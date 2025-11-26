namespace AiMate.Shared.Dtos.Usage;

/// <summary>
/// Usage breakdown by model
/// </summary>
public class UsageByModelDto
{
    public string Model { get; set; } = string.Empty;
    public string Connection { get; set; } = string.Empty;
    public int Messages { get; set; }
    public long Tokens { get; set; }
    public decimal Cost { get; set; }
    public string Color { get; set; } = "#A855F7"; // Default purple
}
