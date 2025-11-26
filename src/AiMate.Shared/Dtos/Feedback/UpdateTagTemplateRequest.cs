namespace AiMate.Shared.Dtos.Feedback;

public class UpdateTagTemplateRequest
{
    public string? Category { get; set; }
    public string? Label { get; set; }
    public string? Description { get; set; }
    public bool? IsActive { get; set; }
    public bool? IsRequired { get; set; }
    public int? DisplayOrder { get; set; }
}
