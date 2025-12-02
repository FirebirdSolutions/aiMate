# Artifacts and Code Execution

This document covers aiMate's artifact system for rendering rich content in chat, and the code execution capabilities for running code snippets.

## Overview

Artifacts are rich content blocks that the AI can generate within chat messages. Instead of raw code/data flooding the conversation, artifacts render as collapsible, interactive cards with actions like copy, download, and save to knowledge.

```
┌─────────────────────────────────────────────────────────────┐
│  Chat Message                                               │
│                                                             │
│  "Here's a function to calculate fibonacci numbers:"        │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 📄 Code        JavaScript    12 lines   [▶ Run] [↓] │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │  1 │ function fibonacci(n) {                        │   │
│  │  2 │   if (n <= 1) return n;                        │   │
│  │  3 │   return fibonacci(n - 1) + fibonacci(n - 2);  │   │
│  │  ...                                                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Artifact Types

| Type | Description | Actions |
|------|-------------|---------|
| **File** | Downloadable file with preview | Copy, Download, Save to Knowledge |
| **JSON** | Collapsible tree viewer | Copy, Download, Fullscreen, Save to Knowledge |
| **Table** | Sortable, searchable data table | Sort, Search, Export CSV, Fullscreen |
| **Code** | Syntax-highlighted executable code | Run, Copy, Download, Save to Knowledge |
| **Mermaid** | Diagrams (flowcharts, sequence, ER, etc.) | Re-render, Copy, Download SVG/PNG, Fullscreen |
| **Math** | LaTeX mathematical expressions | Re-render, Copy LaTeX, Fullscreen |
| **Diff** | Code diff viewer (split/unified) | Toggle view, Copy, Fullscreen |
| **Regex** | Interactive regex pattern tester | Edit pattern, Toggle flags, Live matching |
| **SQL** | In-browser SQLite playground | Run query, Import/Export DB, Reset |

## File Structure

```
src/components/
├── FileArtifact.tsx           # Original file download component
└── rich-content/
    ├── index.ts               # Module exports
    ├── types.ts               # TypeScript interfaces
    ├── ArtifactRenderer.tsx   # Parser and router
    ├── JsonArtifact.tsx       # JSON tree viewer
    ├── TableArtifact.tsx      # Data table
    ├── CodeArtifact.tsx       # Code with execution
    ├── MermaidArtifact.tsx    # Mermaid diagrams
    ├── MathArtifact.tsx       # LaTeX math rendering
    ├── DiffArtifact.tsx       # Code diff viewer
    ├── RegexArtifact.tsx      # Regex tester
    └── SqlArtifact.tsx        # SQLite playground
```

---

## Markdown Syntax

The AI uses special markdown code fence syntax to create artifacts:

### File Artifact

```markdown
```file:report.md
# Monthly Report
This is the file content...
```
```

### JSON Artifact

```markdown
```artifact:json
{
  "title": "User Data",
  "data": {
    "name": "John",
    "age": 30,
    "roles": ["admin", "user"]
  }
}
```
```

### Table Artifact

```markdown
```artifact:table
{
  "title": "Sales Data",
  "headers": ["Product", "Q1", "Q2", "Q3"],
  "rows": [
    ["Widget A", 100, 150, 200],
    ["Widget B", 80, 90, 120]
  ],
  "sortable": true,
  "searchable": true
}
```
```

### Code Artifact

```markdown
```artifact:code
{
  "language": "python",
  "title": "Hello World",
  "code": "print('Hello, World!')",
  "executable": true
}
```
```

### Mermaid Artifact (Diagrams)

```markdown
```artifact:mermaid
{
  "title": "User Flow",
  "code": "graph TD\n    A[Start] --> B{Login?}\n    B -->|Yes| C[Dashboard]\n    B -->|No| D[Register]\n    D --> B"
}
```
```

Supported diagram types:
- Flowcharts (`graph TD`, `graph LR`)
- Sequence diagrams (`sequenceDiagram`)
- Class diagrams (`classDiagram`)
- ER diagrams (`erDiagram`)
- Gantt charts (`gantt`)
- Pie charts (`pie`)
- Git graphs (`gitGraph`)
- Mind maps (`mindmap`)
- Timelines (`timeline`)
- State diagrams (`stateDiagram`)

### Math Artifact (LaTeX)

```markdown
```artifact:math
{
  "title": "Quadratic Formula",
  "latex": "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}",
  "displayMode": true,
  "description": "Solutions to ax² + bx + c = 0"
}
```
```

Features:
- KaTeX rendering for fast math display
- Display mode (block) or inline mode
- Common macros: `\R`, `\N`, `\Z`, `\Q`, `\C` for number sets
- Dark mode support

### Diff Artifact (Code Comparison)

```markdown
```artifact:diff
{
  "title": "Bug Fix",
  "oldText": "function add(a, b) {\n  return a - b;\n}",
  "newText": "function add(a, b) {\n  return a + b;\n}",
  "language": "javascript",
  "viewMode": "unified"
}
```
```

Or with pre-formatted diff:

```markdown
```artifact:diff
{
  "title": "Config Changes",
  "diff": "- old_setting = false\n+ old_setting = true\n  unchanged_line"
}
```
```

Features:
- Split view (side-by-side)
- Unified view (combined)
- Line numbers
- Addition/deletion highlighting

### Regex Artifact (Pattern Tester)

```markdown
```artifact:regex
{
  "title": "Email Validator",
  "pattern": "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}",
  "flags": "gi",
  "testString": "Contact us at hello@example.com or support@test.org",
  "description": "Matches email addresses in text"
}
```
```

Features:
- Live pattern matching
- Capture group display
- Flag toggles (g, i, m, s, u)
- Match highlighting with colors
- Editable pattern and test string

### SQL Artifact (SQLite Playground)

```markdown
```artifact:sql
{
  "title": "Customer Database",
  "schema": "CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT, email TEXT, created_at TEXT);",
  "seedData": "INSERT INTO customers VALUES (1, 'Alice', 'alice@example.com', '2024-01-01');\nINSERT INTO customers VALUES (2, 'Bob', 'bob@example.com', '2024-01-15');",
  "query": "SELECT * FROM customers WHERE name LIKE 'A%';",
  "description": "In-browser SQLite database"
}
```
```

Features:
- Full SQLite running in WebAssembly (sql.js)
- Schema initialization
- Seed data support
- Multiple query execution
- Table browser sidebar
- Import/export .sqlite files
- Ctrl+Enter to run queries

---

## Code Execution

CodeArtifact supports two execution modes based on language:

### Browser Sandbox (Client-side)

**Languages:** JavaScript, TypeScript

Executes in a sandboxed `<iframe>` with `sandbox="allow-scripts"`:
- No DOM access to parent page
- No network access
- No file system access
- 10-second timeout
- Console output captured and displayed

```
┌──────────────────────────────────────┐
│ Browser                              │
│  ┌────────────────────────────────┐  │
│  │ aiMate Chat                    │  │
│  │  ┌──────────────────────────┐  │  │
│  │  │ Sandboxed iframe         │  │  │
│  │  │ (allow-scripts only)     │  │  │
│  │  │                          │  │  │
│  │  │ console.log → postMessage│──┼──┼─► Output Panel
│  │  └──────────────────────────┘  │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

### MCP Backend (Server-side)

**Languages:** Python, C#, Go, Rust, Java, Ruby, PHP, Bash

Executes via the `execute_code` MCP tool:
- Runs on backend server
- Full language runtime support
- 30-second timeout
- Returns stdout/stderr

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   Browser    │      │  MCP Server  │      │   Runtime    │
│              │      │              │      │              │
│ CodeArtifact │─────►│ execute_code │─────►│ dotnet/python│
│              │◄─────│   tool       │◄─────│   /go/etc    │
│ Output Panel │      │              │      │              │
└──────────────┘      └──────────────┘      └──────────────┘
```

---

## MCP execute_code Tool

The `execute_code` tool is part of the `core` MCP server (always available).

### Tool Definition

```typescript
{
  name: 'execute_code',
  description: 'Execute code in a sandboxed environment',
  category: 'code',
  parameters: {
    language: {
      type: 'string',
      description: 'Programming language',
      required: true,
    },
    code: {
      type: 'string',
      description: 'Source code to execute',
      required: true,
    },
    timeout: {
      type: 'integer',
      description: 'Timeout in seconds (default: 30, max: 60)',
      required: false,
    },
    stdin: {
      type: 'string',
      description: 'Standard input',
      required: false,
    },
  },
}
```

### Response Format

```typescript
{
  success: true,
  toolName: 'execute_code',
  result: {
    language: 'python',
    stdout: 'Hello, World!\n',
    stderr: '',
    exitCode: 0,
    executionTime: 150, // ms
  },
  executionTime: 200,
  timestamp: '2024-01-15T10:30:00Z',
}
```

### Supported Languages

| Language | Aliases | Backend Runtime |
|----------|---------|-----------------|
| JavaScript | `javascript`, `js` | Browser iframe |
| TypeScript | `typescript`, `ts` | Browser iframe (stripped types) |
| Python | `python`, `py` | `python3` |
| C# | `csharp`, `cs` | `dotnet script` |
| Go | `go` | `go run` |
| Rust | `rust` | `rustc` + run |
| Java | `java` | `java` |
| Ruby | `ruby` | `ruby` |
| PHP | `php` | `php` |
| Bash | `bash`, `sh` | `bash` |

---

## Component API

### FileArtifact

```typescript
interface FileArtifactData {
  type?: 'file';
  filename: string;
  content: string;
  mimeType?: string;
  size?: number;
  encoding?: 'utf-8' | 'base64';
}

interface FileArtifactProps {
  file: FileArtifactData;
  showPreview?: boolean;
  onSaveToKnowledge?: (file: FileArtifactData) => void;
}
```

### JsonArtifact

```typescript
interface JsonArtifactData {
  type: 'json';
  data: any;
  title?: string;
  collapsed?: boolean;
  maxDepth?: number; // Default: 5
}
```

### TableArtifact

```typescript
interface TableArtifactData {
  type: 'table';
  headers: string[];
  rows: any[][];
  title?: string;
  sortable?: boolean;  // Default: true
  searchable?: boolean; // Default: true
}
```

### CodeArtifact

```typescript
interface CodeArtifactData {
  type: 'code';
  language: string;
  code: string;
  title?: string;
  filename?: string;
  executable?: boolean; // Default: true
}
```

---

## Parsing Flow

The `ArtifactRenderer` component handles parsing and routing:

```
Message Content
      │
      ▼
┌─────────────────┐
│ parseArtifacts()│ ─── Regex matches ```artifact:type or ```file:name
└────────┬────────┘
         │
         ▼
   ┌─────────────┐
   │ Switch on   │
   │ artifact    │
   │ type        │
   └──────┬──────┘
          │
    ┌─────┼─────┬─────┬─────┐
    ▼     ▼     ▼     ▼     ▼
  file  json  table code  unknown
    │     │     │     │      │
    ▼     ▼     ▼     ▼      ▼
┌──────┐┌────┐┌─────┐┌────┐┌────┐
│File  ││Json││Table││Code││Json│
│Artif ││Art ││Artif││Art ││(fb)│
└──────┘└────┘└─────┘└────┘└────┘
```

---

## Usage in ChatMessage

The `ChatMessage` component automatically detects and renders artifacts:

```typescript
// In ChatMessage.tsx
import { ArtifactRenderer, parseArtifacts } from "./rich-content";

// Parse artifacts from assistant message
const { artifacts, cleanedContent } = !isUser
  ? parseArtifacts(content)
  : { artifacts: [], cleanedContent: content };

// Render markdown (without artifact blocks)
<ReactMarkdown>{cleanedContent}</ReactMarkdown>

// Render artifacts
<ArtifactRenderer
  artifacts={artifacts}
  onSaveToKnowledge={handleSaveToKnowledge}
/>
```

---

## Save to Knowledge

All artifacts include a "Save to Knowledge" button (brain icon) that:
1. Extracts the artifact content
2. Calls the knowledge service to save
3. Makes the content searchable in future chats

**Current Status:** UI implemented, backend integration pending.

---

## Adding New Artifact Types

To add a new artifact type:

1. **Define the type** in `rich-content/types.ts`:
   ```typescript
   export interface MyArtifactData extends BaseArtifactData {
     type: 'mytype';
     // ... fields
   }
   ```

2. **Update the union type**:
   ```typescript
   export type ArtifactData = ... | MyArtifactData;
   ```

3. **Create the component** in `rich-content/MyArtifact.tsx`

4. **Add parsing case** in `ArtifactRenderer.tsx`:
   ```typescript
   case 'mytype':
     artifact = { type: 'mytype', data: { ... }, raw: fullMatch };
     break;
   ```

5. **Add rendering case**:
   ```typescript
   case 'mytype':
     return <MyArtifact key={...} data={...} />;
   ```

6. **Export from index.ts**

---

## Security Considerations

### Browser Sandbox
- Uses `sandbox="allow-scripts"` only (no same-origin, no forms, no popups)
- Iframe is hidden and destroyed after execution
- 10-second hard timeout
- No access to parent window objects

### MCP Backend
- Execution happens in isolated container/sandbox
- Resource limits enforced (CPU, memory, time)
- No network access by default
- No file system access outside sandbox

### TypeScript Handling
- Basic type stripping for browser execution (not full compilation)
- For production C#/complex TS, use MCP backend

---

## Backend Code Execution Provider

The backend uses an abstracted provider pattern for code execution, allowing you to switch between cloud and self-hosted solutions.

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    ICodeExecutionProvider                        │
│                         (Interface)                              │
└─────────────────────┬───────────────────────┬───────────────────┘
                      │                       │
         ┌────────────┴────────────┐   ┌─────┴─────────────┐
         │  E2BCodeExecutionProvider│   │DockerCodeExecution│
         │       (Cloud)           │   │   Provider        │
         │                         │   │   (Self-hosted)   │
         │  ✓ Multi-language       │   │                   │
         │  ✓ Managed security     │   │  ✓ Full sovereignty│
         │  ✓ Easy setup           │   │  ✓ No external deps│
         │  ✓ Scalable             │   │  ✓ Custom images   │
         └─────────────────────────┘   └───────────────────┘
```

### Configuration (appsettings.json)

```json
{
  "CodeExecution": {
    "PreferredProvider": "E2B",
    "ProviderOrder": ["E2B", "Docker"],
    "FallbackOnError": true,
    "DefaultTimeoutSeconds": 30,

    "E2B": {
      "ApiKey": "e2b_xxx_your_api_key"
    },

    "Docker": {
      "Enabled": false,
      "MaxMemoryMb": 256,
      "MaxCpuPercent": 50,
      "AllowNetwork": false
    }
  }
}
```

### Provider Interface

```csharp
public interface ICodeExecutionProvider
{
    string ProviderName { get; }
    IReadOnlyList<string> SupportedLanguages { get; }

    bool SupportsLanguage(string language);
    Task<CodeExecutionResult> ExecuteAsync(CodeExecutionRequest request, CancellationToken ct);
    Task<bool> IsAvailableAsync(CancellationToken ct);
    Task<ProviderHealthInfo> GetHealthAsync(CancellationToken ct);
}
```

### Switching Providers

To switch from E2B to Docker (self-hosted):

1. Update `appsettings.json`:
   ```json
   {
     "CodeExecution": {
       "PreferredProvider": "Docker",
       "Docker": {
         "Enabled": true
       }
     }
   }
   ```

2. Ensure Docker is installed and running

3. Pre-pull required images:
   ```bash
   docker pull python:3.11-slim
   docker pull node:20-slim
   docker pull mcr.microsoft.com/dotnet/sdk:8.0
   docker pull golang:1.21-alpine
   ```

### Adding a Custom Provider

1. Implement `ICodeExecutionProvider`:
   ```csharp
   public class MyCustomProvider : ICodeExecutionProvider
   {
       public string ProviderName => "Custom";
       // ... implement interface
   }
   ```

2. Register in DI:
   ```csharp
   services.AddSingleton<ICodeExecutionProvider, MyCustomProvider>();
   ```

3. Add to provider order:
   ```json
   { "ProviderOrder": ["Custom", "E2B", "Docker"] }
   ```

---

## Future Enhancements

- [ ] **Chart Artifact** - Render data visualizations (recharts integration)
- [ ] **Image Artifact** - Display generated images
- [ ] **Mermaid Artifact** - Render diagrams
- [ ] **HTML Artifact** - Safe HTML preview
- [ ] **Pyodide Integration** - Python in browser via WebAssembly
- [ ] **Monaco Editor** - Full code editing in artifacts
