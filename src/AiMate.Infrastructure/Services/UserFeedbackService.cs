using AiMate.Core.Entities;
using AiMate.Core.Enums;
using AiMate.Core.Services;
using AiMate.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace AiMate.Infrastructure.Services;

/// <summary>
/// Implementation of user feedback service
/// </summary>
public class UserFeedbackService : IUserFeedbackService
{
    private readonly AiMateDbContext _context;

    public UserFeedbackService(AiMateDbContext context)
    {
        _context = context;
    }

    public async Task<UserFeedback> CreateFeedbackAsync(UserFeedback feedback)
    {
        feedback.CreatedAt = DateTime.UtcNow;
        feedback.Status = FeedbackStatus.New;

        _context.UserFeedbacks.Add(feedback);
        await _context.SaveChangesAsync();

        return feedback;
    }

    public async Task<UserFeedback?> GetFeedbackByIdAsync(Guid id)
    {
        return await _context.UserFeedbacks
            .Include(f => f.User)
            .Include(f => f.AssignedTo)
            .FirstOrDefaultAsync(f => f.Id == id);
    }

    public async Task<List<UserFeedback>> GetUserFeedbackAsync(Guid? userId, bool isAdmin)
    {
        var query = _context.UserFeedbacks
            .Include(f => f.User)
            .Include(f => f.AssignedTo)
            .AsQueryable();

        // Non-admins can only see their own feedback
        if (!isAdmin && userId.HasValue)
        {
            query = query.Where(f => f.UserId == userId.Value);
        }

        return await query
            .OrderByDescending(f => f.CreatedAt)
            .ToListAsync();
    }

    public async Task<(List<UserFeedback> Items, int TotalCount)> GetFeedbackAsync(
        FeedbackType? type = null,
        FeedbackStatus? status = null,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        int skip = 0,
        int take = 50)
    {
        var query = _context.UserFeedbacks
            .Include(f => f.User)
            .Include(f => f.AssignedTo)
            .AsQueryable();

        if (type.HasValue)
            query = query.Where(f => f.FeedbackType == type.Value);

        if (status.HasValue)
            query = query.Where(f => f.Status == status.Value);

        if (fromDate.HasValue)
            query = query.Where(f => f.CreatedAt >= fromDate.Value);

        if (toDate.HasValue)
            query = query.Where(f => f.CreatedAt <= toDate.Value);

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(f => f.CreatedAt)
            .Skip(skip)
            .Take(take)
            .ToListAsync();

        return (items, totalCount);
    }

    public async Task<UserFeedback> UpdateFeedbackStatusAsync(Guid id, FeedbackStatus status, string? adminNotes = null)
    {
        var feedback = await _context.UserFeedbacks.FindAsync(id);
        if (feedback == null)
            throw new InvalidOperationException("Feedback not found");

        feedback.Status = status;
        feedback.UpdatedAt = DateTime.UtcNow;

        if (adminNotes != null)
            feedback.AdminNotes = adminNotes;

        if (status == FeedbackStatus.Resolved || status == FeedbackStatus.Closed)
            feedback.ResolvedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return feedback;
    }

    public async Task<UserFeedback> AssignFeedbackAsync(Guid id, Guid assignedToUserId)
    {
        var feedback = await _context.UserFeedbacks.FindAsync(id);
        if (feedback == null)
            throw new InvalidOperationException("Feedback not found");

        feedback.AssignedToUserId = assignedToUserId;
        feedback.UpdatedAt = DateTime.UtcNow;

        if (feedback.Status == FeedbackStatus.New)
            feedback.Status = FeedbackStatus.InReview;

        await _context.SaveChangesAsync();

        return feedback;
    }

    public async Task DeleteFeedbackAsync(Guid id)
    {
        var feedback = await _context.UserFeedbacks.FindAsync(id);
        if (feedback == null)
            throw new InvalidOperationException("Feedback not found");

        _context.UserFeedbacks.Remove(feedback);
        await _context.SaveChangesAsync();
    }

    public async Task<FeedbackStatistics> GetStatisticsAsync()
    {
        var now = DateTime.UtcNow;
        var today = now.Date;
        var weekAgo = today.AddDays(-7);
        var monthAgo = today.AddMonths(-1);

        var stats = new FeedbackStatistics
        {
            TotalFeedback = await _context.UserFeedbacks.CountAsync(),
            TodayCount = await _context.UserFeedbacks.CountAsync(f => f.CreatedAt >= today),
            WeekCount = await _context.UserFeedbacks.CountAsync(f => f.CreatedAt >= weekAgo),
            MonthCount = await _context.UserFeedbacks.CountAsync(f => f.CreatedAt >= monthAgo)
        };

        // Calculate average rating (only feedbacks with ratings)
        var ratingsQuery = _context.UserFeedbacks.Where(f => f.Rating.HasValue);
        if (await ratingsQuery.AnyAsync())
        {
            stats.AverageRating = await ratingsQuery.AverageAsync(f => f.Rating!.Value);
        }

        // Group by type
        var byType = await _context.UserFeedbacks
            .GroupBy(f => f.FeedbackType)
            .Select(g => new { Type = g.Key, Count = g.Count() })
            .ToListAsync();

        foreach (var item in byType)
            stats.ByType[item.Type] = item.Count;

        // Group by status
        var byStatus = await _context.UserFeedbacks
            .GroupBy(f => f.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync();

        foreach (var item in byStatus)
            stats.ByStatus[item.Status] = item.Count;

        return stats;
    }
}
