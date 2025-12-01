# Agent Presets - User Guide

> Quickly switch between AI personas for different tasks.

## What are Agent Presets?

Agent Presets are pre-configured AI personalities. Each agent has its own:
- **System prompt** - Instructions that shape the AI's behavior
- **Temperature** - How creative vs precise the responses are
- **Tool access** - Which MCP tools the agent can use
- **Knowledge** - Documents the agent can reference

## Quick Start

### Switching Agents

1. Click the **agent button** in the chat header (shows current agent icon + name)
2. Select an agent from the dropdown
3. Start chatting - the AI now uses that agent's configuration

### Built-in Agents

| Agent | Best For | Style |
|-------|----------|-------|
| 🤖 **General Assistant** | Everyday tasks | Balanced |
| 🔍 **Code Reviewer** | Code review, bug finding | Precise |
| 📚 **Research Assistant** | Information gathering | Thorough |
| 📊 **Data Analyst** | Data insights, patterns | Analytical |
| ✍️ **Creative Writer** | Stories, content | Creative |

## Creating Custom Agents

1. Go to **Admin Panel** (⋮ menu → Settings → Admin)
2. Click the **Agents** tab
3. Click **Create Agent**
4. Configure:
   - **Name & Description** - What this agent does
   - **Icon & Color** - Visual identity
   - **System Prompt** - Instructions for the AI
   - **Tools** - Which MCP tools to enable
   - **Parameters** - Temperature and response length

### Tips for System Prompts

Good system prompts are:
- **Specific** - "You are a Python expert" vs "You are helpful"
- **Instructional** - Tell the AI *how* to respond
- **Contextual** - Include relevant domain knowledge

Example:
```
You are a senior code reviewer. When reviewing code:
1. Check for bugs and edge cases
2. Identify security vulnerabilities
3. Suggest performance improvements
4. Be constructive, not critical
```

## Managing Agents

### Enable/Disable
Toggle the switch next to any agent to show/hide it in the selector.

### Duplicate
Click the copy icon to create a copy of any agent (including built-ins) for customization.

### Import/Export
- **Export** - Save your custom agents as JSON for backup or sharing
- **Import** - Load agents from a JSON file

### Delete
Custom agents can be deleted. Built-in agents can only be disabled.

## How Agents Affect Chat

When you send a message, aiMate uses:

1. **Agent's system prompt** (first priority)
2. **Your custom system prompt** from Settings (combined)
3. **Agent's temperature** setting
4. **Agent's max tokens** setting
5. **Agent's attached knowledge** (merged with your attachments)

This means you can have a base system prompt in Settings that applies to all agents, while each agent adds its specialized instructions.

## FAQ

**Q: Do agents remember previous conversations?**
A: Agents apply to the current chat session. Switching agents mid-conversation changes how the AI responds going forward.

**Q: Can I use different agents for different conversations?**
A: Yes! Each time you switch agents, it applies to your current/next messages. Different chats can use different agents.

**Q: What's the difference between temperature settings?**
A: Lower (0.0-0.3) = more precise, deterministic. Higher (0.7-1.0) = more creative, varied.

**Q: Why can't I delete built-in agents?**
A: Built-in agents are system defaults. You can disable them or duplicate and customize them.
