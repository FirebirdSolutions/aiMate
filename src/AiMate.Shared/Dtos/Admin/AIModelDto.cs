namespace AiMate.Shared.Dtos.Admin;

/// <summary>
/// AI Model configuration
/// </summary>
public class AIModelDto
{
    // General
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string ModelId { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Connection { get; set; } = string.Empty;
    public string Provider { get; set; } = string.Empty;
    public string? ApiKey { get; set; }
    public string? CustomEndpoint { get; set; }
    public bool IsEnabled { get; set; } = true;

    // Model Parameters
    public int ContextWindow { get; set; } = 8192;
    public int MaxTokens { get; set; } = 4096;
    public double Temperature { get; set; } = 0.7;
    public double TopP { get; set; } = 1.0;
    public double FrequencyPenalty { get; set; } = 0.0;
    public double PresencePenalty { get; set; } = 0.0;

    // Capabilities
    public bool SupportsVision { get; set; } = false;
    public bool SupportsWebSearch { get; set; } = false;
    public bool SupportsFileUpload { get; set; } = false;
    public bool SupportsImageGeneration { get; set; } = false;

    // Ownership & Access
    public string? OwnerId { get; set; }
    public string? Visibility { get; set; } = "Private";
    public List<string> AllowedGroups { get; set; } = new();
}
