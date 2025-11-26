namespace AiMate.Shared.Dtos.Feedback;

/// <summary>
/// Create or update feedback request
/// </summary>
public class CreateFeedbackRequest
{
    public Guid UserId { get; set; }
    public int Rating { get; set; }
    public string? TextFeedback { get; set; }
    public List<FeedbackTagDto>? Tags { get; set; }
    public string? ModelId { get; set; }
    public long? ResponseTimeMs { get; set; }
}
