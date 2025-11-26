namespace AiMate.Shared.Dtos.Workspace;

/// <summary>
/// Update workspace request
/// </summary>
public class UpdateWorkspaceRequest
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public string? Type { get; set; }
    public string? Personality { get; set; }
}
