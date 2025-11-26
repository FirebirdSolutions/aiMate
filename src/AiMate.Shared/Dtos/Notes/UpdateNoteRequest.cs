namespace AiMate.Shared.Dtos.Notes;

/// <summary>
/// Update note request
/// </summary>
public class UpdateNoteRequest
{
    public string? Title { get; set; }
    public string? Content { get; set; }
    public string? ContentType { get; set; }
    public List<string>? Tags { get; set; }
    public string? Collection { get; set; }
    public string? Category { get; set; }
    public string? Color { get; set; }
    public bool? IsPinned { get; set; }
    public bool? IsFavorite { get; set; }
    public bool? IsArchived { get; set; }
}
