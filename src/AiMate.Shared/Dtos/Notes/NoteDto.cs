namespace AiMate.Shared.Dtos.Notes;

/// <summary>
/// Note DTO - for personal notes and knowledge capture
/// </summary>
public class NoteDto
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string ContentType { get; set; } = "markdown"; // markdown, plain, html

    // Organization
    public List<string> Tags { get; set; } = new();
    public string? Collection { get; set; }
    public string? Category { get; set; }
    public string? Color { get; set; } // For visual organization

    // Metadata
    public bool IsPinned { get; set; }
    public bool IsFavorite { get; set; }
    public bool IsArchived { get; set; }

    // Ownership & Access
    public string? OwnerId { get; set; }
    public string Visibility { get; set; } = "Private"; // Private, Shared, Public
    public List<string> SharedWith { get; set; } = new(); // User IDs or group IDs

    // Relations
    public string? LinkedConversationId { get; set; }
    public string? LinkedWorkspaceId { get; set; }
    public List<string> Attachments { get; set; } = new(); // File IDs

    // Timestamps
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastViewedAt { get; set; }
}
