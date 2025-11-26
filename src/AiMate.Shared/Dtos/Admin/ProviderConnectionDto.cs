namespace AiMate.Shared.Dtos.Admin;

/// <summary>
/// LLM Provider Connection (OpenAI, Anthropic, etc.)
/// </summary>
public class ProviderConnectionDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = "Cloud"; // Cloud or Local
    public string Url { get; set; } = string.Empty;
    public string Auth { get; set; } = "None"; // None, Bearer, ApiKey, OAuth
    public string? AuthToken { get; set; }
    public string? Headers { get; set; } // JSON format
    public string? PrefixId { get; set; }
    public string ProviderType { get; set; } = "OpenAI"; // OpenAI, Anthropic, Local, etc.
    public List<string> ModelIds { get; set; } = new();
    public List<string> Tags { get; set; } = new();
    public bool IsEnabled { get; set; } = true;

    // Ownership & Visibility
    public string? OwnerId { get; set; }
    public string Visibility { get; set; } = "Private";
    public List<string> AllowedGroups { get; set; } = new();
    public string ApiKey { get; set; } = "";
    public string Description { get; set; } = "";
}
