namespace AiMate.Shared.Dtos.Knowledge;

/// <summary>
/// Knowledge base analytics DTO
/// </summary>
public class KnowledgeAnalyticsDto
{
    public int TotalArticles { get; set; }
    public int TotalViews { get; set; }
    public int TotalReferences { get; set; }
    public List<KnowledgeArticleDto> MostViewed { get; set; } = new();
    public List<KnowledgeArticleDto> MostReferenced { get; set; } = new();
    public List<KnowledgeArticleDto> RecentlyAdded { get; set; } = new();
    public Dictionary<string, int> TagCounts { get; set; } = new();
    public Dictionary<string, int> TypeCounts { get; set; } = new();
    public Dictionary<string, int> CategoryCounts { get; set; } = new();
}
