/**
 * Knowledge Base Service
 * 
 * Handles knowledge articles, semantic search, and analytics
 */

import { apiClient } from '../client';
import {
  KnowledgeArticleDto,
  CreateKnowledgeArticleDto,
  KnowledgeAnalyticsDto,
  SemanticSearchRequest,
  SemanticSearchResponse,
  ApiSuccessResponse,
} from '../types';

class KnowledgeService {
  // ============================================================================
  // KNOWLEDGE ARTICLES
  // ============================================================================

  /**
   * Get all knowledge articles (with optional filters)
   */
  async getArticles(params?: {
    type?: string;
    category?: string;
    tags?: string[];
    visibility?: string;
    published?: boolean;
  }): Promise<KnowledgeArticleDto[]> {
    const queryParams = new URLSearchParams();
    if (params?.type) queryParams.append('type', params.type);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.tags) params.tags.forEach(tag => queryParams.append('tags', tag));
    if (params?.visibility) queryParams.append('visibility', params.visibility);
    if (params?.published !== undefined) queryParams.append('published', params.published.toString());

    const query = queryParams.toString();
    return apiClient.get<KnowledgeArticleDto[]>(`/knowledge${query ? `?${query}` : ''}`);
  }

  /**
   * Get knowledge article by ID
   */
  async getArticle(id: string): Promise<KnowledgeArticleDto> {
    return apiClient.get<KnowledgeArticleDto>(`/knowledge/${id}`);
  }

  /**
   * Create knowledge article
   */
  async createArticle(data: CreateKnowledgeArticleDto): Promise<KnowledgeArticleDto> {
    return apiClient.post<KnowledgeArticleDto>('/knowledge', data);
  }

  /**
   * Update knowledge article
   */
  async updateArticle(id: string, data: Partial<CreateKnowledgeArticleDto>): Promise<KnowledgeArticleDto> {
    return apiClient.put<KnowledgeArticleDto>(`/knowledge/${id}`, data);
  }

  /**
   * Delete knowledge article
   */
  async deleteArticle(id: string): Promise<ApiSuccessResponse> {
    return apiClient.delete<ApiSuccessResponse>(`/knowledge/${id}`);
  }

  /**
   * Publish article
   */
  async publishArticle(id: string): Promise<KnowledgeArticleDto> {
    return apiClient.post<KnowledgeArticleDto>(`/knowledge/${id}/publish`);
  }

  /**
   * Unpublish article
   */
  async unpublishArticle(id: string): Promise<KnowledgeArticleDto> {
    return apiClient.post<KnowledgeArticleDto>(`/knowledge/${id}/unpublish`);
  }

  /**
   * Feature article
   */
  async featureArticle(id: string): Promise<KnowledgeArticleDto> {
    return apiClient.post<KnowledgeArticleDto>(`/knowledge/${id}/feature`);
  }

  /**
   * Unfeature article
   */
  async unfeatureArticle(id: string): Promise<KnowledgeArticleDto> {
    return apiClient.post<KnowledgeArticleDto>(`/knowledge/${id}/unfeature`);
  }

  /**
   * Increment view count
   */
  async incrementViewCount(id: string): Promise<ApiSuccessResponse> {
    return apiClient.post<ApiSuccessResponse>(`/knowledge/${id}/view`);
  }

  // ============================================================================
  // SEMANTIC SEARCH
  // ============================================================================

  /**
   * Perform semantic search across knowledge base
   */
  async semanticSearch(request: SemanticSearchRequest): Promise<SemanticSearchResponse> {
    return apiClient.post<SemanticSearchResponse>('/knowledge/search/semantic', request);
  }

  /**
   * Basic text search
   */
  async textSearch(query: string, limit?: number): Promise<KnowledgeArticleDto[]> {
    const queryParams = new URLSearchParams();
    queryParams.append('q', query);
    if (limit) queryParams.append('limit', limit.toString());

    return apiClient.get<KnowledgeArticleDto[]>(`/knowledge/search?${queryParams.toString()}`);
  }

  // ============================================================================
  // ANALYTICS
  // ============================================================================

  /**
   * Get knowledge base analytics
   */
  async getAnalytics(): Promise<KnowledgeAnalyticsDto> {
    return apiClient.get<KnowledgeAnalyticsDto>('/knowledge/analytics');
  }

  /**
   * Get most viewed articles
   */
  async getMostViewed(limit: number = 10): Promise<KnowledgeArticleDto[]> {
    return apiClient.get<KnowledgeArticleDto[]>(`/knowledge/analytics/most-viewed?limit=${limit}`);
  }

  /**
   * Get most referenced articles
   */
  async getMostReferenced(limit: number = 10): Promise<KnowledgeArticleDto[]> {
    return apiClient.get<KnowledgeArticleDto[]>(`/knowledge/analytics/most-referenced?limit=${limit}`);
  }

  /**
   * Get featured articles
   */
  async getFeatured(): Promise<KnowledgeArticleDto[]> {
    return apiClient.get<KnowledgeArticleDto[]>('/knowledge/featured');
  }

  /**
   * Get articles by category
   */
  async getByCategory(category: string): Promise<KnowledgeArticleDto[]> {
    return apiClient.get<KnowledgeArticleDto[]>(`/knowledge/category/${category}`);
  }

  /**
   * Get articles by tag
   */
  async getByTag(tag: string): Promise<KnowledgeArticleDto[]> {
    return apiClient.get<KnowledgeArticleDto[]>(`/knowledge/tag/${tag}`);
  }

  /**
   * Get all categories
   */
  async getCategories(): Promise<string[]> {
    return apiClient.get<string[]>('/knowledge/categories');
  }

  /**
   * Get all tags
   */
  async getTags(): Promise<string[]> {
    return apiClient.get<string[]>('/knowledge/tags');
  }


  // ============================================================================
  // DOCUMENTS (RAG)
  // ============================================================================

  /**
   * Get knowledge documents
   */
  async getDocuments(workspaceId?: string): Promise<any[]> {
    const query = workspaceId ? `?workspaceId=${workspaceId}` : '';
    return apiClient.get<any[]>(`/knowledge/documents${query}`);
  }

  /**
   * Upload knowledge document
   */
  async uploadDocument(file: File, data?: { workspaceId?: string; tags?: string[] }): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    if (data?.workspaceId) formData.append('workspaceId', data.workspaceId);
    if (data?.tags) formData.append('tags', JSON.stringify(data.tags));

    return apiClient.post<any>('/knowledge/documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  /**
   * Delete knowledge document
   */
  async deleteDocument(id: string): Promise<ApiSuccessResponse> {
    return apiClient.delete<ApiSuccessResponse>(`/knowledge/documents/${id}`);
  }

  /**
   * Update knowledge document
   */
  async updateDocument(id: string, updates: any): Promise<any> {
    return apiClient.put<any>(`/knowledge/documents/${id}`, updates);
  }

  /**
   * Search knowledge documents
   */
  async searchDocuments(query: string, workspaceId?: string): Promise<any[]> {
    const wsQuery = workspaceId ? `&workspaceId=${workspaceId}` : '';
    return apiClient.get<any[]>(`/knowledge/documents/search?q=${encodeURIComponent(query)}${wsQuery}`);
  }

  /**
   * Reprocess knowledge document
   */
  async reprocessDocument(id: string): Promise<ApiSuccessResponse> {
    return apiClient.post<ApiSuccessResponse>(`/knowledge/documents/${id}/reprocess`);
  }

  /**
   * Get document chunks
   */
  async getDocumentChunks(id: string): Promise<any[]> {
    return apiClient.get<any[]>(`/knowledge/documents/${id}/chunks`);
  }
}

export const knowledgeService = new KnowledgeService();
export default knowledgeService;
