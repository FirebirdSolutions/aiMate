# aiMate.nz Modals, Dialogs & UI Components Guide

## Table of Contents
1. [Overview](#overview)
2. [Settings Modal](#settings-modal)
3. [Admin Modal](#admin-modal)
4. [Knowledge Modal](#knowledge-modal)
5. [Files Modal](#files-modal)
6. [Search Modal](#search-modal)
7. [Notes Modal](#notes-modal)
8. [Project Modal](#project-modal)
9. [Share Dialog](#share-dialog)
10. [Rating Modal](#rating-modal)
11. [Help & About Modals](#help--about-modals)
12. [Edit Dialogs](#edit-dialogs)
13. [Smart Context Panel (Add Context)](#smart-context-panel-add-context)
14. [Base Components](#base-components)

---

## Overview

aiMate.nz features a comprehensive modal and dialog system built with **Radix UI primitives** and **Tailwind CSS**. All modals follow a consistent design language with:

- **Tabbed interfaces** for complex settings
- **Responsive layouts** (mobile + desktop)
- **Dark mode support** throughout
- **Accessibility** (ARIA labels, keyboard navigation)
- **Debug logging** integration
- **Toast notifications** for user feedback

### Modal Architecture

```
BaseModal (Shared wrapper)
├── Title & Description
├── Icon (dynamic)
├── Tab Navigation (optional)
├── Content Area (scrollable)
├── Actions (Save/Delete/Cancel)
└── Debug Logging Integration
```

All modals use the `BaseModal` component for consistency, which handles:
- Layout and sizing
- Tab management
- Save/Cancel/Delete actions
- Debug event logging
- Responsive behavior

---

## Settings Modal

**Purpose**: User preferences and account settings  
**Component**: `SettingsModal.tsx`  
**Trigger**: ⚙️ Settings button in sidebar  
**Icon**: Settings ⚙️

### Tabs Overview (6 Total)

#### 1. **General Tab** 
*Icon: Settings ⚙️*

**WebUI Settings**
- **Language Selection**
  - Options: English (GB), English (US), Spanish, French, German
  - Default: English (GB)
  - Affects: UI labels, date formats, number formatting

- **Notifications**
  - Options: Off, On, Mentions Only
  - Controls: Toast notifications, system alerts
  - Default: On

**System Prompt**
- Large textarea for custom system instructions
- Default: "Your name is Echo and you are an AI assistant, my name is Rich."
- Supports: Multi-line text, markdown formatting
- Used: Prepended to every conversation for AI context

#### 2. **Interface Tab**
*Icon: Palette 🎨*

**Theme Settings**
- **Appearance**
  - Light Mode
  - Dark Mode
  - System (follows OS preference)
  - Real-time theme switching

- **Color Theme**
  - Purple (default) 💜
  - Blue 💙
  - Green 💚
  - Orange 🧡
  - Affects: Accent colors, buttons, highlights

- **Font Size**
  - Small (compact reading)
  - Medium (standard) ← default
  - Large (accessibility)

**Chat Display**
- **Show Timestamps** (toggle)
  - Displays message timestamps in chat
  - Format: "HH:mm" or relative time

- **Syntax Highlighting** (toggle)
  - Enables code block highlighting
  - Supports: 50+ languages
  - Theme: Follows color theme

- **Markdown Support** (toggle)
  - Renders markdown in messages
  - Supports: Headers, lists, bold, italic, links
  - Live preview in chat

#### 3. **Connections Tab**
*Icon: Link2 🔗*

**API Connections**
Configure external service API keys:

- **OpenAI API Key**
  - Input type: Password (masked)
  - Format: `sk-...`
  - Used for: GPT models

- **Anthropic API Key**
  - Input type: Password (masked)
  - Format: `sk-ant-...`
  - Used for: Claude models

- **Ollama Base URL**
  - Input type: URL
  - Default: `http://localhost:11434`
  - Used for: Local models

All API keys are:
- Stored securely in user settings context
- Never logged to debug panel
- Validated on save
- Can be cleared individually

#### 4. **Personalisation Tab**
*Icon: Sparkles ✨*

**AI Behavior**
- **Creativity Level**
  - Precise: Lower temperature, factual responses
  - Balanced: Medium temperature (default)
  - Creative: Higher temperature, imaginative responses

- **Response Style**
  - Concise: Brief, to-the-point answers
  - Balanced: Standard response length (default)
  - Detailed: Comprehensive, thorough explanations

**Custom Instructions**
- **Additional Context** (textarea)
  - Example: "Always respond in a friendly tone, use emojis occasionally..."
  - Appended to system prompt
  - Conversation-wide customization

- **Remember Conversation Context** (toggle)
  - When enabled: AI references previous messages
  - When disabled: Each message is independent
  - Default: Enabled

#### 5. **Account Tab**
*Icon: User 👤*

**Account Information**
- Email address (editable)
- Username (editable)
- "Update Profile" button

**Password Management**
- Current Password field
- New Password field
- Confirm Password field
- "Change Password" button
- Password strength indicator (future)

**Privacy & Data**
- **Allow Analytics** (toggle)
  - Anonymous usage statistics
  - Helps improve the app
  - Default: Enabled

- **Personalization** (toggle)
  - Use data to personalize experience
  - Affects: Model suggestions, UI customization
  - Default: Enabled

- **Download My Data** button
  - Exports all user data
  - Format: JSON
  - Includes: Conversations, settings, usage stats

**Subscription**
- Current plan display (Free/Pro/Enterprise)
- "Upgrade" button
- Feature comparison (future)

**Danger Zone** 🚨
High-risk actions with red styling:
- **Clear All Conversations** - Deletes entire chat history
- **Reset All Settings** - Restores default settings
- **Delete Account** - Permanent account deletion

All require confirmation dialog before execution.

#### 6. **Usage Tab**
*Icon: BarChart3 📊*

**Current Billing Period**
- Start and end dates
- Formatted: "Nov 1, 2025 - Nov 30, 2025" (NZ format)

**Summary Cards**
1. **Total Messages**
   - Count of all messages sent
   - Example: 1,247

2. **Total Tokens**
   - Token usage across all models
   - Displayed: In thousands (e.g., "145.3K")

3. **Total Cost** (highlighted)
   - Cumulative cost in USD
   - Format: $12.45
   - Color: Purple accent for emphasis

**Usage by Model Table**
Columns:
- **Model** - Name with color coding
- **Connection** - Provider (OpenAI, Anthropic, Ollama)
- **Messages** - Count per model
- **Tokens** - Tokens used (in K)
- **Cost** - Cost in USD

Example:
```
Model              Connection   Messages  Tokens   Cost
GPT-4             OpenAI       432       98.2K    $8.12
Claude 3 Sonnet   Anthropic    298       45.1K    $3.67
Llama 3.1         Ollama       517       0.0K     $0.00
```

**View Detailed Analytics** Button
- Opens `UsageDetailsDialog`
- Shows: Charts, graphs, detailed breakdowns
- Export options

---

## Admin Modal

**Purpose**: System-wide administrator settings  
**Component**: `AdminModal.tsx`  
**Trigger**: 🛡️ Admin button in sidebar (admin users only)  
**Icon**: ShieldCheck 🛡️  
**Access**: Requires admin role

### Tabs Overview (11 Total)

#### 1. **General Tab**
*Icon: ShieldCheck 🛡️*

**System Settings**
- **Offline Mode** (toggle)
  - Enables/disables offline mode globally
  - Shows indicator in UI
  - Affects all users

- **Debug Mode** (toggle)
  - System-wide debug logging
  - Performance monitoring
  - Error tracking

- **Debug Settings** (collapsible)
  - Auto-clear logs (toggle)
  - Clear interval (slider: 1-60 minutes)
  - Log level (dropdown: Debug, Info, Warn, Error)
  - Export logs (button)

- **Showcase Mode** (toggle)
  - Hides sensitive data for demos
  - Masks API keys
  - Shows indicator banner

#### 2. **Interface Tab**
*Icon: Layers 📚*

**Global Interface Settings**
- Default theme for new users
- Default color scheme
- Branding customization
- Logo upload
- Custom CSS (future)

#### 3. **Users & Groups Tab**
*Icon: Users 👥*

**User Management**
- User list with roles
- Add/Edit/Delete users
- Role assignment (User, Admin, Super Admin)
- Account status (Active, Suspended, Pending)
- Last login timestamps
- Bulk actions

**Group Management**
- Create groups
- Assign users to groups
- Group permissions
- Resource sharing

#### 4. **Connections Tab**
*Icon: Database 🗄️*

**External Service Connections**

Manage connections to external services. Each connection has:
- **Edit Dialog** - Modify connection settings
- **Test Button** - Verify connection works
- **Status Indicator** - Connected/Disconnected/Error
- **Usage Stats** - Requests made, errors

Supported connections:
- OpenAI
- Anthropic
- Ollama
- Custom API endpoints

**Connection Card Layout**:
```
┌─────────────────────────────────────┐
│ 🔌 OpenAI                   ✅ Active│
│ api.openai.com                      │
│ Models: GPT-4, GPT-3.5-turbo       │
│ Requests: 1,234 | Errors: 2        │
│ [Edit] [Test] [Delete]             │
└─────────────────────────────────────┘
```

#### 5. **Models Tab**
*Icon: BarChart3 📊*

**AI Model Management**

**Model List**
Each model shows:
- Model name and provider
- Enable/Disable toggle
- Configuration button
- Pricing information
- Capabilities

**Model Configuration Options**:
- Temperature range
- Max tokens
- Top P
- Frequency penalty
- Presence penalty
- Stop sequences
- Context window size

**Model Categories**:
- **Text Generation**: GPT-4, Claude, Llama
- **Code**: Codex, Code Llama
- **Vision**: GPT-4V, Claude 3 Opus
- **Embeddings**: text-embedding-ada-002

**Bulk Actions**:
- Enable all
- Disable all
- Import model configs
- Export model configs

#### 6. **Plugins Tab**
*Icon: FileText 📄*

**Plugin System**

List of installed plugins with:
- Plugin name and version
- Description
- Enable/Disable toggle
- Settings button
- Update available indicator
- Uninstall button

**Plugin Store**:
- Browse available plugins
- Search and filter
- Install new plugins
- Update plugins

Example Plugins:
- Code Interpreter
- Web Scraper
- Calculator
- Weather API
- Custom Tools

#### 7. **MCP (Model Context Protocol) Tab**
*Icon: Database 🗄️*

**MCP Server Management**

Configure and manage MCP servers for extended AI capabilities.

**Server List**:
Each MCP server shows:
- Server name and type
- Connection status
- Available tools count
- Configuration button

Example MCP servers:
- GitHub MCP
- Slack MCP
- Notion MCP
- Custom MCP servers

**Add MCP Server**:
- Server URL
- Authentication method
- Available tools preview
- Test connection

#### 8. **Documents Tab**
*Icon: FileText 📄*

**Document Processing Settings**

- **Allowed File Types**
  - PDF, DOCX, TXT, MD, etc.
  - Maximum file size
  - OCR settings for images

- **Document Processing**
  - Chunking strategy
  - Embedding model
  - Vector database settings
  - Indexing frequency

- **Storage**
  - Storage location
  - Retention policy
  - Automatic cleanup

#### 9. **Web Search Tab**
*Icon: Search 🔍*

**Web Search Configuration**

- **Search Provider**
  - Google
  - Bing
  - DuckDuckGo
  - Custom

- **Search Settings**
  - API key configuration
  - Max results per search
  - Safe search filter
  - Result caching duration

- **Domain Restrictions**
  - Allowed domains
  - Blocked domains
  - URL patterns

#### 10. **Code Execution Tab**
*Icon: Code 💻*

**Code Interpreter Settings**

- **Execution Environment**
  - Python version
  - Node.js version
  - Available packages
  - Resource limits (CPU, Memory, Time)

- **Security**
  - Sandbox settings
  - Network access (enabled/disabled)
  - File system access
  - Allowed imports

- **Output**
  - Max output length
  - Timeout settings
  - Error handling

#### 11. **Images Tab**
*Icon: Sparkles ✨*

**Image Generation Settings**

- **Image Providers**
  - DALL-E 3
  - Stable Diffusion
  - Midjourney (future)

- **Generation Settings**
  - Default size (256x256, 512x512, 1024x1024)
  - Default quality
  - Style presets
  - Content moderation

- **Storage**
  - Image storage location
  - Automatic resizing
  - Format conversion
  - CDN integration

---

## Knowledge Modal

**Purpose**: Manage knowledge base, documents, and AI-generated artifacts  
**Component**: `KnowledgeModal.tsx`  
**Trigger**: 🧠 Knowledge button in chat header  
**Icon**: Brain 🧠

### Features

**Main Tabs** (2):
1. **Knowledge Library** - Stored documents and resources
2. **Artifacts** - AI-generated content

### Knowledge Library Tab

**View Modes**:
- Grid view (cards with previews)
- List view (detailed table)

**Item Types**:
- 🌐 **Web** - Saved web pages
- 📄 **PDF** - PDF documents
- 📝 **Document** - Text files, Word docs
- 🎥 **Video** - Video content
- 🎧 **Audio** - Audio files
- 💻 **Code** - Code snippets, repositories
- 🖼️ **Image** - Images with OCR

**Each Knowledge Item Shows**:
```
┌─────────────────────────────────────┐
│ 📄 Machine Learning Guide           │
│ PDF • Nov 15, 2025                  │
│ Tags: AI, Tutorial, Python          │
│ Summary: Comprehensive guide to...  │
│ 📊 Used 12 times • Last: Nov 20     │
│ [View] [Edit] [Delete]              │
└─────────────────────────────────────┘
```

**Search & Filter**:
- **Search bar** - Full-text search across all items
- **Type filter** - Filter by document type
- **Collection filter** - Filter by collection
- **Tag filter** - Multi-select tags
- **Date range** - Filter by upload/update date

**Sort Options**:
- Most Recent
- Most Used
- Alphabetical
- Size
- Date Added

**Bulk Actions**:
- Select multiple items
- Add to collection
- Batch delete
- Export selected
- Share selected

**Collections**:
Color-coded organizational folders:
```
┌───────────────────────────────┐
│ 💜 Machine Learning           │
│ 23 items                      │
└───────────────────────────────┘

┌───────────────────────────────┐
│ 💙 Web Development            │
│ 45 items                      │
└───────────────────────────────┘
```

**Import Options** (+ button):
- 📤 Upload Files
- 🌐 Import from URL
- 📋 Paste Content
- 🔗 Connect GitHub Repo
- 📚 Import from Drive
- 🗂️ Batch Upload

**Smart Features**:
- **Auto-tagging** - AI suggests relevant tags
- **Entity extraction** - Identifies people, places, concepts
- **Summary generation** - Auto-generates summaries
- **Related items** - Shows similar documents
- **Usage tracking** - Tracks when/where used

### Artifacts Tab

**Purpose**: Store and manage AI-generated content

**Artifact Types**:
- 📊 **Analysis** - Data analysis results
- 💻 **Code** - Generated code snippets
- 📝 **Document** - Written content
- 🎨 **Design** - UI/UX artifacts
- 📈 **Chart** - Generated visualizations

**Each Artifact Shows**:
```
┌─────────────────────────────────────┐
│ 📊 API Response Analysis            │
│ Analysis • Nov 3, 2025 • v2         │
│ Tags: API, Performance              │
│ Updated by: Claude 3 Sonnet         │
│ [View] [Edit] [Share] [Delete]     │
└─────────────────────────────────────┘
```

**Versioning**:
- Automatic version tracking
- View version history
- Compare versions
- Restore previous version

**Sharing**:
- Generate shareable link
- Set expiration
- Password protection
- Download as file

---

## Files Modal

**Purpose**: File upload and management for chat attachments  
**Component**: `FilesModal.tsx`  
**Trigger**: 📎 Attach button in chat input  
**Icon**: Paperclip 📎

### Features

**Upload Methods**:
1. **Drag & Drop** - Drop files anywhere in modal
2. **Click to Browse** - Traditional file picker
3. **Paste** - Paste images from clipboard

**Supported File Types**:
- 📄 Documents: PDF, DOCX, TXT, MD
- 🖼️ Images: JPG, PNG, GIF, WebP
- 💻 Code: JS, TS, PY, JSON, etc.
- 📊 Data: CSV, XLSX
- 📦 Archives: ZIP (extracts contents)

**File List View**:
```
┌─────────────────────────────────────────────┐
│ 📄 report.pdf               2.3 MB  [X]     │
│ Uploaded: Nov 15, 2025, 2:34 PM            │
│ [Preview] [Download] [Attach to Message]   │
├─────────────────────────────────────────────┤
│ 🖼️ screenshot.png           456 KB  [X]     │
│ Uploaded: Nov 15, 2025, 2:35 PM            │
│ [Preview] [Download] [Attach to Message]   │
└─────────────────────────────────────────────┘
```

**File Actions**:
- **Preview** - View file content inline
- **Download** - Download to local machine
- **Attach** - Add to current message
- **Delete** - Remove from storage
- **Share** - Get shareable link

**File Preview**:
- **Images**: Full image preview
- **PDFs**: Embedded PDF viewer
- **Text/Code**: Syntax-highlighted code viewer
- **Others**: File metadata and download option

**Attachment to Messages**:
- Files attached to messages show thumbnail
- Can attach multiple files per message
- AI can read and analyze attached files
- Files stored with conversation

**Storage Info**:
- Used storage: 45.3 MB / 5 GB
- Progress bar visualization
- Upgrade prompt when nearing limit

---

## Search Modal

**Purpose**: Search across all conversations and messages  
**Component**: `SearchModal.tsx`  
**Trigger**: Cmd/Ctrl + K keyboard shortcut  
**Icon**: Search 🔍

### Features

**Search Interface**:
```
┌─────────────────────────────────────┐
│ 🔍 Search conversations...          │
└─────────────────────────────────────┘

Filters: [All] [This Week] [Favorites]
Sort: [Relevance] [Date] [Workspace]
```

**Search Scope**:
- **All Conversations** - Search everywhere
- **Current Workspace** - Limit to workspace
- **Specific Date Range** - Time-bound search
- **Tagged Conversations** - Search by tags

**Search Results**:
```
┌─────────────────────────────────────┐
│ 💬 Understanding AI Safety          │
│ Workspace: NZ AI Project            │
│ ...critical safety failures in AI   │
│ models during crisis scenario...    │
│ Nov 15, 2025, 3:45 PM               │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 💬 Crisis Detection Implementation  │
│ Workspace: Development               │
│ ...implementing crisis detection     │
│ with verified NZ resources...       │
│ Nov 10, 2025, 10:22 AM              │
└─────────────────────────────────────┘
```

**Result Information**:
- Conversation title
- Workspace name
- Matching text snippet (highlighted)
- Timestamp
- Click to navigate

**Advanced Search**:
- **Exact phrase** - Use quotes "exact phrase"
- **Exclude words** - Use minus -excluded
- **OR operator** - word1 OR word2
- **Wildcards** - Use * for partial matching

**Search Filters**:
- Workspace
- Date range
- Model used
- Has attachments
- Starred/favorited
- Archived

**Keyboard Navigation**:
- ↑/↓ arrows - Navigate results
- Enter - Open selected conversation
- Esc - Close modal

---

## Notes Modal

**Purpose**: Quick note-taking and context storage  
**Component**: `NotesModal.tsx`  
**Trigger**: 📝 Notes button  
**Icon**: FileText 📝

### Features

**Notes Interface**:
```
┌─────────────────────────────────────┐
│ + New Note                          │
├─────────────────────────────────────┤
│ 📝 Meeting Notes - Nov 15           │
│ Updated 2 hours ago                 │
│ Tags: meeting, planning             │
├─────────────────────────────────────┤
│ 📝 Code Snippets                    │
│ Updated yesterday                   │
│ Tags: code, reference               │
└─────────────────────────────────────┘
```

**Note Editor**:
- Rich text editing
- Markdown support
- Code blocks with syntax highlighting
- Inline images
- Task lists with checkboxes

**Note Metadata**:
- Title (required)
- Tags (multi-select)
- Color label
- Created/updated timestamps
- Attachment to conversations

**Organization**:
- **Search notes** - Full-text search
- **Filter by tags** - Multi-tag filter
- **Sort options** - Recent, Alphabetical, Modified
- **Pin important** - Pinned notes at top

**Attach to Conversation**:
- Notes can be attached to chat messages
- Appears in "Attached Context" panel
- AI can reference note content
- Bi-directional linking

**Sharing**:
- Copy note as markdown
- Export individual notes
- Share via link
- Collaborate (future)

---

## Project Modal

**Purpose**: Organize conversations into projects  
**Component**: `ProjectModal.tsx`  
**Trigger**: 🗂️ Projects button  
**Icon**: FolderOpen 🗂️

### Features

**Project List**:
```
┌─────────────────────────────────────┐
│ 🗂️ aiMate Development               │
│ 12 conversations • Active           │
│ Last updated: Today, 2:30 PM        │
├─────────────────────────────────────┤
│ 🗂️ Client Work                      │
│ 8 conversations • Archived          │
│ Last updated: Nov 10, 2025          │
└─────────────────────────────────────┘
```

**Project Details**:
- Project name and description
- Associated conversations
- Team members (future)
- Status (Active, Archived, On Hold)
- Tags and labels
- Created/updated dates

**Project Actions**:
- Create new project
- Edit project details
- Add/remove conversations
- Archive project
- Delete project
- Export all conversations

**Project Organization**:
- Drag-drop conversations into projects
- Multi-project support (conversation in multiple projects)
- Nested projects (sub-projects)
- Color coding

---

## Share Dialog

**Purpose**: Share conversations with others  
**Component**: `ShareDialog.tsx`  
**Trigger**: Share button in conversation header  
**Icon**: Share2 📤

### Features

**Sharing Options**:

1. **Public Link**
   ```
   ┌───────────────────────────────────┐
   │ 🔗 Share Link                     │
   │                                   │
   │ https://aimate.nz/s/abc123xyz     │
   │ [Copy Link]                       │
   └───────────────────────────────────┘
   ```

   Settings:
   - Expiration (Never, 1 hour, 24 hours, 7 days, 30 days)
   - Password protection (optional)
   - Allow comments (toggle)
   - View-only or allow download

2. **Export Conversation**
   - Format: JSON, Markdown, PDF, HTML
   - Include: Messages, attachments, metadata
   - Options: With/without system messages

3. **Email Share**
   - Enter recipient email
   - Add message
   - Send as link or attachment

**Share Settings**:
- **Who can access**
  - Anyone with link
  - Specific people (email list)
  - Team members only

- **Permissions**
  - View only
  - Can comment
  - Can edit (future)

**Share Analytics** (future):
- View count
- Unique visitors
- Time spent viewing
- Comments/reactions

---

## Rating Modal

**Purpose**: Rate and provide feedback on AI responses  
**Component**: `RatingModal.tsx`  
**Trigger**: 👍/👎 buttons on messages  
**Icon**: Star ⭐

### Features

**Rating Interface**:
```
┌─────────────────────────────────────┐
│ How would you rate this response?   │
│                                     │
│ ⭐⭐⭐⭐⭐                            │
│                                     │
│ What went well? (optional)          │
│ ┌─────────────────────────────────┐ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ What could be improved?             │
│ ┌─────────────────────────────────┐ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Quick Tags]                        │
│ ☑️ Accurate  ☐ Helpful  ☐ Clear   │
│ ☐ Creative  ☐ Concise  ☐ Friendly │
│                                     │
│ [Cancel]          [Submit Rating]   │
└─────────────────────────────────────┘
```

**Rating Options**:
- 5-star rating system
- Text feedback (optional)
- Quick tags for common feedback
- Attach screenshot (optional)

**Feedback Categories**:
- Accuracy
- Helpfulness
- Clarity
- Creativity
- Tone
- Length

**Post-Submission**:
- Thank you message
- Option to elaborate further
- See aggregated feedback (admin)
- Contribute to model improvement

---

## Help & About Modals

### Help Modal
**Component**: `HelpModal.tsx`  
**Icon**: HelpCircle ❓

**Content**:
- Getting Started Guide
- Keyboard Shortcuts
- FAQ (searchable)
- Video Tutorials
- Documentation Links
- Contact Support

**Keyboard Shortcuts Table**:
```
┌─────────────────────────────────────┐
│ General                             │
│ Cmd/Ctrl + K    Open Search         │
│ Cmd/Ctrl + N    New Conversation    │
│ Cmd/Ctrl + ,    Open Settings       │
│                                     │
│ Chat                                │
│ Cmd/Ctrl + Enter    Send Message    │
│ Shift + Enter       New Line        │
│ Esc                 Clear Input     │
└─────────────────────────────────────┘
```

### About Modal
**Component**: `AboutModal.tsx`  
**Icon**: Info ℹ️

**Content**:
- App name and version
- Logo and branding
- Mission statement
- Credits and attributions
- License information
- Links to GitHub, docs, etc.

**aiMate.nz Specific**:
```
┌─────────────────────────────────────┐
│ aiMate.nz                           │
│ Version 1.0.0                       │
│                                     │
│ A sovereign AI platform for         │
│ New Zealanders                      │
│                                     │
│ Built with ❤️ for NZ               │
│                                     │
│ Safety First • Privacy Focused      │
│ Crisis Detection • Verified Resources│
│                                     │
│ [GitHub] [Documentation] [Support]  │
└─────────────────────────────────────┘
```

---

## Edit Dialogs

Small focused dialogs for editing specific items.

### Connection Edit Dialog
**Component**: `ConnectionEditDialog.tsx`  
**Purpose**: Edit API connection settings

**Fields**:
- Connection name
- Base URL
- API key (masked)
- Connection type (OpenAI, Anthropic, Ollama, Custom)
- Timeout settings
- Request headers (advanced)

**Actions**:
- Test Connection
- Save
- Cancel

### Model Edit Dialog
**Component**: `ModelEditDialog.tsx`  
**Purpose**: Configure AI model settings

**Configuration**:
- Model display name
- Provider selection
- Model ID (technical identifier)
- **Temperature** (0.0 - 2.0 slider)
- **Max Tokens** (number input)
- **Top P** (0.0 - 1.0 slider)
- **Frequency Penalty** (-2.0 to 2.0)
- **Presence Penalty** (-2.0 to 2.0)
- **Stop Sequences** (multi-input)

**Advanced**:
- Context window size
- Pricing per 1K tokens
- Rate limits
- Model capabilities (checkboxes)

### MCP Edit Dialog
**Component**: `MCPEditDialog.tsx`  
**Purpose**: Configure MCP server connection

**Settings**:
- Server URL
- Authentication type (None, API Key, OAuth)
- Available tools (list with enable/disable)
- Tool parameters
- Timeout settings

### Plugin Edit Dialog
**Component**: `PluginEditDialog.tsx`  
**Purpose**: Configure plugin settings

**Configuration**:
- Plugin name
- Enable/disable toggle
- Plugin-specific settings (dynamic form)
- Permissions required
- Update settings

---

## Smart Context Panel (Add Context)

**Component**: `AttachedContext.tsx`  
**Location**: Above chat input, collapsible  
**Icon**: Brain 🧠

### Overview

The **Smart Context Panel** is an innovative feature that allows users to attach various types of context to their conversations, making AI responses more informed and relevant. It's a collapsible, always-accessible panel that sits just above the chat input.

### Visual Design

```
┌─────────────────────────────────────────────────────┐
│ 🧠 Smart Context                        3 attached ▼│
├─────────────────────────────────────────────────────┤
│ [💜 ML Basics] [💙 Meeting Notes] [💚 data.csv] [X]│
└─────────────────────────────────────────────────────┘
```

When collapsed:
```
🧠 Smart Context    3 attached ▶
```

### Supported Context Types

The panel supports **5 different context types**, each with unique styling:

#### 1. **Knowledge Items** 🧠
- **Color**: Purple
- **Icon**: Brain
- **Source**: Knowledge Modal
- **Use Cases**: 
  - Attach research papers
  - Reference documentation
  - Include learning materials
- **Example**: "ML Basics.pdf", "API Documentation"

#### 2. **Notes** 📝
- **Color**: Blue
- **Icon**: FileText
- **Source**: Notes Modal
- **Use Cases**:
  - Meeting notes for context
  - Quick references
  - Custom instructions
- **Example**: "Meeting Notes - Nov 15", "Code Review Checklist"

#### 3. **Files** 📎
- **Color**: Green
- **Icon**: File
- **Source**: Files Modal
- **Use Cases**:
  - Data files for analysis
  - Images for discussion
  - Code files for review
- **Example**: "data.csv", "screenshot.png", "app.tsx"

#### 4. **Webpages** 🌐
- **Color**: Cyan
- **Icon**: Globe
- **Source**: Import from URL
- **Use Cases**:
  - Reference external resources
  - Current news articles
  - Documentation pages
- **Example**: "React Docs", "News Article", "GitHub Issue"

#### 5. **Chat Conversations** 💬
- **Color**: Orange
- **Icon**: MessageSquare
- **Source**: Previous conversations
- **Use Cases**:
  - Continue previous discussions
  - Reference past solutions
  - Build on earlier context
- **Example**: "Crisis Detection Chat", "Code Review - Nov 10"

### Badge Design

Each attached item appears as a **colored badge** with:

```
┌────────────────────────┐
│ 🧠 ML Basics Guide  [X]│
└────────────────────────┘
```

**Badge Components**:
1. **Icon** - Type-specific icon (colored)
2. **Title** - Truncated to 200px max
3. **Remove Button** - X icon to detach
4. **Color Coding** - Background, text, and border match type

**Hover Effect**:
- Remove button darkens
- Entire badge slightly lifts (shadow)
- Cursor changes to pointer

### Interaction Flow

#### Adding Context

1. **From Knowledge Modal**:
   ```
   User clicks 🧠 Knowledge button
   → Browses knowledge items
   → Clicks "Attach to Chat" on item
   → Item appears in Smart Context Panel
   ```

2. **From Notes Modal**:
   ```
   User clicks 📝 Notes button
   → Selects a note
   → Clicks "Attach to Current Conversation"
   → Note badge added to panel
   ```

3. **From Files Modal**:
   ```
   User uploads/selects file
   → Clicks "Attach to Message"
   → File badge appears in panel
   ```

4. **From Previous Chat**:
   ```
   User in conversation sidebar
   → Right-clicks conversation
   → Selects "Use as Context"
   → Chat badge added to panel
   ```

#### Removing Context

```
User clicks X on badge
→ Badge fades out
→ Item removed from context
→ Count updates
→ Panel collapses if empty
```

### Collapsible Behavior

**Header Always Visible**:
- Shows "Smart Context" label with brain icon
- Displays count of attached items
- Toggle arrow (▼ when open, ▶ when closed)

**Open State**:
- Shows all attached badges
- Badges wrap to multiple lines if needed
- Background: Light gray (light mode) / Dark gray (dark mode)
- Border: Subtle rounded border

**Closed State**:
- Only header visible (single line)
- Saves vertical space
- Count still visible
- Click anywhere to expand

**Auto-Collapse**:
- Collapses when no items attached
- Re-opens when first item added
- Remembers user preference (localStorage)

### Technical Implementation

**State Management**:
```typescript
interface AttachedContextState {
  attachedKnowledge: string[];  // IDs of knowledge items
  attachedNotes: string[];      // IDs of notes
  attachedFiles: string[];      // IDs of files
  attachedWebpages: string[];   // IDs of webpages
  attachedChats: string[];      // IDs of conversations
  isOpen: boolean;              // Collapse state
}
```

**Props Interface**:
```typescript
interface AttachedContextProps {
  // Attached IDs
  attachedKnowledge: string[];
  attachedNotes: string[];
  attachedFiles: string[];
  attachedChats: string[];
  attachedWebpages: string[];
  
  // Full item data for display
  knowledgeItems: KnowledgeItem[];
  noteItems: NoteItem[];
  fileItems: FileItem[];
  chatItems: Conversation[];
  webpageItems: WebpageItem[];
  
  // Detach callbacks
  onDetachKnowledge: (id: string) => void;
  onDetachNote: (id: string) => void;
  onDetachFile: (id: string) => void;
  onDetachChat: (id: string) => void;
  onDetachWebpage: (id: string) => void;
}
```

**Badge Rendering Logic**:
```typescript
const getTypeConfig = (type) => {
  switch (type) {
    case 'knowledge':
      return {
        icon: Brain,
        colorClass: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700',
        iconColor: 'text-purple-600'
      };
    case 'note':
      return {
        icon: FileText,
        colorClass: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700',
        iconColor: 'text-blue-600'
      };
    // ... other types
  }
};
```

### Use Cases & Benefits

#### 1. **Research & Analysis**
```
Attach:
- 🧠 Research papers
- 📎 Data files
- 🌐 Reference websites

Ask:
"Analyze this data in the context of the research papers"
```

#### 2. **Code Review**
```
Attach:
- 📎 source.tsx
- 📝 Code review checklist
- 💬 Previous review conversation

Ask:
"Review this code following our checklist and past feedback"
```

#### 3. **Meeting Preparation**
```
Attach:
- 📝 Last meeting notes
- 🧠 Project documentation
- 📎 Presentation slides

Ask:
"Help me prepare for tomorrow's meeting"
```

#### 4. **Learning & Education**
```
Attach:
- 🧠 Tutorial document
- 🌐 Official documentation
- 📝 My learning notes

Ask:
"Explain this concept based on the materials"
```

### Smart Features

#### Context Awareness
The AI automatically:
- Reads all attached context before responding
- References specific attachments in answers
- Suggests relevant attachments from knowledge base
- Indicates which context was most useful

#### Context Suggestions
```
┌─────────────────────────────────────┐
│ 💡 Suggested Context                │
│                                     │
│ This conversation might benefit from:│
│ • 🧠 "AI Safety Guidelines"         │
│ • 📝 "Crisis Detection Notes"       │
│                                     │
│ [Attach Suggested]  [Dismiss]       │
└─────────────────────────────────────┘
```

#### Context Relevance Scoring (Future)
- Shows which attachments were used in response
- Highlights most relevant sections
- Suggests removing unused context

### Persistence

**Context Persistence**:
- Attached context saved with conversation
- Reloads when conversation reopened
- Synced across devices
- Included in conversation exports

**Smart Defaults**:
- Remember frequently used combinations
- Auto-attach based on conversation topic
- Workspace-specific default context

### Keyboard Shortcuts

```
Cmd/Ctrl + Shift + K  →  Toggle Knowledge attachment
Cmd/Ctrl + Shift + N  →  Toggle Notes attachment
Cmd/Ctrl + Shift + F  →  Toggle Files attachment
Cmd/Ctrl + Shift + C  →  Open context panel
Esc (in panel)        →  Collapse panel
```

### Mobile Experience

On mobile devices:
- Panel appears above keyboard
- Horizontal scroll for many badges
- Swipe to remove badges
- Tap to expand/collapse
- Optimized touch targets (48px minimum)

### Accessibility

- **Keyboard Navigation**: Tab through badges, Space/Enter to remove
- **Screen Readers**: Announces count, type, and title of each item
- **ARIA Labels**: Proper labeling for all interactive elements
- **Focus Management**: Clear focus indicators
- **Color Independence**: Icons + text, not color alone

---

## Base Components

### BaseModal
**Component**: `BaseModal.tsx`  
**Purpose**: Shared modal wrapper for consistent behavior

**Props**:
```typescript
interface BaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  icon?: React.ComponentType;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  tabs?: TabConfig[];
  children?: React.ReactNode;
  onSave?: () => void;
  onDelete?: () => void;
  showSave?: boolean;
  showDelete?: boolean;
}
```

**Features**:
- Consistent layout across all modals
- Automatic debug logging
- Keyboard shortcuts (Esc to close)
- Responsive sizing
- Dark mode support
- Loading states
- Error boundaries

**Sizes**:
- `sm`: 400px max width
- `md`: 600px max width (default)
- `lg`: 800px max width
- `xl`: 1000px max width

### BaseDialog
**Component**: `BaseDialog.tsx`  
**Purpose**: Smaller dialogs for focused tasks

**Differences from BaseModal**:
- Smaller default size
- No tabs support
- Simpler layout
- Faster animations
- Used for confirmations and quick edits

---

## Design System

### Color Coding

All modals follow consistent color coding:

**Context Types**:
- 💜 **Purple** - Knowledge, AI-related
- 💙 **Blue** - Notes, documentation
- 💚 **Green** - Files, uploads
- 🧡 **Orange** - Conversations, chats
- 💙 **Cyan** - Web, external links

**Status Colors**:
- ✅ **Green** - Success, active, connected
- 🟡 **Yellow** - Warning, pending
- 🔴 **Red** - Error, danger, delete
- ⚪ **Gray** - Inactive, disabled

### Typography

**Headings**:
- Modal Title: 1.5rem, font-semibold
- Tab Labels: 0.875rem, font-medium
- Section Headers: 1.125rem, font-semibold

**Body Text**:
- Primary: 0.875rem, font-normal
- Secondary (descriptions): 0.75rem, text-gray-500
- Monospace (code, IDs): font-mono, 0.8125rem

### Spacing

**Modal Padding**:
- Header: 1.5rem
- Content: 1.5rem
- Footer: 1rem

**Internal Spacing**:
- Between sections: 1.5rem
- Between fields: 1rem
- Between labels and inputs: 0.5rem

### Animations

**Modal Entrance**:
- Fade in: 200ms
- Scale from 95% to 100%
- Overlay fade: 150ms

**Badge Interactions**:
- Hover lift: 2px translate
- Remove fade: 150ms
- Color transitions: 200ms

### Responsive Behavior

**Desktop (>768px)**:
- Full modal width
- Side-by-side layouts
- Multi-column grids
- Hover states active

**Tablet (768px - 1024px)**:
- Slightly reduced padding
- 2-column grids become 1-column
- Larger touch targets

**Mobile (<768px)**:
- Full-screen modals
- Single column layouts
- Bottom sheets for quick actions
- Swipe gestures enabled
- Larger fonts and buttons

---

## Keyboard Shortcuts Summary

```
GLOBAL SHORTCUTS
Cmd/Ctrl + K         Open Search Modal
Cmd/Ctrl + ,         Open Settings Modal
Cmd/Ctrl + N         New Conversation
Cmd/Ctrl + Shift + A  Open Admin Panel (admin only)

MODAL SHORTCUTS
Esc                  Close Modal/Dialog
Tab                  Navigate fields
Shift + Tab          Navigate backward
Enter                Submit/Save (when applicable)
Cmd/Ctrl + S         Save (in modals)

CONTEXT PANEL
Cmd/Ctrl + Shift + K  Attach Knowledge
Cmd/Ctrl + Shift + N  Attach Note
Cmd/Ctrl + Shift + F  Attach File
Cmd/Ctrl + Shift + C  Toggle Context Panel

CHAT SHORTCUTS
Cmd/Ctrl + Enter     Send Message
Shift + Enter        New Line
Cmd/Ctrl + /         Show Help
```

---

## Debug Integration

All modals automatically log to the debug panel:

**Events Logged**:
1. **Modal Open** - When modal is opened
   ```
   [INFO] Settings Modal opened
   api/v1/GetUserSettings
   ```

2. **Settings Changed** - When settings are modified
   ```
   [INFO] Theme changed to: dark
   api/v1/settings/interface
   Payload: { theme: "dark" }
   ```

3. **Modal Save** - When changes are saved
   ```
   [SUCCESS] Settings Saved
   api/v1/SaveUserSettings
   ```

4. **Errors** - When something goes wrong
   ```
   [ERROR] Failed to save settings
   api/v1/SaveUserSettings
   Error: Network timeout
   ```

**Debug Panel Access**:
- Enable in Admin > General > Debug Mode
- View in sidebar debug button
- Auto-clear option available
- Export logs to JSON

---

## Toast Notifications

All modals use consistent toast notifications:

**Success Toasts** (green):
- "Settings saved!"
- "File uploaded successfully"
- "Conversation shared"

**Error Toasts** (red):
- "Failed to save settings"
- "Upload failed"
- "Connection error"

**Info Toasts** (blue):
- "Copying to clipboard..."
- "Loading..."

**Warning Toasts** (yellow):
- "Changes not saved"
- "Approaching storage limit"

**Toast Position**: Bottom-right (desktop), Top-center (mobile)  
**Duration**: 3 seconds (dismissible)

---

## Future Enhancements

### Planned Features

1. **Collaboration**
   - Real-time co-editing in modals
   - Shared workspaces
   - Live presence indicators
   - Comments and annotations

2. **AI Assistance**
   - AI-powered search suggestions
   - Auto-categorization in Knowledge Modal
   - Smart tag suggestions
   - Context recommendations

3. **Advanced Analytics**
   - Usage heatmaps
   - Performance metrics
   - Cost optimization insights
   - Model comparison charts

4. **Enhanced Sharing**
   - Granular permissions
   - Conversation templates
   - Public showcase gallery
   - Embed code generation

5. **Integration Plugins**
   - Google Drive integration
   - Dropbox sync
   - Notion export
   - Slack notifications

---

## Conclusion

The aiMate.nz modal and dialog system provides a comprehensive, user-friendly interface for managing all aspects of the AI platform. The **Smart Context Panel** in particular represents an innovative approach to giving users fine-grained control over the context provided to AI models, resulting in more relevant and accurate responses.

All components follow consistent design patterns, accessibility standards, and include robust debug logging for troubleshooting. The system is built to scale with future features while maintaining a clean, intuitive user experience.

---

**Version**: 1.0.0  
**Last Updated**: November 2025  
**Maintained By**: aiMate Development Team
