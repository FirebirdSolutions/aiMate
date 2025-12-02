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
    └── CodeArtifact.tsx       # Code with execution
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

## Future Enhancements

- [ ] **Chart Artifact** - Render data visualizations (recharts integration)
- [ ] **Image Artifact** - Display generated images
- [ ] **Mermaid Artifact** - Render diagrams
- [ ] **HTML Artifact** - Safe HTML preview
- [ ] **Pyodide Integration** - Python in browser via WebAssembly
- [ ] **Monaco Editor** - Full code editing in artifacts
