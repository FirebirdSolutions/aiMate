namespace AiMate.Shared.Dtos.Workspace;

/// <summary>
/// Workspace DTO
/// </summary>
public class WorkspaceDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Type { get; set; } = "General";
    public string Personality { get; set; } = "KiwiMate";
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
