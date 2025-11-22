# Frontend-Backend Integration Guide
**Date:** November 22, 2025
**Purpose:** Map Tailwind/Blazor components to backend API endpoints

---

## Overview

This document outlines the integration points between frontend components and the backend APIs recently implemented. Each component needs to call the appropriate API endpoints to replace mock data and placeholder functionality.

---

## 🔍 Search Integration

### Components Requiring Integration

#### 1. **GlobalSearchDialog.razor** (`Components/Search/GlobalSearchDialog.razor`)

**Current State:**
- ✅ UI complete with filters (Chats, Files, Artifacts, Notes, Knowledge)
- ❌ Using mock data (`GenerateMockResults()` on line 379-404)
- ❌ Client-side search only

**Backend API Available:**
- **Endpoint:** `GET /api/v1/search`
- **Controller:** `SearchApiController.cs`
- **Methods:**
  - `GET /api/v1/search/conversations?query={query}&limit={limit}`
  - `GET /api/v1/search/messages?query={query}&limit={limit}`
  - `GET /api/v1/search/knowledge/semantic?query={query}&threshold={threshold}&limit={limit}`
  - `GET /api/v1/search/knowledge?query={query}&limit={limit}`
  - `GET /api/v1/search?query={query}&limit={limit}` (global search)

**Integration Steps:**

1. **Inject HttpClient:**
   ```csharp
   @inject HttpClient Http
   ```

2. **Replace `OnSearchQueryChanged` method:**
   ```csharp
   private async Task OnSearchQueryChanged(string query)
   {
       _searchQuery = query;
       _isSearching = true;
       StateHasChanged();

       try
       {
           // Call global search API
           var response = await Http.GetFromJsonAsync<GlobalSearchResults>(
               $"/api/v1/search?query={Uri.EscapeDataString(query)}&limit=10");

           if (response != null)
           {
               _allResults = MapToSearchResults(response);
           }
       }
       catch (Exception ex)
       {
           Snackbar.Add($"Search failed: {ex.Message}", Severity.Error);
       }
       finally
       {
           _isSearching = false;
           _selectedIndex = 0;
           StateHasChanged();
       }
   }
   ```

3. **Create mapping method:**
   ```csharp
   private List<SearchResult> MapToSearchResults(GlobalSearchResults apiResponse)
   {
       var results = new List<SearchResult>();

       // Map conversations
       results.AddRange(apiResponse.Conversations.Select(c => new SearchResult
       {
           Type = "Chats",
           Title = c.Item.Title,
           Preview = c.Highlight ?? "Conversation...",
           Location = c.Item.Workspace?.Name ?? "Unknown Workspace",
           UpdatedAt = c.Item.UpdatedAt,
           Url = $"/chat/{c.Item.Id}"
       }));

       // Map messages
       results.AddRange(apiResponse.Messages.Select(m => new SearchResult
       {
           Type = "Messages",
           Title = m.Item.Content.Substring(0, Math.Min(50, m.Item.Content.Length)) + "...",
           Preview = m.Highlight ?? m.Item.Content,
           Location = "Message",
           UpdatedAt = m.Item.CreatedAt,
           Url = $"/chat/{m.Item.ConversationId}"
       }));

       // Map knowledge items
       results.AddRange(apiResponse.KnowledgeItems.Select(k => new SearchResult
       {
           Type = "Knowledge",
           Title = k.Item.Title,
           Preview = k.Highlight ?? k.Item.Content.Substring(0, Math.Min(100, k.Item.Content.Length)),
           Location = "Knowledge Base",
           UpdatedAt = k.Item.UpdatedAt,
           Url = $"/knowledge/{k.Item.Id}"
       }));

       return results;
   }
   ```

4. **Remove mock data:**
   - Delete `GenerateMockResults()` method (lines 379-404)

**Response Models Needed:**
```csharp
public class GlobalSearchResults
{
    public List<SearchResult<Conversation>> Conversations { get; set; }
    public List<SearchResult<Message>> Messages { get; set; }
    public List<SearchResult<KnowledgeItem>> KnowledgeItems { get; set; }
    public int TotalResults { get; set; }
    public string Query { get; set; }
    public long QueryTimeMs { get; set; }
}

public class SearchResult<T>
{
    public T Item { get; set; }
    public double Score { get; set; }
    public string? Highlight { get; set; }
}
```

---

#### 2. **Search.razor** (`Components/Pages/Search.razor`)

**Current State:**
- ✅ UI with tabs (All, Conversations, Messages)
- ❌ Client-side search only (lines 71-94)
- ❌ Searches in-memory ChatState

**Backend API Available:**
- Same as GlobalSearchDialog above

**Integration Steps:**

1. **Add API calls to search methods:**
   ```csharp
   private async Task<List<Core.Entities.Conversation>> GetConversationResults()
   {
       if (string.IsNullOrWhiteSpace(_searchQuery))
           return new List<Core.Entities.Conversation>();

       try
       {
           var response = await Http.GetFromJsonAsync<SearchResults<Core.Entities.Conversation>>(
               $"/api/v1/search/conversations?query={Uri.EscapeDataString(_searchQuery)}&limit=50");

           return response?.Results.Select(r => r.Item).ToList() ?? new();
       }
       catch
       {
           return new List<Core.Entities.Conversation>();
       }
   }

   private async Task<List<Core.Entities.Message>> GetMessageSearchResults()
   {
       if (string.IsNullOrWhiteSpace(_searchQuery))
           return new List<Core.Entities.Message>();

       try
       {
           var response = await Http.GetFromJsonAsync<SearchResults<Core.Entities.Message>>(
               $"/api/v1/search/messages?query={Uri.EscapeDataString(_searchQuery)}&limit=50");

           return response?.Results.Select(r => r.Item).ToList() ?? new();
       }
       catch
       {
           return new List<Core.Entities.Message>();
       }
   }
   ```

2. **Add debouncing for API calls:**
   ```csharp
   private CancellationTokenSource? _searchCts;

   private async Task OnSearchQueryChanged(ChangeEventArgs e)
   {
       _searchQuery = e.Value?.ToString() ?? string.Empty;

       // Cancel previous search
       _searchCts?.Cancel();
       _searchCts = new CancellationTokenSource();

       try
       {
           await Task.Delay(300, _searchCts.Token); // Debounce 300ms
           StateHasChanged(); // Trigger re-render with new results
       }
       catch (TaskCanceledException)
       {
           // Debounce cancelled
       }
   }
   ```

---

## 📁 File Management Integration

### Components Requiring Integration

#### 3. **Files.razor** (`Components/Pages/Files.razor`)

**Current State:**
- ✅ UI with Grid/List views
- ✅ Search and filter controls
- ❌ Empty state, no API integration (line 166: "File API not implemented yet")
- ❌ All methods are stubs

**Backend API Available:**
- **Base Path:** `/api/v1/files`
- **Controller:** `FileApiController.cs`
- **Endpoints:**
  - `POST /api/v1/files/upload?workspaceId={id}` - Upload file
  - `GET /api/v1/files/{id}/download` - Download file
  - `DELETE /api/v1/files/{id}` - Delete file
  - `GET /api/v1/files?workspaceId={id}` - List files
  - `GET /api/v1/files/{id}` - Get file info

**Integration Steps:**

1. **Add service injection:**
   ```csharp
   @inject HttpClient Http
   @inject IJSRuntime JS
   ```

2. **Load files on initialization:**
   ```csharp
   [Parameter]
   [SupplyParameterFromQuery]
   public Guid? WorkspaceId { get; set; }

   protected override async Task OnInitializedAsync()
   {
       if (WorkspaceId == null)
       {
           // Get current workspace from state or default
           WorkspaceId = await GetCurrentWorkspaceId();
       }

       await LoadFiles();
   }

   private async Task LoadFiles()
   {
       _isLoading = true;
       try
       {
           var response = await Http.GetFromJsonAsync<List<WorkspaceFileDto>>(
               $"/api/v1/files?workspaceId={WorkspaceId}");

           if (response != null)
           {
               _files = response.Select(MapToFileDto).ToList();
           }
       }
       catch (Exception ex)
       {
           Snackbar.Add($"Failed to load files: {ex.Message}", Severity.Error);
       }
       finally
       {
           _isLoading = false;
       }
   }

   private FileDto MapToFileDto(WorkspaceFileDto apiFile)
   {
       return new FileDto
       {
           Id = apiFile.Id,
           Name = apiFile.FileName,
           Type = DetermineFileType(apiFile.ContentType),
           Size = apiFile.FileSize,
           UploadedAt = apiFile.UploadedAt
       };
   }

   private string DetermineFileType(string contentType)
   {
       if (contentType.StartsWith("image/")) return "Image";
       if (contentType.Contains("pdf") || contentType.Contains("document")) return "Document";
           if (contentType.Contains("text/") || contentType.Contains("code")) return "Code";
       return "Other";
   }
   ```

3. **Implement file upload:**
   ```csharp
   private async Task HandleFileUpload(IReadOnlyList<IBrowserFile> files)
   {
       if (files == null || !files.Any() || WorkspaceId == null)
           return;

       _isLoading = true;
       var successful = 0;

       try
       {
           foreach (var file in files)
           {
               using var content = new MultipartFormDataContent();
               var fileContent = new StreamContent(file.OpenReadStream(50 * 1024 * 1024)); // 50MB max
               fileContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(file.ContentType);

               content.Add(fileContent, "file", file.Name);

               var response = await Http.PostAsync(
                   $"/api/v1/files/upload?workspaceId={WorkspaceId}",
                   content);

               if (response.IsSuccessStatusCode)
               {
                   successful++;
               }
           }

           Snackbar.Add($"Successfully uploaded {successful} of {files.Count} file(s)", Severity.Success);
           await LoadFiles(); // Refresh list
       }
       catch (Exception ex)
       {
           Snackbar.Add($"Upload failed: {ex.Message}", Severity.Error);
       }
       finally
       {
           _isLoading = false;
       }
   }
   ```

4. **Implement download:**
   ```csharp
   private async Task DownloadFile(FileDto file)
   {
       try
       {
           var response = await Http.GetAsync($"/api/v1/files/{file.Id}/download");

           if (response.IsSuccessStatusCode)
           {
               var stream = await response.Content.ReadAsStreamAsync();
               var fileName = file.Name;

               // Use JS interop to trigger download
               using var streamRef = new DotNetStreamReference(stream);
               await JS.InvokeVoidAsync("downloadFileFromStream", fileName, streamRef);

               Snackbar.Add($"Downloading {fileName}", Severity.Success);
           }
       }
       catch (Exception ex)
       {
           Snackbar.Add($"Download failed: {ex.Message}", Severity.Error);
       }
   }
   ```

5. **Implement delete:**
   ```csharp
   private async Task DeleteFile(FileDto file)
   {
       var confirmed = await JS.InvokeAsync<bool>("confirm", $"Delete {file.Name}?");
       if (!confirmed) return;

       try
       {
           var response = await Http.DeleteAsync($"/api/v1/files/{file.Id}");

           if (response.IsSuccessStatusCode)
           {
               Snackbar.Add($"Deleted {file.Name}", Severity.Success);
               _files.Remove(file);
               StateHasChanged();
           }
       }
       catch (Exception ex)
       {
           Snackbar.Add($"Delete failed: {ex.Message}", Severity.Error);
       }
   }
   ```

6. **Add JavaScript for download (wwwroot/js/fileDownload.js):**
   ```javascript
   window.downloadFileFromStream = async (fileName, streamReference) => {
       const arrayBuffer = await streamReference.arrayBuffer();
       const blob = new Blob([arrayBuffer]);
       const url = URL.createObjectURL(blob);
       const a = document.createElement('a');
       a.href = url;
       a.download = fileName ?? 'download';
       document.body.appendChild(a);
       a.click();
       document.body.removeChild(a);
       URL.revokeObjectURL(url);
   }
   ```

**Response Models Needed:**
```csharp
public class WorkspaceFileDto
{
    public Guid Id { get; set; }
    public Guid WorkspaceId { get; set; }
    public string FileName { get; set; }
    public string FilePath { get; set; }
    public long FileSize { get; set; }
    public string ContentType { get; set; }
    public string? Description { get; set; }
    public DateTime UploadedAt { get; set; }
}
```

---

#### 4. **FileUploadDialog.razor** (`Components/Shared/FileUploadDialog.razor`)

**Current State:**
- ✅ UI complete
- ⚠️ Uses `IFileUploadService` (lines 2, 55, 111-117)
- ❌ Service needs backend integration

**Backend API Available:**
- Same as Files.razor above

**Integration Steps:**

1. **Update IFileUploadService interface:**
   ```csharp
   public interface IFileUploadService
   {
       Task<bool> UploadFileAsync(Guid workspaceId, string fileName, Stream stream, string contentType);
       long GetFileSizeLimit();
   }
   ```

2. **Implement service:**
   ```csharp
   public class FileUploadService : IFileUploadService
   {
       private readonly HttpClient _http;
       private const long MaxFileSize = 50 * 1024 * 1024; // 50MB

       public FileUploadService(HttpClient http)
       {
           _http = http;
       }

       public async Task<bool> UploadFileAsync(Guid workspaceId, string fileName, Stream stream, string contentType)
       {
           using var content = new MultipartFormDataContent();
           var fileContent = new StreamContent(stream);
           fileContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(contentType);
           content.Add(fileContent, "file", fileName);

           var response = await _http.PostAsync(
               $"/api/v1/files/upload?workspaceId={workspaceId}",
               content);

           return response.IsSuccessStatusCode;
       }

       public long GetFileSizeLimit() => MaxFileSize;
   }
   ```

3. **Register in Program.cs:**
   ```csharp
   builder.Services.AddScoped<IFileUploadService, FileUploadService>();
   ```

---

#### 5. **AttachFilesMenu.razor** (`Components/Chat/AttachFilesMenu.razor`)

**Current State:**
- ✅ UI complete with multiple attachment types
- ❌ All methods are placeholders (lines 157-240)
- ❌ No backend integration

**Backend API Available:**
- File API: `/api/v1/files/*` (for file uploads)
- Search API: `/api/v1/search/*` (for knowledge/notes picker)

**Integration Steps:**

1. **Implement file attachment:**
   ```csharp
   @inject IJSRuntime JS
   @inject HttpClient Http

   private async Task HandleAttachFiles()
   {
       // Trigger file input using JS
       var files = await JS.InvokeAsync<IJSObjectReference>("showFilePicker");
       if (files != null)
       {
           // Process and upload files
           // Then call OnFilesAttached callback
       }
   }
   ```

2. **Implement knowledge picker:**
   ```csharp
   private async Task HandleAttachKnowledge()
   {
       var parameters = new DialogParameters
       {
           ["SearchEndpoint"] = "/api/v1/search/knowledge"
       };

       var dialog = await DialogService.ShowAsync<KnowledgePickerDialog>(
           "Select Knowledge Items",
           parameters);

       var result = await dialog.Result;
       if (!result.Canceled && result.Data is List<KnowledgeItem> items)
       {
           // Attach selected knowledge items to conversation
           await OnFilesAttached.InvokeAsync(MapKnowledgeToFiles(items));
       }
   }
   ```

---

## 💬 Feedback Integration

### Components Requiring Integration

#### 6. **MessageFeedbackWidget.razor** (`Components/Chat/MessageFeedbackWidget.razor`)

**Current State:**
- ✅ UI complete with rating slider and tags
- ⚠️ Uses Fluxor state management (lines 2-6)
- ❌ Dispatches actions but backend integration missing

**Backend API Available:**
- **Base Path:** `/api/v1/feedback`
- **Controller:** `FeedbackSystemApiController.cs`
- **Endpoints:**
  - `POST /api/v1/feedback/message` - Submit message feedback
  - `GET /api/v1/feedback/tags/templates` - Get tag templates
  - `GET /api/v1/feedback/message/{messageId}` - Get existing feedback

**Integration Steps:**

1. **Update Fluxor effects to call API:**

Create `FeedbackEffects.cs`:
```csharp
public class FeedbackEffects
{
    private readonly HttpClient _http;

    public FeedbackEffects(HttpClient http)
    {
        _http = http;
    }

    [EffectMethod]
    public async Task HandleLoadTagTemplates(LoadTagTemplatesAction action, IDispatcher dispatcher)
    {
        try
        {
            var templates = await _http.GetFromJsonAsync<List<FeedbackTagTemplate>>(
                "/api/v1/feedback/tags/templates");

            dispatcher.Dispatch(new LoadTagTemplatesSuccessAction(templates));
        }
        catch (Exception ex)
        {
            dispatcher.Dispatch(new LoadTagTemplatesFailureAction(ex.Message));
        }
    }

    [EffectMethod]
    public async Task HandleSubmitFeedback(SubmitFeedbackAction action, IDispatcher dispatcher)
    {
        try
        {
            var request = new SubmitMessageFeedbackRequest
            {
                MessageId = action.MessageId,
                Rating = action.Rating,
                TextFeedback = action.TextFeedback,
                Tags = action.Tags.ToDictionary(t => t.Key, t => t.Value),
                ModelId = action.ModelId,
                ResponseTimeMs = action.ResponseTimeMs
            };

            var response = await _http.PostAsJsonAsync("/api/v1/feedback/message", request);

            if (response.IsSuccessStatusCode)
            {
                dispatcher.Dispatch(new SubmitFeedbackSuccessAction(action.MessageId));
            }
            else
            {
                dispatcher.Dispatch(new SubmitFeedbackFailureAction("Failed to submit feedback"));
            }
        }
        catch (Exception ex)
        {
            dispatcher.Dispatch(new SubmitFeedbackFailureAction(ex.Message));
        }
    }

    [EffectMethod]
    public async Task HandleQuickRate(QuickRateMessageAction action, IDispatcher dispatcher)
    {
        try
        {
            var request = new SubmitMessageFeedbackRequest
            {
                MessageId = action.MessageId,
                Rating = action.Rating,
                ModelId = action.ModelId
            };

            await _http.PostAsJsonAsync("/api/v1/feedback/message", request);
            dispatcher.Dispatch(new SubmitFeedbackSuccessAction(action.MessageId));
        }
        catch (Exception ex)
        {
            dispatcher.Dispatch(new SubmitFeedbackFailureAction(ex.Message));
        }
    }
}
```

2. **Register effects in Program.cs:**
```csharp
builder.Services.AddScoped<FeedbackEffects>();
```

**Request Models:**
```csharp
public class SubmitMessageFeedbackRequest
{
    public Guid MessageId { get; set; }
    public int Rating { get; set; }
    public string? TextFeedback { get; set; }
    public Dictionary<string, string>? Tags { get; set; }
    public string? ModelId { get; set; }
    public long? ResponseTimeMs { get; set; }
}

public class FeedbackTagTemplate
{
    public Guid Id { get; set; }
    public string Category { get; set; }
    public string Label { get; set; }
    public List<FeedbackTagOption> Options { get; set; }
    public int DisplayOrder { get; set; }
}

public class FeedbackTagOption
{
    public string Value { get; set; }
    public string? Icon { get; set; }
    public string? Color { get; set; }
    public TagSentiment Sentiment { get; set; }
    public int DisplayOrder { get; set; }
}
```

---

## 🎨 Admin Components Integration

### Components Requiring Integration

#### 7. **FeedbackTagsAdminTab.razor** (`Components/Admin/FeedbackTagsAdminTab.razor`)

**Backend API Available:**
- `GET /api/v1/feedback/admin/tags/templates` - List all tag templates
- `POST /api/v1/feedback/admin/tags/templates` - Create tag template
- `PUT /api/v1/feedback/admin/tags/templates/{id}` - Update tag template
- `DELETE /api/v1/feedback/admin/tags/templates/{id}` - Delete tag template
- `GET /api/v1/feedback/admin/stats` - Get feedback statistics

**Integration Steps:**
1. Inject HttpClient
2. Load tag templates on initialization
3. Implement CRUD operations
4. Display statistics dashboard

---

## 🔑 Authentication & Authorization

### Required Headers

All API calls must include JWT authentication:

```csharp
// Add to HttpClient configuration in Program.cs
builder.Services.AddScoped(sp =>
{
    var http = new HttpClient { BaseAddress = new Uri(builder.HostEnvironment.BaseAddress) };

    // Add JWT token to all requests
    var authState = sp.GetService<AuthenticationStateProvider>();
    if (authState != null)
    {
        var state = await authState.GetAuthenticationStateAsync();
        var token = state.User.FindFirst("access_token")?.Value;

        if (!string.IsNullOrEmpty(token))
        {
            http.DefaultRequestHeaders.Authorization =
                new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
        }
    }

    return http;
});
```

---

## 📊 Rate Limiting Awareness

Backend has rate limiting configured:
- **API**: 60 requests/minute (default)
- **Developer tier**: 120 requests/minute
- **Admin**: 200 requests/minute
- **Error logging**: 10 requests/minute

### Frontend Handling

Implement exponential backoff for 429 responses:

```csharp
public class RetryHandler : DelegatingHandler
{
    protected override async Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request,
        CancellationToken cancellationToken)
    {
        var maxRetries = 3;
        var retryCount = 0;

        while (true)
        {
            var response = await base.SendAsync(request, cancellationToken);

            if (response.StatusCode != System.Net.HttpStatusCode.TooManyRequests || retryCount >= maxRetries)
            {
                return response;
            }

            var retryAfter = response.Headers.RetryAfter?.Delta ?? TimeSpan.FromSeconds(Math.Pow(2, retryCount));
            await Task.Delay(retryAfter, cancellationToken);
            retryCount++;
        }
    }
}
```

---

## 🚀 Quick Start Checklist

For each component integration:

- [ ] Remove mock data and placeholder methods
- [ ] Inject HttpClient or relevant service
- [ ] Create API request/response DTOs
- [ ] Implement API calls with proper error handling
- [ ] Add loading states (spinners, skeletons)
- [ ] Handle 401 Unauthorized (redirect to login)
- [ ] Handle 403 Forbidden (show permission error)
- [ ] Handle 429 Too Many Requests (retry with backoff)
- [ ] Handle 500 Server Error (show friendly error)
- [ ] Add success notifications (Snackbar)
- [ ] Test with real backend

---

## 📝 Priority Order

Recommended implementation order:

1. **Search** - GlobalSearchDialog + Search.razor (most visible feature)
2. **Files** - Files.razor page + FileUploadDialog (file management)
3. **Feedback** - MessageFeedbackWidget (alpha testing critical)
4. **Attach Menu** - AttachFilesMenu (enhances chat UX)
5. **Admin** - FeedbackTagsAdminTab (admin tools)

---

## 🔗 API Documentation

Full API documentation available at: `/api/docs` (Swagger UI)

- Browse all endpoints
- Test API calls directly
- View request/response schemas
- Copy curl commands for testing

---

## ⚠️ Known Issues & TODOs

1. **MudBlazor to Tailwind Migration:**
   - GlobalSearchDialog still uses MudBlazor components
   - Need to convert to Tailwind CSS classes
   - Consider creating reusable Tailwind components

2. **WebSocket for Real-time Updates:**
   - File uploads could use SignalR for progress
   - Search could show live results
   - Feedback could update in real-time

3. **Caching Strategy:**
   - Backend has 2-minute cache for search results
   - Frontend should respect cache headers
   - Consider client-side caching for static data

---

## 📞 Support

For questions or issues:
- Check Swagger docs: `/api/docs`
- Review backend tests: `tests/AiMate.Infrastructure.Tests/`
- Backend implementation: `src/AiMate.Web/Controllers/`

---

**Last Updated:** November 22, 2025
**Version:** 1.0
**Status:** Ready for Implementation
