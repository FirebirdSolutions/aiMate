namespace AiMate.Shared.Dtos.Notes;

/// <summary>
/// Create note request
/// </summary>
public class CreateNoteRequest
{
    public required string Title { get; set; }
    public string Content { get; set; } = string.Empty;
    public string ContentType { get; set; } = "markdown";
    public List<string>? Tags { get; set; }
    public string? Collection { get; set; }
    public string? Category { get; set; }
    public string? Color { get; set; }
}
