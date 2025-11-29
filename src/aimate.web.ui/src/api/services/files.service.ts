/**
 * Files Service
 * 
 * Handles file uploads, downloads, and attachments
 */

import { apiClient } from '../client';
import {
  FileDto,
  FileUploadResponse,
  UpdateFileDto,
  ApiSuccessResponse,
} from '../types';

class FilesService {
  /**
   * Get all files in a workspace
   */
  async getFiles(workspaceId: string): Promise<FileDto[]> {
    return apiClient.get<FileDto[]>(`/workspaces/${workspaceId}/files`);
  }

  /**
   * Get file by ID
   */
  async getFile(workspaceId: string, fileId: string): Promise<FileDto> {
    return apiClient.get<FileDto>(`/workspaces/${workspaceId}/files/${fileId}`);
  }

  /**
   * Upload file to workspace
   */
  async uploadFile(
    workspaceId: string,
    file: File,
    description?: string,
    onProgress?: (progress: number) => void
  ): Promise<FileUploadResponse> {
    const additionalData: Record<string, string> = {
      workspaceId,
    };

    if (description) {
      additionalData.description = description;
    }

    return apiClient.uploadFile<FileUploadResponse>(
      `/workspaces/${workspaceId}/files`,
      file,
      additionalData,
      onProgress
    );
  }

  /**
   * Upload multiple files
   */
  async uploadMultipleFiles(
    workspaceId: string,
    files: File[],
    onProgress?: (progress: number) => void
  ): Promise<FileUploadResponse[]> {
    const uploadPromises = files.map(file =>
      this.uploadFile(workspaceId, file, undefined, onProgress)
    );

    return Promise.all(uploadPromises);
  }

  /**
   * Update file metadata
   */
  async updateFile(
    workspaceId: string,
    fileId: string,
    data: UpdateFileDto
  ): Promise<FileDto> {
    return apiClient.put<FileDto>(
      `/workspaces/${workspaceId}/files/${fileId}`,
      data
    );
  }

  /**
   * Delete file
   */
  async deleteFile(workspaceId: string, fileId: string): Promise<ApiSuccessResponse> {
    return apiClient.delete<ApiSuccessResponse>(
      `/workspaces/${workspaceId}/files/${fileId}`
    );
  }

  /**
   * Download file
   */
  async downloadFile(workspaceId: string, fileId: string): Promise<Blob> {
    return apiClient.downloadFile(`/workspaces/${workspaceId}/files/${fileId}/download`);
  }

  /**
   * Get file URL
   */
  getFileUrl(workspaceId: string, fileId: string): string {
    return apiClient.getFullUrl(`/workspaces/${workspaceId}/files/${fileId}/download`);
  }

  /**
   * Validate file before upload
   */
  validateFile(
    file: File,
    options?: {
      maxSize?: number; // in bytes
      allowedTypes?: string[];
    }
  ): { valid: boolean; error?: string } {
    const maxSize = options?.maxSize || 50 * 1024 * 1024; // 50MB default
    const allowedTypes = options?.allowedTypes || [];

    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File size exceeds maximum of ${Math.round(maxSize / 1024 / 1024)}MB`,
      };
    }

    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type ${file.type} is not allowed`,
      };
    }

    return { valid: true };
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Get file icon based on file type
   */
  getFileIcon(fileType: string): string {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.startsWith('video/')) return '🎥';
    if (fileType.startsWith('audio/')) return '🎵';
    if (fileType === 'application/pdf') return '📄';
    if (fileType.includes('word')) return '📝';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📊';
    if (fileType.includes('zip') || fileType.includes('compressed')) return '🗜️';
    if (fileType.includes('text')) return '📃';
    return '📎';
  }
}

export const filesService = new FilesService();
export default filesService;
