namespace AiMate.Shared.Dtos.Usage;

/// <summary>
/// User usage analytics response
/// </summary>
public class UserUsageDto
{
    public int TotalMessages { get; set; }
    public long TotalTokens { get; set; }
    public decimal TotalCost { get; set; }
    public string BillingPeriodStart { get; set; } = string.Empty;
    public string BillingPeriodEnd { get; set; } = string.Empty;
    public List<UsageByModelDto> UsageByModel { get; set; } = new();
}
