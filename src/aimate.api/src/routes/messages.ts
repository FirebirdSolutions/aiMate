/**
 * Messages Routes
 *
 * CRUD operations for messages (non-streaming).
 */

import { Router, type Request, type Response } from 'express';
import prisma from '../db/client.js';
import { z } from 'zod';

export const messagesRouter = Router();

// Validation schemas
const createMessageSchema = z.object({
  conversationId: z.string().uuid(),
  role: z.enum(['user', 'assistant', 'system', 'tool']),
  content: z.string(),
  model: z.string().optional(),
  metadata: z.record(z.unknown()).optional().default({}),
});

const updateMessageSchema = z.object({
  content: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

// TODO: Replace with actual auth middleware
const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000001';

/**
 * GET /messages/:id
 * Get a specific message
 */
messagesRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const message = await prisma.message.findFirst({
      where: { id },
      include: {
        conversation: {
          select: { userId: true },
        },
      },
    });

    if (!message || message.conversation.userId !== DEFAULT_USER_ID) {
      res.status(404).json({ error: 'Message not found' });
      return;
    }

    res.json({
      id: message.id,
      conversationId: message.conversationId,
      role: message.role,
      content: message.content,
      model: message.model,
      tokenCount: message.tokenCount,
      metadata: message.metadata,
      createdAt: message.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('Error fetching message:', error);
    res.status(500).json({ error: 'Failed to fetch message' });
  }
});

/**
 * POST /messages
 * Create a message (non-streaming)
 */
messagesRouter.post('/', async (req: Request, res: Response) => {
  try {
    const data = createMessageSchema.parse(req.body);

    // Verify conversation belongs to user
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: data.conversationId,
        userId: DEFAULT_USER_ID,
      },
    });

    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    const message = await prisma.message.create({
      data: {
        conversationId: data.conversationId,
        role: data.role,
        content: data.content,
        model: data.model,
        metadata: data.metadata as object,
      },
    });

    // Update conversation's updatedAt
    await prisma.conversation.update({
      where: { id: data.conversationId },
      data: { updatedAt: new Date() },
    });

    res.status(201).json({
      id: message.id,
      conversationId: message.conversationId,
      role: message.role,
      content: message.content,
      model: message.model,
      tokenCount: message.tokenCount,
      metadata: message.metadata,
      createdAt: message.createdAt.toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    console.error('Error creating message:', error);
    res.status(500).json({ error: 'Failed to create message' });
  }
});

/**
 * PATCH /messages/:id
 * Update a message (e.g., edit content)
 */
messagesRouter.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = updateMessageSchema.parse(req.body);

    // Verify message belongs to user's conversation
    const existing = await prisma.message.findFirst({
      where: { id },
      include: {
        conversation: {
          select: { userId: true },
        },
      },
    });

    if (!existing || existing.conversation.userId !== DEFAULT_USER_ID) {
      res.status(404).json({ error: 'Message not found' });
      return;
    }

    const message = await prisma.message.update({
      where: { id },
      data: {
        ...data,
        metadata: data.metadata as object | undefined,
      },
    });

    res.json({
      id: message.id,
      conversationId: message.conversationId,
      role: message.role,
      content: message.content,
      model: message.model,
      tokenCount: message.tokenCount,
      metadata: message.metadata,
      createdAt: message.createdAt.toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    console.error('Error updating message:', error);
    res.status(500).json({ error: 'Failed to update message' });
  }
});

/**
 * DELETE /messages/:id
 * Delete a message
 */
messagesRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Verify message belongs to user's conversation
    const existing = await prisma.message.findFirst({
      where: { id },
      include: {
        conversation: {
          select: { userId: true },
        },
      },
    });

    if (!existing || existing.conversation.userId !== DEFAULT_USER_ID) {
      res.status(404).json({ error: 'Message not found' });
      return;
    }

    await prisma.message.delete({ where: { id } });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

/**
 * POST /messages/:id/regenerate
 * Regenerate an assistant message
 */
messagesRouter.post('/:id/regenerate', async (_req: Request, res: Response) => {
  // This would typically:
  // 1. Get the conversation context up to this message
  // 2. Delete this message and any after it
  // 3. Re-send to the LLM
  // For now, return a placeholder

  res.status(501).json({
    error: 'Not implemented',
    message: 'Use POST /api/v1/chat/completions for regeneration',
  });
});

/**
 * POST /messages/:id/feedback
 * Submit feedback for a message
 */
messagesRouter.post('/:id/feedback', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    // Verify message belongs to user's conversation
    const message = await prisma.message.findFirst({
      where: { id },
      include: {
        conversation: {
          select: { userId: true },
        },
      },
    });

    if (!message || message.conversation.userId !== DEFAULT_USER_ID) {
      res.status(404).json({ error: 'Message not found' });
      return;
    }

    // Store feedback in metadata
    const metadata = (message.metadata as Record<string, unknown>) || {};
    metadata.feedback = {
      rating,
      comment,
      timestamp: new Date().toISOString(),
    };

    await prisma.message.update({
      where: { id },
      data: { metadata: metadata as object },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

/**
 * GET /messages/:id/stats
 * Get statistics for a message
 */
messagesRouter.get('/:id/stats', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const message = await prisma.message.findFirst({
      where: { id },
      include: {
        conversation: {
          select: { userId: true },
        },
      },
    });

    if (!message || message.conversation.userId !== DEFAULT_USER_ID) {
      res.status(404).json({ error: 'Message not found' });
      return;
    }

    res.json({
      tokenCount: message.tokenCount || 0,
      cost: message.cost ? parseFloat(message.cost.toString()) : 0,
      model: message.model || 'unknown',
      latency: (message.metadata as Record<string, unknown>)?.latency || 0,
    });
  } catch (error) {
    console.error('Error fetching message stats:', error);
    res.status(500).json({ error: 'Failed to fetch message stats' });
  }
});
