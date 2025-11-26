namespace AiMate.Shared.Dtos.Workspace;

/// <summary>
/// Create workspace request
/// </summary>
public class CreateWorkspaceRequest
{
    public required string Name { get; set; }
    public string? Description { get; set; }
    public string Type { get; set; } = "General";
    public string Personality { get; set; } = "KiwiMate";
}
