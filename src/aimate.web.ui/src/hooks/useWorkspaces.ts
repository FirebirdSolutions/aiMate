/**
 * Workspaces Hook
 * 
 * Manages workspace creation, switching, and organization
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { workspacesService, WorkspaceDto, CreateWorkspaceDto } from '../api/services';
import { AppConfig } from '../utils/config';

// Module-level cache to persist data across StrictMode remounts
let globalWorkspacesInitialized = false;
let globalWorkspacesCache: WorkspaceDto[] = [];
let globalCurrentWorkspaceCache: WorkspaceDto | null = null;

export function useWorkspaces() {
  const [workspaces, setWorkspaces] = useState<WorkspaceDto[]>(() => globalWorkspacesCache);
  const [currentWorkspace, setCurrentWorkspace] = useState<WorkspaceDto | null>(() => globalCurrentWorkspaceCache);
  const [loading, setLoading] = useState(!globalWorkspacesInitialized);
  const [error, setError] = useState<string | null>(null);
  const isInitializedRef = useRef(globalWorkspacesInitialized);

  // ============================================================================
  // LOAD WORKSPACES
  // ============================================================================

  const loadWorkspaces = useCallback(async () => {
    if (AppConfig.isOfflineMode()) {
      // Skip reload if already initialized in offline mode
      // Use global flag to survive StrictMode remounts
      if (globalWorkspacesInitialized) {
        console.log('[useWorkspaces] Skipping reload - already initialized');
        return;
      }

      console.log('[useWorkspaces] Loading workspaces...');
      
      // Use mock workspaces in offline mode
      const mockWorkspaces: WorkspaceDto[] = [
        {
          id: 'ws-default',
          name: 'Personal',
          description: 'My personal workspace',
          icon: '🏠',
          color: '#8B5CF6',
          isDefault: true,
          conversationCount: 15,
          createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'ws-work',
          name: 'Work',
          description: 'Professional projects and tasks',
          icon: '💼',
          color: '#3B82F6',
          isDefault: false,
          conversationCount: 8,
          createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'ws-research',
          name: 'Research',
          description: 'Research and learning',
          icon: '🔬',
          color: '#10B981',
          isDefault: false,
          conversationCount: 12,
          createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'ws-aimate',
          name: 'aiMate Development',
          description: 'Building aiMate.nz',
          icon: '🚀',
          color: '#F59E0B',
          isDefault: false,
          conversationCount: 24,
          createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      setWorkspaces(mockWorkspaces);
      setCurrentWorkspace(mockWorkspaces[0]);
      setLoading(false);
      isInitializedRef.current = true;
      globalWorkspacesInitialized = true;
      return;
    }

    try {
      setLoading(true);
      const data = await workspacesService.getWorkspaces();
      setWorkspaces(data);
      
      // Set default workspace as current if none selected
      const defaultWs = data.find(ws => ws.isDefault) || data[0];
      setCurrentWorkspace(prev => {
        // Only set if no current workspace exists
        return prev || defaultWs || null;
      });
      
      setError(null);
      isInitializedRef.current = true;
      globalWorkspacesInitialized = true;
    } catch (err) {
      console.error('[useWorkspaces] Failed to load workspaces:', err);
      setError('Failed to load workspaces');
      setWorkspaces([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // ============================================================================
  // CREATE WORKSPACE
  // ============================================================================

  const createWorkspace = useCallback(async (data: CreateWorkspaceDto) => {
    if (AppConfig.isOfflineMode()) {
      const newWorkspace: WorkspaceDto = {
        id: `ws-${Date.now()}`,
        name: data.name,
        description: data.description,
        icon: data.icon || '📁',
        color: data.color || '#8B5CF6',
        isDefault: false,
        conversationCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setWorkspaces(prev => [...prev, newWorkspace]);
      return newWorkspace;
    }

    try {
      const workspace = await workspacesService.createWorkspace(data);
      setWorkspaces(prev => [...prev, workspace]);
      return workspace;
    } catch (err) {
      console.error('[useWorkspaces] Failed to create workspace:', err);
      throw err;
    }
  }, []);

  // ============================================================================
  // UPDATE WORKSPACE
  // ============================================================================

  const updateWorkspace = useCallback(async (
    workspaceId: string, 
    updates: Partial<WorkspaceDto>
  ) => {
    // Optimistic update
    setWorkspaces(prev => prev.map(ws => 
      ws.id === workspaceId ? { ...ws, ...updates } : ws
    ));
    
    setCurrentWorkspace(prev => 
      prev?.id === workspaceId ? { ...prev, ...updates } : prev
    );

    if (AppConfig.isOfflineMode()) {
      return;
    }

    try {
      await workspacesService.updateWorkspace(workspaceId, updates);
    } catch (err) {
      console.error('[useWorkspaces] Failed to update workspace:', err);
      await loadWorkspaces(); // Revert
      throw err;
    }
  }, [loadWorkspaces]);

  // ============================================================================
  // DELETE WORKSPACE
  // ============================================================================

  const deleteWorkspace = useCallback(async (workspaceId: string) => {
    // Optimistic update
    let deletedWorkspaceWasCurrent = false;
    setWorkspaces(prev => {
      const filtered = prev.filter(ws => ws.id !== workspaceId);
      return filtered;
    });
    
    // Switch to default workspace if deleting current
    setCurrentWorkspace(prev => {
      if (prev?.id === workspaceId) {
        deletedWorkspaceWasCurrent = true;
        return null; // Will be set by the next setState
      }
      return prev;
    });
    
    if (deletedWorkspaceWasCurrent) {
      setWorkspaces(prev => {
        const defaultWs = prev.find(ws => ws.isDefault);
        if (defaultWs) {
          setCurrentWorkspace(defaultWs);
        }
        return prev;
      });
    }

    if (AppConfig.isOfflineMode()) {
      return;
    }

    try {
      await workspacesService.deleteWorkspace(workspaceId);
    } catch (err) {
      console.error('[useWorkspaces] Failed to delete workspace:', err);
      await loadWorkspaces(); // Revert
      throw err;
    }
  }, [loadWorkspaces]);

  // ============================================================================
  // SWITCH WORKSPACE
  // ============================================================================

  const switchWorkspace = useCallback(async (workspaceId: string) => {
    setWorkspaces(prev => {
      const workspace = prev.find(ws => ws.id === workspaceId);
      if (workspace) {
        setCurrentWorkspace(workspace);
        
        // Store in localStorage for persistence
        try {
          localStorage.setItem('aiMate:currentWorkspace', workspaceId);
        } catch (err) {
          console.error('[useWorkspaces] Failed to store current workspace:', err);
        }
      }
      return prev;
    });
  }, []);

  // ============================================================================
  // SET DEFAULT WORKSPACE
  // ============================================================================

  const setDefaultWorkspace = useCallback(async (workspaceId: string) => {
    if (AppConfig.isOfflineMode()) {
      setWorkspaces(prev => prev.map(ws => ({
        ...ws,
        isDefault: ws.id === workspaceId,
      })));
      return;
    }

    try {
      await workspacesService.setDefaultWorkspace(workspaceId);
      await loadWorkspaces();
    } catch (err) {
      console.error('[useWorkspaces] Failed to set default workspace:', err);
      throw err;
    }
  }, [loadWorkspaces]);

  // ============================================================================
  // DUPLICATE WORKSPACE
  // ============================================================================

  const duplicateWorkspace = useCallback(async (workspaceId: string) => {
    if (AppConfig.isOfflineMode()) {
      let duplicate: WorkspaceDto | undefined;
      setWorkspaces(prev => {
        const original = prev.find(ws => ws.id === workspaceId);
        if (!original) return prev;
        
        duplicate = {
          ...original,
          id: `ws-${Date.now()}`,
          name: `${original.name} (Copy)`,
          isDefault: false,
          conversationCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        return [...prev, duplicate];
      });
      return duplicate;
    }

    try {
      const duplicated = await workspacesService.duplicateWorkspace(workspaceId);
      setWorkspaces(prev => [...prev, duplicated]);
      return duplicated;
    } catch (err) {
      console.error('[useWorkspaces] Failed to duplicate workspace:', err);
      throw err;
    }
  }, []);

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  useEffect(() => {
    loadWorkspaces();
  }, [loadWorkspaces]);

  // Restore last workspace from localStorage
  useEffect(() => {
    if (workspaces.length > 0 && !currentWorkspace) {
      try {
        const savedWorkspaceId = localStorage.getItem('aiMate:currentWorkspace');
        if (savedWorkspaceId) {
          const savedWorkspace = workspaces.find(ws => ws.id === savedWorkspaceId);
          if (savedWorkspace) {
            setCurrentWorkspace(savedWorkspace);
            return;
          }
        }
      } catch (err) {
        console.error('[useWorkspaces] Failed to restore workspace:', err);
      }
      
      // Fallback to default workspace
      const defaultWs = workspaces.find(ws => ws.isDefault) || workspaces[0];
      setCurrentWorkspace(defaultWs);
    }
  }, [workspaces, currentWorkspace]);

  // Sync module-level cache whenever workspaces or currentWorkspace change
  useEffect(() => {
    globalWorkspacesCache = workspaces;
  }, [workspaces]);

  useEffect(() => {
    globalCurrentWorkspaceCache = currentWorkspace;
  }, [currentWorkspace]);

  return {
    workspaces,
    currentWorkspace,
    loading,
    error,
    
    // Actions
    refresh: loadWorkspaces,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    switchWorkspace,
    setDefaultWorkspace,
    duplicateWorkspace,
  };
}
