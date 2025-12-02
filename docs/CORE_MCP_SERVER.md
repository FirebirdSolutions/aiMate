# aiMate Core MCP Server

> The internal MCP server that powers aiMate's AI capabilities

---

## Overview

The **Core MCP Server** is aiMate's built-in MCP server that provides essential AI capabilities without external dependencies. It runs as part of the aiMate backend and exposes tools using the [domain facade pattern](./MCP_DESIGN_SPEC.md) for context efficiency.

### Why a Core Server?

1. **Zero Configuration** - Works out of the box, no external MCP servers needed
2. **Offline Capable** - Full functionality without internet (except LLM calls)
3. **Context Optimized** - 8 domain facades instead of 60+ granular tools
4. **Integrated** - Direct access to aiMate's data stores and services

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        aiMate Backend                            │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Core MCP Server                         │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐  │  │
│  │  │ Memories    │ │ Knowledge   │ │ Code Execution      │  │  │
│  │  │ Execute     │ │ Execute     │ │ (E2B/Docker/Custom) │  │  │
│  │  └─────────────┘ └─────────────┘ └─────────────────────┘  │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐  │  │
│  │  │ Files       │ │ Convo       │ │ Projects            │  │  │
│  │  │ Execute     │ │ Execute     │ │ Execute             │  │  │
│  │  └─────────────┘ └─────────────┘ └─────────────────────┘  │  │
│  │  ┌─────────────┐ ┌─────────────┐                          │  │
│  │  │ Hydration   │ │ Search      │                          │  │
│  │  │ Execute     │ │ Execute     │                          │  │
│  │  └─────────────┘ └─────────────┘                          │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                   │
│  ┌───────────────────────────┴───────────────────────────────┐  │
│  │                    Data Layer                              │  │
│  │  SQLite/Postgres │ Vector Store │ File System │ Cache     │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Domain Facades

The Core MCP Server exposes **8 domain facades** following the [context-optimized pattern](./MCP_DESIGN_SPEC.md):

| Tool | Commands | Purpose |
|------|----------|---------|
| `MemoriesExecute` | add, get, list, search, update, delete, embed | Persistent user memories |
| `KnowledgeExecute` | add, get, list, search, embed, chunk, delete | Document/RAG knowledge base |
| `ConversationsExecute` | list, get, search, archive, export, delete | Chat history management |
| `ProjectsExecute` | list, get, upsert, archive, delete | Workspace/project management |
| `FilesExecute` | list, get, put, delete, roundtrip_* | File operations |
| `CodeExecute` | run, validate, languages | Code execution sandbox |
| `HydrationExecute` | context, persona, preferences, system_prompt | AI context loading |
| `SearchExecute` | web, semantic, hybrid, rerank | Unified search |

### Request/Response Format

All domain facades use the same envelope:

```typescript
// Request
{
  cmd: string;                              // Command name
  detail?: 'minimal' | 'standard' | 'full'; // Response verbosity
  params?: Record<string, unknown>;         // Command parameters
}

// Response
{
  ok: boolean;     // Success flag
  cmd: string;     // Echo back command
  data?: unknown;  // Result data
  count?: number;  // For list operations
  error?: string;  // Error message if !ok
}
```

---

## Tool Specifications

### MemoriesExecute

User memory persistence - facts, preferences, and context the AI should remember.

```typescript
// Add a memory
{ cmd: "add", params: { title: "Prefers dark mode", body: "User mentioned..." } }

// Search memories
{ cmd: "search", params: { query: "user preferences", topK: 5 } }

// List all (with pagination)
{ cmd: "list", params: { limit: 20, offset: 0 }, detail: "minimal" }
```

| Command | Parameters | Description |
|---------|------------|-------------|
| `add` | `title`, `body`, `tags?` | Create a new memory |
| `get` | `id` | Get memory by ID |
| `list` | `limit?`, `offset?`, `tags?` | List memories |
| `search` | `query`, `topK?` | Semantic search |
| `update` | `id`, `title?`, `body?`, `tags?` | Update memory |
| `delete` | `id` | Delete memory |
| `embed` | `id` | Re-embed for vector search |

---

### KnowledgeExecute

Document storage and RAG (Retrieval Augmented Generation).

```typescript
// Add document
{ cmd: "add", params: {
    title: "API Docs",
    content: "...",
    source: "upload",
    mimeType: "text/markdown"
  }
}

// Search for context
{ cmd: "search", params: { query: "authentication flow", topK: 3 } }

// Chunk a document for RAG
{ cmd: "chunk", params: { id: "doc-123", chunkSize: 500, overlap: 50 } }
```

| Command | Parameters | Description |
|---------|------------|-------------|
| `add` | `title`, `content`, `source?`, `mimeType?` | Add document |
| `get` | `id` | Get document by ID |
| `list` | `limit?`, `offset?`, `source?` | List documents |
| `search` | `query`, `topK?`, `threshold?` | Semantic search |
| `chunk` | `id`, `chunkSize?`, `overlap?` | Split into chunks |
| `embed` | `id` | Re-embed document |
| `delete` | `id` | Delete document |

---

### CodeExecute

Sandboxed code execution with multiple backend providers.

```typescript
// Execute Python code
{ cmd: "run", params: {
    language: "python",
    code: "print('Hello')",
    timeout: 30
  }
}

// Check available languages
{ cmd: "languages" }

// Validate code syntax
{ cmd: "validate", params: { language: "javascript", code: "..." } }
```

| Command | Parameters | Description |
|---------|------------|-------------|
| `run` | `language`, `code`, `timeout?`, `stdin?` | Execute code |
| `validate` | `language`, `code` | Syntax check only |
| `languages` | - | List supported languages |

**Response for `run`:**

```typescript
{
  ok: true,
  cmd: "run",
  data: {
    language: "python",
    stdout: "Hello\n",
    stderr: "",
    exitCode: 0,
    executionTime: 150  // ms
  }
}
```

**Supported Languages:**

| Language | Provider | Notes |
|----------|----------|-------|
| JavaScript/TypeScript | Browser iframe | Client-side, 10s timeout |
| Python | E2B / Docker | Server-side, 30s timeout |
| C# | Docker | `dotnet script` |
| Go, Rust, Java, Ruby, PHP | Docker | Various runtimes |
| Bash | Docker | Shell scripts |

See [ARTIFACTS_AND_CODE_EXECUTION.md](./ARTIFACTS_AND_CODE_EXECUTION.md) for provider configuration.

---

### FilesExecute

File operations with atomic roundtrip support.

```typescript
// List files in project
{ cmd: "list", params: { projectId: "proj-123", path: "/src" } }

// Read file
{ cmd: "get", params: { projectId: "proj-123", path: "/src/index.ts" } }

// Atomic multi-file update
{ cmd: "roundtrip_start", params: {
    projectId: "proj-123",
    paths: ["a.ts", "b.ts"]
  }
}
{ cmd: "roundtrip_commit", params: {
    manifestId: "...",
    changes: [...],
    mode: "replace"
  }
}
```

| Command | Parameters | Description |
|---------|------------|-------------|
| `list` | `projectId`, `path?`, `recursive?` | List files |
| `get` | `projectId`, `path` | Read file content |
| `put` | `projectId`, `path`, `content` | Write file |
| `delete` | `projectId`, `path` | Delete file |
| `roundtrip_start` | `projectId`, `paths` | Begin atomic operation |
| `roundtrip_preview` | `manifestId`, `changes` | Preview changes |
| `roundtrip_commit` | `manifestId`, `changes`, `mode` | Apply atomically |

---

### ConversationsExecute

Chat history management.

```typescript
// List recent conversations
{ cmd: "list", params: { limit: 20 }, detail: "minimal" }

// Search across all chats
{ cmd: "search", params: { query: "database migration" } }

// Export for backup
{ cmd: "export", params: { id: "conv-123", format: "json" } }
```

| Command | Parameters | Description |
|---------|------------|-------------|
| `list` | `limit?`, `offset?`, `archived?` | List conversations |
| `get` | `id` | Get full conversation |
| `search` | `query`, `topK?` | Search messages |
| `archive` | `id`, `archived` | Archive/unarchive |
| `export` | `id`, `format?` | Export (json/markdown) |
| `delete` | `id` | Delete conversation |

---

### HydrationExecute

Load AI context - persona, preferences, system prompts.

```typescript
// Get full context for a chat
{ cmd: "context", params: {
    conversationId: "conv-123",
    includeMemories: true,
    includeKnowledge: true
  }
}

// Get user's AI persona settings
{ cmd: "persona" }

// Get system prompt
{ cmd: "system_prompt", params: { model: "gpt-4" } }
```

| Command | Parameters | Description |
|---------|------------|-------------|
| `context` | `conversationId`, `include*` | Full context bundle |
| `persona` | - | User's AI personality prefs |
| `preferences` | - | User settings |
| `system_prompt` | `model?` | Configured system prompt |

**Context Response:**

```typescript
{
  ok: true,
  cmd: "context",
  data: {
    systemPrompt: "You are a helpful assistant...",
    memories: [...],        // Relevant memories
    knowledge: [...],       // RAG chunks
    recentMessages: [...],  // Last N messages
    persona: { ... }        // AI personality
  }
}
```

---

### SearchExecute

Unified search across multiple sources.

```typescript
// Semantic search across everything
{ cmd: "hybrid", params: {
    query: "authentication",
    sources: ["knowledge", "memories", "conversations"],
    topK: 10
  }
}

// Web search (if enabled)
{ cmd: "web", params: { query: "latest TypeScript features" } }
```

| Command | Parameters | Description |
|---------|------------|-------------|
| `semantic` | `query`, `sources?`, `topK?` | Vector similarity search |
| `hybrid` | `query`, `sources?`, `topK?` | Combined keyword + semantic |
| `web` | `query`, `engine?` | Web search (Google, DuckDuckGo) |
| `rerank` | `query`, `results` | Rerank results by relevance |

---

### ProjectsExecute

Workspace and project management.

```typescript
// List projects
{ cmd: "list", detail: "minimal" }

// Create/update project
{ cmd: "upsert", params: {
    id: "proj-new",
    name: "My App",
    description: "..."
  }
}
```

| Command | Parameters | Description |
|---------|------------|-------------|
| `list` | `limit?`, `archived?` | List projects |
| `get` | `id` | Get project details |
| `upsert` | `id?`, `name`, `description?` | Create or update |
| `archive` | `id`, `archived` | Archive/unarchive |
| `delete` | `id` | Delete project |

---

## Configuration

### Environment Variables

```bash
# Core server settings
AIMATE_CORE_MCP_ENABLED=true
AIMATE_CORE_MCP_PORT=5100           # If running standalone

# Code execution
AIMATE_CODE_EXEC_PROVIDER=docker    # docker, e2b, or custom
AIMATE_CODE_EXEC_TIMEOUT=30         # Default timeout in seconds
E2B_API_KEY=...                     # For E2B provider

# Vector store
AIMATE_VECTOR_STORE=sqlite          # sqlite, pgvector, qdrant
AIMATE_EMBEDDING_MODEL=all-MiniLM-L6-v2

# Search
AIMATE_WEB_SEARCH_ENABLED=false
AIMATE_WEB_SEARCH_ENGINE=duckduckgo
```

### appsettings.json

```json
{
  "CoreMcp": {
    "Enabled": true,
    "Domains": {
      "Memories": { "Enabled": true },
      "Knowledge": { "Enabled": true },
      "Code": {
        "Enabled": true,
        "ProviderOrder": ["E2B", "Docker"],
        "DefaultTimeout": 30
      },
      "Files": { "Enabled": true },
      "Conversations": { "Enabled": true },
      "Hydration": { "Enabled": true },
      "Search": {
        "Enabled": true,
        "WebSearchEnabled": false
      },
      "Projects": { "Enabled": true }
    }
  }
}
```

---

## Deployment Options

### 1. Embedded (Default)

Core MCP Server runs within the aiMate backend process.

```
┌─────────────────────────────────┐
│         aiMate Backend          │
│  ┌───────────────────────────┐  │
│  │     Core MCP Server       │  │
│  │   (in-process)            │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

**Pros:** Simple, no extra processes, shared memory
**Cons:** Crashes affect backend

### 2. Sidecar Process

Core MCP Server runs as a separate process, communicates via stdio or HTTP.

```
┌─────────────────┐      ┌─────────────────┐
│  aiMate Backend │◄────►│  Core MCP       │
│                 │ stdio│  Server         │
└─────────────────┘      └─────────────────┘
```

**Pros:** Isolation, independent restarts
**Cons:** IPC overhead, more complex deployment

### 3. Remote Service

Core MCP Server runs on a different host.

```
┌─────────────────┐      ┌─────────────────┐
│  aiMate Backend │◄────►│  Core MCP       │
│   (Server A)    │ HTTP │  (Server B)     │
└─────────────────┘      └─────────────────┘
```

**Pros:** Scale independently, dedicated resources
**Cons:** Network latency, auth required

---

## Integration with Artifacts

The Core MCP Server powers several artifact types:

| Artifact | Core MCP Tool | How It's Used |
|----------|---------------|---------------|
| Code | `CodeExecute` | Backend execution for Python, C#, etc. |
| SQL | `CodeExecute` | SQLite queries (browser) or backend |
| API | Direct HTTP | Proxied through backend for CORS |
| File | `FilesExecute` | Save generated files |
| Chart/Table | - | Client-side only |

### Code Execution Flow

```
┌────────────┐    ┌──────────────┐    ┌─────────────────┐
│ CodeArtifact│───►│ Core MCP     │───►│ E2B / Docker    │
│ (Frontend) │    │ CodeExecute  │    │ Provider        │
└────────────┘    └──────────────┘    └─────────────────┘
      │                                       │
      │◄──────────── stdout/stderr ───────────┤
```

---

## Security Considerations

1. **Code Execution Sandboxing**
   - All code runs in isolated containers (Docker) or managed sandboxes (E2B)
   - No network access by default
   - Resource limits enforced (CPU, memory, time)
   - No file system access outside sandbox

2. **File Operations**
   - Scoped to project directories
   - Path traversal prevention
   - Atomic operations with conflict detection

3. **Authentication**
   - Core MCP uses the same auth as the aiMate backend
   - Per-user data isolation
   - No cross-tenant access

4. **Rate Limiting**
   - Code execution: 10 requests/minute per user
   - Search: 60 requests/minute per user
   - File operations: 100 requests/minute per user

---

## Future Enhancements

- [ ] **Plugin System** - Allow third-party domain facades
- [ ] **Streaming Responses** - For long-running code execution
- [ ] **Distributed Execution** - Multi-node code execution pool
- [ ] **Audit Logging** - Track all tool invocations
- [ ] **Custom Providers** - User-defined code execution backends

---

## Related Documentation

- [MCP Design Specification](./MCP_DESIGN_SPEC.md) - Domain facade pattern
- [Artifacts & Code Execution](./ARTIFACTS_AND_CODE_EXECUTION.md) - UI components
- [CLAUDE.md](../CLAUDE.md) - Development guide

---

*Last updated: 2025-12-02*
