/**
 * Memories Routes
 *
 * Manage persistent user memories for context.
 */

import { Router, type Request, type Response } from 'express';
import prisma from '../db/client.js';
import { z } from 'zod';

export const memoriesRouter = Router();

const createMemorySchema = z.object({
  content: z.string().min(1),
  category: z.string().optional(),
  source: z.enum(['manual', 'auto_extracted']).optional().default('manual'),
});

const updateMemorySchema = z.object({
  content: z.string().min(1).optional(),
  category: z.string().optional(),
  isActive: z.boolean().optional(),
});

// TODO: Replace with actual auth middleware
const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000001';

/**
 * GET /memories
 * List all memories for the current user
 */
memoriesRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { category, active } = req.query;

    const memories = await prisma.memory.findMany({
      where: {
        userId: DEFAULT_USER_ID,
        ...(category && { category: category as string }),
        ...(active !== undefined && { isActive: active === 'true' }),
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(memories.map(m => ({
      id: m.id,
      content: m.content,
      category: m.category,
      source: m.source,
      isActive: m.isActive,
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
    })));
  } catch (error) {
    console.error('Error fetching memories:', error);
    res.status(500).json({ error: 'Failed to fetch memories' });
  }
});

/**
 * POST /memories
 * Create a new memory
 */
memoriesRouter.post('/', async (req: Request, res: Response) => {
  try {
    const data = createMemorySchema.parse(req.body);

    const memory = await prisma.memory.create({
      data: {
        userId: DEFAULT_USER_ID,
        content: data.content,
        category: data.category,
        source: data.source,
      },
    });

    res.status(201).json({
      id: memory.id,
      content: memory.content,
      category: memory.category,
      source: memory.source,
      isActive: memory.isActive,
      createdAt: memory.createdAt.toISOString(),
      updatedAt: memory.updatedAt.toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    console.error('Error creating memory:', error);
    res.status(500).json({ error: 'Failed to create memory' });
  }
});

/**
 * GET /memories/:id
 * Get a specific memory
 */
memoriesRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const memory = await prisma.memory.findFirst({
      where: {
        id,
        userId: DEFAULT_USER_ID,
      },
    });

    if (!memory) {
      res.status(404).json({ error: 'Memory not found' });
      return;
    }

    res.json({
      id: memory.id,
      content: memory.content,
      category: memory.category,
      source: memory.source,
      isActive: memory.isActive,
      createdAt: memory.createdAt.toISOString(),
      updatedAt: memory.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Error fetching memory:', error);
    res.status(500).json({ error: 'Failed to fetch memory' });
  }
});

/**
 * PATCH /memories/:id
 * Update a memory
 */
memoriesRouter.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = updateMemorySchema.parse(req.body);

    const result = await prisma.memory.updateMany({
      where: {
        id,
        userId: DEFAULT_USER_ID,
      },
      data,
    });

    if (result.count === 0) {
      res.status(404).json({ error: 'Memory not found' });
      return;
    }

    const memory = await prisma.memory.findUnique({ where: { id } });
    res.json({
      id: memory!.id,
      content: memory!.content,
      category: memory!.category,
      source: memory!.source,
      isActive: memory!.isActive,
      createdAt: memory!.createdAt.toISOString(),
      updatedAt: memory!.updatedAt.toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    console.error('Error updating memory:', error);
    res.status(500).json({ error: 'Failed to update memory' });
  }
});

/**
 * DELETE /memories/:id
 * Delete a memory
 */
memoriesRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await prisma.memory.deleteMany({
      where: {
        id,
        userId: DEFAULT_USER_ID,
      },
    });

    if (result.count === 0) {
      res.status(404).json({ error: 'Memory not found' });
      return;
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting memory:', error);
    res.status(500).json({ error: 'Failed to delete memory' });
  }
});

/**
 * GET /memories/active
 * Get all active memories (for chat context injection)
 */
memoriesRouter.get('/context/active', async (_req: Request, res: Response) => {
  try {
    const memories = await prisma.memory.findMany({
      where: {
        userId: DEFAULT_USER_ID,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20, // Limit for context window
    });

    // Format for injection into system prompt
    const context = memories.map(m => `- ${m.content}`).join('\n');

    res.json({
      count: memories.length,
      context,
      memories: memories.map(m => ({
        id: m.id,
        content: m.content,
        category: m.category,
      })),
    });
  } catch (error) {
    console.error('Error fetching active memories:', error);
    res.status(500).json({ error: 'Failed to fetch active memories' });
  }
});
