/**
 * Models Routes
 *
 * Manage available models from LLM connections.
 */

import { Router, type Request, type Response } from 'express';
import prisma from '../db/client.js';
import { z } from 'zod';

export const modelsRouter = Router();

const updateModelSchema = z.object({
  name: z.string().optional(),
  contextWindow: z.number().optional(),
  capabilities: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

// TODO: Replace with actual auth middleware
const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000001';

/**
 * GET /models
 * List all models from enabled connections
 */
modelsRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const models = await prisma.model.findMany({
      where: {
        connection: {
          userId: DEFAULT_USER_ID,
          isEnabled: true,
        },
      },
      include: {
        connection: {
          select: {
            id: true,
            name: true,
            provider: true,
            baseUrl: true,
          },
        },
      },
      orderBy: [
        { connection: { name: 'asc' } },
        { name: 'asc' },
      ],
    });

    res.json(models.map(m => ({
      id: m.id,
      modelId: m.modelId,
      name: m.name,
      contextWindow: m.contextWindow,
      capabilities: m.capabilities,
      isActive: m.isActive,
      connection: {
        id: m.connection.id,
        name: m.connection.name,
        provider: m.connection.provider,
      },
      createdAt: m.createdAt.toISOString(),
    })));
  } catch (error) {
    console.error('Error fetching models:', error);
    res.status(500).json({ error: 'Failed to fetch models' });
  }
});

/**
 * GET /models/active
 * List only active models
 */
modelsRouter.get('/active', async (_req: Request, res: Response) => {
  try {
    const models = await prisma.model.findMany({
      where: {
        isActive: true,
        connection: {
          userId: DEFAULT_USER_ID,
          isEnabled: true,
        },
      },
      include: {
        connection: {
          select: {
            id: true,
            name: true,
            provider: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json(models.map(m => ({
      id: m.id,
      modelId: m.modelId,
      name: m.name,
      contextWindow: m.contextWindow,
      capabilities: m.capabilities,
      connection: {
        id: m.connection.id,
        name: m.connection.name,
        provider: m.connection.provider,
      },
    })));
  } catch (error) {
    console.error('Error fetching active models:', error);
    res.status(500).json({ error: 'Failed to fetch active models' });
  }
});

/**
 * GET /models/:id
 * Get a specific model
 */
modelsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const model = await prisma.model.findFirst({
      where: {
        id,
        connection: {
          userId: DEFAULT_USER_ID,
        },
      },
      include: {
        connection: {
          select: {
            id: true,
            name: true,
            provider: true,
            baseUrl: true,
          },
        },
      },
    });

    if (!model) {
      res.status(404).json({ error: 'Model not found' });
      return;
    }

    res.json({
      id: model.id,
      modelId: model.modelId,
      name: model.name,
      contextWindow: model.contextWindow,
      capabilities: model.capabilities,
      isActive: model.isActive,
      connection: model.connection,
      createdAt: model.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('Error fetching model:', error);
    res.status(500).json({ error: 'Failed to fetch model' });
  }
});

/**
 * PATCH /models/:id
 * Update a model
 */
modelsRouter.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = updateModelSchema.parse(req.body);

    // Verify model belongs to user's connection
    const existing = await prisma.model.findFirst({
      where: {
        id,
        connection: {
          userId: DEFAULT_USER_ID,
        },
      },
    });

    if (!existing) {
      res.status(404).json({ error: 'Model not found' });
      return;
    }

    const model = await prisma.model.update({
      where: { id },
      data,
      include: {
        connection: {
          select: {
            id: true,
            name: true,
            provider: true,
          },
        },
      },
    });

    res.json({
      id: model.id,
      modelId: model.modelId,
      name: model.name,
      contextWindow: model.contextWindow,
      capabilities: model.capabilities,
      isActive: model.isActive,
      connection: model.connection,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    console.error('Error updating model:', error);
    res.status(500).json({ error: 'Failed to update model' });
  }
});

/**
 * POST /models/:id/enable
 * Enable a model
 */
modelsRouter.post('/:id/enable', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Verify model belongs to user's connection
    const existing = await prisma.model.findFirst({
      where: {
        id,
        connection: {
          userId: DEFAULT_USER_ID,
        },
      },
    });

    if (!existing) {
      res.status(404).json({ error: 'Model not found' });
      return;
    }

    await prisma.model.update({
      where: { id },
      data: { isActive: true },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error enabling model:', error);
    res.status(500).json({ error: 'Failed to enable model' });
  }
});

/**
 * POST /models/:id/disable
 * Disable a model
 */
modelsRouter.post('/:id/disable', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Verify model belongs to user's connection
    const existing = await prisma.model.findFirst({
      where: {
        id,
        connection: {
          userId: DEFAULT_USER_ID,
        },
      },
    });

    if (!existing) {
      res.status(404).json({ error: 'Model not found' });
      return;
    }

    await prisma.model.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error disabling model:', error);
    res.status(500).json({ error: 'Failed to disable model' });
  }
});

/**
 * DELETE /models/:id
 * Delete a model
 */
modelsRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Verify model belongs to user's connection
    const existing = await prisma.model.findFirst({
      where: {
        id,
        connection: {
          userId: DEFAULT_USER_ID,
        },
      },
    });

    if (!existing) {
      res.status(404).json({ error: 'Model not found' });
      return;
    }

    await prisma.model.delete({ where: { id } });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting model:', error);
    res.status(500).json({ error: 'Failed to delete model' });
  }
});
