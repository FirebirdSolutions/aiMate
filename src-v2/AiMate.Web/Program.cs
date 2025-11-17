using AiMate.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using MudBlazor.Services;
using Fluxor;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.File("logs/aiMate-.txt", rollingInterval: RollingInterval.Day)
    .CreateLogger();

builder.Host.UseSerilog();

// Add services to the container
builder.Services.AddRazorComponents()
    .AddInteractiveServerComponents();

// MudBlazor
builder.Services.AddMudServices();

// Fluxor state management
builder.Services.AddFluxor(options =>
{
    options.ScanAssemblies(typeof(Program).Assembly);
    options.UseReduxDevTools();
});

// Database
var connectionString = builder.Configuration.GetConnectionString("PostgreSQL");
if (!string.IsNullOrEmpty(connectionString))
{
    builder.Services.AddDbContext<AiMateDbContext>(options =>
        options.UseNpgsql(connectionString, npgsqlOptions =>
        {
            npgsqlOptions.UseVector();
        }));
}

// Add HTTP client
builder.Services.AddHttpClient();

// Add localization
builder.Services.AddLocalization();

// Register our services
builder.Services.AddScoped<AiMate.Core.Services.ILiteLLMService, AiMate.Infrastructure.Services.LiteLLMService>();
builder.Services.AddScoped<AiMate.Core.Services.IPersonalityService, AiMate.Infrastructure.Services.PersonalityService>();
builder.Services.AddScoped<AiMate.Core.Services.IKnowledgeGraphService, AiMate.Infrastructure.Services.KnowledgeGraphService>();
builder.Services.AddScoped<AiMate.Core.Services.IWorkspaceService, AiMate.Infrastructure.Services.WorkspaceService>();
builder.Services.AddScoped<AiMate.Core.Services.IAuthService, AiMate.Infrastructure.Services.AuthService>();
builder.Services.AddScoped<AiMate.Core.Services.IFileUploadService, AiMate.Infrastructure.Services.FileUploadService>();
builder.Services.AddScoped<AiMate.Core.Services.IEmbeddingService, AiMate.Infrastructure.Services.OpenAIEmbeddingService>();

// Register HttpClient for services that need it
builder.Services.AddHttpClient<AiMate.Infrastructure.Services.LiteLLMService>();
builder.Services.AddHttpClient<AiMate.Infrastructure.Services.OpenAIEmbeddingService>();

Log.Information("All services registered successfully (Phase 5 complete)");

var app = builder.Build();

// Configure the HTTP request pipeline
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseAntiforgery();

app.MapRazorComponents<App>()
    .AddInteractiveServerRenderMode();

try
{
    Log.Information("Starting aiMate application");
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
