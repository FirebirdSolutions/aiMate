# aiMate Web UI - Master Bug/Feature/Enhancement List

> **Reference Docs:** `/docs/*`, `/docs/api/*`, `/CLAUDE.md`

---

## Status Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Complete |
| ⚠️ | Partial/In Progress |
| ❌ | Not Started |
| 🔄 | Needs Review |

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
| Task Model implementation | 🔄 | Discuss: What do we need? |
| Title Generation | 🔄 | Discuss: Implementation needed? |

### Connections

| Item | Status | Notes |
|------|--------|-------|
| Provider Type dropdown | 🔄 | Do we need it? |
| Auth input display | ❌ | API key, OAuth details |

### Models - General

| Item | Status | Notes |
|------|--------|-------|
| Model Params | 🔄 | Review needed |

### Models - Prompts

| Item | Status | Notes |
|------|--------|-------|
| Suggestions | ❌ | TODO |
| Tools/Filters | ❌ | Dynamic - TODO |
| Actions | ❌ | Remove for now |

### Models - Advanced Params

| Item | Status | Notes |
|------|--------|-------|
| Pass to chat context | ❌ | Ensure they're passed correctly |

### MCP

| Item | Status | Notes |
|------|--------|-------|
| Test connection button | ❌ | TODO: Implement |
| General functionality | 🔄 | Check/Review/Implement |
| Tool list retrieval | ❌ | TODO |
| Tool authorisation | ❌ | TODO |

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
| Default option | ❌ | Should default to ON |

### System Prompt

| Item | Status | Notes |
|------|--------|-------|
| Check usage | 🔄 | Verify it's being used |

### Interface - Theme

| Item | Status | Notes |
|------|--------|-------|
| Theme persistence | 🔄 | Check persistence works |
| Colour theme flow | ❌ | Ensure flows to all controls (toggles, etc) |

### Interface - Chat Display

| Item | Status | Notes |
|------|--------|-------|
| Timestamp option | ❌ | Ensure implemented |
| Syntax highlighting | ❌ | Ensure implemented |
| Markdown rendering | ❌ | Ensure implemented |
| Code blocks | ❌ | Additional functionality needed |

### Personalisation - AI Behaviour

| Item | Status | Notes |
|------|--------|-------|
| Creativity level | 🔄 | Check how it's used |
| Response level | 🔄 | Check how it's used |

### Personalisation - Custom Instructions

| Item | Status | Notes |
|------|--------|-------|
| Check usage | 🔄 | See General > System Prompt - duplicating? |

### Personalisation - Remember Context

| Item | Status | Notes |
|------|--------|-------|
| Check usage | 🔄 | Verify it's being used |

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
| Edit Memory | 🔄 | Check usage |

### Usage

| Item | Status | Notes |
|------|--------|-------|
| Mock data | ❌ | Implement mock data |
| Loading state | ❌ | Stuck on loading - fix |

---

## Chat

### Prompt Input

| Item | Status | Notes |
|------|--------|-------|
| Attach Content | 🔄 | Review |
| Tooling | 🔄 | Review |

### User Messages

| Item | Status | Notes |
|------|--------|-------|
| Basic rendering | ✅ | Done |

### Assistant Messages

| Item | Status | Notes |
|------|--------|-------|
| Sharing | ❌ | TODO: Implement |
| Processing indicator | ❌ | Fix - shows chat bubble before response |

### Both Message Types

| Item | Status | Notes |
|------|--------|-------|
| Add to knowledge | ❌ | TODO: Implement |
| "Not implemented" items | 🔄 | Review all |

---

## Top Bar

### Right-hand Kebab Menu

| Item | Status | Notes |
|------|--------|-------|
| Help and FAQ | 🔄 | Check where info is stored (see `/HelpSystem`) |

---

## Side Navigation

### Search

| Item | Status | Notes |
|------|--------|-------|
| Search functionality | ❌ | TODO: Implement |

### Notes

| Item | Status | Notes |
|------|--------|-------|
| Basic functionality | ✅ | Complete |
| Migrate to Knowledge? | 🔄 | Discuss |

### Knowledge

| Item | Status | Notes |
|------|--------|-------|
| Full audit | ❌ | TODO |
| Integrate Files/Notes? | 🔄 | Discuss |

### Files

| Item | Status | Notes |
|------|--------|-------|
| Remove as top-level | 🔄 | Integrate with Knowledge instead? |

### Projects

| Item | Status | Notes |
|------|--------|-------|
| Populate existing | ❌ | TODO |
| Allow editing | ❌ | TODO |

### Chat List

| Item | Status | Notes |
|------|--------|-------|
| Virtualization | ✅ | Done - @tanstack/react-virtual |
| Kebab menu functionality | 🔄 | Ensure all works (e.g. Move to Project) |
| Vertical scroll styling | ❌ | TODO |

---

## Technical Debt

| Item | Status | Notes |
|------|--------|-------|
| Remove unused LazyLoadTrigger | ❌ | Replaced by virtualization |
| TypeScript strict mode | ❌ | Enable and fix errors |
| Replace `any` types | ❌ | In various hooks |
| Bundle size optimization | ❌ | Code splitting needed (currently 1.4MB) |

---

## Completed Items (for reference)

- [x] List virtualization (@tanstack/react-virtual)
- [x] Error boundaries (ErrorBoundary.tsx)
- [x] Performance optimization for lists
- [x] MCP tool integration
- [x] Tool call parsing (XML/JSON)
- [x] SSE streaming for chat
- [x] Offline mode with mock data

---

*Last updated: 2025-11-30*
