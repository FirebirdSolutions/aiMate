using AiMate.Core.Enums;

namespace AiMate.Core.Entities;

/// <summary>
/// General user feedback for alpha testing and feature requests
/// </summary>
public class UserFeedback
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// User who submitted feedback (nullable for anonymous feedback)
    /// </summary>
    public Guid? UserId { get; set; }
    public User? User { get; set; }

    /// <summary>
    /// Optional email for anonymous feedback follow-up
    /// </summary>
    public string? UserEmail { get; set; }

    /// <summary>
    /// Type of feedback
    /// </summary>
    public FeedbackType FeedbackType { get; set; }

    /// <summary>
    /// Short subject/title
    /// </summary>
    public required string Subject { get; set; }

    /// <summary>
    /// Detailed feedback message
    /// </summary>
    public required string Message { get; set; }

    /// <summary>
    /// Optional 1-5 star rating
    /// </summary>
    public int? Rating { get; set; }

    /// <summary>
    /// Page where feedback was submitted
    /// </summary>
    public string? CurrentPage { get; set; }

    /// <summary>
    /// User agent string
    /// </summary>
    public string? UserAgent { get; set; }

    /// <summary>
    /// Screen resolution
    /// </summary>
    public string? ScreenResolution { get; set; }

    /// <summary>
    /// Additional metadata (JSON)
    /// </summary>
    public string? MetadataJson { get; set; }

    /// <summary>
    /// Current status
    /// </summary>
    public FeedbackStatus Status { get; set; } = FeedbackStatus.New;

    /// <summary>
    /// Admin notes for internal tracking
    /// </summary>
    public string? AdminNotes { get; set; }

    /// <summary>
    /// Admin user assigned to this feedback
    /// </summary>
    public Guid? AssignedToUserId { get; set; }
    public User? AssignedTo { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public DateTime? ResolvedAt { get; set; }
}
