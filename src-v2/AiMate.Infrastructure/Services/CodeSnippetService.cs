using AiMate.Core.Entities;
using AiMate.Core.Interfaces;
using AiMate.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace AiMate.Infrastructure.Services;

/// <summary>
/// Service for managing code snippets/artifacts
/// </summary>
public class CodeSnippetService : ICodeSnippetService
{
    private readonly AiMateDbContext _dbContext;
    private readonly ILogger<CodeSnippetService> _logger;

    public CodeSnippetService(
        AiMateDbContext dbContext,
        ILogger<CodeSnippetService> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task<CodeSnippet> SaveSnippetAsync(
        Guid userId,
        string name,
        string code,
        string description = "",
        string language = "csharp",
        string tags = "",
        Guid? workspaceId = null)
    {
        var snippet = new CodeSnippet
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            WorkspaceId = workspaceId,
            Name = name,
            Code = code,
            Description = description,
            Language = language,
            Tags = tags,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            IsPublic = false,
            Views = 0,
            Runs = 0
        };

        _dbContext.CodeSnippets.Add(snippet);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Code snippet saved: {SnippetId} by user {UserId}", snippet.Id, userId);

        return snippet;
    }

    public async Task<CodeSnippet> UpdateSnippetAsync(
        Guid snippetId,
        Guid userId,
        string? name = null,
        string? code = null,
        string? description = null,
        string? tags = null)
    {
        var snippet = await _dbContext.CodeSnippets
            .FirstOrDefaultAsync(s => s.Id == snippetId && s.UserId == userId);

        if (snippet == null)
        {
            throw new InvalidOperationException($"Snippet {snippetId} not found or not owned by user {userId}");
        }

        if (name != null) snippet.Name = name;
        if (code != null) snippet.Code = code;
        if (description != null) snippet.Description = description;
        if (tags != null) snippet.Tags = tags;

        snippet.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Code snippet updated: {SnippetId}", snippetId);

        return snippet;
    }

    public async Task<CodeSnippet?> GetSnippetAsync(Guid snippetId, Guid userId)
    {
        var snippet = await _dbContext.CodeSnippets
            .FirstOrDefaultAsync(s => s.Id == snippetId && s.UserId == userId);

        if (snippet != null)
        {
            snippet.Views++;
            await _dbContext.SaveChangesAsync();
        }

        return snippet;
    }

    public async Task<List<CodeSnippet>> GetUserSnippetsAsync(
        Guid userId,
        string? language = null,
        string? tag = null,
        int limit = 100)
    {
        var query = _dbContext.CodeSnippets
            .Where(s => s.UserId == userId);

        if (!string.IsNullOrEmpty(language))
        {
            query = query.Where(s => s.Language == language);
        }

        if (!string.IsNullOrEmpty(tag))
        {
            query = query.Where(s => s.Tags.Contains(tag));
        }

        var snippets = await query
            .OrderByDescending(s => s.UpdatedAt)
            .Take(limit)
            .ToListAsync();

        return snippets;
    }

    public async Task<List<CodeSnippet>> GetWorkspaceSnippetsAsync(Guid workspaceId, Guid userId)
    {
        var snippets = await _dbContext.CodeSnippets
            .Where(s => s.WorkspaceId == workspaceId && s.UserId == userId)
            .OrderByDescending(s => s.UpdatedAt)
            .ToListAsync();

        return snippets;
    }

    public async Task<bool> DeleteSnippetAsync(Guid snippetId, Guid userId)
    {
        var snippet = await _dbContext.CodeSnippets
            .FirstOrDefaultAsync(s => s.Id == snippetId && s.UserId == userId);

        if (snippet == null)
        {
            return false;
        }

        _dbContext.CodeSnippets.Remove(snippet);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Code snippet deleted: {SnippetId}", snippetId);

        return true;
    }

    public async Task IncrementRunCountAsync(Guid snippetId)
    {
        var snippet = await _dbContext.CodeSnippets
            .FirstOrDefaultAsync(s => s.Id == snippetId);

        if (snippet != null)
        {
            snippet.Runs++;
            await _dbContext.SaveChangesAsync();
        }
    }

    public async Task<List<CodeSnippet>> SearchSnippetsAsync(
        Guid userId,
        string query,
        int limit = 20)
    {
        var snippets = await _dbContext.CodeSnippets
            .Where(s => s.UserId == userId &&
                       (s.Name.Contains(query) ||
                        s.Description.Contains(query) ||
                        s.Tags.Contains(query)))
            .OrderByDescending(s => s.UpdatedAt)
            .Take(limit)
            .ToListAsync();

        return snippets;
    }
}
