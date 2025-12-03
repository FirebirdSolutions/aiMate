namespace AiMate.Core.Services;

/// <summary>
/// Result from code execution
/// </summary>
public class CodeExecutionResult
{
    public bool Success { get; set; }
    public string Stdout { get; set; } = string.Empty;
    public string Stderr { get; set; } = string.Empty;
    public int ExitCode { get; set; }
    public long ExecutionTimeMs { get; set; }
    public string? Error { get; set; }

    /// <summary>
    /// Files created during execution (for sandboxes that support file I/O)
    /// </summary>
    public Dictionary<string, byte[]>? OutputFiles { get; set; }
}

/// <summary>
/// Request to execute code
/// </summary>
public class CodeExecutionRequest
{
    public required string Language { get; set; }
    public required string Code { get; set; }
    public int TimeoutSeconds { get; set; } = 30;
    public string? Stdin { get; set; }

    /// <summary>
    /// Files to make available in the sandbox
    /// </summary>
    public Dictionary<string, byte[]>? InputFiles { get; set; }

    /// <summary>
    /// Environment variables to set
    /// </summary>
    public Dictionary<string, string>? Environment { get; set; }
}

/// <summary>
/// Abstraction for code execution providers.
/// Implementations can use E2B, Docker, or other sandboxing solutions.
/// </summary>
public interface ICodeExecutionProvider
{
    /// <summary>
    /// Provider name for logging and configuration
    /// </summary>
    string ProviderName { get; }

    /// <summary>
    /// Languages supported by this provider
    /// </summary>
    IReadOnlyList<string> SupportedLanguages { get; }

    /// <summary>
    /// Check if a language is supported
    /// </summary>
    bool SupportsLanguage(string language);

    /// <summary>
    /// Execute code in a sandboxed environment
    /// </summary>
    Task<CodeExecutionResult> ExecuteAsync(
        CodeExecutionRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Check if the provider is available and configured
    /// </summary>
    Task<bool> IsAvailableAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Get provider health/status information
    /// </summary>
    Task<ProviderHealthInfo> GetHealthAsync(CancellationToken cancellationToken = default);
}

/// <summary>
/// Health information for a code execution provider
/// </summary>
public class ProviderHealthInfo
{
    public bool IsHealthy { get; set; }
    public string Status { get; set; } = "Unknown";
    public string? Message { get; set; }
    public Dictionary<string, object>? Metadata { get; set; }
}
