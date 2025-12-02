# Agent Presets Specification

> Quick-switch AI personas with predefined tools, prompts, and behaviors.

## Overview

Agent Presets allow users to create reusable AI configurations that combine:
- Custom system prompts (persona/instructions)
- Enabled MCP tools subset
- Knowledge base attachments
- Model parameters (temperature, etc.)

## Data Model

```typescript
interface AgentPreset {
  id: string;
  name: string;
  description: string;
  icon?: string;                    // Emoji or icon name
  color?: string;                   // Accent color

  // Configuration
  systemPrompt: string;             // Custom instructions
  enabledToolIds: string[];         // MCP tools this agent can use
  knowledgeIds: string[];           // Auto-attached knowledge

  // Parameters
  temperature?: number;             // Override creativity level
  maxTokens?: number;               // Override response length

  // Behavior
  autoApproveTools: boolean;        // Skip tool confirmation dialogs

  // Metadata
  createdAt: string;
  updatedAt: string;
  isBuiltIn: boolean;               // System vs user-created
}
```

## Built-in Presets

| Name | Description | Tools | Temp |
|------|-------------|-------|------|
| General Assistant | Default helpful assistant | All enabled | 0.7 |
| Code Reviewer | Reviews code for bugs, style, security | None | 0.3 |
| Research Assistant | Searches and summarizes information | web_search, fetch | 0.5 |
| Data Analyst | Analyzes data, creates visualizations | None | 0.4 |
| Creative Writer | Helps with creative writing tasks | None | 1.0 |

## UI Components

### 1. Agent Selector (Chat Header)
- Dropdown in chat header to switch agents
- Shows current agent icon + name
- Quick access to recently used agents

### 2. Agent Management (Admin Panel)
- New "Agents" tab in Admin Modal
- List of presets with enable/disable toggle
- Create/Edit/Delete custom agents
- Import/Export agent configurations

### 3. Agent Edit Dialog
- Name, description, icon picker
- System prompt textarea
- Tool selection (checkboxes from enabled MCP tools)
- Knowledge attachment selector
- Parameter sliders (temperature, max tokens)

## Implementation Plan

### Phase 1: Core (This PR)
1. Create `useAgents` hook with localStorage persistence
2. Add AgentsTab to AdminModal
3. Add AgentEditDialog component
4. Add agent selector to ChatHeader
5. Wire agent config into chat send flow

### Phase 2: Enhancements (Future)
- Per-conversation agent override
- Agent suggestions based on message content
- Agent templates/marketplace
- Usage analytics per agent

## Storage

Agents stored in localStorage under key `aimate-agent-presets`:
```json
{
  "presets": [...],
  "activePresetId": "general-assistant",
  "recentPresetIds": ["general-assistant", "code-reviewer"]
}
```

## Integration Points

- `useChat.sendMessage()` - Pass agent's systemPrompt and enabledToolIds
- `ChatHeader` - Agent selector dropdown
- `AdminModal` - Agents management tab
- `useTools` - Filter available tools by agent's enabledToolIds
