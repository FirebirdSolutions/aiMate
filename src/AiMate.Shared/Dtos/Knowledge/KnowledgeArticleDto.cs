namespace AiMate.Shared.Dtos.Knowledge;

/// <summary>
/// Knowledge article DTO - for reference materials and documentation
/// </summary>
public class KnowledgeArticleDto
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string ContentType { get; set; } = "markdown"; // markdown, plain, html
    public string Summary { get; set; } = string.Empty;

    // Organization
    public string Type { get; set; } = "Article"; // Article, Guide, Reference, Tutorial, FAQ
    public List<string> Tags { get; set; } = new();
    public string? Collection { get; set; }
    public string? Category { get; set; }
    public string? Language { get; set; } = "en";

    // Analytics
    public int ViewCount { get; set; }
    public int ReferenceCount { get; set; } // How many times referenced in chats/notes
    public int UpvoteCount { get; set; }
    public int DownvoteCount { get; set; }
    public double AverageRating { get; set; }
    public DateTime? LastViewedAt { get; set; }

    // Metadata
    public string? Author { get; set; }
    public string? Source { get; set; } // URL or reference to original source
    public bool IsFeatured { get; set; }
    public bool IsPublished { get; set; } = true;
    public bool IsVerified { get; set; } // Verified by admin/expert

    // Ownership & Access
    public string? OwnerId { get; set; }
    public string Visibility { get; set; } = "Public"; // Private, Team, Public
    public List<string> SharedWith { get; set; } = new();

    // Relations
    public List<string> RelatedArticles { get; set; } = new(); // Related article IDs
    public List<string> Attachments { get; set; } = new();

    // Timestamps
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? PublishedAt { get; set; }
}
