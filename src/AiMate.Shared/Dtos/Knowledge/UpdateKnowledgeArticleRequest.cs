namespace AiMate.Shared.Dtos.Knowledge;

/// <summary>
/// Update knowledge article request
/// </summary>
public class UpdateKnowledgeArticleRequest
{
    public string? Title { get; set; }
    public string? Content { get; set; }
    public string? ContentType { get; set; }
    public string? Summary { get; set; }
    public string? Type { get; set; }
    public List<string>? Tags { get; set; }
    public string? Collection { get; set; }
    public string? Category { get; set; }
    public string? Source { get; set; }
    public bool? IsFeatured { get; set; }
    public bool? IsPublished { get; set; }
    public bool? IsVerified { get; set; }
}
