# aiMate Docker Architecture

## Overview

Clean two-container architecture with PostgreSQL backend:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            Docker Network                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────┐         ┌─────────────────────┐                │
│  │    aimate-ui        │         │    aimate-db        │                │
│  │    (Port 3000)      │ ◄────── │    (Port 5432)      │                │
│  │                     │         │                     │                │
│  │  - React Frontend   │         │  - PostgreSQL 16    │                │
│  │  - Node.js API      │         │  - Persistent Vol   │                │
│  │  - Vite Dev Server  │         │  - Auto Migrations  │                │
│  └─────────────────────┘         └─────────────────────┘                │
│           │                                                              │
│           │ Direct connection (no proxy needed)                          │
│           ▼                                                              │
│  ┌─────────────────────┐                                                │
│  │  External LM Server │                                                │
│  │  (LMStudio/Ollama)  │                                                │
│  │  Host: host.docker  │                                                │
│  │  .internal:1234     │                                                │
│  └─────────────────────┘                                                │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Container Definitions

### 1. aimate-db (PostgreSQL)

```yaml
# docker-compose.yml
services:
  aimate-db:
    image: postgres:16-alpine
    container_name: aimate-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: aimate
      POSTGRES_PASSWORD: ${DB_PASSWORD:-aimate_dev}
      POSTGRES_DB: aimate
    volumes:
      - aimate-db-data:/var/lib/postgresql/data
      - ./db/init:/docker-entrypoint-initdb.d  # Initial schema
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U aimate"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  aimate-db-data:
```

### 2. aimate-ui (Frontend + API)

```yaml
  aimate-ui:
    build:
      context: ./src/aimate.web.ui
      dockerfile: Dockerfile
    container_name: aimate-ui
    restart: unless-stopped
    environment:
      DATABASE_URL: postgres://aimate:${DB_PASSWORD:-aimate_dev}@aimate-db:5432/aimate
      NODE_ENV: production
      VITE_API_BASE_URL: http://localhost:3000/api
    ports:
      - "3000:3000"
    depends_on:
      aimate-db:
        condition: service_healthy
    extra_hosts:
      - "host.docker.internal:host-gateway"  # For local LM server access
```

## Database Schema

### Core Tables

```sql
-- db/init/001_schema.sql

-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    password_hash VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Conversations
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    workspace_id UUID,
    title VARCHAR(500) NOT NULL DEFAULT 'New Conversation',
    is_archived BOOLEAN DEFAULT FALSE,
    is_pinned BOOLEAN DEFAULT FALSE,
    tags JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Messages
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
    content TEXT NOT NULL,
    model VARCHAR(255),
    token_count INTEGER,
    cost DECIMAL(10, 6),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

-- LM Connections
CREATE TABLE connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    provider VARCHAR(100),
    url VARCHAR(500) NOT NULL,
    api_key_encrypted BYTEA,  -- Encrypted with app key
    is_enabled BOOLEAN DEFAULT TRUE,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Models
CREATE TABLE models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    connection_id UUID REFERENCES connections(id) ON DELETE CASCADE,
    model_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    context_window INTEGER,
    capabilities JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Knowledge Documents
CREATE TABLE knowledge_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    filename VARCHAR(500) NOT NULL,
    file_type VARCHAR(100),
    file_size BIGINT,
    status VARCHAR(50) DEFAULT 'pending',
    chunk_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Knowledge Chunks (for RAG)
CREATE TABLE knowledge_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES knowledge_documents(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    embedding VECTOR(384),  -- For pgvector
    chunk_index INTEGER,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

-- MCP Servers
CREATE TABLE mcp_servers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    url VARCHAR(500) NOT NULL,
    auth_type VARCHAR(50),
    auth_config JSONB DEFAULT '{}',
    is_enabled BOOLEAN DEFAULT TRUE,
    tools JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_conversations_user ON conversations(user_id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_created ON messages(created_at);
CREATE INDEX idx_knowledge_chunks_document ON knowledge_chunks(document_id);
```

### pgvector Extension (for RAG)

```sql
-- db/init/000_extensions.sql
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;  -- For fuzzy search
```

## Migration System

Use **Prisma** or **Drizzle** for type-safe migrations:

### Option A: Prisma (Recommended)

```bash
# Structure
src/aimate.web.ui/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│       ├── 001_initial/
│       │   └── migration.sql
│       └── 002_add_knowledge/
│           └── migration.sql
```

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           String         @id @default(uuid())
  email        String         @unique
  name         String?
  passwordHash String?
  role         String         @default("user")
  settings     Json           @default("{}")
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt

  conversations Conversation[]
  connections   Connection[]
  documents     KnowledgeDocument[]
  mcpServers    MCPServer[]
}

model Conversation {
  id          String    @id @default(uuid())
  userId      String
  workspaceId String?
  title       String    @default("New Conversation")
  isArchived  Boolean   @default(false)
  isPinned    Boolean   @default(false)
  tags        Json      @default("[]")
  metadata    Json      @default("{}")
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  user     User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  messages Message[]
}

model Message {
  id             String   @id @default(uuid())
  conversationId String
  role           String
  content        String
  model          String?
  tokenCount     Int?
  cost           Decimal?
  metadata       Json     @default("{}")
  createdAt      DateTime @default(now())

  conversation Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
}
```

### Migration Commands

```bash
# Development
npx prisma migrate dev --name add_feature

# Production (in container startup)
npx prisma migrate deploy
```

## API Structure

### Backend API (Node.js + Express/Fastify)

```
src/aimate.web.ui/
├── src/
│   ├── server/            # NEW: Backend API
│   │   ├── index.ts       # Server entry point
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── chat.ts
│   │   │   ├── conversations.ts
│   │   │   ├── connections.ts
│   │   │   ├── models.ts
│   │   │   ├── knowledge.ts
│   │   │   └── tools.ts
│   │   ├── services/
│   │   │   ├── llm.service.ts     # Proxy to LM servers
│   │   │   ├── rag.service.ts     # Vector search
│   │   │   └── mcp.service.ts     # Tool execution
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   └── error.ts
│   │   └── db/
│   │       └── client.ts          # Prisma client
│   └── (existing frontend)
```

### Key Endpoints

```typescript
// Chat (proxied through backend)
POST /api/v1/chat/completions
  - Receives message from frontend
  - Looks up active connection
  - Proxies to LM server with API key
  - Streams response back
  - Saves to database

// Connections
GET    /api/v1/connections
POST   /api/v1/connections
PUT    /api/v1/connections/:id
DELETE /api/v1/connections/:id
POST   /api/v1/connections/:id/test

// Conversations
GET    /api/v1/conversations
POST   /api/v1/conversations
GET    /api/v1/conversations/:id
PUT    /api/v1/conversations/:id
DELETE /api/v1/conversations/:id
GET    /api/v1/conversations/:id/messages

// Models (discovered from connections)
GET    /api/v1/models
POST   /api/v1/models/:id/enable
POST   /api/v1/models/:id/disable
```

## Docker Compose (Full)

```yaml
# docker-compose.yml
version: '3.8'

services:
  aimate-db:
    image: postgres:16-alpine
    container_name: aimate-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: aimate
      POSTGRES_PASSWORD: ${DB_PASSWORD:-aimate_dev_secret}
      POSTGRES_DB: aimate
    volumes:
      - aimate-db-data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U aimate"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - aimate-network

  aimate-ui:
    build:
      context: ./src/aimate.web.ui
      dockerfile: Dockerfile
    container_name: aimate-ui
    restart: unless-stopped
    environment:
      DATABASE_URL: postgres://aimate:${DB_PASSWORD:-aimate_dev_secret}@aimate-db:5432/aimate
      NODE_ENV: ${NODE_ENV:-development}
      JWT_SECRET: ${JWT_SECRET:-change_me_in_production}
      ENCRYPTION_KEY: ${ENCRYPTION_KEY:-change_me_in_production}
    ports:
      - "3000:3000"
    depends_on:
      aimate-db:
        condition: service_healthy
    extra_hosts:
      - "host.docker.internal:host-gateway"
    networks:
      - aimate-network
    command: >
      sh -c "
        npx prisma migrate deploy &&
        npm run start
      "

networks:
  aimate-network:
    driver: bridge

volumes:
  aimate-db-data:
```

## Dockerfile (UI + API)

```dockerfile
# src/aimate.web.ui/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Build frontend
COPY . .
RUN npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

# Copy built assets and dependencies
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

# Runtime environment
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Start server (runs migrations then starts)
CMD ["npm", "run", "start:prod"]
```

## Development Workflow

### First Time Setup

```bash
# 1. Start database
docker compose up -d aimate-db

# 2. Run migrations
cd src/aimate.web.ui
npx prisma migrate dev

# 3. Start dev server
npm run dev
```

### Daily Development

```bash
# Start everything
docker compose up -d

# View logs
docker compose logs -f aimate-ui

# Stop
docker compose down
```

### Adding a Migration

```bash
# 1. Edit prisma/schema.prisma

# 2. Generate migration
npx prisma migrate dev --name describe_change

# 3. Commit migration files
git add prisma/migrations
git commit -m "db: add new_feature table"
```

## Benefits of This Architecture

1. **Single Source of Truth**: PostgreSQL stores everything
2. **API Key Security**: Keys encrypted in DB, never exposed to frontend
3. **Proper Migrations**: Prisma handles schema changes safely
4. **Horizontal Scaling**: Can add read replicas, connection pooling
5. **Observability**: Database queries can be logged/monitored
6. **Backup/Restore**: Standard PostgreSQL backup tools work
7. **Type Safety**: Prisma generates TypeScript types from schema

## Next Steps

1. [ ] Initialize Prisma schema
2. [ ] Create initial migration
3. [ ] Build API routes (start with chat proxy)
4. [ ] Update frontend to use backend API
5. [ ] Remove offline mode fallback from chat
6. [ ] Add Docker Compose file
7. [ ] Test full flow
