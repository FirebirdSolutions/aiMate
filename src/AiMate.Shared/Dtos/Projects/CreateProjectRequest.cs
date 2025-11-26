namespace AiMate.Shared.Dtos.Projects;

public class CreateProjectRequest
{
    public required string Key { get; set; }
    public required string Name { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? OwnerName { get; set; }
    public string? OwnerEmail { get; set; }
    public string? Owner { get; set; }
    public string Status { get; set; } = "Planning";
    public string Priority { get; set; } = "Medium";
    public decimal? Budget { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? DueDate { get; set; }
    public int ProgressPercent { get; set; } = 0;
    public List<string>? Tags { get; set; }
    public List<string>? TeamMembers { get; set; }
    public string? Notes { get; set; }
}
