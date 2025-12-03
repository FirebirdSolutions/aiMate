using System.Diagnostics;
using System.Text;
using AiMate.Core.Services;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AiMate.Infrastructure.Services.CodeExecution;

/// <summary>
/// Self-hosted Docker-based code execution provider.
/// Provides full sovereignty - runs entirely on your infrastructure.
///
/// IMPLEMENTATION STATUS: Stubbed - ready for implementation
///
/// To implement:
/// 1. Install Docker on the host machine
/// 2. Pull language-specific images (python:3.11-slim, node:20-slim, etc.)
/// 3. Implement container creation with resource limits
/// 4. Add network isolation and security policies
/// </summary>
public class DockerCodeExecutionProvider : ICodeExecutionProvider
{
    private readonly ILogger<DockerCodeExecutionProvider> _logger;
    private readonly DockerOptions _options;

    private static readonly IReadOnlyList<string> _supportedLanguages = new[]
    {
        "python", "py",
        "javascript", "js",
        "typescript", "ts",
        "csharp", "cs",
        "go",
        "rust",
        "java",
        "ruby",
        "php",
        "bash", "sh"
    };

    // Docker image mapping for each language
    private static readonly Dictionary<string, DockerImageConfig> _languageImages = new()
    {
        ["python"] = new("python:3.11-slim", "python3", "main.py"),
        ["py"] = new("python:3.11-slim", "python3", "main.py"),
        ["javascript"] = new("node:20-slim", "node", "main.js"),
        ["js"] = new("node:20-slim", "node", "main.js"),
        ["typescript"] = new("node:20-slim", "npx ts-node", "main.ts"),
        ["ts"] = new("node:20-slim", "npx ts-node", "main.ts"),
        ["csharp"] = new("mcr.microsoft.com/dotnet/sdk:8.0", "dotnet script", "main.csx"),
        ["cs"] = new("mcr.microsoft.com/dotnet/sdk:8.0", "dotnet script", "main.csx"),
        ["go"] = new("golang:1.21-alpine", "go run", "main.go"),
        ["rust"] = new("rust:1.74-slim", "rustc -o /tmp/a.out && /tmp/a.out", "main.rs"),
        ["java"] = new("openjdk:21-slim", "java", "Main.java"),
        ["ruby"] = new("ruby:3.2-slim", "ruby", "main.rb"),
        ["php"] = new("php:8.2-cli", "php", "main.php"),
        ["bash"] = new("alpine:3.18", "sh", "main.sh"),
        ["sh"] = new("alpine:3.18", "sh", "main.sh")
    };

    public string ProviderName => "Docker";
    public IReadOnlyList<string> SupportedLanguages => _supportedLanguages;

    public DockerCodeExecutionProvider(
        ILogger<DockerCodeExecutionProvider> logger,
        IOptions<DockerOptions> options)
    {
        _logger = logger;
        _options = options.Value;
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
                Error = $"Language '{language}' is not supported",
                ExitCode = -1
            };
        }

        if (!_options.Enabled)
        {
            return new CodeExecutionResult
            {
                Success = false,
                Error = "Docker code execution is not enabled. Set CodeExecution:Docker:Enabled = true",
                ExitCode = -1
            };
        }

        // Check if Docker is available
        if (!await IsDockerAvailableAsync(cancellationToken))
        {
            return new CodeExecutionResult
            {
                Success = false,
                Error = "Docker is not available on this system",
                ExitCode = -1
            };
        }

        var config = _languageImages[language];

        try
        {
            _logger.LogInformation("Executing {Language} code via Docker ({Image})", language, config.Image);

            // Create a temporary directory for the code
            var tempDir = Path.Combine(Path.GetTempPath(), $"aicode_{Guid.NewGuid():N}");
            Directory.CreateDirectory(tempDir);

            try
            {
                // Write code to file
                var codePath = Path.Combine(tempDir, config.Filename);
                await File.WriteAllTextAsync(codePath, request.Code, cancellationToken);

                // Build docker run command with security restrictions
                var args = BuildDockerArgs(config, tempDir, request.TimeoutSeconds);

                // Execute
                var result = await RunDockerCommandAsync(args, request.TimeoutSeconds, cancellationToken);
                result.ExecutionTimeMs = (long)(DateTime.UtcNow - startTime).TotalMilliseconds;

                return result;
            }
            finally
            {
                // Clean up temp directory
                try
                {
                    Directory.Delete(tempDir, recursive: true);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to clean up temp directory {TempDir}", tempDir);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Docker code execution failed");
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
        if (!_options.Enabled)
            return false;

        return await IsDockerAvailableAsync(cancellationToken);
    }

    public async Task<ProviderHealthInfo> GetHealthAsync(CancellationToken cancellationToken = default)
    {
        if (!_options.Enabled)
        {
            return new ProviderHealthInfo
            {
                IsHealthy = false,
                Status = "Disabled",
                Message = "Docker provider is disabled in configuration"
            };
        }

        var isAvailable = await IsDockerAvailableAsync(cancellationToken);

        if (isAvailable)
        {
            return new ProviderHealthInfo
            {
                IsHealthy = true,
                Status = "Healthy",
                Message = "Docker is available",
                Metadata = new Dictionary<string, object>
                {
                    ["maxMemoryMb"] = _options.MaxMemoryMb,
                    ["maxCpuPercent"] = _options.MaxCpuPercent,
                    ["networkEnabled"] = _options.AllowNetwork
                }
            };
        }

        return new ProviderHealthInfo
        {
            IsHealthy = false,
            Status = "Unavailable",
            Message = "Docker daemon is not running or not accessible"
        };
    }

    private async Task<bool> IsDockerAvailableAsync(CancellationToken cancellationToken)
    {
        try
        {
            using var process = new Process
            {
                StartInfo = new ProcessStartInfo
                {
                    FileName = "docker",
                    Arguments = "version --format '{{.Server.Version}}'",
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                }
            };

            process.Start();
            await process.WaitForExitAsync(cancellationToken);

            return process.ExitCode == 0;
        }
        catch
        {
            return false;
        }
    }

    private string BuildDockerArgs(DockerImageConfig config, string tempDir, int timeoutSeconds)
    {
        var args = new StringBuilder();

        args.Append("run --rm ");

        // Security: Resource limits
        args.Append($"--memory={_options.MaxMemoryMb}m ");
        args.Append($"--cpus={_options.MaxCpuPercent / 100.0:F2} ");
        args.Append("--pids-limit=100 ");

        // Security: No network access (unless explicitly allowed)
        if (!_options.AllowNetwork)
        {
            args.Append("--network=none ");
        }

        // Security: Read-only root filesystem
        args.Append("--read-only ");

        // Security: Drop all capabilities
        args.Append("--cap-drop=ALL ");

        // Security: No new privileges
        args.Append("--security-opt=no-new-privileges ");

        // Mount the code directory
        args.Append($"-v \"{tempDir}:/code:ro\" ");

        // Working directory
        args.Append("-w /code ");

        // Timeout (using timeout command inside container)
        args.Append($"{config.Image} timeout {timeoutSeconds} {config.Command} /code/{config.Filename}");

        return args.ToString();
    }

    private async Task<CodeExecutionResult> RunDockerCommandAsync(
        string args,
        int timeoutSeconds,
        CancellationToken cancellationToken)
    {
        using var process = new Process
        {
            StartInfo = new ProcessStartInfo
            {
                FileName = "docker",
                Arguments = args,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            }
        };

        var stdout = new StringBuilder();
        var stderr = new StringBuilder();

        process.OutputDataReceived += (_, e) =>
        {
            if (e.Data != null) stdout.AppendLine(e.Data);
        };

        process.ErrorDataReceived += (_, e) =>
        {
            if (e.Data != null) stderr.AppendLine(e.Data);
        };

        process.Start();
        process.BeginOutputReadLine();
        process.BeginErrorReadLine();

        using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        cts.CancelAfter(TimeSpan.FromSeconds(timeoutSeconds + 10));

        try
        {
            await process.WaitForExitAsync(cts.Token);
        }
        catch (OperationCanceledException)
        {
            try
            {
                process.Kill(entireProcessTree: true);
            }
            catch { }

            return new CodeExecutionResult
            {
                Success = false,
                Error = "Execution timed out",
                ExitCode = -1,
                Stdout = stdout.ToString(),
                Stderr = stderr.ToString()
            };
        }

        return new CodeExecutionResult
        {
            Success = process.ExitCode == 0,
            ExitCode = process.ExitCode,
            Stdout = stdout.ToString(),
            Stderr = stderr.ToString()
        };
    }

    private record DockerImageConfig(string Image, string Command, string Filename);
}

/// <summary>
/// Configuration options for Docker code execution provider
/// </summary>
public class DockerOptions
{
    public const string SectionName = "CodeExecution:Docker";

    /// <summary>
    /// Enable Docker-based code execution
    /// </summary>
    public bool Enabled { get; set; } = false;

    /// <summary>
    /// Maximum memory per container in MB
    /// </summary>
    public int MaxMemoryMb { get; set; } = 256;

    /// <summary>
    /// Maximum CPU usage as percentage (100 = 1 full core)
    /// </summary>
    public int MaxCpuPercent { get; set; } = 50;

    /// <summary>
    /// Allow network access from containers
    /// </summary>
    public bool AllowNetwork { get; set; } = false;

    /// <summary>
    /// Default timeout for code execution in seconds
    /// </summary>
    public int DefaultTimeoutSeconds { get; set; } = 30;

    /// <summary>
    /// Docker socket path (for custom Docker installations)
    /// </summary>
    public string? DockerSocket { get; set; }
}
