namespace AiMate.Shared.Dtos.Projects;

public class UpdateProjectRequest
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public string? Status { get; set; }
    public string? Priority { get; set; }
    public decimal? Budget { get; set; }
    public int? ProgressPercent { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? DueDate { get; set; }
    public string? Owner { get; set; }
    public List<string>? TeamMembers { get; set; }
    public List<string>? Tags { get; set; }
    public string? Notes { get; set; }
}
