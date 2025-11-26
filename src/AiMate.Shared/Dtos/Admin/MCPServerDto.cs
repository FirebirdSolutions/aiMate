namespace AiMate.Shared.Dtos.Admin;

/// <summary>
/// MCP Server configuration
/// </summary>
public class MCPServerDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = "stdio";
    public bool Connected { get; set; }
    public int ToolCount { get; set; }
    public string? Command { get; set; }
    public string? Arguments { get; set; }
    public string? Url { get; set; }

    // Ownership & Visibility
    public string? OwnerId { get; set; }
    public string Visibility { get; set; } = "Private";
    public List<string> AllowedGroups { get; set; } = new();
}
