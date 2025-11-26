namespace AiMate.Shared.Dtos.Feedback;

/// <summary>
/// Update feedback request
/// </summary>
public class UpdateFeedbackRequest
{
    public int? Rating { get; set; }
    public string? TextFeedback { get; set; }
    public List<FeedbackTagDto>? Tags { get; set; }
    public string? ModelId { get; set; }
    public long? ResponseTimeMs { get; set; }
}
