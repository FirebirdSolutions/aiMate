namespace AiMate.Shared.Dtos.Conversation;

/// <summary>
/// Update conversation request
/// </summary>
public class UpdateConversationRequest
{
    public string? Title { get; set; }
    public string? ModelId { get; set; }
    public bool? IsPinned { get; set; }
    public bool? IsArchived { get; set; }
}
