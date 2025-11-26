namespace AiMate.Shared.Dtos.Admin;

/// <summary>
/// Admin data response (all admin data in one)
/// </summary>
public class AdminDataDto
{
    public AdminOverviewDto Overview { get; set; } = new();
    public List<AIModelDto> Models { get; set; } = new();
    public List<MCPServerDto> McpServers { get; set; } = new();
    public List<SystemLogDto> SystemLogs { get; set; } = new();
    public string AdminLiteLLMUrl { get; set; } = "http://localhost:4000";
    public string? AdminLiteLLMApiKey { get; set; }
}
