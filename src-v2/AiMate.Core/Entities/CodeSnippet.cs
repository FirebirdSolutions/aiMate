namespace AiMate.Core.Entities;

/// <summary>
/// Code snippet/artifact that can be saved and reused
/// </summary>
public class CodeSnippet
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Language { get; set; } = "csharp"; // Future: support more languages
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public bool IsPublic { get; set; } // Future: public snippet sharing
    public int Views { get; set; }
    public int Runs { get; set; } // Track how many times it's been executed
    public string Tags { get; set; } = string.Empty; // Comma-separated tags
    public Guid? WorkspaceId { get; set; } // Optional: associate with workspace

    // Navigation properties
    public User User { get; set; } = null!;
    public Workspace? Workspace { get; set; }
}
