namespace AiMate.Shared.Dtos.Conversation;

/// <summary>
/// Conversation DTO
/// </summary>
public class ConversationDto
{
    public int Id { get; set; }
    public int WorkspaceId { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public int MessageCount { get; set; }
    public string? ModelId { get; set; }
    public bool IsPinned { get; set; }
    public bool IsArchived { get; set; }
}
