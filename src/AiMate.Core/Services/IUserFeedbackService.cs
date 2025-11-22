using AiMate.Core.Entities;
using AiMate.Core.Enums;

namespace AiMate.Core.Services;

/// <summary>
/// Service for managing general user feedback
/// </summary>
public interface IUserFeedbackService
{
    /// <summary>
    /// Submit new user feedback
    /// </summary>
    Task<UserFeedback> CreateFeedbackAsync(UserFeedback feedback);

    /// <summary>
    /// Get feedback by ID
    /// </summary>
    Task<UserFeedback?> GetFeedbackByIdAsync(Guid id);

    /// <summary>
    /// Get all feedback for a user (or all if admin)
    /// </summary>
    Task<List<UserFeedback>> GetUserFeedbackAsync(Guid? userId, bool isAdmin);

    /// <summary>
    /// Get feedback with filtering and pagination
    /// </summary>
    Task<(List<UserFeedback> Items, int TotalCount)> GetFeedbackAsync(
        FeedbackType? type = null,
        FeedbackStatus? status = null,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        int skip = 0,
        int take = 50);

    /// <summary>
    /// Update feedback status (admin only)
    /// </summary>
    Task<UserFeedback> UpdateFeedbackStatusAsync(Guid id, FeedbackStatus status, string? adminNotes = null);

    /// <summary>
    /// Assign feedback to an admin user
    /// </summary>
    Task<UserFeedback> AssignFeedbackAsync(Guid id, Guid assignedToUserId);

    /// <summary>
    /// Delete feedback
    /// </summary>
    Task DeleteFeedbackAsync(Guid id);

    /// <summary>
    /// Get feedback statistics
    /// </summary>
    Task<FeedbackStatistics> GetStatisticsAsync();
}

/// <summary>
/// Feedback statistics for admin dashboard
/// </summary>
public class FeedbackStatistics
{
    public int TotalFeedback { get; set; }
    public Dictionary<FeedbackType, int> ByType { get; set; } = new();
    public Dictionary<FeedbackStatus, int> ByStatus { get; set; } = new();
    public double AverageRating { get; set; }
    public int TodayCount { get; set; }
    public int WeekCount { get; set; }
    public int MonthCount { get; set; }
}
