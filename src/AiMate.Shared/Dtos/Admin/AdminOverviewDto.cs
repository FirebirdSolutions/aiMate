namespace AiMate.Shared.Dtos.Admin;

/// <summary>
/// Admin overview statistics
/// </summary>
public class AdminOverviewDto
{
    public int TotalUsers { get; set; }
    public int TotalConversations { get; set; }
    public int ConversationsToday { get; set; }
    public int ActiveModels { get; set; }
    public int TotalModels { get; set; }
    public int ConnectedMcpServers { get; set; }
    public int TotalMcpServers { get; set; }
    public bool LiteLLMConnected { get; set; }
    public string LiteLLMUrl { get; set; } = string.Empty;
    public double StorageUsedMB { get; set; }
    public double StorageLimitMB { get; set; }
    public string Uptime { get; set; } = string.Empty;
    public string AppVersion { get; set; } = "v1.0.0";
    public double LocalStorageUsedMB { get; set; }
    public double LocalStorageLimitMB { get; set; }
    public double IndexedDBUsedMB { get; set; }
    public double IndexedDBLimitMB { get; set; }
}
