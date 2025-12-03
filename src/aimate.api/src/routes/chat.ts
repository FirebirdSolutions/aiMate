/**
 * Chat Routes
 *
 * SSE streaming chat completions that proxy to LLM servers.
 * This is the core endpoint that the frontend uses for chat.
 */

import { Router, type Request, type Response } from 'express';
import prisma from '../db/client.js';
import { z } from 'zod';

export const chatRouter = Router();

// Validation schema matching OpenAI API format
const chatCompletionSchema = z.object({
  model: z.string(),
  messages: z.array(z.object({
    role: z.enum(['system', 'user', 'assistant', 'tool']),
    content: z.string(),
    name: z.string().optional(),
    tool_calls: z.array(z.unknown()).optional(),
    tool_call_id: z.string().optional(),
  })),
  temperature: z.number().min(0).max(2).optional().default(0.7),
  max_tokens: z.number().optional(),
  stream: z.boolean().optional().default(true),
  // aiMate-specific fields
  conversationId: z.string().uuid().optional(),
  connectionId: z.string().uuid().optional(),
});

// TODO: Replace with actual auth middleware
const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000001';

/**
 * POST /chat/completions
 * OpenAI-compatible chat completions endpoint with SSE streaming
 */
chatRouter.post('/completions', async (req: Request, res: Response) => {
  try {
    const data = chatCompletionSchema.parse(req.body);

    // Get the connection to use (either specified or find enabled one)
    let connection;
    if (data.connectionId) {
      connection = await prisma.connection.findFirst({
        where: {
          id: data.connectionId,
          userId: DEFAULT_USER_ID,
          isEnabled: true,
        },
      });
    } else {
      // Find first enabled connection
      connection = await prisma.connection.findFirst({
        where: {
          userId: DEFAULT_USER_ID,
          isEnabled: true,
        },
        orderBy: { createdAt: 'asc' },
      });
    }

    if (!connection) {
      res.status(400).json({
        error: 'No LLM connection available',
        message: 'Please configure an LLM connection in settings',
      });
      return;
    }

    // Save user message if conversationId provided
    let conversationId = data.conversationId;
    const userMessage = data.messages[data.messages.length - 1];

    if (conversationId && userMessage.role === 'user') {
      await prisma.message.create({
        data: {
          conversationId,
          role: 'user',
          content: userMessage.content,
          metadata: {},
        },
      });
    }

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
    res.flushHeaders();

    // Proxy request to LLM server
    const llmUrl = `${connection.baseUrl}/chat/completions`;
    const llmPayload = {
      model: data.model,
      messages: data.messages,
      temperature: data.temperature,
      max_tokens: data.max_tokens,
      stream: true,
    };

    console.log(`[chat] Proxying to ${llmUrl} with model ${data.model}`);

    const llmResponse = await fetch(llmUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(connection.apiKey && { 'Authorization': `Bearer ${connection.apiKey}` }),
      },
      body: JSON.stringify(llmPayload),
    });

    if (!llmResponse.ok) {
      const errorText = await llmResponse.text();
      console.error(`[chat] LLM error: ${llmResponse.status} ${errorText}`);
      res.write(`data: ${JSON.stringify({ error: true, message: errorText })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }

    // Stream the response
    const reader = llmResponse.body?.getReader();
    if (!reader) {
      res.write(`data: ${JSON.stringify({ error: true, message: 'No response body' })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }

    const decoder = new TextDecoder();
    let fullContent = '';
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE messages
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6);
          if (jsonStr === '[DONE]') {
            // Stream complete - save assistant message
            if (conversationId && fullContent) {
              await prisma.message.create({
                data: {
                  conversationId,
                  role: 'assistant',
                  content: fullContent,
                  model: data.model,
                  metadata: {},
                },
              });

              // Update conversation title if this is the first exchange
              const conversation = await prisma.conversation.findUnique({
                where: { id: conversationId },
                include: { messages: { take: 3 } },
              });

              if (conversation && conversation.messages.length <= 2 && conversation.title === 'New Conversation') {
                // Generate title from first user message
                const firstUserMsg = data.messages.find(m => m.role === 'user');
                if (firstUserMsg) {
                  const title = firstUserMsg.content.substring(0, 50) + (firstUserMsg.content.length > 50 ? '...' : '');
                  await prisma.conversation.update({
                    where: { id: conversationId },
                    data: { title },
                  });
                }
              }
            }

            res.write('data: [DONE]\n\n');
            continue;
          }

          try {
            const chunk = JSON.parse(jsonStr);
            const content = chunk.choices?.[0]?.delta?.content;
            if (content) {
              fullContent += content;
            }
            // Forward the chunk to the client
            res.write(`data: ${jsonStr}\n\n`);
          } catch {
            // Skip malformed JSON
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    res.end();
  } catch (error) {
    console.error('[chat] Error:', error);

    if (!res.headersSent) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation error', details: error.errors });
      } else {
        res.status(500).json({ error: 'Chat completion failed' });
      }
    } else {
      // Headers already sent (SSE mode), send error as event
      res.write(`data: ${JSON.stringify({ error: true, message: error instanceof Error ? error.message : 'Unknown error' })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    }
  }
});

/**
 * POST /chat/send
 * Alternative endpoint - use /chat/completions instead
 */
chatRouter.post('/send', (_req: Request, res: Response) => {
  res.status(501).json({
    error: 'Use POST /api/v1/chat/completions instead',
  });
});
