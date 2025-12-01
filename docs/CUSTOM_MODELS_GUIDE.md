# Custom Models Guide

Create personalised AI assistants by wrapping base models with custom system prompts, knowledge, tools, and capabilities. Custom Models let you build specialised versions of AI models tailored to specific tasks or personas.

---

## Quick Start

1. **Open Admin Panel**: Click the menu icon and select Admin Panel
2. **Go to Custom Models tab**: Find it in the left sidebar
3. **Click "New Model"**: Start building your first custom model
4. **Configure and Save**: Set up your model and click Save

---

## What Are Custom Models?

Custom Models are **presets** that wrap existing AI models with additional configuration:

| Feature | Description |
|---------|-------------|
| **System Prompt** | Instructions that define the model's personality and behaviour |
| **Dynamic Variables** | Auto-populated values like current date, user name, etc. |
| **Knowledge Bindings** | Attach document collections for RAG (Retrieval Augmented Generation) |
| **Tool Bindings** | Enable specific tools or MCP servers |
| **Capabilities** | Toggle features like vision, web search, code execution |
| **Prompt Suggestions** | Starter chips to help users begin conversations |

Think of Custom Models as creating a specialised assistant - like having an expert Python tutor, a legal document analyser, or a creative writing coach all using the same underlying AI but configured differently.

---

## Creating a Custom Model

### Step 1: Basic Information

1. Open **Admin Panel > Custom Models**
2. Click **"New Model"**
3. Fill in the basic details:

| Field | Description |
|-------|-------------|
| **Name** | Display name for your model (e.g., "Python Tutor") |
| **Description** | Brief explanation of what this model does |
| **Base Model** | The underlying AI model to use (Claude, GPT-4, etc.) |
| **Avatar** | Icon to identify your model (emoji or image URL) |
| **Colour** | Theme colour for visual identification |

### Step 2: System Prompt

The system prompt is the heart of your custom model. It tells the AI how to behave.

**Example system prompts:**

```
You are a friendly Python tutor. Explain concepts step-by-step with examples.
Always check if the user understands before moving on.
```

```
You are a professional legal document reviewer for New Zealand law.
Focus on clarity, identify potential issues, and suggest improvements.
Never provide actual legal advice - always recommend consulting a lawyer.
```

#### Using Dynamic Variables

Make your prompts smarter with variables that auto-populate:

| Variable | What It Inserts |
|----------|-----------------|
| `{{ CURRENT_DATE }}` | Today's date (1 December 2025) |
| `{{ CURRENT_TIME }}` | Current time (14:30) |
| `{{ CURRENT_DATETIME }}` | Full date and time |
| `{{ USER_NAME }}` | The user's display name |
| `{{ USER_LANGUAGE }}` | User's preferred language |
| `{{ WORKSPACE_NAME }}` | Current workspace name |
| `{{ MODEL_NAME }}` | Name of this custom model |

**Example with variables:**

```
You are {{ MODEL_NAME }}, an AI assistant for {{ USER_NAME }}.
Today is {{ CURRENT_DATE }}. When discussing dates or schedules,
use this as your reference point.
```

### Step 3: Knowledge Bindings

Connect document collections to give your model access to specific information.

1. Go to the **Bindings** tab
2. Toggle on **Knowledge**
3. Select which collections to bind:
   - Company policies
   - Product documentation
   - Research papers
   - Any collections you've created

When a user asks a question, the model will search these collections and include relevant context in its response (RAG).

### Step 4: Tool Bindings

Enable specific tools for your custom model:

1. Go to the **Bindings** tab
2. Toggle on **Tools** or **MCP Servers**
3. Select which tools to enable:
   - Calculator
   - Web search
   - File operations
   - Custom MCP tools

**Note:** Only enable tools the model actually needs. More tools = more complexity.

### Step 5: Capabilities

Toggle advanced features in the **Capabilities** tab:

| Capability | Description |
|------------|-------------|
| **Vision** | Analyse images and screenshots |
| **Web Search** | Search the internet for up-to-date information |
| **Code Interpreter** | Execute code and return results |
| **Image Generation** | Create images from descriptions |
| **File Upload** | Accept file uploads from users |

### Step 6: Inference Parameters (Advanced)

Fine-tune how the model generates responses:

| Parameter | Description | Range |
|-----------|-------------|-------|
| **Temperature** | Creativity vs consistency (lower = more focused) | 0.0 - 2.0 |
| **Top P** | Nucleus sampling threshold | 0.0 - 1.0 |
| **Max Tokens** | Maximum response length | 1 - 128000 |
| **Stop Sequences** | Text that triggers end of response | Custom text |

### Step 7: Prompt Suggestions

Add starter chips that appear when users begin a new conversation:

1. Go to the **Basic** tab
2. Find **Prompt Suggestions**
3. Add helpful starting prompts:
   - "Explain Python decorators"
   - "Review this code for bugs"
   - "Help me debug this error"

Users can click these to quickly start conversations without typing.

---

## Managing Custom Models

### Enabling/Disabling Models

- Use the toggle switch on any model card
- Disabled models won't appear in the model selector

### Editing Models

1. Click the three-dot menu on a model card
2. Select **Edit**
3. Make your changes
4. Click **Save**

### Cloning Models

Want to create a variation? Clone an existing model:

1. Click the three-dot menu
2. Select **Clone**
3. A copy is created with "(Copy)" in the name
4. Edit as needed

### Deleting Models

1. Click the three-dot menu
2. Select **Delete**
3. Confirm deletion

**Warning:** Deletion is permanent. Export first if you want a backup.

---

## Import & Export

### Exporting Models

Share your custom model configurations:

1. Go to **Admin Panel > Custom Models**
2. Click the **Export** button
3. Choose which models to export (or export all)
4. Save the JSON file

The export includes:
- Model configuration
- System prompt
- Capabilities and bindings
- Inference parameters
- Prompt suggestions

**Note:** Knowledge content and actual documents are NOT exported - only the binding references.

### Importing Models

Load custom models from a file:

1. Go to **Admin Panel > Custom Models**
2. Click the **Import** button
3. Select your JSON file
4. Review the models to import
5. Click **Import**

Imported models are added to your existing collection.

---

## Built-In Models

aiMate comes with several pre-configured custom models to get you started:

### Python Tutor

An expert Python programming tutor that explains concepts step-by-step with examples and exercises.

**Best for:** Learning Python, debugging, understanding code

### Meeting Summariser

Transforms meeting notes into structured summaries with action items and key decisions.

**Best for:** Productivity, note-taking, team collaboration

### Research Assistant

Helps analyse sources, synthesise information, and structure research with proper citations.

**Best for:** Academic work, research projects, fact-checking

### Creative Writer

A versatile writing partner for stories, poetry, scripts, and creative content.

**Best for:** Fiction writing, brainstorming, creative projects

### Code Reviewer

Analyses code for bugs, security issues, and improvements with actionable feedback.

**Best for:** Code review, security audits, best practices

---

## Use Cases

### Customer Support Agent

```
Name: Support Agent
System Prompt: You are a friendly customer support agent for [Company].
Use the knowledge base to answer questions accurately.
If you don't know something, say so and offer to escalate.
Always be polite and professional.

Bindings: Company FAQ, Product Documentation, Support Policies
Capabilities: File Upload (for screenshots)
```

### Legal Document Helper

```
Name: Legal Assistant
System Prompt: You are a legal document analysis assistant for NZ law.
Identify key clauses, potential issues, and suggest clarifications.
IMPORTANT: Always remind users to consult a qualified lawyer.

Bindings: NZ Legal Templates, Contract Guidelines
Capabilities: File Upload, Vision (for document images)
```

### Study Buddy

```
Name: Study Buddy - {{ WORKSPACE_NAME }}
System Prompt: You are a study assistant helping {{ USER_NAME }} learn.
Break down complex topics, create flashcards, and quiz the user.
Adapt your explanations to their level of understanding.

Bindings: Course Materials (knowledge collection)
Suggestions: "Quiz me on Chapter 3", "Explain this concept simply", "Create flashcards"
```

---

## Tips & Best Practices

### Writing Effective System Prompts

1. **Be specific**: "You are a Python tutor" is better than "You help with coding"

2. **Set boundaries**: Tell the model what NOT to do as well as what to do

3. **Include format instructions**: "Use bullet points for lists" or "Format code in code blocks"

4. **Add persona details**: Give the model a consistent personality

### Choosing the Right Base Model

| Use Case | Recommended Base Model |
|----------|------------------------|
| General chat | Claude 3.5 Sonnet, GPT-4 |
| Complex reasoning | Claude 3 Opus, GPT-4 Turbo |
| Quick responses | Claude 3 Haiku, GPT-4 Mini |
| Code generation | Claude 3.5 Sonnet, GPT-4 |
| Creative writing | Claude 3 Opus |

### Knowledge Binding Best Practices

1. **Keep collections focused**: One topic per collection works better than everything in one
2. **Update regularly**: Remove outdated documents
3. **Test with real questions**: Make sure the RAG finds relevant content

### When to Use Custom Models vs Base Models

**Use Custom Models when:**
- You repeat the same instructions often
- You need consistent behaviour across sessions
- You want to share a configuration with others
- You need specific knowledge or tools

**Use Base Models when:**
- You need maximum flexibility
- You're experimenting with different approaches
- The task varies significantly each time

---

## Frequently Asked Questions

### Q: Can I share custom models with my team?

**Yes!** Export your model configuration and share the JSON file. Others can import it into their aiMate instance.

### Q: Do custom models cost more to use?

**No.** Custom models use the same underlying base model - they just add configuration. Costs depend on the base model you choose.

### Q: Can I use dynamic variables in prompt suggestions?

**Not currently.** Variables only work in the system prompt. Prompt suggestions are static text.

### Q: What happens if I delete a knowledge collection that's bound to a model?

The binding will show as broken. The model will still work but without that knowledge source. Edit the model to update or remove the binding.

### Q: Can I nest custom models (use one custom model as the base for another)?

**Not directly.** You can clone a model and modify it, but each custom model must use a base AI model, not another custom model.

### Q: How do I reset a custom model to its default state?

Delete it and import it again from your backup, or recreate it from scratch. There's no "reset to default" button.

---

## Troubleshooting

### Model not appearing in selector

- Check if the model is **enabled** (toggle on)
- Check if the model is **hidden** (visibility settings)
- Refresh the page

### Knowledge not being used

- Verify the knowledge collection has documents
- Check that the binding is enabled
- Test the knowledge search separately

### Dynamic variables not working

- Use the exact syntax: `{{ VARIABLE_NAME }}`
- Check spelling (variables are case-sensitive)
- Preview your prompt before saving

### Slow responses

- Check if you have many tools/MCP servers bound (each adds overhead)
- Consider reducing max tokens
- Try a faster base model (e.g., Haiku instead of Opus)

---

## Getting Help

If you have questions about Custom Models:

- Check the **Help & FAQ** in the menu
- Report issues at [github.com/anthropics/claude-code/issues](https://github.com/anthropics/claude-code/issues)

Happy building!
