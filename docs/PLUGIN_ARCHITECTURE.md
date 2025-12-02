# aiMate Plugin Architecture

## Overview

The aiMate plugin system provides a flexible architecture for extending functionality through composable plugins. Plugins can intercept the request/response cycle, add UI actions, and modify message rendering.

## Core Concepts

### Plugin Definition

```typescript
interface PluginDefinition {
  id: string;           // Unique identifier (kebab-case)
  name: string;         // Display name
  version: string;      // Semantic version
  description: string;  // Brief description
  author?: string;      // Plugin author
  enabled: boolean;     // Is plugin active

  // Hook registrations
  hooks?: {
    beforeRequest?: Array<(request, ctx) => request>;
    afterResponse?: Array<(response, ctx) => response>;
    messageRender?: Array<(message, ctx) => PluginAction[]>;
  };

  // Message actions (buttons under messages)
  messageActions?: PluginAction[];

  // Plugin configuration
  settings?: Record<string, any>;
}
```

### Hook Points

| Hook | Trigger | Use Cases |
|------|---------|-----------|
| `beforeRequest` | Before message sent to LM | Modify prompts, add context, filter content |
| `afterResponse` | After LM response received | Transform output, add metadata, trigger actions |
| `messageRender` | When rendering a message | Add dynamic actions, modify display |

### Plugin Actions

Actions appear as buttons/icons under messages:

```typescript
interface PluginAction {
  id: string;           // Unique action ID
  label: string;        // Tooltip/button text
  icon?: string;        // Lucide icon name
  onClick: (ctx) => void | Promise<void>;
  condition?: (ctx) => boolean;  // When to show action
}
```

### Plugin Context

Context passed to all hooks and actions:

```typescript
interface PluginContext {
  messageId?: string;
  messageContent?: string;
  messageRole?: 'user' | 'assistant' | 'system';
  conversationId?: string;
  workspaceId?: string;

  // Callback functions (when available)
  onRegenerate?: () => void;
  onContinue?: () => void;
  onEdit?: (content: string) => void;

  // Extensible - plugins can add their own context
  [key: string]: any;
}
```

## Creating a Plugin

### 1. Basic Structure

```typescript
const myPlugin: PluginDefinition = {
  id: 'my-plugin',
  name: 'My Plugin',
  version: '1.0.0',
  description: 'Does something useful',
  author: 'Your Name',
  enabled: true,

  messageActions: [
    {
      id: 'my-action',
      label: 'Do Something',
      icon: 'Sparkles',
      onClick: async (ctx) => {
        console.log('Action triggered!', ctx);
      },
    },
  ],
};
```

### 2. Using Hooks

```typescript
const processingPlugin: PluginDefinition = {
  id: 'processing-plugin',
  name: 'Processing Plugin',
  version: '1.0.0',
  description: 'Processes requests and responses',
  enabled: true,

  hooks: {
    // Modify request before sending to LM
    beforeRequest: [
      (request, ctx) => {
        return {
          ...request,
          messages: [
            { role: 'system', content: 'Always be helpful.' },
            ...request.messages,
          ],
        };
      },
    ],

    // Process response after receiving from LM
    afterResponse: [
      (response, ctx) => {
        // Add metadata, log, transform, etc.
        console.log('Response received:', response);
        return response;
      },
    ],
  },
};
```

### 3. Conditional Actions

```typescript
messageActions: [
  {
    id: 'code-action',
    label: 'Run Code',
    icon: 'Play',
    onClick: (ctx) => executeCode(ctx.codeContent),
    // Only show when message contains code
    condition: (ctx) => ctx.hasCodeBlock === true,
  },
],
```

## Built-in Plugins

### Message Actions (id: `message-actions`)
Core message interactions:
- **Copy** - Copy message to clipboard
- **Feedback** - Thumbs up/down for AI responses
- **Regenerate** - Request new response
- **Continue** - Ask AI to continue

### Code Highlighting (id: `code-highlight`)
Enhanced code block features:
- **Copy Code** - Copy code block content
- Syntax highlighting (via parent component)

### Text to Speech (id: `text-to-speech`)
Read messages aloud using browser speech synthesis:
- **Read Aloud** - Start speaking the message
- **Stop** - Stop current speech
- Settings: voice, rate, pitch

### Export (id: `export`)
Export messages in various formats:
- **Copy as Markdown** - Copy with role prefix
- **Share** - Native share dialog (with clipboard fallback)

### Bookmarks (id: `bookmarks`)
Save important messages:
- **Save to Knowledge** - Save assistant responses to knowledge base

### Structured Content (id: `structured-content`)
Parse and render rich structured content from AI responses:
- **Export Data** - Export as JSON
- **Export as CSV** - Export table data as CSV
- **View Raw JSON** - Copy raw structured data

Supports content types: tables, key-value lists, cards, charts, code blocks, file trees.

See [STRUCTURED_CONTENT_SPEC.md](/docs/STRUCTURED_CONTENT_SPEC.md) for full specification.

### Translation (id: `translation`) [Disabled by default]
Translate messages to different languages:
- **Translate** - Translate message content
- Settings: targetLanguage, apiKey

### Web Search (id: `web-search`) [Disabled by default]
Search the web for information:
- **Search Web** - Open search for message content
- Can inject search results into context (beforeRequest hook)

## Plugin Ideas for Implementation

### High Priority

| Plugin | Description | Hooks Used |
|--------|-------------|------------|
| **Text-to-Speech** | Read messages aloud | `messageActions` |
| **Translation** | Translate messages | `beforeRequest`, `messageActions` |
| **Web Search** | Search and inject context | `beforeRequest` |
| **Export** | Export conversations | `messageActions` |
| **Memory** | Extract and save facts | `afterResponse` |

### Medium Priority

| Plugin | Description | Hooks Used |
|--------|-------------|------------|
| **Summarization** | Summarize conversations | `messageActions` |
| **Citation** | Add source references | `afterResponse` |
| **Auto-tagging** | Tag conversations | `afterResponse` |
| **Keyboard Shortcuts** | Custom hotkeys | UI hooks |
| **LaTeX Rendering** | Math equations | `messageRender` |

### Future Considerations

| Plugin | Description |
|--------|-------------|
| **Image Generation** | DALL-E, Stable Diffusion integration |
| **Code Execution** | Sandboxed code runner |
| **Voice Input** | Speech-to-text |
| **Themes** | Custom UI themes |
| **Analytics** | Usage statistics |

## Hook Execution Order

1. Hooks execute in plugin registration order
2. Within a plugin, hooks execute in array order
3. Each hook receives output from previous hook
4. Errors in one hook don't stop other hooks

```
Request Flow:
  User Input
      ↓
  beforeRequest (plugin 1) → beforeRequest (plugin 2) → ...
      ↓
  Send to LM
      ↓
  afterResponse (plugin 1) → afterResponse (plugin 2) → ...
      ↓
  Render Message
```

## Best Practices

### Do's
- Keep plugins focused on single responsibility
- Use meaningful, unique IDs
- Provide clear descriptions
- Handle errors gracefully
- Use conditions to hide irrelevant actions

### Don'ts
- Don't block the UI with long operations
- Don't modify global state directly
- Don't assume context properties exist
- Don't hard-code user preferences

## Settings Management

Plugins can define settings:

```typescript
const settingsPlugin: PluginDefinition = {
  id: 'settings-example',
  // ...
  settings: {
    apiKey: '',
    maxResults: 5,
    language: 'en',
  },
};
```

Update settings via hook:
```typescript
const { updatePluginSettings } = usePlugins();
updatePluginSettings('settings-example', { maxResults: 10 });
```

## Future Architecture

### Planned Features
1. **Plugin Marketplace** - Browse and install community plugins
2. **Sandboxed Execution** - Isolated plugin runtime
3. **Plugin Dependencies** - Declare required plugins
4. **UI Extension Points** - Sidebar, header, settings panels
5. **Event System** - Subscribe to app-wide events

### Extension Points (Roadmap)

```typescript
interface PluginExtensionPoints {
  // Current
  messageActions: PluginAction[];
  hooks: PluginHooks;

  // Planned
  sidebarPanels?: SidebarPanel[];
  settingsPanels?: SettingsPanel[];
  commands?: Command[];  // Slash commands
  contextMenus?: ContextMenu[];
  themes?: Theme[];
}
```

## API Reference

### usePlugins Hook

```typescript
const {
  // State
  plugins,           // All registered plugins
  enabledPlugins,    // Only enabled plugins

  // Management
  enablePlugin,      // Enable by ID
  disablePlugin,     // Disable by ID
  updatePluginSettings, // Update settings

  // Execution
  runBeforeRequest,  // Run beforeRequest hooks
  runAfterResponse,  // Run afterResponse hooks

  // Actions
  getMessageActions, // Get actions for context
  executeAction,     // Execute action by ID
} = usePlugins();
```

## Contributing Plugins

1. Create plugin definition in `src/hooks/usePlugins.ts`
2. Add to `BUILTIN_PLUGINS` array
3. Test with various message types
4. Document in this file
5. Submit PR

For community plugins (future):
1. Create standalone package
2. Export PluginDefinition
3. Submit to plugin registry
