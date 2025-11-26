namespace AiMate.Shared.Dtos.Conversation;

/// <summary>
/// Create conversation request
/// </summary>
public class CreateConversationRequest
{
    public required int WorkspaceId { get; set; }
    public string Title { get; set; } = "New Conversation";
}
