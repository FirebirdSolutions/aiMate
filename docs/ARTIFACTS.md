# aiMate Artifacts

Rich content blocks that the AI can generate within chat messages. Instead of raw code/data, artifacts render as interactive cards with actions like copy, download, and save to knowledge.

## Quick Reference

| Type | Syntax | Description |
|------|--------|-------------|
| [File](#file) | `` ```file:name.ext `` | Downloadable files |
| [JSON](#json) | `` ```artifact:json `` | Collapsible tree viewer |
| [Table](#table) | `` ```artifact:table `` | Sortable data tables |
| [Code](#code) | `` ```artifact:code `` | Executable code |
| [Mermaid](#mermaid) | `` ```artifact:mermaid `` | Diagrams |
| [Math](#math) | `` ```artifact:math `` | LaTeX expressions |
| [Diff](#diff) | `` ```artifact:diff `` | Code comparisons |
| [Regex](#regex) | `` ```artifact:regex `` | Pattern tester |
| [SQL](#sql) | `` ```artifact:sql `` | SQLite playground |
| [Image](#image) | `` ```artifact:image `` | Zoomable images |
| [Chart](#chart) | `` ```artifact:chart `` | Data visualizations |
| [Canvas](#canvas) | `` ```artifact:canvas `` | p5.js / Canvas API |
| [API](#api) | `` ```artifact:api `` | REST API tester |

---

## File

Downloadable files with syntax-highlighted preview.

```markdown
```file:config.json
{
  "name": "aiMate",
  "version": "1.0.0"
}
```
```

**Actions:** Copy, Download, Save to Knowledge

---

## JSON

Collapsible JSON tree viewer with syntax highlighting.

```json
{
  "title": "User Profile",
  "data": {
    "name": "Alice",
    "email": "alice@example.com",
    "roles": ["admin", "user"],
    "settings": {
      "theme": "dark",
      "notifications": true
    }
  },
  "collapsed": false,
  "maxDepth": 5
}
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `title` | string | - | Header title |
| `data` | any | required | JSON data to display |
| `collapsed` | boolean | true | Start collapsed |
| `maxDepth` | number | 5 | Max nesting depth |

**Actions:** Copy, Download, Fullscreen, Save to Knowledge

---

## Table

Sortable, searchable data tables with CSV export.

```json
{
  "title": "Sales Report",
  "headers": ["Product", "Q1", "Q2", "Q3", "Q4"],
  "rows": [
    ["Widget A", 1200, 1400, 1100, 1600],
    ["Widget B", 800, 950, 1000, 1100],
    ["Widget C", 2000, 2200, 1900, 2400]
  ],
  "sortable": true,
  "searchable": true
}
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `title` | string | - | Header title |
| `headers` | string[] | required | Column headers |
| `rows` | any[][] | required | Row data |
| `sortable` | boolean | true | Enable sorting |
| `searchable` | boolean | true | Enable search |

**Actions:** Sort columns, Search, Export CSV, Fullscreen

---

## Code

Syntax-highlighted code with execution support.

```json
{
  "title": "Fibonacci",
  "language": "python",
  "code": "def fib(n):\n    if n <= 1:\n        return n\n    return fib(n-1) + fib(n-2)\n\nprint([fib(i) for i in range(10)])",
  "executable": true
}
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `title` | string | - | Header title |
| `language` | string | required | Programming language |
| `code` | string | required | Source code |
| `filename` | string | - | Optional filename |
| `executable` | boolean | true | Show run button |

**Execution:**
- **Browser (JS/TS):** Sandboxed iframe, 10s timeout
- **Backend (Python, C#, Go, etc.):** MCP `execute_code` tool, 30s timeout

**Actions:** Run, Copy, Download, Save to Knowledge

---

## Mermaid

Diagrams using Mermaid.js syntax.

```json
{
  "title": "User Flow",
  "code": "graph TD\n    A[Start] --> B{Logged in?}\n    B -->|Yes| C[Dashboard]\n    B -->|No| D[Login]\n    D --> B"
}
```

**Supported Diagrams:**
- Flowcharts (`graph TD`, `graph LR`)
- Sequence (`sequenceDiagram`)
- Class (`classDiagram`)
- ER (`erDiagram`)
- Gantt (`gantt`)
- Pie (`pie`)
- Git (`gitGraph`)
- Mind map (`mindmap`)
- Timeline (`timeline`)
- State (`stateDiagram`)

**Actions:** Re-render, Show code, Copy, Download SVG, Download PNG, Fullscreen

---

## Math

LaTeX mathematical expressions rendered with KaTeX.

```json
{
  "title": "Quadratic Formula",
  "latex": "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}",
  "displayMode": true,
  "description": "Solutions to ax² + bx + c = 0"
}
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `title` | string | - | Header title |
| `latex` | string | required | LaTeX expression |
| `displayMode` | boolean | true | Block (true) or inline (false) |
| `description` | string | - | Optional explanation |

**Built-in Macros:** `\R`, `\N`, `\Z`, `\Q`, `\C` for number sets

**Actions:** Re-render, Show LaTeX, Copy, Fullscreen

---

## Diff

Code diff viewer with split and unified views.

**Compare two texts:**
```json
{
  "title": "Bug Fix",
  "oldText": "function add(a, b) {\n  return a - b;\n}",
  "newText": "function add(a, b) {\n  return a + b;\n}",
  "language": "javascript",
  "viewMode": "unified"
}
```

**Or provide pre-formatted diff:**
```json
{
  "title": "Config Changes",
  "diff": "- debug = false\n+ debug = true\n  port = 3000"
}
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `title` | string | - | Header title |
| `oldText` | string | - | Original text |
| `newText` | string | - | Modified text |
| `diff` | string | - | Pre-formatted diff |
| `oldFile` | string | "Original" | Left side label |
| `newFile` | string | "Modified" | Right side label |
| `language` | string | - | Syntax highlighting |
| `viewMode` | string | "unified" | "split" or "unified" |

**Actions:** Toggle split/unified, Copy, Fullscreen

---

## Regex

Interactive regex pattern tester with live matching.

```json
{
  "title": "Email Validator",
  "pattern": "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}",
  "flags": "gi",
  "testString": "Contact: alice@example.com, bob@test.org",
  "description": "Matches email addresses"
}
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `title` | string | - | Header title |
| `pattern` | string | required | Regex pattern |
| `flags` | string | "g" | Regex flags (g, i, m, s, u) |
| `testString` | string | "" | Text to test against |
| `description` | string | - | Pattern explanation |

**Features:**
- Live matching as you type
- Capture group extraction
- Color-coded match highlighting
- Editable pattern and test string

**Actions:** Edit pattern, Toggle flags, Copy regex

---

## SQL

In-browser SQLite playground using sql.js (WebAssembly).

```json
{
  "title": "Customer Database",
  "schema": "CREATE TABLE customers (\n  id INTEGER PRIMARY KEY,\n  name TEXT NOT NULL,\n  email TEXT UNIQUE\n);",
  "seedData": "INSERT INTO customers VALUES (1, 'Alice', 'alice@example.com');\nINSERT INTO customers VALUES (2, 'Bob', 'bob@example.com');",
  "query": "SELECT * FROM customers WHERE name LIKE 'A%';",
  "description": "Query customer records"
}
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `title` | string | - | Header title |
| `query` | string | required | SQL query to run |
| `schema` | string | - | CREATE TABLE statements |
| `seedData` | string | - | INSERT statements |
| `description` | string | - | Database description |

**Features:**
- Full SQLite in WebAssembly
- Table browser sidebar
- Multiple query execution
- Import/export .sqlite files
- Ctrl+Enter to run

**Actions:** Run, Reset DB, Import, Export, Fullscreen

---

## Image

Zoomable image viewer with pan and rotate.

```json
{
  "title": "Architecture Diagram",
  "src": "https://example.com/diagram.png",
  "alt": "System architecture",
  "width": 800,
  "height": 600
}
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `title` | string | - | Header title |
| `src` | string | required | Image URL or data URI |
| `alt` | string | - | Alt text |
| `width` | number | - | Display width |
| `height` | number | - | Display height |

**Features:**
- Zoom in/out (Ctrl+scroll or buttons)
- Pan when zoomed (drag to move)
- Rotate 90° increments
- Checkerboard background for transparency
- Supports URLs and base64 data URIs

**Actions:** Zoom, Pan, Rotate, Reset, Download, Fullscreen

---

## Chart

Data visualizations using Recharts.

**Bar chart:**
```json
{
  "title": "Monthly Sales",
  "chartType": "bar",
  "xKey": "month",
  "yKey": "sales",
  "data": [
    {"month": "Jan", "sales": 4000},
    {"month": "Feb", "sales": 3000},
    {"month": "Mar", "sales": 5000}
  ]
}
```

**Multi-series line chart:**
```json
{
  "title": "Revenue vs Expenses",
  "chartType": "line",
  "xKey": "month",
  "yKey": ["revenue", "expenses"],
  "data": [
    {"month": "Jan", "revenue": 5000, "expenses": 3000},
    {"month": "Feb", "revenue": 6000, "expenses": 3500}
  ],
  "colors": ["#10b981", "#ef4444"]
}
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `title` | string | - | Header title |
| `chartType` | string | "bar" | "bar", "line", "pie", "area" |
| `xKey` | string | required | X-axis data key |
| `yKey` | string \| string[] | required | Y-axis data key(s) |
| `data` | object[] | required | Chart data |
| `colors` | string[] | - | Custom colors |

**Actions:** Toggle data table, Export CSV, Fullscreen

---

## Canvas

Interactive Canvas/p5.js visualizations.

**p5.js mode** (auto-detected with `setup`/`draw`):
```json
{
  "title": "Bouncing Ball",
  "mode": "p5",
  "width": 400,
  "height": 400,
  "code": "let x, y, dx = 3, dy = 2;\n\nfunction setup() {\n  createCanvas(400, 400);\n  x = width/2; y = height/2;\n}\n\nfunction draw() {\n  background(30);\n  fill(255, 100, 100);\n  ellipse(x, y, 50);\n  x += dx; y += dy;\n  if (x < 25 || x > width-25) dx *= -1;\n  if (y < 25 || y > height-25) dy *= -1;\n}"
}
```

**Raw Canvas API:**
```json
{
  "title": "Gradient",
  "mode": "canvas",
  "width": 400,
  "height": 200,
  "code": "const g = ctx.createLinearGradient(0,0,width,0);\ng.addColorStop(0, '#ff6b6b');\ng.addColorStop(1, '#4ecdc4');\nctx.fillStyle = g;\nctx.fillRect(0, 0, width, height);"
}
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `title` | string | - | Header title |
| `code` | string | required | Canvas/p5.js code |
| `mode` | string | auto | "canvas" or "p5" |
| `width` | number | 400 | Canvas width |
| `height` | number | 400 | Canvas height |
| `autoRun` | boolean | true | Run on expand |

**Canvas API Helpers:** `ctx`, `width`, `height`, `clear()`, `fill()`, `stroke()`, `rect()`, `circle()`, `line()`

**Actions:** Run, Stop, Restart, Show code, Export PNG, Fullscreen

---

## API

REST API tester (mini Postman).

**GET request:**
```json
{
  "title": "Get User",
  "url": "https://jsonplaceholder.typicode.com/users/1",
  "method": "GET"
}
```

**POST with body:**
```json
{
  "title": "Create Post",
  "url": "https://jsonplaceholder.typicode.com/posts",
  "method": "POST",
  "headers": {
    "Content-Type": "application/json"
  },
  "body": "{\"title\": \"Hello\", \"body\": \"World\", \"userId\": 1}"
}
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `title` | string | - | Header title |
| `url` | string | required | Request URL |
| `method` | string | "GET" | HTTP method |
| `headers` | object | - | Request headers |
| `body` | string | - | Request body |
| `description` | string | - | Request description |

**Features:**
- GET, POST, PUT, PATCH, DELETE methods
- Editable URL, headers, body
- Response viewer with status, timing, headers
- Pretty-printed JSON response
- Copy as cURL command

**Actions:** Send, Edit headers/body, Copy cURL, Fullscreen

---

## Common Features

All artifacts share these capabilities:

- **Collapsible** - Click header to expand/collapse
- **Fullscreen** - Maximize for detailed viewing
- **Copy** - Copy content to clipboard
- **Save to Knowledge** - Store for future RAG retrieval
- **Dark mode** - Automatic theme support

---

## Adding to Chat

The AI generates artifacts using this markdown syntax:

````markdown
```artifact:type
{
  "property": "value"
}
```
````

Or for files:

````markdown
```file:filename.ext
content here
```
````

The `ArtifactRenderer` component parses these blocks and renders the appropriate component.
