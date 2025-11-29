/**
 * Projects Service
 * 
 * Handles project management and collaboration
 */

import { apiClient } from '../client';
import { ProjectDto, CreateProjectDto, UpdateProjectDto } from '../types';

class ProjectsService {
  /**
   * Get all projects for a workspace
   */
  async getProjects(workspaceId?: string): Promise<ProjectDto[]> {
    const params = workspaceId ? { workspaceId } : {};
    return apiClient.get<ProjectDto[]>('/projects', params);
  }

  /**
   * Get a specific project
   */
  async getProject(projectId: string): Promise<ProjectDto> {
    return apiClient.get<ProjectDto>(`/projects/${projectId}`);
  }

  /**
   * Create a new project
   */
  async createProject(data: CreateProjectDto): Promise<ProjectDto> {
    return apiClient.post<ProjectDto>('/projects', data);
  }

  /**
   * Update a project
   */
  async updateProject(
    projectId: string,
    data: Partial<UpdateProjectDto>
  ): Promise<ProjectDto> {
    return apiClient.patch<ProjectDto>(`/projects/${projectId}`, data);
  }

  /**
   * Delete a project
   */
  async deleteProject(projectId: string): Promise<void> {
    return apiClient.delete(`/projects/${projectId}`);
  }

  /**
   * Add a conversation to a project
   */
  async addConversation(projectId: string, conversationId: string): Promise<void> {
    return apiClient.post(`/projects/${projectId}/conversations`, { conversationId });
  }

  /**
   * Remove a conversation from a project
   */
  async removeConversation(projectId: string, conversationId: string): Promise<void> {
    return apiClient.delete(`/projects/${projectId}/conversations/${conversationId}`);
  }

  /**
   * Add a document to a project
   */
  async addDocument(projectId: string, documentId: string): Promise<void> {
    return apiClient.post(`/projects/${projectId}/documents`, { documentId });
  }

  /**
   * Remove a document from a project
   */
  async removeDocument(projectId: string, documentId: string): Promise<void> {
    return apiClient.delete(`/projects/${projectId}/documents/${documentId}`);
  }

  /**
   * Add a collaborator to a project
   */
  async addCollaborator(projectId: string, userId: string): Promise<void> {
    return apiClient.post(`/projects/${projectId}/collaborators`, { userId });
  }

  /**
   * Remove a collaborator from a project
   */
  async removeCollaborator(projectId: string, userId: string): Promise<void> {
    return apiClient.delete(`/projects/${projectId}/collaborators/${userId}`);
  }

  /**
   * Get project statistics
   */
  async getProjectStats(projectId: string): Promise<{
    conversationCount: number;
    documentCount: number;
    collaboratorCount: number;
    lastActivity: string;
  }> {
    return apiClient.get(`/projects/${projectId}/stats`);
  }
}

export const projectsService = new ProjectsService();
