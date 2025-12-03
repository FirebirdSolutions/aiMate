using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using AiMate.Core.Services;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AiMate.Infrastructure.Services.CodeExecution;

/// <summary>
/// E2B.dev cloud-based code execution provider.
/// https://e2b.dev/docs
/// </summary>
public class E2BCodeExecutionProvider : ICodeExecutionProvider
{
    private readonly ILogger<E2BCodeExecutionProvider> _logger;
    private readonly HttpClient _httpClient;
    private readonly E2BOptions _options;

    private static readonly IReadOnlyList<string> _supportedLanguages = new[]
    {
        "python", "py",
        "javascript", "js",
        "typescript", "ts",
        "r",
        "java",
        "bash", "sh"
    };

    // E2B language to template mapping
    private static readonly Dictionary<string, string> _languageTemplates = new()
    {
        ["python"] = "Python3",
        ["py"] = "Python3",
        ["javascript"] = "Node",
        ["js"] = "Node",
        ["typescript"] = "Node",
        ["ts"] = "Node",
        ["r"] = "R",
        ["java"] = "Java",
        ["bash"] = "Bash",
        ["sh"] = "Bash"
    };

    public string ProviderName => "E2B";
    public IReadOnlyList<string> SupportedLanguages => _supportedLanguages;

    public E2BCodeExecutionProvider(
        ILogger<E2BCodeExecutionProvider> logger,
        IHttpClientFactory httpClientFactory,
        IOptions<E2BOptions> options)
    {
        _logger = logger;
        _httpClient = httpClientFactory.CreateClient("E2B");
        _options = options.Value;

        // Configure base URL and auth
        _httpClient.BaseAddress = new Uri("https://api.e2b.dev/");
        if (!string.IsNullOrEmpty(_options.ApiKey))
        {
            _httpClient.DefaultRequestHeaders.Add("X-API-Key", _options.ApiKey);
        }
    }

    public bool SupportsLanguage(string language)
    {
        return _supportedLanguages.Contains(language.ToLowerInvariant());
    }

    public async Task<CodeExecutionResult> ExecuteAsync(
        CodeExecutionRequest request,
        CancellationToken cancellationToken = default)
    {
        var startTime = DateTime.UtcNow;
        var language = request.Language.ToLowerInvariant();

        if (!SupportsLanguage(language))
        {
            return new CodeExecutionResult
            {
                Success = false,
                Error = $"Language '{language}' is not supported by E2B provider",
                ExitCode = -1
            };
        }

        if (string.IsNullOrEmpty(_options.ApiKey))
        {
            return new CodeExecutionResult
            {
                Success = false,
                Error = "E2B API key not configured",
                ExitCode = -1
            };
        }

        try
        {
            _logger.LogInformation("Executing {Language} code via E2B", language);

            // Create a sandbox
            var template = _languageTemplates.GetValueOrDefault(language, "Python3");
            var sandboxResponse = await CreateSandboxAsync(template, cancellationToken);

            if (sandboxResponse == null)
            {
                return new CodeExecutionResult
                {
                    Success = false,
                    Error = "Failed to create E2B sandbox",
                    ExitCode = -1
                };
            }

            try
            {
                // Execute code in the sandbox
                var result = await RunCodeInSandboxAsync(
                    sandboxResponse.SandboxId,
                    request.Code,
                    language,
                    request.TimeoutSeconds,
                    cancellationToken);

                result.ExecutionTimeMs = (long)(DateTime.UtcNow - startTime).TotalMilliseconds;
                return result;
            }
            finally
            {
                // Always clean up the sandbox
                await KillSandboxAsync(sandboxResponse.SandboxId, cancellationToken);
            }
        }
        catch (TaskCanceledException)
        {
            return new CodeExecutionResult
            {
                Success = false,
                Error = "Execution timed out",
                ExitCode = -1,
                ExecutionTimeMs = (long)(DateTime.UtcNow - startTime).TotalMilliseconds
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "E2B code execution failed");
            return new CodeExecutionResult
            {
                Success = false,
                Error = $"Execution failed: {ex.Message}",
                ExitCode = -1,
                ExecutionTimeMs = (long)(DateTime.UtcNow - startTime).TotalMilliseconds
            };
        }
    }

    public async Task<bool> IsAvailableAsync(CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrEmpty(_options.ApiKey))
            return false;

        try
        {
            var health = await GetHealthAsync(cancellationToken);
            return health.IsHealthy;
        }
        catch
        {
            return false;
        }
    }

    public async Task<ProviderHealthInfo> GetHealthAsync(CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrEmpty(_options.ApiKey))
        {
            return new ProviderHealthInfo
            {
                IsHealthy = false,
                Status = "Not Configured",
                Message = "E2B API key not set"
            };
        }

        try
        {
            // Try to list sandboxes as a health check
            var response = await _httpClient.GetAsync("sandboxes", cancellationToken);

            if (response.IsSuccessStatusCode)
            {
                return new ProviderHealthInfo
                {
                    IsHealthy = true,
                    Status = "Healthy",
                    Message = "E2B API is reachable"
                };
            }

            return new ProviderHealthInfo
            {
                IsHealthy = false,
                Status = "Unhealthy",
                Message = $"E2B API returned {response.StatusCode}"
            };
        }
        catch (Exception ex)
        {
            return new ProviderHealthInfo
            {
                IsHealthy = false,
                Status = "Error",
                Message = ex.Message
            };
        }
    }

    private async Task<E2BSandboxResponse?> CreateSandboxAsync(
        string template,
        CancellationToken cancellationToken)
    {
        var request = new
        {
            template,
            timeout = 60 // Max sandbox lifetime in seconds
        };

        var response = await _httpClient.PostAsJsonAsync("sandboxes", request, cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogError("Failed to create E2B sandbox: {Error}", error);
            return null;
        }

        return await response.Content.ReadFromJsonAsync<E2BSandboxResponse>(cancellationToken: cancellationToken);
    }

    private async Task<CodeExecutionResult> RunCodeInSandboxAsync(
        string sandboxId,
        string code,
        string language,
        int timeoutSeconds,
        CancellationToken cancellationToken)
    {
        // Determine the execution command based on language
        var (command, filename) = language switch
        {
            "python" or "py" => ("python3", "main.py"),
            "javascript" or "js" => ("node", "main.js"),
            "typescript" or "ts" => ("npx ts-node", "main.ts"),
            "java" => ("java", "Main.java"),
            "r" => ("Rscript", "main.R"),
            "bash" or "sh" => ("bash", "main.sh"),
            _ => ("python3", "main.py")
        };

        // First, write the code to a file
        var writeRequest = new
        {
            path = $"/home/user/{filename}",
            content = code
        };

        await _httpClient.PostAsJsonAsync(
            $"sandboxes/{sandboxId}/filesystem",
            writeRequest,
            cancellationToken);

        // Then execute the file
        var execRequest = new
        {
            cmd = $"{command} /home/user/{filename}",
            timeout = timeoutSeconds
        };

        using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        cts.CancelAfter(TimeSpan.FromSeconds(timeoutSeconds + 5));

        var response = await _httpClient.PostAsJsonAsync(
            $"sandboxes/{sandboxId}/process",
            execRequest,
            cts.Token);

        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync(cts.Token);
            return new CodeExecutionResult
            {
                Success = false,
                Error = $"Execution failed: {error}",
                ExitCode = -1
            };
        }

        var result = await response.Content.ReadFromJsonAsync<E2BProcessResponse>(cancellationToken: cts.Token);

        return new CodeExecutionResult
        {
            Success = result?.ExitCode == 0,
            Stdout = result?.Stdout ?? string.Empty,
            Stderr = result?.Stderr ?? string.Empty,
            ExitCode = result?.ExitCode ?? -1
        };
    }

    private async Task KillSandboxAsync(string sandboxId, CancellationToken cancellationToken)
    {
        try
        {
            await _httpClient.DeleteAsync($"sandboxes/{sandboxId}", cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to kill E2B sandbox {SandboxId}", sandboxId);
        }
    }

    // E2B API response types
    private class E2BSandboxResponse
    {
        [JsonPropertyName("sandboxId")]
        public string SandboxId { get; set; } = string.Empty;
    }

    private class E2BProcessResponse
    {
        [JsonPropertyName("stdout")]
        public string Stdout { get; set; } = string.Empty;

        [JsonPropertyName("stderr")]
        public string Stderr { get; set; } = string.Empty;

        [JsonPropertyName("exitCode")]
        public int ExitCode { get; set; }
    }
}

/// <summary>
/// Configuration options for E2B provider
/// </summary>
public class E2BOptions
{
    public const string SectionName = "CodeExecution:E2B";

    /// <summary>
    /// E2B API key from https://e2b.dev/dashboard
    /// </summary>
    public string? ApiKey { get; set; }

    /// <summary>
    /// Default timeout for code execution in seconds
    /// </summary>
    public int DefaultTimeoutSeconds { get; set; } = 30;
}
