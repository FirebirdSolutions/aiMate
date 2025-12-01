# aiMate MCP Design Specification

> Context-Optimized APIs for LLM Consumers

**Reference**: [Context-Optimized APIs: Designing MCP Servers for LLMs](https://dev.to/vaticnz/context-optimized-apis-designing-mcp-servers-for-llms-5gpk)

---

## The Problem: Tool Sprawl

Traditional REST conventions work for human developers who read documentation once. But LLMs re-read **every tool description on every turn**, paying per token.

A granular approach like this:

```
memory_add, memory_get, memory_list, memory_update, memory_delete,
memory_pin, memory_archive, memory_link, memory_search, memory_embed...
```

Multiplied across domains (knowledge, tasks, files, database) quickly hits 60+ tools = ~12,000 tokens of context overhead per turn.

---

## The Solution: Domain Facades

**One tool per domain. Commands as parameters.**

Instead of 14 memory tools, expose 1 memory tool with 14 commands:

```typescript
// Before: 14 tools, 14 descriptions, 14 schemas
MemoriesAdd({ title, body, ... })
MemoriesSearch({ query, topK, ... })
MemoriesPin({ id, pinned })

// After: 1 tool, 1 description, commands as a parameter
MemoryExecute({ cmd: "add", params: { title, body, ... }})
MemoryExecute({ cmd: "search", params: { query, topK, ... }})
MemoryExecute({ cmd: "pin", params: { id, pinned }})
```

The AI reasons about **9 domains** instead of **60 verbs**.

---

## aiMate Domain Facades

| Tool | Commands | Purpose |
|------|----------|---------|
| `MemoriesExecute` | add, get, list, search, update, delete, embed | User memory persistence |
| `KnowledgeExecute` | add, get, list, search, embed, chunk | Document/knowledge base |
| `ConversationsExecute` | list, get, search, archive, export | Chat history |
| `ProjectsExecute` | list, get, upsert, archive | Workspace management |
| `FilesExecute` | list, get, put, delete, roundtrip_* | File operations |
| `ToolsExecute` | list, get, execute, validate | MCP tool proxy |
| `HydrationExecute` | context, persona, preferences | AI context loading |
| `SearchExecute` | web, semantic, hybrid | Unified search |

**8 tools. Same functionality as 50+.**

---

## Request/Response Envelopes

### Request Format

```typescript
interface DomainRequest {
  cmd: string;              // Command name
  detail?: 'minimal' | 'standard' | 'full';  // Response verbosity
  params?: Record<string, unknown>;           // Command parameters
}
```

### Response Format

```typescript
interface DomainResponse {
  ok: boolean;              // Success flag
  cmd: string;              // Echo back command (for correlation)
  data?: unknown;           // Result data
  count?: number;           // For list operations
  error?: string;           // Error message if !ok
}
```

**Always echo back the command.** The AI needs to correlate request/response when juggling multiple operations.

---

## Detail Levels

Control response verbosity with a single parameter:

| Level | Returns | Use Case |
|-------|---------|----------|
| `minimal` | ID, title only | Lists, counts, quick checks |
| `standard` | Key fields, excerpts | General use |
| `full` | Everything | Deep inspection, debugging |

The AI requests what it needs. No more parsing 50KB responses when you just wanted a count.

---

## Implementation Pattern

Each domain facade follows the same structure:

```typescript
class MemoriesExecutor {
  async execute(request: DomainRequest): Promise<DomainResponse> {
    const { cmd, detail = 'standard', params = {} } = request;

    try {
      const result = await this.dispatch(cmd, params, detail);
      return {
        ok: true,
        cmd,
        data: result.data,
        count: result.count,
      };
    } catch (error) {
      return {
        ok: false,
        cmd,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async dispatch(
    cmd: string,
    params: Record<string, unknown>,
    detail: string
  ) {
    switch (cmd.toLowerCase()) {
      case 'add':    return this.add(params, detail);
      case 'get':    return this.get(params, detail);
      case 'list':   return this.list(params, detail);
      case 'search': return this.search(params, detail);
      case 'update': return this.update(params, detail);
      case 'delete': return this.delete(params, detail);
      default:
        throw new Error(`Unknown command: ${cmd}`);
    }
  }
}
```

---

## Manifest-Based Roundtripping

For atomic multi-file operations (code generation, bulk edits):

```typescript
// 1. Start roundtrip - get current state
roundtrip_start({ paths: ["a.ts", "b.ts", "c.ts"] })
  → Returns: manifest (SHA256 hashes) + content

// 2. Preview changes
roundtrip_preview({ manifestId, changes })
  → Returns: diff, conflict warnings

// 3. Commit atomically
roundtrip_commit({ manifestId, changes, mode: "replace" })
  → Applies atomically with conflict detection
```

**Commit modes**:

| Mode | Existing | New | Use Case |
|------|----------|-----|----------|
| `replace` | Overwrite | Create | Full sync |
| `add_only` | Skip | Create | Safe scaffolding |
| `update_only` | Overwrite | Skip | Targeted fixes |

---

## Context Optimization Principles

1. **Conservative injection** - Don't auto-inject context. Surface "Suggested Context" that users opt-in to attach.

2. **Semantic search over brute force** - Use embeddings to find relevant context, not keyword matching across everything.

3. **Detail levels for control** - Let the AI request the verbosity it needs.

4. **Consistent envelopes** - Same request/response shape across all domains reduces cognitive load.

5. **Echo commands** - Always include the command in the response for correlation.

6. **Graceful degradation** - If a domain is unavailable, return a clear error, don't fail silently.

---

## Token Budget Comparison

| Approach | Tool Definitions | Per-Turn Overhead |
|----------|-----------------|-------------------|
| Granular (60 tools) | ~12,000 tokens | High |
| Domain Facades (8 tools) | ~2,000 tokens | Low |
| **Savings** | **~10,000 tokens** | **83%** |

---

## When NOT to Use This Pattern

- Simple servers with 3-5 tools (overhead isn't worth it)
- Stateless utilities where operations are truly independent
- Human-facing APIs (developers prefer granular REST)

This pattern is specifically for **LLM consumers** with context constraints and per-token costs.

---

## References

- [Context-Optimized APIs: Designing MCP Servers for LLMs](https://dev.to/vaticnz/context-optimized-apis-designing-mcp-servers-for-llms-5gpk)
- [MCP Protocol Specification](https://modelcontextprotocol.io/)

---

*Last updated: 2025-11-30*
