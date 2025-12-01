# C# Plugin Architecture for aiMate

This document outlines the server-side plugin architecture using C# / ASP.NET Core, complementing the frontend TypeScript plugins.

## Architectural Decision: MCP for External Only

**Key Principle**: Use MCP for external tool integration, native APIs for internal communication.

```
❌ Over-engineered (avoid):
Frontend → MCP Client → MCP Server (C#) → Plugin System → MCP Client → External MCP

✅ Recommended:
Frontend → REST/SignalR → C# Plugin System → MCP Client → External MCP Servers
                              ↓
                         Native C# Plugins
```

### Why Not MCP Internally?

| Concern | MCP Internal | Native API |
|---------|--------------|------------|
| Performance | Protocol overhead | Direct calls |
| Type Safety | JSON schema | C# generics + TS codegen |
| Debugging | Protocol inspection | Standard .NET debugging |
| Flexibility | MCP spec constraints | Full control |
| Complexity | Extra translation layer | Simpler stack |

### Where MCP Makes Sense

| Use Case | Protocol | Reason |
|----------|----------|--------|
| Frontend ↔ Backend | REST + SignalR | Fast, typed, you control it |
| Backend ↔ External MCP | MCP | Interop with ecosystem |
| Internal C# Plugins | Native .NET | No translation overhead |
| LLM ↔ Tools | Function calling | Standard AI interface |

### The C# Backend as MCP Client

The backend connects TO external MCP servers (filesystem, databases, etc.) but does NOT expose itself as an MCP server:

```csharp
// C# backend is an MCP CLIENT, not server
public class McpClientService : IHostedService
{
    private readonly ConcurrentDictionary<string, McpConnection> _connections = new();
    private readonly ILogger<McpClientService> _logger;

    public async Task StartAsync(CancellationToken ct)
    {
        var configs = _configuration.GetSection("McpServers").Get<List<McpServerConfig>>();

        foreach (var config in configs ?? [])
        {
            try
            {
                var conn = await McpConnection.CreateAsync(config);
                _connections[config.Name] = conn;
                _logger.LogInformation("Connected to MCP server: {Name}", config.Name);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to connect to MCP server: {Name}", config.Name);
            }
        }
    }

    public async Task<ToolResult> CallToolAsync(string serverName, string toolName, JsonDocument args)
    {
        if (!_connections.TryGetValue(serverName, out var conn))
            return ToolResult.Error($"MCP server '{serverName}' not connected");

        return await conn.CallToolAsync(toolName, args);
    }

    public IEnumerable<(string Server, ToolDefinition Tool)> GetAllTools()
    {
        return _connections.SelectMany(kvp =>
            kvp.Value.Tools.Select(t => (kvp.Key, t)));
    }

    public async Task StopAsync(CancellationToken ct)
    {
        foreach (var conn in _connections.Values)
            await conn.DisposeAsync();
    }
}
```

---

## Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React/TS)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ UI Plugins  │  │ Chat Hooks  │  │ Plugin Bridge (API) │  │
│  └─────────────┘  └─────────────┘  └──────────┬──────────┘  │
└───────────────────────────────────────────────┼─────────────┘
                                                │ HTTP/SignalR
┌───────────────────────────────────────────────┼─────────────┐
│                    Backend (ASP.NET Core)     │             │
│  ┌────────────────────────────────────────────▼──────────┐  │
│  │                   Plugin Host Service                  │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌───────────────┐  │  │
│  │  │ Discovery   │  │ Lifecycle   │  │ Execution     │  │  │
│  │  │ & Loading   │  │ Management  │  │ Pipeline      │  │  │
│  │  └─────────────┘  └─────────────┘  └───────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
│                              │                               │
│  ┌───────────────────────────┼───────────────────────────┐  │
│  │              Plugin Instances                          │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐            │  │
│  │  │ RAG      │  │ Sentiment│  │ Document │  ...       │  │
│  │  │ Plugin   │  │ Plugin   │  │ Parser   │            │  │
│  │  └──────────┘  └──────────┘  └──────────┘            │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 1. Plugin Contract (Interface)

```csharp
// AiMate.Plugins.Abstractions

namespace AiMate.Plugins;

/// <summary>
/// Base interface all plugins must implement
/// </summary>
public interface IPlugin
{
    /// <summary>Unique plugin identifier</summary>
    string Id { get; }

    /// <summary>Display name</summary>
    string Name { get; }

    /// <summary>Plugin version (SemVer)</summary>
    string Version { get; }

    /// <summary>Plugin description</summary>
    string Description { get; }

    /// <summary>Plugin author</summary>
    string Author { get; }

    /// <summary>Called when plugin is loaded</summary>
    Task InitializeAsync(IPluginContext context);

    /// <summary>Called when plugin is unloaded</summary>
    Task ShutdownAsync();
}

/// <summary>
/// Plugin that processes messages before sending to LLM
/// </summary>
public interface IMessagePreProcessor : IPlugin
{
    int Priority { get; } // Lower = runs first
    Task<MessageContext> ProcessAsync(MessageContext context);
}

/// <summary>
/// Plugin that processes LLM responses before returning to user
/// </summary>
public interface IMessagePostProcessor : IPlugin
{
    int Priority { get; }
    Task<MessageContext> ProcessAsync(MessageContext context);
}

/// <summary>
/// Plugin that provides tools/functions for LLM to call
/// </summary>
public interface IToolProvider : IPlugin
{
    IReadOnlyList<ToolDefinition> GetTools();
    Task<ToolResult> ExecuteToolAsync(string toolName, JsonDocument parameters);
}

/// <summary>
/// Plugin for document processing and RAG
/// </summary>
public interface IDocumentProcessor : IPlugin
{
    IReadOnlyList<string> SupportedExtensions { get; }
    Task<DocumentChunks> ProcessAsync(Stream document, string fileName);
}

/// <summary>
/// Plugin for embedding generation
/// </summary>
public interface IEmbeddingProvider : IPlugin
{
    int Dimensions { get; }
    Task<float[]> GenerateEmbeddingAsync(string text);
    Task<float[][]> GenerateEmbeddingsAsync(IEnumerable<string> texts);
}
```

## 2. Plugin Context & Services

```csharp
/// <summary>
/// Context passed to plugins during initialization
/// </summary>
public interface IPluginContext
{
    /// <summary>Plugin's isolated configuration</summary>
    IConfiguration Configuration { get; }

    /// <summary>Logging for the plugin</summary>
    ILogger Logger { get; }

    /// <summary>Plugin's data directory</summary>
    string DataDirectory { get; }

    /// <summary>Access to shared services</summary>
    IServiceProvider Services { get; }

    /// <summary>Publish events to other plugins</summary>
    Task PublishEventAsync<T>(T @event) where T : IPluginEvent;

    /// <summary>Subscribe to events from other plugins</summary>
    void Subscribe<T>(Func<T, Task> handler) where T : IPluginEvent;
}

/// <summary>
/// Message context passed through processing pipeline
/// </summary>
public record MessageContext
{
    public required string ConversationId { get; init; }
    public required string UserId { get; init; }
    public required string Content { get; init; }
    public required MessageRole Role { get; init; }
    public IReadOnlyList<Message> History { get; init; } = [];
    public Dictionary<string, object> Metadata { get; init; } = [];

    // For modifications
    public MessageContext WithContent(string newContent)
        => this with { Content = newContent };

    public MessageContext WithMetadata(string key, object value)
    {
        var newMeta = new Dictionary<string, object>(Metadata) { [key] = value };
        return this with { Metadata = newMeta };
    }
}
```

## 3. Plugin Host Service

```csharp
/// <summary>
/// Manages plugin lifecycle and execution
/// </summary>
public class PluginHostService : IHostedService
{
    private readonly ILogger<PluginHostService> _logger;
    private readonly PluginOptions _options;
    private readonly IServiceProvider _services;
    private readonly ConcurrentDictionary<string, LoadedPlugin> _plugins = new();

    public PluginHostService(
        ILogger<PluginHostService> logger,
        IOptions<PluginOptions> options,
        IServiceProvider services)
    {
        _logger = logger;
        _options = options.Value;
        _services = services;
    }

    public async Task StartAsync(CancellationToken ct)
    {
        _logger.LogInformation("Starting plugin host...");

        // Discover plugins in configured directories
        var pluginPaths = DiscoverPlugins(_options.PluginDirectories);

        foreach (var path in pluginPaths)
        {
            try
            {
                await LoadPluginAsync(path, ct);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to load plugin from {Path}", path);
            }
        }

        _logger.LogInformation("Loaded {Count} plugins", _plugins.Count);
    }

    public async Task StopAsync(CancellationToken ct)
    {
        foreach (var plugin in _plugins.Values)
        {
            try
            {
                await plugin.Instance.ShutdownAsync();
                plugin.LoadContext?.Unload();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error shutting down plugin {Id}", plugin.Instance.Id);
            }
        }
    }

    private async Task LoadPluginAsync(string path, CancellationToken ct)
    {
        // Use AssemblyLoadContext for isolation and hot-reload
        var loadContext = new PluginLoadContext(path);
        var assembly = loadContext.LoadFromAssemblyPath(path);

        // Find plugin types
        var pluginTypes = assembly.GetTypes()
            .Where(t => typeof(IPlugin).IsAssignableFrom(t) && !t.IsAbstract);

        foreach (var type in pluginTypes)
        {
            var instance = (IPlugin)ActivatorUtilities.CreateInstance(_services, type);
            var context = CreatePluginContext(instance);

            await instance.InitializeAsync(context);

            _plugins[instance.Id] = new LoadedPlugin
            {
                Instance = instance,
                LoadContext = loadContext,
                Context = context
            };

            _logger.LogInformation("Loaded plugin: {Name} v{Version}", instance.Name, instance.Version);
        }
    }

    // Hot-reload support
    public async Task ReloadPluginAsync(string pluginId)
    {
        if (_plugins.TryRemove(pluginId, out var existing))
        {
            await existing.Instance.ShutdownAsync();
            existing.LoadContext?.Unload();

            // Force GC to unload assembly
            GC.Collect();
            GC.WaitForPendingFinalizers();

            // Reload from original path
            // ... reload logic
        }
    }
}

/// <summary>
/// Isolated assembly load context for plugins
/// </summary>
public class PluginLoadContext : AssemblyLoadContext
{
    private readonly AssemblyDependencyResolver _resolver;

    public PluginLoadContext(string pluginPath) : base(isCollectible: true)
    {
        _resolver = new AssemblyDependencyResolver(pluginPath);
    }

    protected override Assembly? Load(AssemblyName name)
    {
        var path = _resolver.ResolveAssemblyToPath(name);
        return path != null ? LoadFromAssemblyPath(path) : null;
    }
}
```

## 4. Execution Pipeline

```csharp
/// <summary>
/// Executes the plugin pipeline for messages
/// </summary>
public class PluginPipeline
{
    private readonly PluginHostService _host;
    private readonly ILogger<PluginPipeline> _logger;

    public async Task<MessageContext> ExecutePreProcessorsAsync(MessageContext context)
    {
        var processors = _host.GetPlugins<IMessagePreProcessor>()
            .OrderBy(p => p.Priority);

        foreach (var processor in processors)
        {
            try
            {
                context = await processor.ProcessAsync(context);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Pre-processor {Name} failed", processor.Name);
                // Continue with next processor or throw based on config
            }
        }

        return context;
    }

    public async Task<MessageContext> ExecutePostProcessorsAsync(MessageContext context)
    {
        var processors = _host.GetPlugins<IMessagePostProcessor>()
            .OrderBy(p => p.Priority);

        foreach (var processor in processors)
        {
            try
            {
                context = await processor.ProcessAsync(context);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Post-processor {Name} failed", processor.Name);
            }
        }

        return context;
    }

    public async Task<ToolResult> ExecuteToolAsync(string pluginId, string toolName, JsonDocument parameters)
    {
        var provider = _host.GetPlugin<IToolProvider>(pluginId);
        if (provider == null)
            return ToolResult.Error($"Plugin {pluginId} not found");

        return await provider.ExecuteToolAsync(toolName, parameters);
    }
}
```

## 5. API Controller

```csharp
[ApiController]
[Route("api/plugins")]
public class PluginsController : ControllerBase
{
    private readonly PluginHostService _host;
    private readonly PluginPipeline _pipeline;

    [HttpGet]
    public ActionResult<IEnumerable<PluginInfo>> ListPlugins()
    {
        return Ok(_host.GetAllPlugins().Select(p => new PluginInfo
        {
            Id = p.Id,
            Name = p.Name,
            Version = p.Version,
            Description = p.Description,
            Author = p.Author,
            Capabilities = GetCapabilities(p)
        }));
    }

    [HttpGet("{pluginId}/tools")]
    public ActionResult<IEnumerable<ToolDefinition>> GetTools(string pluginId)
    {
        var provider = _host.GetPlugin<IToolProvider>(pluginId);
        if (provider == null)
            return NotFound();

        return Ok(provider.GetTools());
    }

    [HttpPost("{pluginId}/tools/{toolName}/execute")]
    public async Task<ActionResult<ToolResult>> ExecuteTool(
        string pluginId,
        string toolName,
        [FromBody] JsonDocument parameters)
    {
        var result = await _pipeline.ExecuteToolAsync(pluginId, toolName, parameters);
        return Ok(result);
    }

    [HttpPost("{pluginId}/reload")]
    [Authorize(Policy = "Admin")]
    public async Task<ActionResult> ReloadPlugin(string pluginId)
    {
        await _host.ReloadPluginAsync(pluginId);
        return Ok();
    }
}
```

## 6. Example Plugins

### Sentiment Analysis Plugin

```csharp
public class SentimentPlugin : IMessagePostProcessor
{
    public string Id => "sentiment-analysis";
    public string Name => "Sentiment Analysis";
    public string Version => "1.0.0";
    public string Description => "Analyzes sentiment of messages";
    public string Author => "aiMate";
    public int Priority => 100;

    private ILogger _logger = null!;

    public Task InitializeAsync(IPluginContext context)
    {
        _logger = context.Logger;
        return Task.CompletedTask;
    }

    public Task ShutdownAsync() => Task.CompletedTask;

    public async Task<MessageContext> ProcessAsync(MessageContext context)
    {
        // Simple sentiment detection (replace with ML.NET or Azure Cognitive)
        var sentiment = AnalyzeSentiment(context.Content);

        return context.WithMetadata("sentiment", sentiment);
    }

    private SentimentResult AnalyzeSentiment(string text)
    {
        // Placeholder - integrate ML.NET or external API
        var score = text.Contains("thank") || text.Contains("great") ? 0.8 :
                    text.Contains("bad") || text.Contains("error") ? 0.2 : 0.5;

        return new SentimentResult
        {
            Score = score,
            Label = score > 0.6 ? "Positive" : score < 0.4 ? "Negative" : "Neutral"
        };
    }
}
```

### RAG Enhancement Plugin

```csharp
public class RagPlugin : IMessagePreProcessor, IDocumentProcessor
{
    public string Id => "rag-enhanced";
    public string Name => "RAG Enhancement";
    public string Version => "1.0.0";
    public string Description => "Retrieval-Augmented Generation with vector search";
    public string Author => "aiMate";
    public int Priority => 10; // Run early

    public IReadOnlyList<string> SupportedExtensions => [".pdf", ".docx", ".txt", ".md"];

    private IVectorStore _vectorStore = null!;
    private IEmbeddingProvider _embeddings = null!;

    public async Task InitializeAsync(IPluginContext context)
    {
        _vectorStore = context.Services.GetRequiredService<IVectorStore>();
        _embeddings = context.Services.GetRequiredService<IEmbeddingProvider>();
    }

    public Task ShutdownAsync() => Task.CompletedTask;

    public async Task<MessageContext> ProcessAsync(MessageContext context)
    {
        // Generate embedding for the query
        var embedding = await _embeddings.GenerateEmbeddingAsync(context.Content);

        // Search for relevant documents
        var results = await _vectorStore.SearchAsync(embedding, topK: 5);

        if (results.Any())
        {
            // Inject context into the message
            var ragContext = string.Join("\n\n", results.Select(r =>
                $"[Source: {r.Metadata["source"]}]\n{r.Content}"));

            var enhancedContent = $"""
                Context from knowledge base:
                {ragContext}

                User question: {context.Content}
                """;

            return context
                .WithContent(enhancedContent)
                .WithMetadata("rag_sources", results.Select(r => r.Metadata["source"]).ToList());
        }

        return context;
    }

    public async Task<DocumentChunks> ProcessAsync(Stream document, string fileName)
    {
        // Extract text based on file type
        var text = await ExtractTextAsync(document, fileName);

        // Chunk the document
        var chunks = ChunkText(text, chunkSize: 512, overlap: 50);

        // Generate embeddings
        var embeddings = await _embeddings.GenerateEmbeddingsAsync(chunks);

        return new DocumentChunks
        {
            FileName = fileName,
            Chunks = chunks.Zip(embeddings, (text, emb) => new Chunk
            {
                Content = text,
                Embedding = emb
            }).ToList()
        };
    }
}
```

### MCP Bridge Plugin

```csharp
public class McpBridgePlugin : IToolProvider
{
    public string Id => "mcp-bridge";
    public string Name => "MCP Bridge";
    public string Version => "1.0.0";
    public string Description => "Bridges MCP servers to the plugin system";
    public string Author => "aiMate";

    private readonly List<McpConnection> _connections = [];
    private ILogger _logger = null!;

    public async Task InitializeAsync(IPluginContext context)
    {
        _logger = context.Logger;

        var mcpConfig = context.Configuration.GetSection("McpServers").Get<List<McpServerConfig>>();

        foreach (var config in mcpConfig ?? [])
        {
            var connection = await McpConnection.ConnectAsync(config);
            _connections.Add(connection);
            _logger.LogInformation("Connected to MCP server: {Name}", config.Name);
        }
    }

    public Task ShutdownAsync()
    {
        foreach (var conn in _connections)
            conn.Dispose();
        return Task.CompletedTask;
    }

    public IReadOnlyList<ToolDefinition> GetTools()
    {
        return _connections
            .SelectMany(c => c.Tools.Select(t => new ToolDefinition
            {
                Name = $"{c.Name}_{t.Name}",
                Description = t.Description,
                Parameters = t.InputSchema
            }))
            .ToList();
    }

    public async Task<ToolResult> ExecuteToolAsync(string toolName, JsonDocument parameters)
    {
        var parts = toolName.Split('_', 2);
        var connection = _connections.FirstOrDefault(c => c.Name == parts[0]);

        if (connection == null)
            return ToolResult.Error($"MCP server {parts[0]} not found");

        return await connection.CallToolAsync(parts[1], parameters);
    }
}
```

## 7. Configuration

```json
// appsettings.json
{
  "Plugins": {
    "PluginDirectories": [
      "./plugins",
      "/opt/aimate/plugins"
    ],
    "EnableHotReload": true,
    "Sandbox": {
      "MaxMemoryMB": 512,
      "MaxCpuPercent": 25,
      "AllowedAssemblies": [
        "System.*",
        "Microsoft.Extensions.*",
        "AiMate.Plugins.Abstractions"
      ]
    }
  }
}
```

## 8. Frontend Integration

```typescript
// src/api/services/plugins.service.ts

export interface BackendPlugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  capabilities: ('preProcessor' | 'postProcessor' | 'toolProvider' | 'documentProcessor')[];
}

export interface BackendTool {
  name: string;
  description: string;
  parameters: JsonSchema;
}

export const pluginsApi = {
  list: () => api.get<BackendPlugin[]>('/plugins'),

  getTools: (pluginId: string) =>
    api.get<BackendTool[]>(`/plugins/${pluginId}/tools`),

  executeTool: (pluginId: string, toolName: string, params: unknown) =>
    api.post(`/plugins/${pluginId}/tools/${toolName}/execute`, params),

  reload: (pluginId: string) =>
    api.post(`/plugins/${pluginId}/reload`),
};

// Usage in useTools hook
const executeBackendTool = async (pluginId: string, toolName: string, params: unknown) => {
  const result = await pluginsApi.executeTool(pluginId, toolName, params);
  return result.data;
};
```

## 9. Security Considerations

1. **Assembly Isolation**: Use `AssemblyLoadContext` with collectible assemblies
2. **Resource Limits**: Enforce memory and CPU limits per plugin
3. **Permission System**: Whitelist allowed APIs and assemblies
4. **Sandboxing**: Consider AppDomain or container-based isolation for untrusted plugins
5. **Signing**: Require plugins to be signed for production deployments
6. **Audit Logging**: Log all plugin executions and tool calls

## 10. Next Steps

1. Create `AiMate.Plugins.Abstractions` NuGet package
2. Implement basic plugin host in backend
3. Add plugin management UI in admin panel
4. Create plugin development SDK and templates
5. Build example plugins (sentiment, RAG, MCP bridge)

---

*Last updated: 1 December 2025*
