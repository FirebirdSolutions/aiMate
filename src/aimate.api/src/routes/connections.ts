/**
 * Connections Routes
 *
 * Manage LLM server connections (LMStudio, Ollama, OpenAI, etc.)
 */

import { Router, type Request, type Response } from 'express';
import prisma from '../db/client.js';
import { z } from 'zod';

export const connectionsRouter = Router();

// Validation schemas
const createConnectionSchema = z.object({
  name: z.string().min(1),
  provider: z.string().optional(), // openai, anthropic, ollama, lmstudio, etc.
  baseUrl: z.string().url(),
  apiKey: z.string().optional(),
  isEnabled: z.boolean().optional().default(true),
  settings: z.record(z.unknown()).optional().default({}),
});

const updateConnectionSchema = createConnectionSchema.partial();

// TODO: Replace with actual auth middleware
const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000001';

/**
 * GET /connections
 * List all connections for the current user
 */
connectionsRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const connections = await prisma.connection.findMany({
      where: { userId: DEFAULT_USER_ID },
      include: {
        _count: { select: { models: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json(connections.map(conn => ({
      id: conn.id,
      name: conn.name,
      provider: conn.provider,
      baseUrl: conn.baseUrl,
      hasApiKey: !!conn.apiKey,
      isEnabled: conn.isEnabled,
      settings: conn.settings,
      modelCount: conn._count.models,
      createdAt: conn.createdAt.toISOString(),
      updatedAt: conn.updatedAt.toISOString(),
    })));
  } catch (error) {
    console.error('Error fetching connections:', error);
    res.status(500).json({ error: 'Failed to fetch connections' });
  }
});

/**
 * POST /connections
 * Create a new connection
 */
connectionsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const data = createConnectionSchema.parse(req.body);

    const connection = await prisma.connection.create({
      data: {
        userId: DEFAULT_USER_ID,
        name: data.name,
        provider: data.provider,
        baseUrl: data.baseUrl,
        apiKey: data.apiKey, // TODO: Encrypt in production
        isEnabled: data.isEnabled,
        settings: data.settings,
      },
    });

    res.status(201).json({
      id: connection.id,
      name: connection.name,
      provider: connection.provider,
      baseUrl: connection.baseUrl,
      hasApiKey: !!connection.apiKey,
      isEnabled: connection.isEnabled,
      settings: connection.settings,
      createdAt: connection.createdAt.toISOString(),
      updatedAt: connection.updatedAt.toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    console.error('Error creating connection:', error);
    res.status(500).json({ error: 'Failed to create connection' });
  }
});

/**
 * GET /connections/:id
 * Get a specific connection
 */
connectionsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const connection = await prisma.connection.findFirst({
      where: {
        id,
        userId: DEFAULT_USER_ID,
      },
      include: {
        models: true,
      },
    });

    if (!connection) {
      res.status(404).json({ error: 'Connection not found' });
      return;
    }

    res.json({
      id: connection.id,
      name: connection.name,
      provider: connection.provider,
      baseUrl: connection.baseUrl,
      hasApiKey: !!connection.apiKey,
      isEnabled: connection.isEnabled,
      settings: connection.settings,
      models: connection.models.map(m => ({
        id: m.id,
        modelId: m.modelId,
        name: m.name,
        contextWindow: m.contextWindow,
        capabilities: m.capabilities,
        isActive: m.isActive,
      })),
      createdAt: connection.createdAt.toISOString(),
      updatedAt: connection.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Error fetching connection:', error);
    res.status(500).json({ error: 'Failed to fetch connection' });
  }
});

/**
 * PATCH /connections/:id
 * Update a connection
 */
connectionsRouter.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = updateConnectionSchema.parse(req.body);

    const result = await prisma.connection.updateMany({
      where: {
        id,
        userId: DEFAULT_USER_ID,
      },
      data,
    });

    if (result.count === 0) {
      res.status(404).json({ error: 'Connection not found' });
      return;
    }

    const connection = await prisma.connection.findUnique({ where: { id } });
    res.json({
      id: connection!.id,
      name: connection!.name,
      provider: connection!.provider,
      baseUrl: connection!.baseUrl,
      hasApiKey: !!connection!.apiKey,
      isEnabled: connection!.isEnabled,
      settings: connection!.settings,
      createdAt: connection!.createdAt.toISOString(),
      updatedAt: connection!.updatedAt.toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    console.error('Error updating connection:', error);
    res.status(500).json({ error: 'Failed to update connection' });
  }
});

/**
 * DELETE /connections/:id
 * Delete a connection
 */
connectionsRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await prisma.connection.deleteMany({
      where: {
        id,
        userId: DEFAULT_USER_ID,
      },
    });

    if (result.count === 0) {
      res.status(404).json({ error: 'Connection not found' });
      return;
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting connection:', error);
    res.status(500).json({ error: 'Failed to delete connection' });
  }
});

/**
 * POST /connections/:id/test
 * Test a connection by fetching available models
 */
connectionsRouter.post('/:id/test', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const connection = await prisma.connection.findFirst({
      where: {
        id,
        userId: DEFAULT_USER_ID,
      },
    });

    if (!connection) {
      res.status(404).json({ error: 'Connection not found' });
      return;
    }

    // Test the connection by fetching models
    const testUrl = `${connection.baseUrl}/models`;
    console.log(`[connections] Testing connection to ${testUrl}`);

    const response = await fetch(testUrl, {
      headers: {
        ...(connection.apiKey && { 'Authorization': `Bearer ${connection.apiKey}` }),
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      res.status(400).json({
        success: false,
        error: `Connection failed: ${response.status}`,
        details: errorText,
      });
      return;
    }

    const data = await response.json() as { data?: Array<{ id: string; name?: string; owned_by?: string }> };
    const models = data.data || [];

    res.json({
      success: true,
      message: `Connected successfully. Found ${models.length} models.`,
      models: models.map((m: { id: string; name?: string; owned_by?: string }) => ({
        id: m.id,
        name: m.name || m.id,
        ownedBy: m.owned_by,
      })),
    });
  } catch (error) {
    console.error('Error testing connection:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Connection test failed',
    });
  }
});

/**
 * POST /connections/:id/sync-models
 * Sync available models from the connection
 */
connectionsRouter.post('/:id/sync-models', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const connection = await prisma.connection.findFirst({
      where: {
        id,
        userId: DEFAULT_USER_ID,
      },
    });

    if (!connection) {
      res.status(404).json({ error: 'Connection not found' });
      return;
    }

    // Fetch models from LLM server
    const modelsUrl = `${connection.baseUrl}/models`;
    const response = await fetch(modelsUrl, {
      headers: {
        ...(connection.apiKey && { 'Authorization': `Bearer ${connection.apiKey}` }),
      },
    });

    if (!response.ok) {
      res.status(400).json({ error: 'Failed to fetch models from server' });
      return;
    }

    const data = await response.json() as { data?: Array<{ id: string; name?: string; context_window?: number }> };
    const remoteModels = data.data || [];

    // Get existing models
    const existingModels = await prisma.model.findMany({
      where: { connectionId: id },
    });
    const existingModelIds = new Set(existingModels.map(m => m.modelId));

    // Add new models
    const newModels = [];
    for (const remote of remoteModels) {
      if (!existingModelIds.has(remote.id)) {
        const model = await prisma.model.create({
          data: {
            connectionId: id,
            modelId: remote.id,
            name: remote.name || remote.id,
            contextWindow: remote.context_window,
            capabilities: ['chat'],
            isActive: true,
          },
        });
        newModels.push(model);
      }
    }

    res.json({
      synced: newModels.length,
      total: remoteModels.length,
      models: newModels.map(m => ({
        id: m.id,
        modelId: m.modelId,
        name: m.name,
      })),
    });
  } catch (error) {
    console.error('Error syncing models:', error);
    res.status(500).json({ error: 'Failed to sync models' });
  }
});
