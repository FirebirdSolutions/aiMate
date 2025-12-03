/**
 * Conversations Routes
 *
 * CRUD operations for conversations.
 */

import { Router, type Request, type Response } from 'express';
import prisma from '../db/client.js';
import { z } from 'zod';

export const conversationsRouter = Router();

// Validation schemas
const createConversationSchema = z.object({
  title: z.string().optional().default('New Conversation'),
  workspaceId: z.string().uuid().optional(),
  tags: z.array(z.string()).optional().default([]),
  metadata: z.record(z.unknown()).optional().default({}),
});

const updateConversationSchema = z.object({
  title: z.string().optional(),
  isArchived: z.boolean().optional(),
  isPinned: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

// TODO: Replace with actual auth middleware
const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000001';

/**
 * GET /conversations
 * List all conversations for the current user
 */
conversationsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { workspaceId, archived, search, limit = '50', offset = '0' } = req.query;

    const conversations = await prisma.conversation.findMany({
      where: {
        userId: DEFAULT_USER_ID,
        ...(workspaceId && { workspaceId: workspaceId as string }),
        ...(archived !== undefined && { isArchived: archived === 'true' }),
        ...(search && {
          title: { contains: search as string, mode: 'insensitive' },
        }),
      },
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: { content: true, createdAt: true },
        },
        _count: { select: { messages: true } },
      },
      orderBy: [
        { isPinned: 'desc' },
        { updatedAt: 'desc' },
      ],
      take: parseInt(limit as string, 10),
      skip: parseInt(offset as string, 10),
    });

    res.json(conversations.map(conv => ({
      id: conv.id,
      title: conv.title,
      workspaceId: conv.workspaceId,
      isArchived: conv.isArchived,
      isPinned: conv.isPinned,
      tags: conv.tags,
      metadata: conv.metadata,
      messageCount: conv._count.messages,
      lastMessage: conv.messages[0]?.content?.substring(0, 100),
      createdAt: conv.createdAt.toISOString(),
      updatedAt: conv.updatedAt.toISOString(),
    })));
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

/**
 * POST /conversations
 * Create a new conversation
 */
conversationsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const data = createConversationSchema.parse(req.body);

    const conversation = await prisma.conversation.create({
      data: {
        userId: DEFAULT_USER_ID,
        title: data.title,
        workspaceId: data.workspaceId,
        tags: data.tags as string[],
        metadata: data.metadata as object,
      },
    });

    res.status(201).json({
      id: conversation.id,
      title: conversation.title,
      workspaceId: conversation.workspaceId,
      isArchived: conversation.isArchived,
      isPinned: conversation.isPinned,
      tags: conversation.tags,
      metadata: conversation.metadata,
      createdAt: conversation.createdAt.toISOString(),
      updatedAt: conversation.updatedAt.toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    console.error('Error creating conversation:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

/**
 * GET /conversations/:id
 * Get a specific conversation with messages
 */
conversationsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        userId: DEFAULT_USER_ID,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    res.json({
      id: conversation.id,
      title: conversation.title,
      workspaceId: conversation.workspaceId,
      isArchived: conversation.isArchived,
      isPinned: conversation.isPinned,
      tags: conversation.tags,
      metadata: conversation.metadata,
      messages: conversation.messages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        model: msg.model,
        tokenCount: msg.tokenCount,
        metadata: msg.metadata,
        createdAt: msg.createdAt.toISOString(),
      })),
      createdAt: conversation.createdAt.toISOString(),
      updatedAt: conversation.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

/**
 * PATCH /conversations/:id
 * Update a conversation
 */
conversationsRouter.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = updateConversationSchema.parse(req.body);

    const conversation = await prisma.conversation.updateMany({
      where: {
        id,
        userId: DEFAULT_USER_ID,
      },
      data: {
        ...data,
        tags: data.tags as string[] | undefined,
        metadata: data.metadata as object | undefined,
      },
    });

    if (conversation.count === 0) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    const updated = await prisma.conversation.findUnique({ where: { id } });
    res.json({
      id: updated!.id,
      title: updated!.title,
      workspaceId: updated!.workspaceId,
      isArchived: updated!.isArchived,
      isPinned: updated!.isPinned,
      tags: updated!.tags,
      metadata: updated!.metadata,
      createdAt: updated!.createdAt.toISOString(),
      updatedAt: updated!.updatedAt.toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    console.error('Error updating conversation:', error);
    res.status(500).json({ error: 'Failed to update conversation' });
  }
});

/**
 * DELETE /conversations/:id
 * Delete a conversation
 */
conversationsRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await prisma.conversation.deleteMany({
      where: {
        id,
        userId: DEFAULT_USER_ID,
      },
    });

    if (result.count === 0) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

/**
 * GET /conversations/:id/messages
 * Get messages for a conversation
 */
conversationsRouter.get('/:id/messages', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Verify conversation belongs to user
    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        userId: DEFAULT_USER_ID,
      },
    });

    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    const messages = await prisma.message.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: 'asc' },
    });

    res.json(messages.map(msg => ({
      id: msg.id,
      conversationId: msg.conversationId,
      role: msg.role,
      content: msg.content,
      model: msg.model,
      tokenCount: msg.tokenCount,
      metadata: msg.metadata,
      createdAt: msg.createdAt.toISOString(),
    })));
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});
