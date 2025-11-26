namespace AiMate.Shared.Dtos.Admin;

/// <summary>
/// System log entry
/// </summary>
public class SystemLogDto
{
    public DateTime Timestamp { get; set; }
    public string Level { get; set; } = "INFO";
    public string Message { get; set; } = string.Empty;
    public string? Source { get; set; }
}
