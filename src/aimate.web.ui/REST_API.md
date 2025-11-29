# aiMate REST API Documentation

**Version:** v1
**Last Updated:** January 2025
**Base URL:** `https://your-domain.com/api/v1`
**Format:** JSON
**Authentication:** Bearer Token (API Key)

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [API Key Management](#api-key-management)
4. [Rate Limiting](#rate-limiting)
5. [Error Handling](#error-handling)
6. [Chat API](#chat-api)
7. [Workspace & Conversation API](#workspace--conversation-api)
8. [Feedback API](#feedback-api)
9. [Knowledge Base API](#knowledge-base-api)
10. [Notes API](#notes-api)
11. [Projects API](#projects-api)
12. [Settings API](#settings-api)
13. [Usage Analytics API](#usage-analytics-api)
14. [Admin API](#admin-api)
15. [Files & Attachments API](#files--attachments-api)
16. [Search API](#search-api)
17. [Tools & MCP API](#tools--mcp-api)
18. [Code Management API](#code-management-api)
19. [Plugins API](#plugins-api)
20. [Connections API (BYOK)](#connections-api-byok)
21. [Organization & Groups API](#organization--groups-api)
22. [Structured Content API](#structured-content-api)
23. [Code Examples](#code-examples)
24. [Best Practices](#best-practices)

---

## Overview

The aiMate REST API provides complete programmatic access to all aiMate functionality, enabling:

- **OpenAI-Compatible** Chat endpoints for seamless integration
- **Full CRUD Operations** on all resources (Workspaces, Conversations, Projects, Notes, etc.)
- **Real-time Streaming** for chat completions via Server-Sent Events
- **Advanced Search** with semantic capabilities powered by AI embeddings
- **Team Collaboration** with organizations, groups, and permissions
- **Bring Your Own Key (BYOK)** support for multiple AI providers
- **Comprehensive Analytics** on usage and feedback

### Key Features

- ✅ **OpenAI-Compatible** Chat completions (streaming & non-streaming)
- ✅ **170+ Endpoints** across 23 controllers
- ✅ **Full CRUD** for all primary resources
- ✅ **Real-time Streaming** with Server-Sent Events
- ✅ **Semantic Search** with AI embeddings
- ✅ **Multi-Provider Support** (OpenAI, Anthropic, Google, Azure, local models)
- ✅ **Team Management** with organizations and permissions
- ✅ **File Management** with 50MB upload support
- ✅ **Admin Operations** for system management
- ✅ **MCP Tools** execution and management

---

## Authentication

All API requests (except error logging) require authentication via Bearer token.

### Generating API Keys

**Via Settings UI:**

1. Navigate to Settings → API Keys
2. Click "Generate New Key"
3. Copy the key (shown only once!)
4. Store securely

**Via Admin API:**

```http
POST /api/v1/admin/api-keys
Authorization: Bearer YOUR_ADMIN_KEY
Content-Type: application/json

{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Production API Key",
  "description": "For backend service integration"
}
```

### API Key Format

```
sk-aimate-{32-character-random-string}

Example: sk-aimate-abcdef123456789xyz0123456789abcd
```

### Using API Keys in Requests

Include in the `Authorization` header:

```http
Authorization: Bearer sk-aimate-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Security Best Practices

- ✅ Never commit API keys to version control
- ✅ Rotate keys every 90 days
- ✅ Use environment variables for storage
- ✅ Use separate keys for dev/staging/production
- ✅ Revoke unused keys immediately
- ✅ Use keys with minimal required permissions
- ✅ Monitor key usage in admin panel
- ✅ Implement rate limiting on client side

---

## API Key Management

### GET /api/v1/admin/api-keys

List all your API keys.

**Request:**

```http
GET /api/v1/admin/api-keys
Authorization: Bearer YOUR_API_KEY
```

**Response (200 OK):**

```json
[
  {
    "id": "key-1",
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Production Key",
    "hashedKey": "bcrypt-hash-...",
    "createdAt": "2025-01-10T10:00:00Z",
    "lastUsedAt": "2025-01-18T15:30:00Z",
    "isRevoked": false,
    "requestsPerMinute": 60,
    "requestsPerDay": 10000
  },
  {
    "id": "key-2",
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Staging Key",
    "hashedKey": "bcrypt-hash-...",
    "createdAt": "2025-01-15T14:20:00Z",
    "lastUsedAt": "2025-01-18T10:00:00Z",
    "isRevoked": false,
    "requestsPerMinute": 60,
    "requestsPerDay": 10000
  }
]
```

### POST /api/v1/admin/api-keys

Create a new API key (admin only).

**Request:**

```http
POST /api/v1/admin/api-keys
Authorization: Bearer YOUR_ADMIN_KEY
Content-Type: application/json

{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Integration Key",
  "description": "For third-party service integration"
}
```

**Response (201 Created):**

```json
{
  "id": "key-new-1",
  "apiKey": "sk-aimate-newkeynewkeynewkeynewke",
  "createdAt": "2025-01-18T16:30:00Z"
}
```

**⚠️ Important:** The `apiKey` is only returned once. Store it securely!

### DELETE /api/v1/admin/api-keys/{keyId}

Revoke an API key.

**Request:**

```http
DELETE /api/v1/admin/api-keys/key-1
Authorization: Bearer YOUR_API_KEY
```

**Response (204 No Content)**

---

## Rate Limiting

Rate limits are enforced per API key and based on your subscription tier.

### Rate Limit Headers

Every response includes these headers:

```http
X-RateLimit-Limit: 120
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1640000000
```

### Handling Rate Limits

**When 429 is received:**

```json
{
  "error": {
    "message": "Rate limit exceeded",
    "type": "rate_limit_error",
    "code": "RATE_LIMIT_EXCEEDED",
    "retry_after": 60
  }
}
```

**Implement exponential backoff:**

```typescript
async function requestWithRetry(url: string, options: RequestInit, maxRetries = 5) {
  for (let i = 0; i < maxRetries; i++) {
    const response = await fetch(url, options);

    if (response.status !== 429) return response;

    const retryAfter = Number(response.headers.get('Retry-After')) || Math.pow(2, i);
    console.log(`Rate limited, retrying in ${retryAfter}s...`);
    await new Promise(r => setTimeout(r, retryAfter * 1000));
  }

  throw new Error('Max retries exceeded');
}
```

### Rate Limit Best Practices

- Cache responses when possible (5-15 min TTL)
- Use webhooks instead of polling
- Batch operations when available
- Monitor `X-RateLimit-Remaining` header
- Implement client-side rate limiting

---

## Error Handling

### Standard Error Format

All errors return this consistent structure:

```json
{
  "error": {
    "message": "Human-readable description",
    "type": "error_type",
    "code": "ERROR_CODE",
    "details": {
      "field": "error_detail"
    }
  }
}
```

### HTTP Status Codes

| Code  | Meaning               | When It Occurs                         |
| ----- | --------------------- | -------------------------------------- |
| `200` | OK                    | Request succeeded                      |
| `201` | Created               | Resource created                       |
| `204` | No Content            | Successful deletion                    |
| `400` | Bad Request           | Invalid request body/params            |
| `401` | Unauthorized          | Missing/invalid API key                |
| `403` | Forbidden             | Valid key but insufficient permissions |
| `404` | Not Found             | Resource doesn't exist                 |
| `422` | Unprocessable Entity  | Validation failed                      |
| `429` | Too Many Requests     | Rate limit exceeded                    |
| `500` | Internal Server Error | Server-side error                      |
| `503` | Service Unavailable   | Maintenance/overload                   |

### Error Types & Examples

**401 Unauthorized - Invalid API Key:**

```json
{
  "error": {
    "message": "Invalid or expired API key",
    "type": "authentication_error",
    "code": "INVALID_API_KEY"
  }
}
```

**403 Forbidden - Insufficient Permissions:**

```json
{
  "error": {
    "message": "Your tier does not support this operation",
    "type": "authorization_error",
    "code": "INSUFFICIENT_PERMISSIONS",
    "details": {
      "requiredTier": "Developer",
      "currentTier": "BYOK"
    }
  }
}
```

**422 Validation Error:**

```json
{
  "error": {
    "message": "Validation failed",
    "type": "validation_error",
    "code": "VALIDATION_FAILED",
    "details": {
      "title": ["Title is required"],
      "email": ["Invalid email format"],
      "password": ["Password must be at least 8 characters"]
    }
  }
}
```

**429 Rate Limit:**

```json
{
  "error": {
    "message": "Rate limit exceeded",
    "type": "rate_limit_error",
    "code": "RATE_LIMIT_EXCEEDED",
    "retry_after": 60
  }
}
```

---

## Chat API

OpenAI-compatible chat completions endpoint.

### POST /api/v1/chat/completions

Create a non-streaming chat completion.

**Request:**

```http
POST /api/v1/chat/completions
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "model": "gpt-4",
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful coding assistant."
    },
    {
      "role": "user",
      "content": "How do I implement authentication in a C# ASP.NET Core API?"
    }
  ],
  "temperature": 0.7,
  "max_tokens": 1000,
  "top_p": 1.0,
  "frequency_penalty": 0.0,
  "presence_penalty": 0.0
}
```

**Parameters:**

| Parameter           | Type    | Required | Range    | Description                                            |
| ------------------- | ------- | -------- | -------- | ------------------------------------------------------ |
| `model`             | string  | Yes      | -        | Model ID (e.g., "gpt-4", "claude-3-5-sonnet-20241022") |
| `messages`          | array   | Yes      | -        | Array of message objects                               |
| `temperature`       | float   | No       | 0.0-2.0  | Randomness (0=deterministic, 2=very random)            |
| `max_tokens`        | integer | No       | 1-4000   | Maximum tokens to generate                             |
| `top_p`             | float   | No       | 0.0-1.0  | Nucleus sampling parameter                             |
| `frequency_penalty` | float   | No       | -2.0-2.0 | Penalize token frequency                               |
| `presence_penalty`  | float   | No       | -2.0-2.0 | Penalize new tokens                                    |

**Response (200 OK):**

```json
{
  "id": "chatcmpl-8R3QzQq9K5L2mN6pO7R8s",
  "object": "chat.completion",
  "created": 1705602345,
  "model": "gpt-4",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "To implement authentication in ASP.NET Core, you can use JWT (JSON Web Tokens). Here's a basic example:\n\n1. Install NuGet packages:\n   dotnet add package System.IdentityModel.Tokens.Jwt\n   dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer\n\n2. Configure in Startup.cs:\n   services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)\n       .AddJwtBearer(options => {\n           options.TokenValidationParameters = new TokenValidationParameters {\n               ValidateIssuerSigningKey = true,\n               IssuerSigningKey = new SymmetricSecurityKey(Encoding.ASCII.GetBytes(key)),\n               ValidateIssuer = true,\n               ValidIssuer = issuer,\n               ValidateAudience = true,\n               ValidAudience = audience\n           };\n       });\n\n3. Protect endpoints:\n   [Authorize]\n   [HttpGet(\"protected\")]\n   public ActionResult Protected() {\n       return Ok(\"This is protected\");\n   }"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 28,
    "completion_tokens": 184,
    "total_tokens": 212
  }
}
```

### POST /api/v1/chat/completions/stream

Create a streaming chat completion using Server-Sent Events.

**Request:**

```http
POST /api/v1/chat/completions/stream
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "model": "gpt-4",
  "messages": [
    {
      "role": "user",
      "content": "Count to 5 slowly."
    }
  ],
  "stream": true,
  "temperature": 0.5
}
```

**Response (200 OK) - Server-Sent Events Stream:**

```
data: {"id":"chatcmpl-8R3QzQq9","choices":[{"index":0,"delta":{"content":"1"},"finish_reason":null}]}

data: {"id":"chatcmpl-8R3QzQq9","choices":[{"index":0,"delta":{"content":". "},"finish_reason":null}]}

data: {"id":"chatcmpl-8R3QzQq9","choices":[{"index":0,"delta":{"content":"2"},"finish_reason":null}]}

data: {"id":"chatcmpl-8R3QzQq9","choices":[{"index":0,"delta":{"content":". "},"finish_reason":null}]}

data: {"id":"chatcmpl-8R3QzQq9","choices":[{"index":0,"delta":{"content":"3"},"finish_reason":null}]}

data: {"id":"chatcmpl-8R3QzQq9","choices":[{"index":0,"delta":{"content":". "},"finish_reason":null}]}

data: {"id":"chatcmpl-8R3QzQq9","choices":[{"index":0,"delta":{"content":"4"},"finish_reason":null}]}

data: {"id":"chatcmpl-8R3QzQq9","choices":[{"index":0,"delta":{"content":". "},"finish_reason":null}]}

data: {"id":"chatcmpl-8R3QzQq9","choices":[{"index":0,"delta":{"content":"5"},"finish_reason":"stop"}]}

data: [DONE]
```

**Streaming Example (JavaScript):**

```typescript
async function streamChat(message: string) {
  const response = await fetch('/api/v1/chat/completions/stream', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [{ role: 'user', content: message }],
      stream: true
    })
  });

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n').filter(l => l.trim());

    for (const line of lines) {
      if (line === 'data: [DONE]') return;
      if (line.startsWith('data: ')) {
        const json = JSON.parse(line.slice(6));
        const content = json.choices[0]?.delta?.content || '';
        console.log(content); // Process each chunk
      }
    }
  }
}
```

---

## Workspace & Conversation API

Manage workspaces and conversations within them.

### GET /api/v1/workspaces

List all workspaces for the authenticated user.

**Request:**

```http
GET /api/v1/workspaces?userId=550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer YOUR_API_KEY
```

**Response (200 OK):**

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Product Development",
    "description": "Main product development workspace",
    "type": "Project",
    "personality": "KiwiDev",
    "createdAt": "2025-01-10T10:00:00Z",
    "updatedAt": "2025-01-18T14:30:00Z"
  },
  {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "name": "Research & Development",
    "description": "R&D and experimentation space",
    "type": "Research",
    "personality": "KiwiInnovator",
    "createdAt": "2025-01-12T09:15:00Z",
    "updatedAt": "2025-01-18T11:20:00Z"
  }
]
```

### POST /api/v1/workspaces

Create a new workspace.

**Request:**

```http
POST /api/v1/workspaces?userId=550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "name": "Customer Support",
  "description": "For handling customer inquiries",
  "type": "Support",
  "personality": "KiwiHelper"
}
```

**Response (201 Created):**

```json
{
  "id": "770e8400-e29b-41d4-a716-446655440002",
  "name": "Customer Support",
  "description": "For handling customer inquiries",
  "type": "Support",
  "personality": "KiwiHelper",
  "createdAt": "2025-01-18T16:45:00Z",
  "updatedAt": "2025-01-18T16:45:00Z"
}
```

### PUT /api/v1/workspaces/{id}

Update an existing workspace.

**Request:**

```http
PUT /api/v1/workspaces/770e8400-e29b-41d4-a716-446655440002
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "name": "Customer Support & Sales",
  "description": "Updated description",
  "personality": "KiwiFriendly"
}
```

**Response (200 OK):**

```json
{
  "id": "770e8400-e29b-41d4-a716-446655440002",
  "name": "Customer Support & Sales",
  "description": "Updated description",
  "type": "Support",
  "personality": "KiwiFriendly",
  "createdAt": "2025-01-18T16:45:00Z",
  "updatedAt": "2025-01-18T17:00:00Z"
}
```

### DELETE /api/v1/workspaces/{id}

Delete a workspace and all associated conversations.

**Request:**

```http
DELETE /api/v1/workspaces/770e8400-e29b-41d4-a716-446655440002
Authorization: Bearer YOUR_API_KEY
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Workspace deleted successfully"
}
```

### GET /api/v1/workspaces/{workspaceId}/conversations

List all conversations in a workspace.

**Request:**

```http
GET /api/v1/workspaces/550e8400-e29b-41d4-a716-446655440000/conversations
Authorization: Bearer YOUR_API_KEY
```

**Response (200 OK):**

```json
[
  {
    "id": 660000,
    "workspaceId": 550000,
    "title": "API Design Discussion",
    "modelId": "gpt-4",
    "isPinned": true,
    "isArchived": false,
    "createdAt": "2025-01-15T10:00:00Z",
    "updatedAt": "2025-01-18T14:30:00Z",
    "messageCount": 45
  },
  {
    "id": 670000,
    "workspaceId": 550000,
    "title": "Database Schema Review",
    "modelId": "claude-3-5-sonnet-20241022",
    "isPinned": false,
    "isArchived": false,
    "createdAt": "2025-01-16T11:20:00Z",
    "updatedAt": "2025-01-18T09:15:00Z",
    "messageCount": 28
  }
]
```

### POST /api/v1/workspaces/{workspaceId}/conversations

Create a new conversation.

**Request:**

```http
POST /api/v1/workspaces/550e8400-e29b-41d4-a716-446655440000/conversations
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "title": "Authentication Strategy Discussion"
}
```

**Response (201 Created):**

```json
{
  "id": 680000,
  "workspaceId": 550000,
  "title": "Authentication Strategy Discussion",
  "modelId": null,
  "isPinned": false,
  "isArchived": false,
  "createdAt": "2025-01-18T17:30:00Z",
  "updatedAt": "2025-01-18T17:30:00Z",
  "messageCount": 0
}
```

### PUT /api/v1/workspaces/{workspaceId}/conversations/{conversationId}

Update a conversation.

**Request:**

```http
PUT /api/v1/workspaces/550e8400-e29b-41d4-a716-446655440000/conversations/660000
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "title": "API Design & Documentation",
  "modelId": "gpt-4",
  "isPinned": true,
  "isArchived": false
}
```

**Response (200 OK):**

```json
{
  "id": 660000,
  "workspaceId": 550000,
  "title": "API Design & Documentation",
  "modelId": "gpt-4",
  "isPinned": true,
  "isArchived": false,
  "createdAt": "2025-01-15T10:00:00Z",
  "updatedAt": "2025-01-18T17:45:00Z",
  "messageCount": 45
}
```

### DELETE /api/v1/workspaces/{workspaceId}/conversations/{conversationId}

Delete a conversation and all its messages.

**Request:**

```http
DELETE /api/v1/workspaces/550e8400-e29b-41d4-a716-446655440000/conversations/670000
Authorization: Bearer YOUR_API_KEY
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Conversation deleted successfully"
}
```

---

## Feedback API

Manage feedback and ratings on AI responses.

### POST /api/v1/feedback/messages/{messageId}

Create or update feedback for a message.

**Request:**

```http
POST /api/v1/feedback/messages/880e8400-e29b-41d4-a716-446655440000
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "rating": 9,
  "textFeedback": "Excellent response, very accurate and well-structured code example.",
  "tags": [
    {
      "key": "quality",
      "value": "excellent",
      "color": "success",
      "sentiment": "positive"
    },
    {
      "key": "accuracy",
      "value": "accurate",
      "color": "success",
      "sentiment": "positive"
    }
  ],
  "modelId": "gpt-4",
  "responseTimeMs": 2340
}
```

**Response (200 OK):**

```json
{
  "id": "990e8400-e29b-41d4-a716-446655440000",
  "rating": 9,
  "createdAt": "2025-01-18T17:55:00Z",
  "updatedAt": "2025-01-18T17:55:00Z"
}
```

### PUT /api/v1/feedback/{feedbackId}

Update existing feedback.

**Request:**

```http
PUT /api/v1/feedback/990e8400-e29b-41d4-a716-446655440000
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "rating": 10,
  "textFeedback": "Updated feedback after verification"
}
```

**Response (200 OK):**

```json
{
  "id": "990e8400-e29b-41d4-a716-446655440000",
  "rating": 10,
  "createdAt": "2025-01-18T17:55:00Z",
  "updatedAt": "2025-01-18T18:00:00Z"
}
```

### GET /api/v1/feedback/messages/{messageId}

Get feedback for a specific message.

**Request:**

```http
GET /api/v1/feedback/messages/880e8400-e29b-41d4-a716-446655440000
Authorization: Bearer YOUR_API_KEY
```

**Response (200 OK):**

```json
{
  "id": "990e8400-e29b-41d4-a716-446655440000",
  "messageId": "880e8400-e29b-41d4-a716-446655440000",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "rating": 10,
  "textFeedback": "Excellent response, very accurate and well-structured code example.",
  "tags": [
    {
      "key": "quality",
      "value": "excellent",
      "color": "success",
      "sentiment": "positive"
    }
  ],
  "modelId": "gpt-4",
  "responseTimeMs": 2340,
  "createdAt": "2025-01-18T17:55:00Z",
  "updatedAt": "2025-01-18T18:00:00Z"
}
```

### GET /api/v1/feedback/stats/models/{modelId}

Get aggregate statistics for a model.

**Request:**

```http
GET /api/v1/feedback/stats/models/gpt-4?fromDate=2025-01-01&toDate=2025-01-31
Authorization: Bearer YOUR_API_KEY
```

**Response (200 OK):**

```json
{
  "modelId": "gpt-4",
  "totalFeedback": 1250,
  "averageRating": 8.3,
  "ratingDistribution": {
    "1": 5,
    "2": 8,
    "3": 12,
    "4": 25,
    "5": 50,
    "6": 85,
    "7": 175,
    "8": 350,
    "9": 280,
    "10": 200
  },
  "averageResponseTime": 2500,
  "positivePercentage": 87.2,
  "negativePercentage": 3.5,
  "neutralPercentage": 9.3
}
```

### DELETE /api/v1/feedback/{feedbackId}

Delete feedback entry.

**Request:**

```http
DELETE /api/v1/feedback/990e8400-e29b-41d4-a716-446655440000
Authorization: Bearer YOUR_API_KEY
```

**Response (204 No Content)**

### GET /api/v1/feedback/templates

Get all active feedback tag templates.

**Request:**

```http
GET /api/v1/feedback/templates
Authorization: Bearer YOUR_API_KEY
```

**Response (200 OK):**

```json
[
  {
    "id": "template-1",
    "category": "Quality",
    "label": "Response Quality",
    "description": "Rate the overall quality of the response",
    "isActive": true,
    "options": [
      {
        "value": "poor",
        "color": "danger",
        "sentiment": "negative",
        "icon": "thumbs-down",
        "displayOrder": 1
      },
      {
        "value": "good",
        "color": "success",
        "sentiment": "positive",
        "icon": "thumbs-up",
        "displayOrder": 2
      }
    ]
  }
]
```

### POST /api/v1/feedback/templates

Create a new feedback tag template (admin only).

**Request:**

```http
POST /api/v1/feedback/templates
Authorization: Bearer YOUR_ADMIN_API_KEY
Content-Type: application/json

{
  "category": "Relevance",
  "label": "Response Relevance",
  "description": "How relevant is the response to the question?",
  "options": [
    {
      "value": "not-relevant",
      "color": "danger",
      "sentiment": "negative",
      "icon": "times",
      "displayOrder": 1
    },
    {
      "value": "highly-relevant",
      "color": "success",
      "sentiment": "positive",
      "icon": "check",
      "displayOrder": 2
    }
  ],
  "isRequired": false
}
```

**Response (201 Created):**

```json
{
  "id": "template-new-1",
  "category": "Relevance",
  "label": "Response Relevance",
  "description": "How relevant is the response to the question?",
  "isActive": true,
  "isRequired": false,
  "options": [
    {
      "value": "not-relevant",
      "color": "danger",
      "sentiment": "negative",
      "icon": "times",
      "displayOrder": 1
    },
    {
      "value": "highly-relevant",
      "color": "success",
      "sentiment": "positive",
      "icon": "check",
      "displayOrder": 2
    }
  ],
  "createdAt": "2025-01-18T18:15:00Z"
}
```

---

## Knowledge Base API

Manage and search your knowledge base.

### GET /api/v1/knowledge

List knowledge articles.

**Request:**

```http
GET /api/v1/knowledge?userId=550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer YOUR_API_KEY
```

**Response (200 OK):**

```json
[
  {
    "id": "article-1",
    "title": "Getting Started with aiMate",
    "content": "Complete guide on setting up and using aiMate...",
    "type": "Documentation",
    "category": "Getting Started",
    "tags": ["tutorial", "beginner", "setup"],
    "visibility": "Public",
    "isPublished": true,
    "isFeatured": true,
    "viewCount": 450,
    "referenceCount": 28,
    "createdAt": "2025-01-05T10:00:00Z",
    "updatedAt": "2025-01-18T14:30:00Z",
    "lastViewedAt": "2025-01-18T17:00:00Z"
  }
]
```

### POST /api/v1/knowledge

Create a new knowledge article.

**Request:**

```http
POST /api/v1/knowledge?userId=550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "title": "Advanced API Patterns",
  "content": "Detailed guide covering advanced API design patterns...",
  "type": "Article",
  "category": "Advanced Topics",
  "tags": ["api", "design", "advanced"],
  "visibility": "Private",
  "isPublished": false,
  "isFeatured": false
}
```

**Response (201 Created):**

```json
{
  "id": "article-new-1",
  "title": "Advanced API Patterns",
  "content": "Detailed guide covering advanced API design patterns...",
  "type": "Article",
  "category": "Advanced Topics",
  "tags": ["api", "design", "advanced"],
  "visibility": "Private",
  "isPublished": false,
  "isFeatured": false,
  "viewCount": 0,
  "referenceCount": 0,
  "createdAt": "2025-01-18T18:30:00Z",
  "updatedAt": "2025-01-18T18:30:00Z"
}
```

### GET /api/v1/knowledge/analytics

Get knowledge base analytics.

**Request:**

```http
GET /api/v1/knowledge/analytics?userId=550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer YOUR_API_KEY
```

**Response (200 OK):**

```json
{
  "totalArticles": 145,
  "totalViews": 8500,
  "totalReferences": 450,
  "mostViewed": [
    {
      "id": "article-1",
      "title": "Getting Started with aiMate",
      "viewCount": 450
    },
    {
      "id": "article-5",
      "title": "API Reference",
      "viewCount": 380
    }
  ],
  "mostReferenced": [
    {
      "id": "article-2",
      "title": "Authentication Guide",
      "referenceCount": 120
    },
    {
      "id": "article-3",
      "title": "Error Handling",
      "referenceCount": 95
    }
  ],
  "tagCounts": {
    "tutorial": 35,
    "api": 28,
    "authentication": 18,
    "guide": 22
  }
}
```

### POST /api/v1/knowledge/search

Semantic search across knowledge base.

**Request:**

```http
POST /api/v1/knowledge/search
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "query": "How do I implement JWT authentication?",
  "limit": 5,
  "threshold": 0.7
}
```

**Response (200 OK):**

```json
{
  "results": [
    {
      "id": "article-2",
      "title": "Authentication Guide",
      "content": "Complete guide to implementing JWT authentication...",
      "score": 0.94,
      "relevance": "high"
    },
    {
      "id": "article-8",
      "title": "Security Best Practices",
      "content": "Security considerations including JWT token management...",
      "score": 0.82,
      "relevance": "high"
    }
  ],
  "totalResults": 2,
  "queryTime": 145
}
```

---

## Notes API

Create and manage personal notes.

### GET /api/v1/notes

Get all notes for a user.

**Request:**

```http
GET /api/v1/notes?userId=550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer YOUR_API_KEY
```

**Response (200 OK):**

```json
[
  {
    "id": "note-1",
    "title": "API Design Principles",
    "content": "Notes on RESTful API design...",
    "contentType": "Markdown",
    "tags": ["api", "design"],
    "collection": "Technical",
    "category": "Architecture",
    "color": "#4A90E2",
    "ownerId": "550e8400-e29b-41d4-a716-446655440000",
    "visibility": "Private",
    "isFavorite": true,
    "isPinned": true,
    "isArchived": false,
    "createdAt": "2025-01-10T09:00:00Z",
    "updatedAt": "2025-01-18T16:00:00Z"
  }
]
```

### POST /api/v1/notes

Create a new note.

**Request:**

```http
POST /api/v1/notes?userId=550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "title": "Project Roadmap",
  "content": "Q1: Complete API redesign\nQ2: Mobile app launch\nQ3: Advanced features",
  "contentType": "Markdown",
  "tags": ["projects", "planning"],
  "collection": "Planning",
  "category": "Projects",
  "color": "#7ED321"
}
```

**Response (201 Created):**

```json
{
  "id": "note-new-1",
  "title": "Project Roadmap",
  "content": "Q1: Complete API redesign\nQ2: Mobile app launch\nQ3: Advanced features",
  "contentType": "Markdown",
  "tags": ["projects", "planning"],
  "collection": "Planning",
  "category": "Projects",
  "color": "#7ED321",
  "ownerId": "550e8400-e29b-41d4-a716-446655440000",
  "visibility": "Private",
  "isFavorite": false,
  "isPinned": false,
  "isArchived": false,
  "createdAt": "2025-01-18T19:00:00Z",
  "updatedAt": "2025-01-18T19:00:00Z"
}
```

### PUT /api/v1/notes/{id}

Update a note.

**Request:**

```http
PUT /api/v1/notes/note-1?userId=550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "title": "Updated Title",
  "isFavorite": false,
  "isPinned": true,
  "isArchived": false
}
```

**Response (200 OK):**

```json
{
  "id": "note-1",
  "title": "Updated Title",
  "content": "...",
  "isFavorite": false,
  "isPinned": true,
  "isArchived": false,
  "updatedAt": "2025-01-18T19:10:00Z"
}
```

### DELETE /api/v1/notes/{id}

Delete a note.

**Request:**

```http
DELETE /api/v1/notes/note-1?userId=550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer YOUR_API_KEY
```

**Response (204 No Content)**

### GET /api/v1/notes/collections

Get all unique collections for a user.

**Request:**

```http
GET /api/v1/notes/collections?userId=550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer YOUR_API_KEY
```

**Response (200 OK):**

```json
["Technical", "Planning", "Personal", "Research"]
```

### GET /api/v1/notes/tags

Get all unique tags for a user.

**Request:**

```http
GET /api/v1/notes/tags?userId=550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer YOUR_API_KEY
```

**Response (200 OK):**

```json
["api", "design", "projects", "planning", "research", "technical", "personal"]
```

---

## Projects API

Manage software projects and initiatives.

### GET /api/v1/projects

List all projects for a user.

**Request:**

```http
GET /api/v1/projects?userId=550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer YOUR_API_KEY
```

**Response (200 OK):**

```json
[
  {
    "id": "proj-1",
    "key": "PROJ-001",
    "name": "API Redesign",
    "description": "Complete redesign of the REST API",
    "ownerId": "550e8400-e29b-41d4-a716-446655440000",
    "owner": "John Developer",
    "ownerEmail": "john@example.com",
    "status": "In Progress",
    "priority": "High",
    "budget": 50000,
    "startDate": "2025-01-15T00:00:00Z",
    "dueDate": "2025-04-30T00:00:00Z",
    "progressPercent": 35,
    "tags": ["api", "backend", "critical"],
    "teamMembers": ["alice@example.com", "bob@example.com"],
    "notes": "Currently working on documentation",
    "createdAt": "2025-01-15T10:00:00Z",
    "updatedAt": "2025-01-18T15:45:00Z"
  }
]
```

### POST /api/v1/projects

Create a new project.

**Request:**

```http
POST /api/v1/projects?userId=550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "key": "PROJ-002",
  "name": "Mobile App Development",
  "description": "Native mobile app for iOS and Android",
  "owner": "Jane Manager",
  "ownerEmail": "jane@example.com",
  "status": "Planning",
  "priority": "Medium",
  "budget": 100000,
  "startDate": "2025-03-01T00:00:00Z",
  "dueDate": "2025-09-30T00:00:00Z",
  "progressPercent": 0,
  "tags": ["mobile", "ios", "android"],
  "teamMembers": ["dev1@example.com", "dev2@example.com", "designer@example.com"]
}
```

**Response (201 Created):**

```json
{
  "id": "proj-new-1",
  "key": "PROJ-002",
  "name": "Mobile App Development",
  "description": "Native mobile app for iOS and Android",
  "ownerId": "550e8400-e29b-41d4-a716-446655440000",
  "owner": "Jane Manager",
  "ownerEmail": "jane@example.com",
  "status": "Planning",
  "priority": "Medium",
  "budget": 100000,
  "startDate": "2025-03-01T00:00:00Z",
  "dueDate": "2025-09-30T00:00:00Z",
  "progressPercent": 0,
  "tags": ["mobile", "ios", "android"],
  "teamMembers": ["dev1@example.com", "dev2@example.com", "designer@example.com"],
  "createdAt": "2025-01-18T19:30:00Z",
  "updatedAt": "2025-01-18T19:30:00Z"
}
```

### PUT /api/v1/projects/{id}

Update a project.

**Request:**

```http
PUT /api/v1/projects/proj-1
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "status": "In Progress",
  "progressPercent": 45,
  "priority": "Critical"
}
```

**Response (200 OK):**

```json
{
  "id": "proj-1",
  "key": "PROJ-001",
  "name": "API Redesign",
  "status": "In Progress",
  "progressPercent": 45,
  "priority": "Critical",
  "updatedAt": "2025-01-18T19:45:00Z"
}
```

### DELETE /api/v1/projects/{id}

Delete a project.

**Request:**

```http
DELETE /api/v1/projects/proj-1
Authorization: Bearer YOUR_API_KEY
```

**Response (204 No Content)**

---

## Settings API

Manage user settings and preferences.

### GET /api/v1/settings

Get user settings.

**Request:**

```http
GET /api/v1/settings?userId=550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer YOUR_API_KEY
```

**Response (200 OK):**

```json
{
  "username": "john.developer",
  "email": "john@example.com",
  "userTier": "Developer",
  "theme": "dark",
  "notifications": {
    "email": true,
    "push": true,
    "inApp": true
  },
  "language": "en",
  "timezone": "Pacific/Auckland",
  "defaultModel": "gpt-4",
  "defaultPersonality": "KiwiDev",
  "autoSaveInterval": 300,
  "showLineNumbers": true,
  "fontSize": 14,
  "fontFamily": "Fira Code"
}
```

### PUT /api/v1/settings

Update user settings (REST compliant).

**Request:**

```http
PUT /api/v1/settings?userId=550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "theme": "light",
  "notifications": {
    "email": false,
    "push": true,
    "inApp": true
  },
  "timezone": "America/New_York",
  "defaultModel": "claude-3-5-sonnet-20241022",
  "fontSize": 16
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Settings updated successfully"
}
```

### POST /api/v1/settings

Update user settings (legacy POST method).

**Request:**

```http
POST /api/v1/settings?userId=550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "theme": "dark",
  "defaultModel": "gpt-4"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Settings updated successfully"
}
```

### DELETE /api/v1/settings

Reset user settings to defaults.

**Request:**

```http
DELETE /api/v1/settings?userId=550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer YOUR_API_KEY
```

**Response (200 OK):**

```json
{
  "username": "john.developer",
  "email": "john@example.com",
  "userTier": "Developer",
  "theme": "dark",
  "defaultModel": "gpt-4",
  "defaultPersonality": "KiwiDev"
}
```

---

## Usage Analytics API

Get usage statistics and billing metrics.

### GET /api/v1/users/usage

Get usage statistics for current billing period.

**Request:**

```http
GET /api/v1/users/usage?userId=550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer YOUR_API_KEY
```

**Response (200 OK):**

```json
{
  "totalMessages": 2450,
  "totalTokens": 785000,
  "totalCost": 47.50,
  "billingPeriodStart": "Jan 1, 2025",
  "billingPeriodEnd": "Jan 31, 2025",
  "usageByModel": [
    {
      "model": "GPT-4",
      "connection": "OpenAI",
      "messages": 1200,
      "tokens": 450000,
      "cost": 32.50,
      "color": "#A855F7"
    },
    {
      "model": "Claude 3.5 Sonnet",
      "connection": "Anthropic",
      "messages": 890,
      "tokens": 285000,
      "cost": 12.40,
      "color": "#F97316"
    },
    {
      "model": "GPT-3.5 Turbo",
      "connection": "OpenAI",
      "messages": 360,
      "tokens": 50000,
      "cost": 2.60,
      "color": "#A855F7"
    }
  ]
}
```

---

## Admin API

Administrative operations (requires admin credentials).

### GET /api/v1/admin

Get admin dashboard overview.

**Request:**

```http
GET /api/v1/admin
Authorization: Bearer YOUR_ADMIN_API_KEY
```

**Response (200 OK):**

```json
{
  "totalUsers": 1250,
  "activeUsers": 845,
  "totalWorkspaces": 3450,
  "totalConversations": 28900,
  "totalMessages": 450000,
  "systemHealth": "Healthy",
  "uptime": 99.98,
  "lastBackup": "2025-01-18T00:00:00Z",
  "totalTokensUsed": 15000000,
  "totalCostTracked": 125000.00
}
```

### GET /api/v1/admin/models

List all AI models.

**Request:**

```http
GET /api/v1/admin/models
Authorization: Bearer YOUR_ADMIN_API_KEY
```

**Response (200 OK):**

```json
[
  {
    "id": "gpt-4",
    "name": "GPT-4",
    "provider": "OpenAI",
    "isActive": true,
    "contextWindow": 8192,
    "costPer1kInputTokens": 0.03,
    "costPer1kOutputTokens": 0.06,
    "capabilities": ["chat", "completion", "vision"],
    "usageCount": 125000,
    "lastUsed": "2025-01-18T17:45:00Z"
  },
  {
    "id": "claude-3-5-sonnet-20241022",
    "name": "Claude 3.5 Sonnet",
    "provider": "Anthropic",
    "isActive": true,
    "contextWindow": 200000,
    "costPer1kInputTokens": 0.003,
    "costPer1kOutputTokens": 0.015,
    "capabilities": ["chat", "completion", "vision"],
    "usageCount": 98000,
    "lastUsed": "2025-01-18T17:50:00Z"
  }
]
```

### GET /api/v1/admin/mcp

List all MCP servers.

**Request:**

```http
GET /api/v1/admin/mcp
Authorization: Bearer YOUR_ADMIN_API_KEY
```

**Response (200 OK):**

```json
[
  {
    "id": "mcp-1",
    "name": "Web Search",
    "description": "Search the web for information",
    "isActive": true,
    "status": "Connected",
    "lastConnected": "2025-01-18T17:30:00Z",
    "tools": ["web_search", "news_search"],
    "version": "1.2.0"
  }
]
```

### GET /api/v1/admin/logs

Get system logs.

**Request:**

```http
GET /api/v1/admin/logs?limit=50
Authorization: Bearer YOUR_ADMIN_API_KEY
```

**Parameters:**

| Parameter | Type    | Default | Description              |
| --------- | ------- | ------- | ------------------------ |
| `limit`   | integer | 50      | Number of logs (max 500) |

**Response (200 OK):**

```json
[
  {
    "timestamp": "2025-01-18T17:55:00Z",
    "level": "INFO",
    "source": "ChatApiController",
    "message": "Chat completion created for model gpt-4",
    "details": {
      "userId": "550e8400-e29b-41d4-a716-446655440000",
      "tokenUsed": 120
    }
  }
]
```

### DELETE /api/v1/admin/logs

Clear all system logs.

**Request:**

```http
DELETE /api/v1/admin/logs
Authorization: Bearer YOUR_ADMIN_API_KEY
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Logs cleared successfully"
}
```

---

## Files & Attachments API

Manage file uploads and attachments.

### POST /api/v1/files/upload

Upload a file to a workspace.

**Request:**

```http
POST /api/v1/files/upload?workspaceId=550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer YOUR_API_KEY
Content-Type: multipart/form-data

[Binary file content]
[Optional form field: description=API documentation]
```

**Parameters:**

| Parameter     | Type   | Required | Max Size  | Formats                                                 |
| ------------- | ------ | -------- | --------- | ------------------------------------------------------- |
| `workspaceId` | GUID   | Yes      | -         | -                                                       |
| `description` | string | No       | 500 chars | -                                                       |
| `file`        | File   | Yes      | 50 MB     | PDF, Word, Excel, Images, JSON, XML, CSV, Markdown, ZIP |

**Response (201 Created):**

```json
{
  "id": "file-1",
  "workspaceId": "550e8400-e29b-41d4-a716-446655440000",
  "fileName": "API_Documentation.pdf",
  "fileSize": 2048576,
  "fileType": "application/pdf",
  "description": "API documentation",
  "url": "https://your-domain.com/api/v1/files/file-1/download",
  "uploadedAt": "2025-01-18T18:00:00Z",
  "uploadedBy": "550e8400-e29b-41d4-a716-446655440000"
}
```

### GET /api/v1/files/{id}

Get file information.

**Request:**

```http
GET /api/v1/files/file-1
Authorization: Bearer YOUR_API_KEY
```

**Response (200 OK):**

```json
{
  "id": "file-1",
  "fileName": "API_Documentation.pdf",
  "fileSize": 2048576,
  "fileType": "application/pdf",
  "description": "API documentation",
  "url": "https://your-domain.com/api/v1/files/file-1/download",
  "uploadedAt": "2025-01-18T18:00:00Z"
}
```

### GET /api/v1/files/{id}/download

Download a file.

**Request:**

```http
GET /api/v1/files/file-1/download
Authorization: Bearer YOUR_API_KEY
```

**Response (200 OK):** Binary file content with appropriate `Content-Type` header

### PUT /api/v1/files/{id}

Update file metadata.

**Request:**

```http
PUT /api/v1/files/file-1
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "description": "Updated API documentation - v2.1"
}
```

**Response (200 OK):**

```json
{
  "id": "file-1",
  "fileName": "API_Documentation.pdf",
  "description": "Updated API documentation - v2.1",
  "updatedAt": "2025-01-18T18:10:00Z"
}
```

### DELETE /api/v1/files/{id}

Delete a file.

**Request:**

```http
DELETE /api/v1/files/file-1
Authorization: Bearer YOUR_API_KEY
```

**Response (204 No Content)**

### POST /api/v1/attachments/upload-file

Upload attachment.

**Request:**

```http
POST /api/v1/attachments/upload-file
Authorization: Bearer YOUR_API_KEY
Content-Type: multipart/form-data

[Binary file content]
```

**Response (201 Created):**

```json
{
  "id": "attachment-1",
  "fileName": "screenshot.png",
  "url": "https://your-domain.com/attachments/attachment-1",
  "uploadedAt": "2025-01-18T18:15:00Z"
}
```

---

## Search API

Comprehensive search across all content types.

### GET /api/v1/search/conversations

Search conversations by title.

**Request:**

```http
GET /api/v1/search/conversations?query=api&limit=10
Authorization: Bearer YOUR_API_KEY
```

**Parameters:**

| Parameter | Type    | Required | Default | Range |
| --------- | ------- | -------- | ------- | ----- |
| `query`   | string  | Yes      | -       | -     |
| `limit`   | integer | No       | 10      | 1-50  |

**Response (200 OK):**

```json
{
  "results": [
    {
      "id": 660000,
      "title": "API Design Discussion",
      "workspaceId": "550e8400-e29b-41d4-a716-446655440000",
      "relevance": 0.95
    }
  ],
  "totalResults": 1
}
```

### GET /api/v1/search/messages

Search messages by content.

**Request:**

```http
GET /api/v1/search/messages?query=authentication&limit=10
Authorization: Bearer YOUR_API_KEY
```

**Response (200 OK):**

```json
{
  "results": [
    {
      "id": "msg-123",
      "content": "Here is the authentication guide...",
      "conversationId": "660e8400-e29b-41d4-a716-446655440000",
      "createdAt": "2025-01-18T14:00:00Z",
      "relevance": 0.92
    }
  ],
  "totalResults": 5
}
```

### GET /api/v1/search/knowledge/semantic

Semantic search in knowledge base (AI embeddings).

**Request:**

```http
GET /api/v1/search/knowledge/semantic?query=jwt+tokens&limit=5&threshold=0.7
Authorization: Bearer YOUR_API_KEY
```

**Parameters:**

| Parameter   | Type    | Required | Default | Range   |
| ----------- | ------- | -------- | ------- | ------- |
| `query`     | string  | Yes      | -       | -       |
| `limit`     | integer | No       | 5       | 1-50    |
| `threshold` | float   | No       | 0.7     | 0.0-1.0 |

**Response (200 OK):**

```json
{
  "results": [
    {
      "id": "article-2",
      "title": "Authentication Guide",
      "content": "Complete guide to JWT authentication...",
      "score": 0.91,
      "relevance": "high"
    }
  ],
  "totalResults": 3
}
```

### GET /api/v1/search

Global search across all content types.

**Request:**

```http
GET /api/v1/search?query=workspace&limit=20
Authorization: Bearer YOUR_API_KEY
```

**Response (200 OK):**

```json
{
  "conversations": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440000",
      "title": "Workspace Design"
    }
  ],
  "messages": [
    {
      "id": "msg-123",
      "content": "Let's discuss workspace features..."
    }
  ],
  "knowledge": [
    {
      "id": "article-1",
      "title": "Workspace Guide"
    }
  ]
}
```

---

## Tools & MCP API

Execute MCP (Model Context Protocol) tools.

### GET /api/v1/tools

List available MCP tools.

**Request:**

```http
GET /api/v1/tools?workspaceId=550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer YOUR_API_KEY
```

**Response (200 OK):**

```json
[
  {
    "name": "web_search",
    "description": "Search the web for information",
    "category": "Search",
    "parameters": {
      "query": {
        "type": "string",
        "description": "Search query",
        "required": true
      },
      "max_results": {
        "type": "integer",
        "description": "Maximum number of results",
        "required": false,
        "default": 5
      }
    }
  }
]
```

### POST /api/v1/tools/execute

Execute a specific tool.

**Request:**

```http
POST /api/v1/tools/execute
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "tool": "web_search",
  "parameters": {
    "query": "Latest AI developments in 2025",
    "max_results": 5
  }
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "toolName": "web_search",
  "result": {
    "results": [
      {
        "title": "AI Breakthrough Announced",
        "url": "https://example.com/article",
        "snippet": "Researchers announce major AI advancement..."
      }
    ]
  },
  "executionTime": 1200,
  "timestamp": "2025-01-18T18:20:00Z"
}
```

---

## Code Management API

Manage code files and compilation.

### POST /api/v1/code/files

Create a new code file.

**Request:**

```http
POST /api/v1/code/files?userId=550e8400-e29b-41d4-a716-446655440000&projectId=proj-1
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "fileName": "auth-service.ts",
  "language": "typescript",
  "content": "export class AuthService {\n  // implementation\n}",
  "path": "/src/services/"
}
```

**Response (201 Created):**

```json
{
  "id": "file-code-1",
  "fileName": "auth-service.ts",
  "language": "typescript",
  "path": "/src/services/auth-service.ts",
  "content": "export class AuthService {\n  // implementation\n}",
  "createdAt": "2025-01-18T18:25:00Z",
  "updatedAt": "2025-01-18T18:25:00Z"
}
```

### GET /api/v1/code/files

List code files in a project.

**Request:**

```http
GET /api/v1/code/files?projectId=proj-1
Authorization: Bearer YOUR_API_KEY
```

**Response (200 OK):**

```json
[
  {
    "id": "file-code-1",
    "fileName": "auth-service.ts",
    "language": "typescript",
    "path": "/src/services/auth-service.ts",
    "size": 1024,
    "createdAt": "2025-01-18T18:25:00Z"
  }
]
```

### POST /api/v1/code/compile

Compile code and check for errors.

**Request:**

```http
POST /api/v1/code/compile
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "code": "public class Hello {\n  public static void Main() {\n    System.out.println(\"Hello, World!\");\n  }\n}",
  "language": "csharp"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "messages": [],
  "warnings": [],
  "errors": [],
  "compiledCode": "..."
}
```

---

## Plugins API

Manage plugins and extensions.

### GET /api/v1/plugins

List all loaded plugins.

**Request:**

```http
GET /api/v1/plugins
Authorization: Bearer YOUR_API_KEY
```

**Response (200 OK):**

```json
[
  {
    "id": "plugin-1",
    "name": "Advanced Search",
    "version": "1.2.0",
    "description": "Advanced semantic search capabilities",
    "isEnabled": true,
    "author": "aiMate Team",
    "settings": {
      "modelProvider": "Anthropic",
      "embeddingDimension": 1536
    }
  }
]
```

### GET /api/v1/plugins/{id}/settings

Get plugin settings schema and current values.

**Request:**

```http
GET /api/v1/plugins/plugin-1/settings?userId=550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer YOUR_API_KEY
```

**Response (200 OK):**

```json
{
  "schema": {
    "modelProvider": {
      "type": "select",
      "options": ["OpenAI", "Anthropic", "Google"],
      "description": "Select AI model provider"
    },
    "embeddingDimension": {
      "type": "number",
      "min": 384,
      "max": 4096,
      "description": "Embedding dimension size"
    }
  },
  "values": {
    "modelProvider": "Anthropic",
    "embeddingDimension": 1536
  }
}
```

### PUT /api/v1/plugins/{id}/settings

Update plugin settings (REST compliant).

**Request:**

```http
PUT /api/v1/plugins/plugin-1/settings?userId=550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "modelProvider": "OpenAI",
  "embeddingDimension": 3072
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Plugin settings updated successfully"
}
```

### POST /api/v1/plugins/{id}/toggle

Toggle plugin enabled state.

**Request:**

```http
POST /api/v1/plugins/plugin-1/toggle
Authorization: Bearer YOUR_API_KEY
```

**Response (200 OK):**

```json
{
  "id": "plugin-1",
  "name": "Advanced Search",
  "isEnabled": false
}
```

---

## Connections API (BYOK)

Manage your own API keys for multiple providers (Bring Your Own Key).

### GET /api/v1/connections

List all provider connections.

**Request:**

```http
GET /api/v1/connections?userId=550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer YOUR_API_KEY
```

**Response (200 OK):**

```json
[
  {
    "id": "conn-1",
    "provider": "OpenAI",
    "name": "My OpenAI Key",
    "isActive": true,
    "apiKeyPrefix": "sk-...",
    "createdAt": "2025-01-10T10:00:00Z",
    "lastUsed": "2025-01-18T17:30:00Z",
    "models": ["gpt-4", "gpt-3.5-turbo"]
  },
  {
    "id": "conn-2",
    "provider": "Anthropic",
    "name": "My Anthropic Key",
    "isActive": true,
    "apiKeyPrefix": "sk-ant-...",
    "createdAt": "2025-01-12T14:00:00Z",
    "lastUsed": "2025-01-18T16:45:00Z",
    "models": ["claude-3-5-sonnet-20241022", "claude-3-opus"]
  }
]
```

### POST /api/v1/connections

Create a new provider connection.

**Request:**

```http
POST /api/v1/connections?userId=550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "provider": "Google",
  "name": "Google Gemini API",
  "apiKey": "AIzaSyBt...",
  "isActive": true
}
```

**Response (201 Created):**

```json
{
  "id": "conn-new-1",
  "provider": "Google",
  "name": "Google Gemini API",
  "isActive": true,
  "apiKeyPrefix": "AIza...",
  "createdAt": "2025-01-18T18:35:00Z",
  "models": ["gemini-pro", "gemini-pro-vision"]
}
```

### PUT /api/v1/connections/{id}

Update a connection.

**Request:**

```http
PUT /api/v1/connections/conn-1?userId=550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "name": "OpenAI Production Key",
  "isActive": true
}
```

**Response (200 OK):**

```json
{
  "id": "conn-1",
  "provider": "OpenAI",
  "name": "OpenAI Production Key",
  "isActive": true,
  "updatedAt": "2025-01-18T18:40:00Z"
}
```

### DELETE /api/v1/connections/{id}

Delete a connection.

**Request:**

```http
DELETE /api/v1/connections/conn-1?userId=550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer YOUR_API_KEY
```

**Response (204 No Content)**

### POST /api/v1/connections/{id}/test

Test a connection.

**Request:**

```http
POST /api/v1/connections/conn-1/test?userId=550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer YOUR_API_KEY
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Connection test successful",
  "provider": "OpenAI",
  "availableModels": ["gpt-4", "gpt-3.5-turbo", "gpt-4-turbo"]
}
```

---

## Organization & Groups API

Manage organizations and user groups.

### GET /api/v1/organizations

List organizations for a user.

**Request:**

```http
GET /api/v1/organizations?userId=550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer YOUR_API_KEY
```

**Response (200 OK):**

```json
[
  {
    "id": "org-1",
    "name": "Tech Solutions Inc",
    "description": "Enterprise software development",
    "memberCount": 45,
    "createdAt": "2025-01-05T10:00:00Z",
    "updatedAt": "2025-01-18T15:00:00Z"
  }
]
```

### POST /api/v1/organizations

Create a new organization.

**Request:**

```http
POST /api/v1/organizations
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "name": "Innovation Labs",
  "description": "Research and development organization"
}
```

**Response (201 Created):**

```json
{
  "id": "org-new-1",
  "name": "Innovation Labs",
  "description": "Research and development organization",
  "memberCount": 1,
  "createdAt": "2025-01-18T18:45:00Z"
}
```

### GET /api/v1/groups

List groups for a user.

**Request:**

```http
GET /api/v1/groups?userId=550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer YOUR_API_KEY
```

**Response (200 OK):**

```json
[
  {
    "id": "group-1",
    "organizationId": "org-1",
    "name": "Backend Team",
    "description": "Backend development team",
    "memberCount": 8,
    "createdAt": "2025-01-10T10:00:00Z"
  }
]
```

### POST /api/v1/groups

Create a new group.

**Request:**

```http
POST /api/v1/groups
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "organizationId": "org-1",
  "name": "Frontend Team",
  "description": "Frontend development team"
}
```

**Response (201 Created):**

```json
{
  "id": "group-new-1",
  "organizationId": "org-1",
  "name": "Frontend Team",
  "description": "Frontend development team",
  "memberCount": 0,
  "createdAt": "2025-01-18T19:00:00Z"
}
```

---

## Structured Content API

Manage structured content and templates.

### GET /api/v1/structured-content/templates

List available content templates.

**Request:**

```http
GET /api/v1/structured-content/templates
Authorization: Bearer YOUR_API_KEY
```

**Response (200 OK):**

```json
[
  {
    "id": "template-1",
    "name": "Blog Post",
    "category": "Publishing",
    "description": "Standard blog post template",
    "fields": [
      {
        "name": "title",
        "type": "text",
        "required": true
      },
      {
        "name": "content",
        "type": "richtext",
        "required": true
      },
      {
        "name": "tags",
        "type": "array",
        "required": false
      }
    ]
  }
]
```

### POST /api/v1/structured-content/parse

Parse and validate structured content.

**Request:**

```http
POST /api/v1/structured-content/parse
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "templateId": "template-1",
  "data": {
    "title": "Getting Started with aiMate",
    "content": "Complete guide...",
    "tags": ["tutorial", "api"]
  }
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "parsed": {
    "title": "Getting Started with aiMate",
    "content": "Complete guide...",
    "tags": ["tutorial", "api"],
    "metadata": {
      "wordCount": 1250,
      "estimatedReadTime": "5 min"
    }
  }
}
```

---

## Code Examples

### cURL

**Non-streaming Chat:**

```bash
curl -X POST https://your-domain.com/api/v1/chat/completions \
  -H "Authorization: Bearer sk-aimate-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4",
    "messages": [
      {
        "role": "user",
        "content": "Explain REST API design principles"
      }
    ],
    "temperature": 0.7,
    "max_tokens": 500
  }'
```

**Streaming Chat:**

```bash
curl -N -X POST https://your-domain.com/api/v1/chat/completions/stream \
  -H "Authorization: Bearer sk-aimate-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4",
    "messages": [
      {"role": "user", "content": "Count to 10"}
    ],
    "stream": true
  }'
```

### Python

```python
import requests
import json

API_KEY = "sk-aimate-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
BASE_URL = "https://your-domain.com/api/v1"

# Chat Completion
response = requests.post(
    f"{BASE_URL}/chat/completions",
    headers={
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    },
    json={
        "model": "gpt-4",
        "messages": [
            {"role": "user", "content": "What is REST API?"}
        ],
        "temperature": 0.7
    }
)

result = response.json()
print(result["choices"][0]["message"]["content"])

# Create Workspace
workspace = requests.post(
    f"{BASE_URL}/workspaces?userId=your-user-id",
    headers={
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    },
    json={
        "name": "My Project",
        "description": "Project workspace",
        "type": "Project"
    }
)

print(workspace.json())
```

### JavaScript/TypeScript

```typescript
const API_KEY = "sk-aimate-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
const BASE_URL = "https://your-domain.com/api/v1";

// Chat Completion
async function chatCompletion(message: string): Promise<string> {
  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages: [{ role: "user", content: message }],
      temperature: 0.7
    })
  });

  const data = await response.json();
  return data.choices[0].message.content;
}

// Streaming Chat
async function streamChat(message: string, onChunk: (text: string) => void) {
  const response = await fetch(`${BASE_URL}/chat/completions/stream`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages: [{ role: "user", content: message }],
      stream: true
    })
  });

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n').filter(l => l.trim());

    for (const line of lines) {
      if (line === 'data: [DONE]') return;
      if (line.startsWith('data: ')) {
        const json = JSON.parse(line.slice(6));
        const content = json.choices[0]?.delta?.content || '';
        if (content) onChunk(content);
      }
    }
  }
}

// Usage
chatCompletion("What is the capital of New Zealand?")
  .then(response => console.log(response));

streamChat("Count to 5", (chunk) => {
  console.log(chunk);
});
```

### C#

```csharp
using System.Net.Http;
using System.Net.Http.Json;

public class AiMateClient
{
    private readonly HttpClient _httpClient;
    private const string BaseUrl = "https://your-domain.com/api/v1";
    private const string ApiKey = "sk-aimate-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx";

    public AiMateClient()
    {
        _httpClient = new HttpClient();
        _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {ApiKey}");
    }

    public async Task<string> ChatCompletionAsync(string message)
    {
        var request = new
        {
            model = "gpt-4",
            messages = new[] { new { role = "user", content = message } },
            temperature = 0.7
        };

        var response = await _httpClient.PostAsJsonAsync(
            $"{BaseUrl}/chat/completions",
            request
        );

        response.EnsureSuccessStatusCode();
        var result = await response.Content.ReadAsAsync<dynamic>();
        return result.choices[0].message.content;
    }

    public async Task<List<WorkspaceDto>> GetWorkspacesAsync(string userId)
    {
        var response = await _httpClient.GetAsync($"{BaseUrl}/workspaces?userId={userId}");
        response.EnsureSuccessStatusCode();

        return await response.Content.ReadAsAsync<List<WorkspaceDto>>()
            ?? new List<WorkspaceDto>();
    }
}
```

---

## Best Practices

### Error Handling

```typescript
async function safeChatCompletion(message: string): Promise<string> {
  try {
    const response = await fetch('/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [{ role: 'user', content: message }]
      })
    });

    if (!response.ok) {
      const error = await response.json();

      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = Number(response.headers.get('Retry-After')) || 60;
        console.log(`Rate limited. Retrying in ${retryAfter}s...`);
        await new Promise(r => setTimeout(r, retryAfter * 1000));
        return safeChatCompletion(message); // Retry
      }

      // Handle authentication
      if (response.status === 401) {
        throw new Error('Invalid API key');
      }

      // Handle other errors
      throw new Error(error.error.message);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}
```

### Rate Limit Handling with Exponential Backoff

```python
import time
import random

def chat_with_retry(message: str, max_retries: int = 5) -> str:
    for attempt in range(max_retries):
        try:
            response = requests.post(
                f"{BASE_URL}/chat/completions",
                headers={
                    "Authorization": f"Bearer {API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "gpt-4",
                    "messages": [{"role": "user", "content": message}]
                },
                timeout=30
            )

            if response.status_code == 429:
                retry_after = int(response.headers.get('Retry-After', 60))
                # Add jitter to prevent thundering herd
                wait_time = retry_after + random.uniform(0, 5)
                print(f"Rate limited. Retrying in {wait_time:.1f}s...")
                time.sleep(wait_time)
                continue

            response.raise_for_status()
            return response.json()["choices"][0]["message"]["content"]

        except requests.exceptions.RequestException as e:
            if attempt == max_retries - 1:
                raise
            # Exponential backoff for other errors
            wait_time = 2 ** attempt + random.uniform(0, 1)
            print(f"Error: {e}. Retrying in {wait_time:.1f}s...")
            time.sleep(wait_time)

    raise Exception("Max retries exceeded")
```

### Caching Responses

```typescript
const responseCache = new Map<string, { response: string; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function cachedChatCompletion(message: string): Promise<string> {
  // Check cache
  const cached = responseCache.get(message);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log("Cache hit");
    return cached.response;
  }

  // Call API
  const response = await chatCompletion(message);

  // Store in cache
  responseCache.set(message, {
    response,
    timestamp: Date.now()
  });

  return response;
}
```

### Streaming with Progress Tracking

```typescript
async function streamChatWithProgress(
  message: string,
  onChunk: (text: string) => void,
  onProgress: (percent: number) => void
): Promise<void> {
  const response = await fetch('/api/v1/chat/completions/stream', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [{ role: 'user', content: message }],
      stream: true
    })
  });

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let totalText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n').filter(l => l.trim());

    for (const line of lines) {
      if (line === 'data: [DONE]') {
        onProgress(100);
        return;
      }

      if (line.startsWith('data: ')) {
        const json = JSON.parse(line.slice(6));
        const content = json.choices[0]?.delta?.content || '';
        if (content) {
          totalText += content;
          onChunk(content);
          onProgress(Math.min(totalText.length / 10, 99)); // Rough estimate
        }
      }
    }
  }
}
```

### Batch Operations

```python
def batch_create_notes(notes: List[Dict], batch_size: int = 10) -> List[Dict]:
    """Create multiple notes efficiently with batching"""
    results = []

    for i in range(0, len(notes), batch_size):
        batch = notes[i:i + batch_size]

        # Create notes in parallel (using asyncio in production)
        for note in batch:
            response = requests.post(
                f"{BASE_URL}/notes?userId={USER_ID}",
                headers={"Authorization": f"Bearer {API_KEY}"},
                json=note
            )

            if response.status_code == 201:
                results.append(response.json())
            else:
                print(f"Error creating note: {response.text}")

        # Rate limiting between batches
        if i + batch_size < len(notes):
            time.sleep(1)

    return results
```

---

## Support & Resources

**API Documentation:** https://docs.aimate.co.nz
**GitHub Issues:** https://github.com/ChoonForge/aiMate/issues
**Community:** https://github.com/ChoonForge/aiMate/discussions
**Email Support:** api@aimate.co.nz

**Need Help?**

- 📖 Read the [Complete API Documentation](https://docs.aimate.co.nz)
- 💬 Ask in [GitHub Discussions](https://github.com/ChoonForge/aiMate/discussions)
- 🐛 Report bugs on [GitHub Issues](https://github.com/ChoonForge/aiMate/issues)
- 📧 Email: api@aimate.co.nz

---

**Built with ❤️ from New Zealand** 🇳🇿
**API Version:** v1


