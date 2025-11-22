using AiMate.Core.Entities;
using AiMate.Core.Enums;

namespace AiMate.Core.Services;

/// <summary>
/// Service for automated error logging from frontend
/// </summary>
public interface IErrorLoggingService
{
    /// <summary>
    /// Log a new error (or increment occurrence count if duplicate)
    /// </summary>
    Task<ErrorLog> LogErrorAsync(ErrorLog error);

    /// <summary>
    /// Get error by ID
    /// </summary>
    Task<ErrorLog?> GetErrorByIdAsync(Guid id);

    /// <summary>
    /// Get errors with filtering and pagination
    /// </summary>
    Task<(List<ErrorLog> Items, int TotalCount)> GetErrorsAsync(
        ErrorType? type = null,
        ErrorSeverity? severity = null,
        bool? isResolved = null,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        int skip = 0,
        int take = 50);

    /// <summary>
    /// Mark error as resolved
    /// </summary>
    Task<ErrorLog> ResolveErrorAsync(Guid id, string? resolution = null);

    /// <summary>
    /// Get error statistics
    /// </summary>
    Task<ErrorStatistics> GetStatisticsAsync();

    /// <summary>
    /// Find duplicate error by message and component
    /// </summary>
    Task<ErrorLog?> FindDuplicateErrorAsync(string message, string? componentName);
}

/// <summary>
/// Error statistics for admin dashboard
/// </summary>
public class ErrorStatistics
{
    public int TotalErrors { get; set; }
    public int UnresolvedErrors { get; set; }
    public Dictionary<ErrorType, int> ByType { get; set; } = new();
    public Dictionary<ErrorSeverity, int> BySeverity { get; set; } = new();
    public int TodayCount { get; set; }
    public int WeekCount { get; set; }
    public int MonthCount { get; set; }
    public List<ErrorLog> MostFrequent { get; set; } = new();
}
