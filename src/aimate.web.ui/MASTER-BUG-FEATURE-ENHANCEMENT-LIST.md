Bug List for aimate.web.ui

This is the *MASTER* tracking list for /src/aimate.web.ui
Refer to:     /docs/*
                    /docs/api/*

FUTURE FIXES/ENHANCEMENTS/TO IMPLEMENT
    - Plugins
    - Vibe Coding (code_generation_spec.md)
    - Structured Content (Structure_content_spec.md)
    - FULL review of /src/aimate.Api|Shared|Core project for backend/db alignment

| **Real backend connection** | ⚠️ Partial      | Works with direct LM server, backend API stubbed |
| --------------------------- | --------------- | ------------------------------------------------ |
| **Authentication flow**     | ⚠️ Stubbed      | AuthContext exists but login screen not wired    |
| **Database persistence**    | ⚠️ Offline mode | Uses localStorage/mock data, not real backend DB |
| **E2E Testing**             | ❌ Not done      | Listed in Stage 6, no Playwright/Cypress setup   |
| **Accessibility**           | ⚠️ Partial      | Basic ARIA from shadcn, needs keyboard nav       |

EVERYWHERE:
    - Ensure required fields are validated

Admin Panel
    Modal Window
        Status: TODO:   Resize for mobile/desktop
                                    Ensure consistent vertical scrolling
    General
        Status: Complete
    Interface
        Status: TODO:   Fix horizontal width of contents (text boxes/areas)
                                    Discuss: What do we need to implement (Task Model, Title Generation etc)
    Connections
        Status: TODO:   Provider Type - Dropdown?  Do we need it?
                                    Auth - Display input for things like API key, OAUTH details

    Models
        General
            Status: TODO:   Review
        Model Params
            Status: TODO:   Review
                                        Prompts Suggestions
                                        Tools/Filters - dynamic
                                        Actions - Remove for now
        Advanced Params
            Status: TODO:   Ensure they're passed into the chat context

    MCP
        Test connection button
            Status: TODO:   Implement
        General functionality
            Status: TODO:   Check/Review/Implement
        Tooling
            Status: TODO:   Tool List retrieval and authorisation

User Settings
    Modal Window
        Status: TODO:   Resize for mobile/desktop
        Status: TODO:   Ensure consistent vertical scrolling
    General
        Notifications
            Status: TODO:   Default option set to ON
        System Prompt
            Status: TODO:   Check to see it's used
    Interface
        Theme (General)
            Status: TODO:   Check persistence
        Colour Theme
            Status: TODO:   Ensure colour theme flows through to all controls (toggles, etc)
        Chat Display
            Status: TODO:   Ensure options (timestamp, syntax highlighting, markdown) are implemented
                                        Implement additional functionality (code blocks etc)
    Personalisation
        AI Behaviour
            Status: TODO:   Check to see how creativity an response level are used
        Custom Instructions
            Status: TODO:   Check to see it's used (See GENERAL:SYSTEM PROMPT - Are we duplicating?)
        Remember Conversation Context
            Status: TODO:   Check to see it's used

    Account
        Update Profile
            Status: TODO:   Implement mock workflow
        Change Password
            Status: TODO:   Implement mock workflow
        Download My Data
            Status: TODO:   Implement mock workflow
        Subscription
            Status: TODO:   Implement mock workflow
        Danger Zone
            Status: TODO:   Implement mock workflow

    Memories
        Edit Memory
            Status: TODO:

    Usage
        Status: TODO:   Implement mock data
                                    Stuck on loading data

Chat Prompt
    Input
    Attach Content
    Tooling

Chat Messaging
    User
    Assistant
        Status: TODO:   Implement sharing
                                    Fix "Processing" - shows chat bubble before response
    Both
        Status: TODO:   Implement "Add to knowledge"
                                    Review "not implemented"

Top Bar - Right-hand Kebab Menu
    Help and FAQ
        Status: TODO:   Check where this information is stored.
                                    Refer to /HelpSystem
Side Nav
    Search
        Status: TODO:   Implement
    Notes
        Status: Complete - Migrate to Knowledge?
    Knowledge
        Status: TODO:   Full Audit, Integrate Files/Notes?
    Files
        Status: TODO:   Remove as top-level item, integrate with Knowledge

    Projects
        Status: TODO:   Populate for existing Porjects, Allow editing

    Chat List
        Status: TODO:   Ensure all kebab menu functionality works (e.g. Move to Project)
                        Style vertical scroll
