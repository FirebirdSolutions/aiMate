namespace AiMate.Shared.Dtos.Knowledge;

/// <summary>
/// Create knowledge article request
/// </summary>
public class CreateKnowledgeArticleRequest
{
    public required string Title { get; set; }
    public string Content { get; set; } = string.Empty;
    public string ContentType { get; set; } = "markdown";
    public string Summary { get; set; } = string.Empty;
    public string Type { get; set; } = "Article";
    public List<string>? Tags { get; set; }
    public string? Collection { get; set; }
    public string? Category { get; set; }
    public string? Source { get; set; }
}
