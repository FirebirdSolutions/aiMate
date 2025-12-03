/**
 * Workspaces Routes
 *
 * Manage workspaces for organizing conversations.
 */

import { Router, type Request, type Response } from 'express';
import prisma from '../db/client.js';
import { z } from 'zod';

export const workspacesRouter = Router();

const createWorkspaceSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  isDefault: z.boolean().optional().default(false),
});

const updateWorkspaceSchema = createWorkspaceSchema.partial();

// TODO: Replace with actual auth middleware
const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000001';

/**
 * GET /workspaces
 * List all workspaces for the current user
 */
workspacesRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const workspaces = await prisma.workspace.findMany({
      where: { userId: DEFAULT_USER_ID },
      include: {
        _count: { select: { conversations: true } },
      },
      orderBy: [
        { isDefault: 'desc' },
        { name: 'asc' },
      ],
    });

    res.json(workspaces.map(w => ({
      id: w.id,
      name: w.name,
      description: w.description,
      color: w.color,
      icon: w.icon,
      isDefault: w.isDefault,
      conversationCount: w._count.conversations,
      createdAt: w.createdAt.toISOString(),
      updatedAt: w.updatedAt.toISOString(),
    })));
  } catch (error) {
    console.error('Error fetching workspaces:', error);
    res.status(500).json({ error: 'Failed to fetch workspaces' });
  }
});

/**
 * POST /workspaces
 * Create a new workspace
 */
workspacesRouter.post('/', async (req: Request, res: Response) => {
  try {
    const data = createWorkspaceSchema.parse(req.body);

    // If setting as default, unset other defaults
    if (data.isDefault) {
      await prisma.workspace.updateMany({
        where: { userId: DEFAULT_USER_ID, isDefault: true },
        data: { isDefault: false },
      });
    }

    const workspace = await prisma.workspace.create({
      data: {
        userId: DEFAULT_USER_ID,
        name: data.name,
        description: data.description,
        color: data.color,
        icon: data.icon,
        isDefault: data.isDefault,
      },
    });

    res.status(201).json({
      id: workspace.id,
      name: workspace.name,
      description: workspace.description,
      color: workspace.color,
      icon: workspace.icon,
      isDefault: workspace.isDefault,
      createdAt: workspace.createdAt.toISOString(),
      updatedAt: workspace.updatedAt.toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    console.error('Error creating workspace:', error);
    res.status(500).json({ error: 'Failed to create workspace' });
  }
});

/**
 * GET /workspaces/:id
 * Get a specific workspace
 */
workspacesRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const workspace = await prisma.workspace.findFirst({
      where: {
        id,
        userId: DEFAULT_USER_ID,
      },
      include: {
        _count: { select: { conversations: true } },
      },
    });

    if (!workspace) {
      res.status(404).json({ error: 'Workspace not found' });
      return;
    }

    res.json({
      id: workspace.id,
      name: workspace.name,
      description: workspace.description,
      color: workspace.color,
      icon: workspace.icon,
      isDefault: workspace.isDefault,
      conversationCount: workspace._count.conversations,
      createdAt: workspace.createdAt.toISOString(),
      updatedAt: workspace.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Error fetching workspace:', error);
    res.status(500).json({ error: 'Failed to fetch workspace' });
  }
});

/**
 * PATCH /workspaces/:id
 * Update a workspace
 */
workspacesRouter.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = updateWorkspaceSchema.parse(req.body);

    // If setting as default, unset other defaults
    if (data.isDefault) {
      await prisma.workspace.updateMany({
        where: {
          userId: DEFAULT_USER_ID,
          isDefault: true,
          id: { not: id },
        },
        data: { isDefault: false },
      });
    }

    const result = await prisma.workspace.updateMany({
      where: {
        id,
        userId: DEFAULT_USER_ID,
      },
      data,
    });

    if (result.count === 0) {
      res.status(404).json({ error: 'Workspace not found' });
      return;
    }

    const workspace = await prisma.workspace.findUnique({ where: { id } });
    res.json({
      id: workspace!.id,
      name: workspace!.name,
      description: workspace!.description,
      color: workspace!.color,
      icon: workspace!.icon,
      isDefault: workspace!.isDefault,
      createdAt: workspace!.createdAt.toISOString(),
      updatedAt: workspace!.updatedAt.toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    console.error('Error updating workspace:', error);
    res.status(500).json({ error: 'Failed to update workspace' });
  }
});

/**
 * DELETE /workspaces/:id
 * Delete a workspace (conversations are moved to null workspace)
 */
workspacesRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Move conversations to null workspace first
    await prisma.conversation.updateMany({
      where: { workspaceId: id },
      data: { workspaceId: null },
    });

    const result = await prisma.workspace.deleteMany({
      where: {
        id,
        userId: DEFAULT_USER_ID,
      },
    });

    if (result.count === 0) {
      res.status(404).json({ error: 'Workspace not found' });
      return;
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting workspace:', error);
    res.status(500).json({ error: 'Failed to delete workspace' });
  }
});
