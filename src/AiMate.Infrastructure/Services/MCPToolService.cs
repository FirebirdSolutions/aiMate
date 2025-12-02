using System.Net.Http;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Web;
using AiMate.Core.Entities;
using AiMate.Core.Services;
using Microsoft.Extensions.Logging;

namespace AiMate.Infrastructure.Services;

/// <summary>
/// MCP Tool Service implementation with built-in tools
/// </summary>
public class MCPToolService : IMCPToolService
{
    private readonly ILogger<MCPToolService> _logger;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IFileUploadService? _fileUploadService;
    private readonly IKnowledgeGraphService? _knowledgeService;
    private readonly IDatasetGeneratorService? _datasetGenerator;
    private readonly ICodeExecutionProvider? _codeExecutionProvider;
    private readonly Dictionary<string, MCPTool> _registeredTools = [];
    private readonly Dictionary<string, Func<Dictionary<string, object>, Task<MCPToolResult>>> _toolExecutors = [];

    public MCPToolService(
        ILogger<MCPToolService> logger,
        IHttpClientFactory httpClientFactory,
        IFileUploadService? fileUploadService = null,
        IKnowledgeGraphService? knowledgeService = null,
        IDatasetGeneratorService? datasetGenerator = null,
        ICodeExecutionProvider? codeExecutionProvider = null)
    {
        _logger = logger;
        _httpClientFactory = httpClientFactory;
        _fileUploadService = fileUploadService;
        _knowledgeService = knowledgeService;
        _datasetGenerator = datasetGenerator;
        _codeExecutionProvider = codeExecutionProvider;
        RegisterBuiltInTools();
    }

    public Task<List<MCPTool>> GetAvailableToolsAsync(
        Guid workspaceId,
        CancellationToken cancellationToken = default)
    {
        // FUTURE ENHANCEMENT: Filter tools by workspace settings
        // Add WorkspaceTools table with EnabledTools JSON column
        // Query and filter: tools.Where(t => workspaceTools.EnabledTools.Contains(t.Name))
        // Currently returns all registered tools
        var tools = _registeredTools.Values.ToList();
        return Task.FromResult(tools);
    }

    public async Task<MCPToolResult> ExecuteToolAsync(
        string toolName,
        Dictionary<string, object> parameters,
        Guid workspaceId,
        CancellationToken cancellationToken = default)
    {
        if (!_toolExecutors.TryGetValue(toolName, out Func<Dictionary<string, object>, Task<MCPToolResult>>? value))
        {
            return new MCPToolResult
            {
                Success = false,
                Error = $"Tool '{toolName}' not found"
            };
        }

        try
        {
            _logger.LogInformation("Executing tool: {ToolName} with parameters: {Parameters}",
                toolName, JsonSerializer.Serialize(parameters));

            var result = await value(parameters);

            _logger.LogInformation("Tool execution completed: {ToolName}, Success: {Success}",
                toolName, result.Success);

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Tool execution failed: {ToolName}", toolName);
            return new MCPToolResult
            {
                Success = false,
                Error = $"Tool execution failed: {ex.Message}"
            };
        }
    }

    public Task RegisterToolAsync(
        MCPTool tool,
        CancellationToken cancellationToken = default)
    {
        _registeredTools[tool.Name] = tool;
        _logger.LogInformation("Tool registered: {ToolName}", tool.Name);
        return Task.CompletedTask;
    }

    public Task<bool> IsToolAvailableAsync(
        string toolName,
        CancellationToken cancellationToken = default)
    {
        return Task.FromResult(_registeredTools.ContainsKey(toolName));
    }

    private void RegisterBuiltInTools()
    {
        // Web Search Tool
        var webSearchTool = new MCPTool
        {
            Name = "web_search",
            Description = "Search the web for information using DuckDuckGo",
            Parameters = new Dictionary<string, MCPToolParameter>
            {
                ["query"] = new MCPToolParameter
                {
                    Type = "string",
                    Description = "Search query",
                    Required = true
                },
                ["max_results"] = new MCPToolParameter
                {
                    Type = "integer",
                    Description = "Maximum number of results to return",
                    Required = false,
                    DefaultValue = 5
                }
            }
        };

        _registeredTools[webSearchTool.Name] = webSearchTool;
        _toolExecutors[webSearchTool.Name] = ExecuteWebSearchAsync;

        // Execute Code Tool - Multi-language code execution
        var executeCodeTool = new MCPTool
        {
            Name = "execute_code",
            Description = "Execute code in a sandboxed environment. Supports Python, JavaScript, TypeScript, C#, Go, Rust, Java, Ruby, PHP, and Bash.",
            Parameters = new Dictionary<string, MCPToolParameter>
            {
                ["language"] = new MCPToolParameter
                {
                    Type = "string",
                    Description = "Programming language: python, javascript, typescript, csharp, go, rust, java, ruby, php, bash",
                    Required = true
                },
                ["code"] = new MCPToolParameter
                {
                    Type = "string",
                    Description = "Source code to execute",
                    Required = true
                },
                ["timeout"] = new MCPToolParameter
                {
                    Type = "integer",
                    Description = "Execution timeout in seconds (default: 30, max: 60)",
                    Required = false,
                    DefaultValue = 30
                },
                ["stdin"] = new MCPToolParameter
                {
                    Type = "string",
                    Description = "Standard input to provide to the program",
                    Required = false
                }
            },
            RequiresAuth = true
        };

        _registeredTools[executeCodeTool.Name] = executeCodeTool;
        _toolExecutors[executeCodeTool.Name] = ExecuteCodeAsync;

        // Legacy code_interpreter alias (for backwards compatibility)
        _toolExecutors["code_interpreter"] = ExecuteCodeAsync;

        // File Reader Tool
        var fileReaderTool = new MCPTool
        {
            Name = "read_file",
            Description = "Read contents of uploaded files",
            Parameters = new Dictionary<string, MCPToolParameter>
            {
                ["file_id"] = new MCPToolParameter
                {
                    Type = "string",
                    Description = "ID of the file to read",
                    Required = true
                }
            }
        };

        _registeredTools[fileReaderTool.Name] = fileReaderTool;
        _toolExecutors[fileReaderTool.Name] = ExecuteFileReaderAsync;

        // Knowledge Search Tool
        var knowledgeSearchTool = new MCPTool
        {
            Name = "knowledge_search",
            Description = "Search the user's knowledge base using semantic search",
            Parameters = new Dictionary<string, MCPToolParameter>
            {
                ["query"] = new MCPToolParameter
                {
                    Type = "string",
                    Description = "Search query",
                    Required = true
                },
                ["limit"] = new MCPToolParameter
                {
                    Type = "integer",
                    Description = "Maximum number of results",
                    Required = false,
                    DefaultValue = 5
                }
            }
        };

        _registeredTools[knowledgeSearchTool.Name] = knowledgeSearchTool;
        _toolExecutors[knowledgeSearchTool.Name] = ExecuteKnowledgeSearchAsync;

        // Dataset Generator Tool (for Guardian fine-tuning)
        if (_datasetGenerator != null)
        {
            var datasetGenTool = new MCPTool
            {
                Name = "generate_dataset",
                Description = "Generate synthetic training dataset for personality fine-tuning (template-based, safe for mental health)",
                Parameters = new Dictionary<string, MCPToolParameter>
                {
                    ["personality"] = new MCPToolParameter
                    {
                        Type = "string",
                        Description = "Personality name (e.g., 'Guardian')",
                        Required = true
                    },
                    ["num_examples"] = new MCPToolParameter
                    {
                        Type = "integer",
                        Description = "Number of training examples to generate",
                        Required = false,
                        DefaultValue = 100
                    },
                    ["export_format"] = new MCPToolParameter
                    {
                        Type = "string",
                        Description = "Export format: 'jsonl' for fine-tuning or 'json' for review",
                        Required = false,
                        DefaultValue = "jsonl"
                    }
                },
                RequiresAuth = true
            };

            _registeredTools[datasetGenTool.Name] = datasetGenTool;
            _toolExecutors[datasetGenTool.Name] = ExecuteDatasetGeneratorAsync;
        }

        _logger.LogInformation("Built-in tools registered: {Count}", _registeredTools.Count);
    }

    private async Task<MCPToolResult> ExecuteWebSearchAsync(Dictionary<string, object> parameters)
    {
        var query = parameters["query"].ToString();
        var maxResults = parameters.TryGetValue("max_results", out object? value)
            ? Convert.ToInt32(value)
            : 5;

        try
        {
            var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.UserAgent.ParseAdd("Mozilla/5.0 (compatible; aiMate/1.0)");

            var encodedQuery = HttpUtility.UrlEncode(query);
            var url = $"https://html.duckduckgo.com/html/?q={encodedQuery}";

            var startTime = DateTime.UtcNow;
            var response = await client.GetStringAsync(url);
            var queryTime = (DateTime.UtcNow - startTime).TotalMilliseconds;

            // Parse DuckDuckGo HTML results
            var results = ParseDuckDuckGoResults(response, maxResults);

            return new MCPToolResult
            {
                Success = true,
                Result = new
                {
                    query,
                    results = results.Select(r => new
                    {
                        title = r.Title,
                        url = r.Url,
                        snippet = r.Snippet
                    }).ToArray()
                },
                Metadata = new Dictionary<string, object>
                {
                    ["source"] = "DuckDuckGo",
                    ["query_time_ms"] = queryTime,
                    ["result_count"] = results.Count
                }
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Web search failed for query: {Query}", query);
            return new MCPToolResult
            {
                Success = false,
                Error = $"Web search failed: {ex.Message}"
            };
        }
    }

    private List<(string Title, string Url, string Snippet)> ParseDuckDuckGoResults(string html, int maxResults)
    {
        var results = new List<(string, string, string)>();

        try
        {
            // Extract result links and snippets using regex
            var linkPattern = @"<a[^>]+class=""result__a""[^>]+href=""([^""]+)""[^>]*>([^<]+)</a>";
            var snippetPattern = @"<a[^>]+class=""result__snippet""[^>]*>([^<]+)</a>";

            var linkMatches = Regex.Matches(html, linkPattern);
            var snippetMatches = Regex.Matches(html, snippetPattern);

            for (int i = 0; i < Math.Min(Math.Min(linkMatches.Count, snippetMatches.Count), maxResults); i++)
            {
                var url = HttpUtility.HtmlDecode(linkMatches[i].Groups[1].Value);
                var title = HttpUtility.HtmlDecode(linkMatches[i].Groups[2].Value);
                var snippet = HttpUtility.HtmlDecode(snippetMatches[i].Groups[1].Value);

                results.Add((title, url, snippet));
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to parse DuckDuckGo results, returning empty list");
        }

        return results;
    }

    private async Task<MCPToolResult> ExecuteCodeAsync(Dictionary<string, object> parameters)
    {
        var language = parameters.TryGetValue("language", out object? langValue)
            ? langValue?.ToString() ?? "python"
            : "python";
        var code = parameters["code"]?.ToString() ?? string.Empty;
        var timeout = parameters.TryGetValue("timeout", out object? timeoutValue)
            ? Convert.ToInt32(timeoutValue)
            : 30;
        var stdin = parameters.TryGetValue("stdin", out object? stdinValue)
            ? stdinValue?.ToString()
            : null;

        // Check if we have a code execution provider configured
        if (_codeExecutionProvider == null)
        {
            _logger.LogWarning("No code execution provider configured");
            return new MCPToolResult
            {
                Success = false,
                Error = "Code execution not configured. Please configure E2B or Docker provider in appsettings.json"
            };
        }

        // Check if the language is supported
        if (!_codeExecutionProvider.SupportsLanguage(language))
        {
            return new MCPToolResult
            {
                Success = false,
                Error = $"Language '{language}' is not supported. Supported: {string.Join(", ", _codeExecutionProvider.SupportedLanguages)}"
            };
        }

        // Check if the provider is available
        if (!await _codeExecutionProvider.IsAvailableAsync())
        {
            var health = await _codeExecutionProvider.GetHealthAsync();
            return new MCPToolResult
            {
                Success = false,
                Error = $"Code execution provider ({_codeExecutionProvider.ProviderName}) is not available: {health.Message}"
            };
        }

        try
        {
            _logger.LogInformation(
                "Executing {Language} code via {Provider}",
                language, _codeExecutionProvider.ProviderName);

            var request = new CodeExecutionRequest
            {
                Language = language,
                Code = code,
                TimeoutSeconds = Math.Min(timeout, 60), // Cap at 60 seconds
                Stdin = stdin
            };

            var result = await _codeExecutionProvider.ExecuteAsync(request);

            return new MCPToolResult
            {
                Success = result.Success,
                Error = result.Error,
                Result = new
                {
                    language,
                    stdout = result.Stdout,
                    stderr = result.Stderr,
                    exitCode = result.ExitCode,
                    executionTime = result.ExecutionTimeMs
                },
                Metadata = new Dictionary<string, object>
                {
                    ["provider"] = _codeExecutionProvider.ProviderName,
                    ["timeout"] = timeout
                }
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Code execution failed for {Language}", language);
            return new MCPToolResult
            {
                Success = false,
                Error = $"Execution failed: {ex.Message}"
            };
        }
    }

    private async Task<MCPToolResult> ExecuteFileReaderAsync(Dictionary<string, object> parameters)
    {
        var fileId = parameters["file_id"].ToString();

        if (_fileUploadService == null)
        {
            return new MCPToolResult
            {
                Success = false,
                Error = "File upload service not available"
            };
        }

        try
        {
            if (!Guid.TryParse(fileId, out var fileGuid))
            {
                return new MCPToolResult
                {
                    Success = false,
                    Error = "Invalid file ID format"
                };
            }

            var fileResult = await _fileUploadService.GetFileAsync(fileGuid);

            if (fileResult == null)
            {
                return new MCPToolResult
                {
                    Success = false,
                    Error = $"File not found: {fileId}"
                };
            }

            using var reader = new StreamReader(fileResult.Value.Stream);
            var content = await reader.ReadToEndAsync();

            return new MCPToolResult
            {
                Success = true,
                Result = new
                {
                    file_id = fileId,
                    content,
                    content_type = fileResult.Value.ContentType,
                    size_bytes = content.Length
                }
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "File reading failed for file: {FileId}", fileId);
            return new MCPToolResult
            {
                Success = false,
                Error = $"File reading failed: {ex.Message}"
            };
        }
    }

    private async Task<MCPToolResult> ExecuteKnowledgeSearchAsync(Dictionary<string, object> parameters)
    {
        var query = parameters["query"].ToString();
        var limit = parameters.TryGetValue("limit", out object? value)
            ? Convert.ToInt32(value)
            : 5;

        if (_knowledgeService == null)
        {
            return new MCPToolResult
            {
                Success = false,
                Error = "Knowledge service not available"
            };
        }

        try
        {
            // IMPLEMENTATION NEEDED: Add userId parameter to ExecuteToolAsync signature
            // Then pass it through to tool executors via parameters dictionary
            // Example: var userId = parameters.ContainsKey("user_id") ? (Guid)parameters["user_id"] : Guid.Empty;
            // For now, using Empty to search all knowledge items
            var userId = Guid.Empty;

            var items = await _knowledgeService.SearchAsync(query, userId, limit);

            return new MCPToolResult
            {
                Success = true,
                Result = new
                {
                    query,
                    results = items.Select(item => new
                    {
                        id = item.Id,
                        title = item.Title,
                        content = item.Content,
                        tags = item.Tags,
                        created_at = item.CreatedAt,
                        relevance = 0.85 // Placeholder - actual relevance would come from vector similarity score
                    }).ToArray()
                },
                Metadata = new Dictionary<string, object>
                {
                    ["search_type"] = "semantic",
                    ["vector_similarity"] = true,
                    ["result_count"] = items.Count
                }
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Knowledge search failed for query: {Query}", query);
            return new MCPToolResult
            {
                Success = false,
                Error = $"Knowledge search failed: {ex.Message}"
            };
        }
    }

    private async Task<MCPToolResult> ExecuteDatasetGeneratorAsync(Dictionary<string, object> parameters)
    {
        if (_datasetGenerator == null)
        {
            return new MCPToolResult
            {
                Success = false,
                Error = "Dataset generator service not available"
            };
        }

        try
        {
            var personality = parameters["personality"].ToString() ?? "Guardian";
            var numExamples = parameters.TryGetValue("num_examples", out object? value1)
                ? Convert.ToInt32(value1)
                : 100;
            var exportFormat = parameters.TryGetValue("export_format", out object? value)
                ? value.ToString()
                : "jsonl";

            _logger.LogInformation(
                "Generating {Count} training examples for {Personality}",
                numExamples, personality);

            // Generate dataset from templates
            var dataset = await _datasetGenerator.GenerateFromTemplatesAsync(
                personality,
                numExamples);

            // Validate quality
            var validation = await _datasetGenerator.ValidateDatasetAsync(dataset);

            // Export in requested format
            string exportedData;
            if (exportFormat?.ToLower() == "jsonl")
            {
                exportedData = await _datasetGenerator.ExportToJsonLinesAsync(dataset);
            }
            else
            {
                JsonSerializerOptions jsonSerializerOptions = new()
                {
                    WriteIndented = true
                };
                exportedData = JsonSerializer.Serialize(dataset, jsonSerializerOptions);
            }

            return new MCPToolResult
            {
                Success = true,
                Result = new
                {
                    personality,
                    total_examples = dataset.TotalExamples,
                    generated_at = dataset.GeneratedAt,
                    scenario_distribution = dataset.ScenarioDistribution,
                    validation = new
                    {
                        is_valid = validation.IsValid,
                        quality_score = validation.QualityScore,
                        warnings = validation.Warnings,
                        crisis_distribution = validation.CrisisLevelDistribution,
                        cultural_markers = validation.CulturalMarkerCount,
                        resources_mentioned = validation.ResourceMentionCount
                    },
                    export_format = exportFormat,
                    data = exportedData
                },
                Metadata = new Dictionary<string, object>
                {
                    ["generation_method"] = "template_based",
                    ["safe_for_mental_health"] = true,
                    ["human_validation_required"] = true
                }
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Dataset generation failed");
            return new MCPToolResult
            {
                Success = false,
                Error = $"Dataset generation failed: {ex.Message}"
            };
        }
    }
}
