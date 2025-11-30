# CLAUDE.md - aiMate Project Context

## Project Overview

**aiMate.nz** is a sovereign AI chat platform for New Zealand, featuring:
- Real-time streaming chat with multiple AI models
- Multi-workspace conversation management
- Knowledge base with RAG (Retrieval Augmented Generation)
- MCP (Model Context Protocol) tool integration
- Admin panel for model/connection management
- Crisis detection and NZ-specific safety features

## Tech Stack

### Frontend (`/src/aimate.web.ui`)
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite 7.x
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui (48 components)
- **HTTP Client**: Axios with JWT authentication
- **Icons**: Lucide React

### Backend (`/src/AiMate.Api`, `/src/AiMate.Core`, `/src/AiMate.Infrastructure`)
- **Framework**: ASP.NET Core 9.0
- **Database**: PostgreSQL + pgvector
- **ORM**: Entity Framework Core 9.0
- **Authentication**: JWT + BCrypt
- **AI Gateway**: LiteLLM Proxy

## Directory Structure

```
/home/user/aiMate/
├── src/
│   ├── aimate.web.ui/          # React TypeScript frontend
│   │   ├── src/
│   │   │   ├── api/            # API client layer
│   │   │   │   ├── client.ts   # Axios instance with JWT & SSE
│   │   │   │   ├── types.ts    # 90+ TypeScript interfaces
│   │   │   │   └── services/   # 15 service files
│   │   │   ├── components/     # React components (35 custom + 48 UI)
│   │   │   ├── context/        # React context providers
│   │   │   ├── hooks/          # 9 custom React hooks
│   │   │   └── utils/          # Utilities & mock data
│   │   └── package.json
│   ├── AiMate.Api/             # ASP.NET Core Web API
│   ├── AiMate.Core/            # Domain models & interfaces
│   ├── AiMate.Infrastructure/  # Data access & services
│   ├── AiMate.Shared/          # Shared DTOs
│   └── AiMate.Web/             # Blazor Server (legacy)
├── docs/                       # Documentation
├── tests/                      # Test projects
└── CLAUDE.md                   # This file
```

---

## Implementation Stages

### Stage 1: Type Definitions ✅ COMPLETE
- 90+ TypeScript interfaces for all API DTOs
- Request/Response types for all endpoints
- Enums for status codes, user tiers, etc.

### Stage 2: API Client Infrastructure ✅ COMPLETE
- JWT authentication with automatic token management
- SSE (Server-Sent Events) streaming support
- Retry logic with exponential backoff
- Request/response interceptors
- Error handling and logging

### Stage 3: Service Layer ✅ COMPLETE
16 organized service files:
- `admin.service.ts` - Admin dashboard, system management
- `auth.service.ts` - Login, registration, JWT refresh
- `chat.service.ts` - Real-time chat with streaming
- `connections.service.ts` - BYOK connection management
- `conversations.service.ts` - Conversation CRUD & search
- `feedback.service.ts` - Message ratings & feedback
- `files.service.ts` - File upload/download with progress
- `knowledge.service.ts` - RAG documents & semantic search
- `messages.service.ts` - Message CRUD operations
- `projects.service.ts` - Project management
- `search.service.ts` - Full-text search
- `settings.service.ts` - User preferences
- `tools.service.ts` - MCP tool discovery & execution ← NEW
- `usage.service.ts` - Analytics, billing, tracking
- `workspaces.service.ts` - Workspace management
- `index.ts` - Barrel exports

### Stage 4: React Hooks Layer ✅ COMPLETE
10 production-ready hooks:
- `useAdmin.ts` - Admin panel data & operations
- `useSettings.ts` - User settings management
- `useUsage.ts` - Analytics & billing
- `useChat.ts` - Real-time streaming chat
- `useConversations.ts` - Conversation management
- `useWorkspaces.ts` - Workspace organization
- `useKnowledge.ts` - Knowledge base (RAG)
- `useProjects.ts` - Project management
- `useFiles.ts` - File management
- `useTools.ts` - MCP tool execution ← NEW

### Stage 5: UI Integration ✅ COMPLETE

#### All Components Wired:
- ✅ Chat streaming with SSE
- ✅ Conversation management (create/edit/delete)
- ✅ Workspace switching
- ✅ Admin Panel (Models, Connections, MCP servers, Users)
- ✅ Settings Modal (Usage tab)
- ✅ **MCP Tool Integration**
  - ✅ `tools.service.ts` for MCP tool execution
  - ✅ `useTools.ts` hook with offline mock support
  - ✅ `ToolCallDisplay.tsx` component for rendering tool calls
  - ✅ AppDataContext updated with tools hook
- ✅ **ChatInput Attachments**
  - ✅ Wired to `useFiles()` hook for real file uploads
  - ✅ Drag & drop with validation and upload progress
  - ✅ Manual file selection via "Upload New File" button
  - ✅ Upload progress overlay with percentage
- ✅ **KnowledgeModal**
  - ✅ Wired to `useKnowledge()` hook
  - ✅ Load, delete, upload documents via hook
  - ✅ Added refresh functionality
- ✅ **ProjectModal**
  - ✅ Wired to `useProjects()` hook
  - ✅ Create, update, delete projects via hook
  - ✅ Loading states for operations
- ✅ **FilesModal**
  - ✅ Wired to `useFiles()` hook (enhanced with loadFiles)
  - ✅ Upload, delete, download, view files via hook
  - ✅ Added refresh and upload progress

### Stage 6: Testing & Polish (Future)
- End-to-end testing
- Error boundary improvements
- Performance optimization
- Documentation finalization

---

## Current Focus: Stage 6 - Testing & Polish

Stage 5 is complete. All modals and components are now wired to their respective hooks.

### What's Ready for Testing
- **MCP Admin UI** - Toggle/CRUD MCP servers in AdminModal ✅
- **MCP Service** - `admin.service.ts` has MCP server management ✅
- **MCP Types** - `ToolDto`, `ToolExecutionRequest`, `ToolExecutionResponse` ✅

### What's Needed
1. **`tools.service.ts`** - Service for executing MCP tools
   - `getAvailableTools()` - List tools from connected MCP servers
   - `executeTool(request)` - Execute a tool and get result

2. **`useTools.ts`** - Hook for tool integration in chat
   - Available tools state
   - Tool execution with loading/error states
   - Integration with chat flow

3. **Tool Execution UI**
   - Display tool calls in chat messages
   - Show tool results (formatted)
   - Loading states during execution

### Backend Endpoints for Tools
```
GET  /api/v1/tools              - List available tools
POST /api/v1/tools/execute      - Execute a tool
GET  /api/v1/tools/{name}       - Get tool details
```

---

## Development Guidelines

### Running the Frontend
```bash
cd src/aimate.web.ui
npm install
npm run dev
```

### Environment Variables
```bash
VITE_API_BASE_URL=http://localhost:5000
VITE_AUTH_ENABLED=true
VITE_DEBUG_MODE=false
```

### Offline Mode
The UI supports full offline mode with mock data. Toggle via:
- Environment: `VITE_OFFLINE_MODE=true`
- Or in AppConfig context

### Code Patterns
- Use existing hooks from `useAppData()` context
- Follow optimistic update pattern for mutations
- Add debug logging for troubleshooting
- Support both online and offline modes

---

## API Coverage Summary

| Category | Endpoints | Hook | UI Status |
|----------|-----------|------|-----------|
| Auth | 5/5 | ✅ | ✅ Wired |
| Chat | 8/8 | ✅ | ✅ Wired |
| Conversations | 12/12 | ✅ | ✅ Wired |
| Workspaces | 8/8 | ✅ | ✅ Wired |
| Admin | 15/15 | ✅ | ✅ Wired |
| Settings | 5/5 | ✅ | ✅ Wired |
| Usage | 6/6 | ✅ | ✅ Wired |
| **Tools/MCP** | 3/3 | ✅ | ✅ Wired |
| Knowledge | 10/10 | ✅ | ✅ Wired |
| Projects | 10/10 | ✅ | ✅ Wired |
| Files | 6/6 | ✅ | ✅ Wired |

---

## Key Files Reference

### Frontend Entry Points
- `/src/aimate.web.ui/src/App.tsx` - Main application
- `/src/aimate.web.ui/src/context/AppDataContext.tsx` - Central data provider
- `/src/aimate.web.ui/src/api/client.ts` - API client configuration

### Documentation
- `/src/aimate.web.ui/src/SYSTEM_GUIDE.md` - Full system documentation
- `/src/aimate.web.ui/src/API_INTEGRATION_STATUS.md` - Integration status
- `/src/aimate.web.ui/src/WIRED_UP_STATUS.md` - Component wiring status

---

*Last Updated: November 2025*
*Current Stage: 5 Complete - Ready for Stage 6 (Testing & Polish)*
