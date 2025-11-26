namespace AiMate.Shared.Dtos.Settings;

/// <summary>
/// User settings request/response
/// </summary>
public class UserSettingsDto
{
    // General Settings
    public string Language { get; set; } = "en-NZ";
    public string TimeZone { get; set; } = "Pacific/Auckland";
    public bool EnableNotifications { get; set; } = true;
    public bool EnableSoundEffects { get; set; } = false;

    // Interface Settings
    public string Theme { get; set; } = "dark";
    public int FontSize { get; set; } = 14;
    public bool CompactMode { get; set; } = false;
    public bool ShowLineNumbers { get; set; } = true;
    public bool EnableMarkdownPreview { get; set; } = true;
    public string CodeTheme { get; set; } = "dracula";

    // Connection Settings
    public string LiteLLMUrl { get; set; } = "http://localhost:4000";
    public string? ApiKey { get; set; }
    public int RequestTimeout { get; set; } = 120;
    public int MaxRetries { get; set; } = 3;
    public bool UseStreamingByDefault { get; set; } = true;

    // Personalisation Settings
    public string DefaultPersonality { get; set; } = "KiwiMate";
    public string DefaultModel { get; set; } = "gpt-4";
    public double Temperature { get; set; } = 0.7;
    public int MaxTokens { get; set; } = 2000;
    public string SystemPromptOverride { get; set; } = string.Empty;

    // Account Settings
    public string? Username { get; set; }
    public string? Email { get; set; }
    public string? AvatarUrl { get; set; }
    public string UserTier { get; set; } = "Free";

    // Usage Settings
    public bool TrackUsage { get; set; } = true;
    public bool ShowCostEstimates { get; set; } = true;
    public int MonthlyBudget { get; set; } = 0;
    public bool EnableUsageAlerts { get; set; } = true;
}
