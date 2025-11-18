using AiMate.Core.Entities;

namespace AiMate.Core.Interfaces;

/// <summary>
/// Service for managing code snippets/artifacts
/// </summary>
public interface ICodeSnippetService
{
    /// <summary>
    /// Save a new code snippet
    /// </summary>
    Task<CodeSnippet> SaveSnippetAsync(
        Guid userId,
        string name,
        string code,
        string description = "",
        string language = "csharp",
        string tags = "",
        Guid? workspaceId = null);

    /// <summary>
    /// Update an existing snippet
    /// </summary>
    Task<CodeSnippet> UpdateSnippetAsync(
        Guid snippetId,
        Guid userId,
        string? name = null,
        string? code = null,
        string? description = null,
        string? tags = null);

    /// <summary>
    /// Get a specific snippet
    /// </summary>
    Task<CodeSnippet?> GetSnippetAsync(Guid snippetId, Guid userId);

    /// <summary>
    /// Get all snippets for a user
    /// </summary>
    Task<List<CodeSnippet>> GetUserSnippetsAsync(
        Guid userId,
        string? language = null,
        string? tag = null,
        int limit = 100);

    /// <summary>
    /// Get snippets for a workspace
    /// </summary>
    Task<List<CodeSnippet>> GetWorkspaceSnippetsAsync(Guid workspaceId, Guid userId);

    /// <summary>
    /// Delete a snippet
    /// </summary>
    Task<bool> DeleteSnippetAsync(Guid snippetId, Guid userId);

    /// <summary>
    /// Increment run count when snippet is executed
    /// </summary>
    Task IncrementRunCountAsync(Guid snippetId);

    /// <summary>
    /// Search snippets by name or description
    /// </summary>
    Task<List<CodeSnippet>> SearchSnippetsAsync(
        Guid userId,
        string query,
        int limit = 20);
}
