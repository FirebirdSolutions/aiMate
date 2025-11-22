using AiMate.Core.Enums;

namespace AiMate.Core.Entities;

/// <summary>
/// Automated error logging from frontend for debugging and monitoring
/// </summary>
public class ErrorLog
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// User who experienced the error (nullable for pre-auth errors)
    /// </summary>
    public Guid? UserId { get; set; }
    public User? User { get; set; }

    /// <summary>
    /// Type of error
    /// </summary>
    public ErrorType ErrorType { get; set; }

    /// <summary>
    /// Error message
    /// </summary>
    public required string Message { get; set; }

    /// <summary>
    /// Stack trace (if available)
    /// </summary>
    public string? StackTrace { get; set; }

    /// <summary>
    /// Component or file where error occurred
    /// </summary>
    public string? ComponentName { get; set; }

    /// <summary>
    /// URL where error occurred
    /// </summary>
    public string? Url { get; set; }

    /// <summary>
    /// User agent string
    /// </summary>
    public string? UserAgent { get; set; }

    /// <summary>
    /// Browser info (name, version)
    /// </summary>
    public string? BrowserInfo { get; set; }

    /// <summary>
    /// Additional context data (JSON)
    /// </summary>
    public string? AdditionalDataJson { get; set; }

    /// <summary>
    /// Error severity
    /// </summary>
    public ErrorSeverity Severity { get; set; } = ErrorSeverity.Medium;

    /// <summary>
    /// Whether the error has been resolved
    /// </summary>
    public bool IsResolved { get; set; } = false;

    /// <summary>
    /// Resolution notes
    /// </summary>
    public string? Resolution { get; set; }

    /// <summary>
    /// Number of times this exact error has occurred
    /// </summary>
    public int OccurrenceCount { get; set; } = 1;

    /// <summary>
    /// First time this error occurred
    /// </summary>
    public DateTime FirstOccurrence { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Most recent occurrence
    /// </summary>
    public DateTime LastOccurrence { get; set; } = DateTime.UtcNow;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ResolvedAt { get; set; }
}
