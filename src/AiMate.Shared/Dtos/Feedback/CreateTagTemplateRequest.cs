namespace AiMate.Shared.Dtos.Feedback;

public class CreateTagTemplateRequest
{
    public string Category { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsRequired { get; set; }
    public List<TagOptionDto> Options { get; set; } = [];
}

public class TagOptionDto
{
    public string Value { get; set; } = string.Empty;
    public string? Color { get; set; }
    public string Sentiment { get; set; } = "neutral";
    public string? Icon { get; set; }
    public int DisplayOrder { get; set; }
}
