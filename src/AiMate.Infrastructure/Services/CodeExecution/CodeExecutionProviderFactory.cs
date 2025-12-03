using AiMate.Core.Services;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AiMate.Infrastructure.Services.CodeExecution;

/// <summary>
/// Factory for creating and selecting code execution providers.
/// Supports fallback chains and provider selection based on language.
/// </summary>
public class CodeExecutionProviderFactory
{
    private readonly ILogger<CodeExecutionProviderFactory> _logger;
    private readonly CodeExecutionOptions _options;
    private readonly IEnumerable<ICodeExecutionProvider> _providers;
    private ICodeExecutionProvider? _preferredProvider;

    public CodeExecutionProviderFactory(
        ILogger<CodeExecutionProviderFactory> logger,
        IOptions<CodeExecutionOptions> options,
        IEnumerable<ICodeExecutionProvider> providers)
    {
        _logger = logger;
        _options = options.Value;
        _providers = providers;

        _logger.LogInformation(
            "Code execution factory initialized with providers: {Providers}",
            string.Join(", ", _providers.Select(p => p.ProviderName)));
    }

    /// <summary>
    /// Get the best provider for a given language
    /// </summary>
    public ICodeExecutionProvider? GetProvider(string language)
    {
        // First, try the preferred provider
        if (_preferredProvider != null && _preferredProvider.SupportsLanguage(language))
        {
            return _preferredProvider;
        }

        // Then, try providers in configured order
        foreach (var providerName in _options.ProviderOrder)
        {
            var provider = _providers.FirstOrDefault(p =>
                p.ProviderName.Equals(providerName, StringComparison.OrdinalIgnoreCase) &&
                p.SupportsLanguage(language));

            if (provider != null)
            {
                return provider;
            }
        }

        // Finally, try any available provider
        return _providers.FirstOrDefault(p => p.SupportsLanguage(language));
    }

    /// <summary>
    /// Get a specific provider by name
    /// </summary>
    public ICodeExecutionProvider? GetProviderByName(string name)
    {
        return _providers.FirstOrDefault(p =>
            p.ProviderName.Equals(name, StringComparison.OrdinalIgnoreCase));
    }

    /// <summary>
    /// Get all available providers
    /// </summary>
    public IEnumerable<ICodeExecutionProvider> GetAllProviders()
    {
        return _providers;
    }

    /// <summary>
    /// Set the preferred provider (overrides order)
    /// </summary>
    public void SetPreferredProvider(string name)
    {
        _preferredProvider = GetProviderByName(name);
        if (_preferredProvider != null)
        {
            _logger.LogInformation("Preferred provider set to: {Provider}", name);
        }
        else
        {
            _logger.LogWarning("Provider not found: {Provider}", name);
        }
    }

    /// <summary>
    /// Check health of all providers
    /// </summary>
    public async Task<Dictionary<string, ProviderHealthInfo>> GetAllHealthAsync(
        CancellationToken cancellationToken = default)
    {
        var results = new Dictionary<string, ProviderHealthInfo>();

        foreach (var provider in _providers)
        {
            try
            {
                results[provider.ProviderName] = await provider.GetHealthAsync(cancellationToken);
            }
            catch (Exception ex)
            {
                results[provider.ProviderName] = new ProviderHealthInfo
                {
                    IsHealthy = false,
                    Status = "Error",
                    Message = ex.Message
                };
            }
        }

        return results;
    }
}

/// <summary>
/// Composite provider that tries multiple providers with fallback
/// </summary>
public class FallbackCodeExecutionProvider : ICodeExecutionProvider
{
    private readonly ILogger<FallbackCodeExecutionProvider> _logger;
    private readonly CodeExecutionProviderFactory _factory;
    private readonly CodeExecutionOptions _options;

    public string ProviderName => "Fallback";

    public IReadOnlyList<string> SupportedLanguages =>
        _factory.GetAllProviders()
            .SelectMany(p => p.SupportedLanguages)
            .Distinct()
            .ToList();

    public FallbackCodeExecutionProvider(
        ILogger<FallbackCodeExecutionProvider> logger,
        CodeExecutionProviderFactory factory,
        IOptions<CodeExecutionOptions> options)
    {
        _logger = logger;
        _factory = factory;
        _options = options.Value;
    }

    public bool SupportsLanguage(string language)
    {
        return _factory.GetAllProviders().Any(p => p.SupportsLanguage(language));
    }

    public async Task<CodeExecutionResult> ExecuteAsync(
        CodeExecutionRequest request,
        CancellationToken cancellationToken = default)
    {
        var errors = new List<string>();

        foreach (var providerName in _options.ProviderOrder)
        {
            var provider = _factory.GetProviderByName(providerName);

            if (provider == null || !provider.SupportsLanguage(request.Language))
            {
                continue;
            }

            if (!await provider.IsAvailableAsync(cancellationToken))
            {
                _logger.LogDebug("Provider {Provider} is not available, skipping", providerName);
                continue;
            }

            _logger.LogInformation(
                "Attempting execution with provider: {Provider}",
                providerName);

            var result = await provider.ExecuteAsync(request, cancellationToken);

            if (result.Success || !_options.FallbackOnError)
            {
                return result;
            }

            errors.Add($"{providerName}: {result.Error}");
            _logger.LogWarning(
                "Provider {Provider} failed, trying next. Error: {Error}",
                providerName, result.Error);
        }

        return new CodeExecutionResult
        {
            Success = false,
            Error = $"All providers failed. Errors: {string.Join("; ", errors)}",
            ExitCode = -1
        };
    }

    public async Task<bool> IsAvailableAsync(CancellationToken cancellationToken = default)
    {
        foreach (var provider in _factory.GetAllProviders())
        {
            if (await provider.IsAvailableAsync(cancellationToken))
            {
                return true;
            }
        }

        return false;
    }

    public async Task<ProviderHealthInfo> GetHealthAsync(CancellationToken cancellationToken = default)
    {
        var allHealth = await _factory.GetAllHealthAsync(cancellationToken);
        var anyHealthy = allHealth.Values.Any(h => h.IsHealthy);

        return new ProviderHealthInfo
        {
            IsHealthy = anyHealthy,
            Status = anyHealthy ? "Healthy" : "Unhealthy",
            Message = anyHealthy
                ? $"Available providers: {string.Join(", ", allHealth.Where(h => h.Value.IsHealthy).Select(h => h.Key))}"
                : "No providers available",
            Metadata = allHealth.ToDictionary(h => h.Key, h => (object)h.Value.Status)
        };
    }
}

/// <summary>
/// Configuration for code execution
/// </summary>
public class CodeExecutionOptions
{
    public const string SectionName = "CodeExecution";

    /// <summary>
    /// Preferred provider for code execution
    /// </summary>
    public string PreferredProvider { get; set; } = "E2B";

    /// <summary>
    /// Order of providers to try (first available wins)
    /// </summary>
    public List<string> ProviderOrder { get; set; } = new() { "E2B", "Docker" };

    /// <summary>
    /// Whether to try the next provider if one fails
    /// </summary>
    public bool FallbackOnError { get; set; } = true;

    /// <summary>
    /// Default timeout for all providers
    /// </summary>
    public int DefaultTimeoutSeconds { get; set; } = 30;
}
