/**
 * Projects Hook
 * 
 * Manages project creation, collaboration, and organization
 */

import { useState, useEffect, useCallback } from 'react';
import { projectsService, ProjectDto, CreateProjectDto } from '../api/services';
import { AppConfig } from '../utils/config';

export function useProjects(workspaceId?: string) {
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // LOAD PROJECTS
  // ============================================================================

  const loadProjects = useCallback(async (wsId?: string) => {
    if (AppConfig.isOfflineMode()) {
      // Use mock projects in offline mode
      const mockProjects: ProjectDto[] = [
        {
          id: 'proj-1',
          name: 'aiMate.nz Platform',
          description: 'Building a sovereign AI platform for New Zealanders',
          workspaceId: wsId || 'default',
          icon: '🚀',
          color: '#8B5CF6',
          conversationIds: ['conv-1', 'conv-3'],
          documentIds: ['doc-1', 'doc-3'],
          collaborators: ['user-1', 'user-2'],
          status: 'active',
          createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'proj-2',
          name: 'Crisis Detection System',
          description: 'Safety features and NZ resource integration',
          workspaceId: wsId || 'default',
          icon: '🛡️',
          color: '#EF4444',
          conversationIds: ['conv-2'],
          documentIds: ['doc-2'],
          collaborators: ['user-1'],
          status: 'active',
          createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
          updatedAt: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: 'proj-3',
          name: 'API Integration',
          description: 'REST API implementation and documentation',
          workspaceId: wsId || 'default',
          icon: '⚡',
          color: '#3B82F6',
          conversationIds: [],
          documentIds: ['doc-3'],
          collaborators: ['user-1'],
          status: 'planning',
          createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
          updatedAt: new Date(Date.now() - 3600000).toISOString(),
        },
      ];
      setProjects(mockProjects);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await projectsService.getProjects(wsId);
      setProjects(data);
      setError(null);
    } catch (err) {
      console.error('[useProjects] Failed to load projects:', err);
      setError('Failed to load projects');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // ============================================================================
  // CREATE PROJECT
  // ============================================================================

  const createProject = useCallback(async (data: CreateProjectDto) => {
    if (AppConfig.isOfflineMode()) {
      const newProject: ProjectDto = {
        id: `proj-${Date.now()}`,
        name: data.name,
        description: data.description,
        workspaceId: data.workspaceId || 'default',
        icon: data.icon || '📁',
        color: data.color || '#8B5CF6',
        conversationIds: [],
        documentIds: [],
        collaborators: [],
        status: 'planning',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setProjects(prev => [newProject, ...prev]);
      return newProject;
    }

    try {
      const project = await projectsService.createProject(data);
      setProjects(prev => [project, ...prev]);
      return project;
    } catch (err) {
      console.error('[useProjects] Failed to create project:', err);
      throw err;
    }
  }, []);

  // ============================================================================
  // UPDATE PROJECT
  // ============================================================================

  const updateProject = useCallback(async (
    projectId: string, 
    updates: Partial<ProjectDto>
  ) => {
    // Optimistic update
    setProjects(prev => prev.map(proj => 
      proj.id === projectId ? { ...proj, ...updates } : proj
    ));

    if (AppConfig.isOfflineMode()) {
      return;
    }

    try {
      await projectsService.updateProject(projectId, updates);
    } catch (err) {
      console.error('[useProjects] Failed to update project:', err);
      await loadProjects(workspaceId); // Revert
      throw err;
    }
  }, [workspaceId, loadProjects]);

  // ============================================================================
  // DELETE PROJECT
  // ============================================================================

  const deleteProject = useCallback(async (projectId: string) => {
    // Optimistic update
    setProjects(prev => prev.filter(proj => proj.id !== projectId));

    if (AppConfig.isOfflineMode()) {
      return;
    }

    try {
      await projectsService.deleteProject(projectId);
    } catch (err) {
      console.error('[useProjects] Failed to delete project:', err);
      await loadProjects(workspaceId); // Revert
      throw err;
    }
  }, [workspaceId, loadProjects]);

  // ============================================================================
  // ADD CONVERSATION TO PROJECT
  // ============================================================================

  const addConversation = useCallback(async (projectId: string, conversationId: string) => {
    // Optimistic update
    setProjects(prev => prev.map(proj => 
      proj.id === projectId 
        ? { ...proj, conversationIds: [...(proj.conversationIds || []), conversationId] }
        : proj
    ));

    if (AppConfig.isOfflineMode()) {
      return;
    }

    try {
      await projectsService.addConversation(projectId, conversationId);
    } catch (err) {
      console.error('[useProjects] Failed to add conversation:', err);
      await loadProjects(workspaceId); // Revert
      throw err;
    }
  }, [workspaceId, loadProjects]);

  // ============================================================================
  // REMOVE CONVERSATION FROM PROJECT
  // ============================================================================

  const removeConversation = useCallback(async (projectId: string, conversationId: string) => {
    // Optimistic update
    setProjects(prev => prev.map(proj => 
      proj.id === projectId 
        ? { ...proj, conversationIds: (proj.conversationIds || []).filter(id => id !== conversationId) }
        : proj
    ));

    if (AppConfig.isOfflineMode()) {
      return;
    }

    try {
      await projectsService.removeConversation(projectId, conversationId);
    } catch (err) {
      console.error('[useProjects] Failed to remove conversation:', err);
      await loadProjects(workspaceId); // Revert
      throw err;
    }
  }, [workspaceId, loadProjects]);

  // ============================================================================
  // ADD DOCUMENT TO PROJECT
  // ============================================================================

  const addDocument = useCallback(async (projectId: string, documentId: string) => {
    // Optimistic update
    setProjects(prev => prev.map(proj => 
      proj.id === projectId 
        ? { ...proj, documentIds: [...(proj.documentIds || []), documentId] }
        : proj
    ));

    if (AppConfig.isOfflineMode()) {
      return;
    }

    try {
      await projectsService.addDocument(projectId, documentId);
    } catch (err) {
      console.error('[useProjects] Failed to add document:', err);
      await loadProjects(workspaceId); // Revert
      throw err;
    }
  }, [workspaceId, loadProjects]);

  // ============================================================================
  // ADD COLLABORATOR
  // ============================================================================

  const addCollaborator = useCallback(async (projectId: string, userId: string) => {
    // Optimistic update
    setProjects(prev => prev.map(proj => 
      proj.id === projectId 
        ? { ...proj, collaborators: [...(proj.collaborators || []), userId] }
        : proj
    ));

    if (AppConfig.isOfflineMode()) {
      return;
    }

    try {
      await projectsService.addCollaborator(projectId, userId);
    } catch (err) {
      console.error('[useProjects] Failed to add collaborator:', err);
      await loadProjects(workspaceId); // Revert
      throw err;
    }
  }, [workspaceId, loadProjects]);

  // ============================================================================
  // REMOVE COLLABORATOR
  // ============================================================================

  const removeCollaborator = useCallback(async (projectId: string, userId: string) => {
    // Optimistic update
    setProjects(prev => prev.map(proj => 
      proj.id === projectId 
        ? { ...proj, collaborators: (proj.collaborators || []).filter(id => id !== userId) }
        : proj
    ));

    if (AppConfig.isOfflineMode()) {
      return;
    }

    try {
      await projectsService.removeCollaborator(projectId, userId);
    } catch (err) {
      console.error('[useProjects] Failed to remove collaborator:', err);
      await loadProjects(workspaceId); // Revert
      throw err;
    }
  }, [workspaceId, loadProjects]);

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  useEffect(() => {
    loadProjects(workspaceId);
  }, [workspaceId, loadProjects]);

  return {
    projects,
    loading,
    error,
    
    // Actions
    refresh: () => loadProjects(workspaceId),
    createProject,
    updateProject,
    deleteProject,
    addConversation,
    removeConversation,
    addDocument,
    addCollaborator,
    removeCollaborator,
  };
}
