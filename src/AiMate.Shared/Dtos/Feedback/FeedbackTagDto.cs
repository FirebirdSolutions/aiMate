namespace AiMate.Shared.Dtos.Feedback;

public class FeedbackTagDto
{
    public string Key { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public string? Color { get; set; }
    public string Sentiment { get; set; } = "neutral";
}
