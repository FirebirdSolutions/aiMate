-- Migration: Add CodeSnippets table for code artifacts
-- Date: 2025-01-18
-- Description: Store user code snippets/artifacts that can be saved and reused in CodeMate

CREATE TABLE "CodeSnippets" (
    "Id" uuid PRIMARY KEY,
    "UserId" uuid NOT NULL,
    "WorkspaceId" uuid NULL,
    "Name" text NOT NULL,
    "Description" text NOT NULL DEFAULT '',
    "Code" text NOT NULL,
    "Language" text NOT NULL DEFAULT 'csharp',
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    "IsPublic" boolean NOT NULL DEFAULT false,
    "Views" integer NOT NULL DEFAULT 0,
    "Runs" integer NOT NULL DEFAULT 0,
    "Tags" text NOT NULL DEFAULT '',
    CONSTRAINT "FK_CodeSnippets_Users_UserId" FOREIGN KEY ("UserId")
        REFERENCES "Users" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_CodeSnippets_Workspaces_WorkspaceId" FOREIGN KEY ("WorkspaceId")
        REFERENCES "Workspaces" ("Id") ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX "IX_CodeSnippets_UserId" ON "CodeSnippets" ("UserId");
CREATE INDEX "IX_CodeSnippets_WorkspaceId" ON "CodeSnippets" ("WorkspaceId");
CREATE INDEX "IX_CodeSnippets_CreatedAt" ON "CodeSnippets" ("CreatedAt");
CREATE INDEX "IX_CodeSnippets_UserId_Language" ON "CodeSnippets" ("UserId", "Language");
CREATE INDEX "IX_CodeSnippets_IsPublic_Language" ON "CodeSnippets" ("IsPublic", "Language");

-- Insert example snippets for demonstration
INSERT INTO "CodeSnippets" ("Id", "UserId", "Name", "Description", "Code", "Language", "CreatedAt", "UpdatedAt", "IsPublic", "Views", "Runs", "Tags")
SELECT
    gen_random_uuid(),
    "Id",
    'Hello World',
    'Simple hello world example',
    'Console.WriteLine("Hello from aiMate!");
return "Success";',
    'csharp',
    NOW(),
    NOW(),
    false,
    0,
    0,
    'example,beginner'
FROM "Users"
LIMIT 1;

COMMENT ON TABLE "CodeSnippets" IS 'Code snippets/artifacts saved by users';
COMMENT ON COLUMN "CodeSnippets"."Language" IS 'Programming language (csharp, python, javascript, etc.)';
COMMENT ON COLUMN "CodeSnippets"."Views" IS 'Number of times snippet was viewed';
COMMENT ON COLUMN "CodeSnippets"."Runs" IS 'Number of times snippet was executed';
COMMENT ON COLUMN "CodeSnippets"."Tags" IS 'Comma-separated tags for categorization';
