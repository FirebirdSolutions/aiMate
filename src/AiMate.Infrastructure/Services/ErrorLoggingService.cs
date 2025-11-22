using AiMate.Core.Entities;
using AiMate.Core.Enums;
using AiMate.Core.Services;
using AiMate.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace AiMate.Infrastructure.Services;

/// <summary>
/// Implementation of error logging service
/// </summary>
public class ErrorLoggingService : IErrorLoggingService
{
    private readonly AiMateDbContext _context;

    public ErrorLoggingService(AiMateDbContext context)
    {
        _context = context;
    }

    public async Task<ErrorLog> LogErrorAsync(ErrorLog error)
    {
        // Check if this is a duplicate error
        var duplicate = await FindDuplicateErrorAsync(error.Message, error.ComponentName);

        if (duplicate != null)
        {
            // Increment occurrence count and update last occurrence
            duplicate.OccurrenceCount++;
            duplicate.LastOccurrence = DateTime.UtcNow;

            // If severity increased, update it
            if (error.Severity > duplicate.Severity)
                duplicate.Severity = error.Severity;

            await _context.SaveChangesAsync();
            return duplicate;
        }

        // New error
        error.CreatedAt = DateTime.UtcNow;
        error.FirstOccurrence = DateTime.UtcNow;
        error.LastOccurrence = DateTime.UtcNow;
        error.OccurrenceCount = 1;

        _context.ErrorLogs.Add(error);
        await _context.SaveChangesAsync();

        return error;
    }

    public async Task<ErrorLog?> GetErrorByIdAsync(Guid id)
    {
        return await _context.ErrorLogs
            .Include(e => e.User)
            .FirstOrDefaultAsync(e => e.Id == id);
    }

    public async Task<(List<ErrorLog> Items, int TotalCount)> GetErrorsAsync(
        ErrorType? type = null,
        ErrorSeverity? severity = null,
        bool? isResolved = null,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        int skip = 0,
        int take = 50)
    {
        var query = _context.ErrorLogs
            .Include(e => e.User)
            .AsQueryable();

        if (type.HasValue)
            query = query.Where(e => e.ErrorType == type.Value);

        if (severity.HasValue)
            query = query.Where(e => e.Severity == severity.Value);

        if (isResolved.HasValue)
            query = query.Where(e => e.IsResolved == isResolved.Value);

        if (fromDate.HasValue)
            query = query.Where(e => e.CreatedAt >= fromDate.Value);

        if (toDate.HasValue)
            query = query.Where(e => e.CreatedAt <= toDate.Value);

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(e => e.LastOccurrence)
            .ThenByDescending(e => e.OccurrenceCount)
            .Skip(skip)
            .Take(take)
            .ToListAsync();

        return (items, totalCount);
    }

    public async Task<ErrorLog> ResolveErrorAsync(Guid id, string? resolution = null)
    {
        var error = await _context.ErrorLogs.FindAsync(id);
        if (error == null)
            throw new InvalidOperationException("Error not found");

        error.IsResolved = true;
        error.ResolvedAt = DateTime.UtcNow;

        if (resolution != null)
            error.Resolution = resolution;

        await _context.SaveChangesAsync();

        return error;
    }

    public async Task<ErrorStatistics> GetStatisticsAsync()
    {
        var now = DateTime.UtcNow;
        var today = now.Date;
        var weekAgo = today.AddDays(-7);
        var monthAgo = today.AddMonths(-1);

        var stats = new ErrorStatistics
        {
            TotalErrors = await _context.ErrorLogs.CountAsync(),
            UnresolvedErrors = await _context.ErrorLogs.CountAsync(e => !e.IsResolved),
            TodayCount = await _context.ErrorLogs.CountAsync(e => e.CreatedAt >= today),
            WeekCount = await _context.ErrorLogs.CountAsync(e => e.CreatedAt >= weekAgo),
            MonthCount = await _context.ErrorLogs.CountAsync(e => e.CreatedAt >= monthAgo)
        };

        // Group by type
        var byType = await _context.ErrorLogs
            .GroupBy(e => e.ErrorType)
            .Select(g => new { Type = g.Key, Count = g.Count() })
            .ToListAsync();

        foreach (var item in byType)
            stats.ByType[item.Type] = item.Count;

        // Group by severity
        var bySeverity = await _context.ErrorLogs
            .GroupBy(e => e.Severity)
            .Select(g => new { Severity = g.Key, Count = g.Count() })
            .ToListAsync();

        foreach (var item in bySeverity)
            stats.BySeverity[item.Severity] = item.Count;

        // Get most frequent errors (unresolved, top 10)
        stats.MostFrequent = await _context.ErrorLogs
            .Where(e => !e.IsResolved)
            .OrderByDescending(e => e.OccurrenceCount)
            .Take(10)
            .ToListAsync();

        return stats;
    }

    public async Task<ErrorLog?> FindDuplicateErrorAsync(string message, string? componentName)
    {
        // Find unresolved error with same message and component
        // Within last 24 hours to prevent grouping old errors
        var oneDayAgo = DateTime.UtcNow.AddDays(-1);

        var query = _context.ErrorLogs
            .Where(e => e.Message == message && !e.IsResolved)
            .Where(e => e.LastOccurrence >= oneDayAgo);

        if (!string.IsNullOrEmpty(componentName))
            query = query.Where(e => e.ComponentName == componentName);

        return await query.FirstOrDefaultAsync();
    }
}
