using AiMate.Core.Services;
using Microsoft.AspNetCore.Mvc;

namespace AiMate.Web.Controllers;

/// <summary>
/// Chat API for Developer tier - REST API for external integrations
/// </summary>
[ApiController]
[Route("api/v1/chat")]
public class ChatApiController : ControllerBase
{
    private readonly ILiteLLMService _liteLLMService;
    private readonly IApiKeyService _apiKeyService;
    private readonly ILogger<ChatApiController> _logger;

    public ChatApiController(
        ILiteLLMService liteLLMService,
        IApiKeyService apiKeyService,
        ILogger<ChatApiController> logger)
    {
        _liteLLMService = liteLLMService;
        _apiKeyService = apiKeyService;
        _logger = logger;
    }

    /// <summary>
    /// Send chat completion request (OpenAI-compatible)
    /// </summary>
    [HttpPost("completions")]
    public async Task<IActionResult> CreateCompletion([FromBody] ChatCompletionRequest request)
    {
        // Validate API key from Authorization header
        var apiKey = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
        var userId = await _apiKeyService.ValidateApiKeyAsync(apiKey);

        if (userId == null)
        {
            return Unauthorized(new { error = "Invalid API key" });
        }

        try
        {
            _logger.LogInformation("Chat completion request for user {UserId}", userId);

            // For now, return a placeholder response
            // TODO: Integrate with LiteLLM service for actual completion
            return Ok(new
            {
                id = Guid.NewGuid().ToString(),
                @object = "chat.completion",
                created = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
                model = request.Model,
                choices = new[]
                {
                    new
                    {
                        index = 0,
                        message = new
                        {
                            role = "assistant",
                            content = "API integration coming soon! This is a placeholder response."
                        },
                        finish_reason = "stop"
                    }
                },
                usage = new
                {
                    prompt_tokens = 10,
                    completion_tokens = 20,
                    total_tokens = 30
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Chat completion failed");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// Stream chat completion (OpenAI-compatible)
    /// </summary>
    [HttpPost("completions/stream")]
    public async Task<IActionResult> CreateCompletionStream([FromBody] ChatCompletionRequest request)
    {
        var apiKey = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
        var userId = await _apiKeyService.ValidateApiKeyAsync(apiKey);

        if (userId == null)
        {
            return Unauthorized(new { error = "Invalid API key" });
        }

        // TODO: Implement SSE streaming
        return StatusCode(501, new { error = "Streaming not yet implemented" });
    }
}

/// <summary>
/// Chat completion request (OpenAI-compatible)
/// </summary>
public class ChatCompletionRequest
{
    public string Model { get; set; } = "gpt-4";
    public List<ChatMessage> Messages { get; set; } = new();
    public double Temperature { get; set; } = 0.7;
    public int MaxTokens { get; set; } = 1000;
    public bool Stream { get; set; } = false;
}

public class ChatMessage
{
    public string Role { get; set; } = "user";
    public string Content { get; set; } = string.Empty;
}
