# aiMate Web UI - Master Bug/Feature/Enhancement List

> **Reference Docs:** `/docs/*`, `/docs/api/*`, `/CLAUDE.md`

---

## Status Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Complete |
| ⚠️ | Partial/In Progress/TODO |
| ❌ | Not Started |
| ⛔ | Removed (not needed for MVP) |
| 🔒 | Hidden/Deferred (revisit later) |

---

## High Priority - Integration Gaps

| Item | Status | Notes |
|------|--------|-------|
| Real backend connection | ⚠️ | Works with direct LM server, backend API stubbed |
| Authentication flow | ⚠️ | AuthContext exists but login screen not wired |
| Database persistence | ⚠️ | Uses localStorage/mock data, not real backend DB |
| E2E Testing | ❌ | Listed in Stage 6, no Playwright/Cypress setup |
| Accessibility | ⚠️ | Basic ARIA from shadcn, needs keyboard nav |

---

## Future Implementations

- [ ] Plugins system
- [ ] Vibe Coding (see `code_generation_spec.md`)
- [ ] Structured Content (see `structure_content_spec.md`)
- [ ] Full review of `/src/aimate.Api|Shared|Core` for backend/DB alignment
- [ ] Agentic Tools - Create and manage custom AI agents with tool access
- [ ] Advanced RAG - Enhanced retrieval with hybrid search and reranking

---

## Global Requirements

- [ ] Ensure required fields are validated everywhere
- [ ] Consistent error handling patterns
- [ ] Loading states for all async operations

---

## Admin Panel Modal

### General

| Item | Status | Notes |
|------|--------|-------|
| Resize for mobile/desktop | ❌ | TODO |
| Consistent vertical scrolling | ❌ | TODO |
| Tab content complete | ✅ | Done |

### Interface

| Item | Status | Notes |
|------|--------|-------|
| Horizontal width of contents | ❌ | Text boxes/areas need fixing |
| Task Model implementation | ⛔ | **Removed** - Overkill for MVP, users pick model in chat |
| Title Generation | ✅ | Auto-generate from first message, no separate model needed |

### Connections

| Item | Status | Notes |
|------|--------|-------|
| Provider Type dropdown | ⛔ | **Removed** - URL pattern implies provider |
| Auth input display | ❌ | API key, OAuth details |

### Models - General

| Item | Status | Notes |
|------|--------|-------|
| Model Params | ⚠️ | Simplify to just temperature + max_tokens for MVP |

### Models - Prompts

| Item | Status | Notes |
|------|--------|-------|
| Suggestions | ❌ | TODO |
| Tools/Filters | ❌ | Dynamic - TODO |
| Actions | ⛔ | **Removed** - Not needed for MVP |

### Models - Advanced Params

| Item | Status | Notes |
|------|--------|-------|
| Pass to chat context | 🔒 | **Hidden** - Tab hidden, revisit later |

### MCP

| Item | Status | Notes |
|------|--------|-------|
| Test connection button | ✅ | Done - Shows success/failure with latency |
| General functionality | ✅ | Working - list/enable/disable/add/edit/delete |
| Tool list retrieval | ✅ | Working - useTools hook discovers from enabled servers |
| Tool authorisation | ❌ | TODO |
| Import/Export | ❌ | Buttons present but not implemented (MCPEditDialog:86-92) |

---

## User Settings Modal

### General

| Item | Status | Notes |
|------|--------|-------|
| Resize for mobile/desktop | ❌ | TODO |
| Consistent vertical scrolling | ❌ | TODO |

### Notifications

| Item | Status | Notes |
|------|--------|-------|
| Default option | ✅ | Fixed - defaults to 'on' |

### System Prompt

| Item | Status | Notes |
|------|--------|-------|
| Check usage | ✅ | Verified - passed via userSettings.general.systemPrompt to chat |

### Interface - Theme

| Item | Status | Notes |
|------|--------|-------|
| Theme persistence | ✅ | Verified - localStorage persistence works |
| Colour theme flow | ❌ | Ensure flows to all controls (toggles, etc) |

### Interface - Chat Display

| Item | Status | Notes |
|------|--------|-------|
| Timestamp option | ✅ | Wired to UserSettings, conditional display |
| Syntax highlighting | ✅ | Wired to UserSettings, affects code block styling |
| Markdown rendering | ✅ | Wired to UserSettings, toggles ReactMarkdown |
| Code blocks | ⚠️ | Basic styling works, needs syntax highlighter library |

### Personalisation - AI Behaviour

| Item | Status | Notes |
|------|--------|-------|
| Creativity level | ✅ | Wired to temperature (precise=0.3, balanced=0.7, creative=1.0) |
| Response level | ✅ | Wired to max_tokens (concise=512, balanced=2048, detailed=4096) |

### Personalisation - Custom Instructions

| Item | Status | Notes |
|------|--------|-------|
| Check usage | ⛔ | **Merge with System Prompt** - Remove this field, append to system prompt instead |

### Personalisation - Remember Context

| Item | Status | Notes |
|------|--------|-------|
| Check usage | ✅ | Wired - toggles whether conversation history is included |

### Account

| Item | Status | Notes |
|------|--------|-------|
| Update Profile | ❌ | Implement mock workflow |
| Change Password | ❌ | Implement mock workflow |
| Download My Data | ❌ | Implement mock workflow |
| Subscription | ❌ | Implement mock workflow |
| Danger Zone | ❌ | Implement mock workflow |

### Memories

| Item | Status | Notes |
|------|--------|-------|
| Edit Memory | ✅ | Keep simple - inline edit is sufficient |

### Usage

| Item | Status | Notes |
|------|--------|-------|
| Mock data | ✅ | useUsage hook has mock data, falls back on error |
| Loading state | ✅ | Fixed - 5s timeout with fallback to mock data |

---

## Chat

### Prompt Input

| Item | Status | Notes |
|------|--------|-------|
| Attach Content | ✅ | Keep - powerful with Knowledge/Project features |
| Tooling | ✅ | Keep basic - MCP tools work, don't over-engineer |

### User Messages

| Item | Status | Notes |
|------|--------|-------|
| Basic rendering | ✅ | Done |

### Assistant Messages

| Item | Status | Notes |
|------|--------|-------|
| Sharing | ✅ | Simplified to Copy Link only for MVP |
| Processing indicator | ✅ | Fixed - bouncing dots only show before first chunk |

### Both Message Types

| Item | Status | Notes |
|------|--------|-------|
| Add to knowledge | ✅ | Done - Brain icon saves message to knowledge |
| "Not implemented" items | ✅ | Audited - removed non-working buttons, implemented TTS |

---

## Top Bar

### Right-hand Kebab Menu

| Item | Status | Notes |
|------|--------|-------|
| Help and FAQ | 🔒 | **Deferred** - Point to GitHub docs for now |

---

## Side Navigation

### Search

| Item | Status | Notes |
|------|--------|-------|
| Search functionality | ✅ | Searches conversations and knowledge with debounced queries |
| Filter toggles | ✅ | Chats and Knowledge filters |
| Click to navigate | ✅ | Clicking conversation opens it |

### Knowledge

| Item | Status | Notes |
|------|--------|-------|
| Full audit | ❌ | TODO |
| Consolidated from Notes/Files | ✅ | Notes and Files buttons removed, Knowledge is unified |
| Project cross-linking | ✅ | Done - Project chats can be saved to Knowledge with context |
| Project source display | ✅ | Done - Knowledge items show project badge and source type |

### Projects

| Item | Status | Notes |
|------|--------|-------|
| Populate existing | ✅ | Done - useProjects hook with mock data |
| Allow editing | ✅ | Done - ProjectModal supports create/edit/delete |
| Project-conversation linking | ✅ | Done - addConversation/removeConversation wired |
| ProjectModal chats tab | ✅ | Done - fetches real conversations from conversationIds |
| Project view mode | ✅ | Done - Click project to filter to its chats only |
| Project-scoped chat creation | ✅ | Done - New chats auto-added to active project |
| Project indicator in chat | ✅ | Done - Banner in ChatInput shows active project |
| Save chats to Knowledge | ✅ | Done - Brain icon in chat menu saves with project context |

### Chat List

| Item | Status | Notes |
|------|--------|-------|
| Virtualization | ✅ | Done - @tanstack/react-virtual |
| Kebab menu functionality | ✅ | Done - Move to Project properly wired |
| Vertical scroll styling | ❌ | TODO |

---

## Technical Debt

| Item | Status | Notes |
|------|--------|-------|
| Remove unused LazyLoadTrigger | ✅ | Deleted - was replaced by virtualization |
| TypeScript strict mode | ❌ | Enable and fix errors |
| Replace `any` types | ❌ | In various hooks (e.g., ChatInput:75) |
| Bundle size optimization | ❌ | Code splitting needed (currently 1.4MB) |
| Console.log cleanup | ❌ | 76+ statements across hooks - consider proper logging |
| ChatInput stub data | ⚠️ | Line 74 - attachment data from stubs, verify if intentional |

---

## Completed Items (for reference)

- [x] List virtualization (@tanstack/react-virtual)
- [x] Error boundaries (ErrorBoundary.tsx)
- [x] Performance optimization for lists
- [x] MCP tool integration
- [x] Tool call parsing (XML/JSON)
- [x] SSE streaming for chat
- [x] Offline mode with mock data
- [x] Notification default to ON
- [x] Theme persistence (localStorage)
- [x] Timestamp toggle (wired to ChatMessage)
- [x] Markdown rendering toggle (wired to ChatMessage)
- [x] Syntax highlighting toggle (wired to ChatMessage)
- [x] Usage tab loading state (5s timeout with fallback)
- [x] System prompt wired to chat context
- [x] Creativity level → temperature mapping
- [x] Response style → max_tokens mapping
- [x] Remember context toggle (history inclusion)
- [x] Processing indicator fix (bouncing dots only before first chunk)
- [x] Toast audit (removed non-working share buttons, implemented TTS)
- [x] MCP design spec documentation
- [x] Knowledge consolidation (removed Notes/Files buttons, unified under Knowledge)
- [x] SearchModal implementation (real search across conversations & knowledge)
- [x] Code cleanup (removed dead NotesModal/FilesModal, unused imports)
- [x] Modal audit completed (all modals consistent, no "not implemented" toasts)
- [x] Full codebase audit (see audit report for testing checklist)
- [x] LazyLoadTrigger.tsx removed (dead code)

---

*Last updated: 2025-12-01*
