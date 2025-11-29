/**
 * Search Service
 * 
 * Handles global search across conversations, messages, and knowledge base
 */

import { apiClient } from '../client';
import {
  GlobalSearchResultDto,
  SearchResultDto,
  ConversationSearchResult,
  MessageSearchResult,
  KnowledgeSearchResult,
} from '../types';

class SearchService {
  /**
   * Global search across all resources
   */
  async globalSearch(query: string, limit?: number): Promise<GlobalSearchResultDto> {
    const params = new URLSearchParams({ q: query });
    if (limit) params.append('limit', limit.toString());

    return apiClient.get<GlobalSearchResultDto>(`/search?${params.toString()}`);
  }

  /**
   * Search conversations only
   */
  async searchConversations(
    workspaceId: string,
    query: string,
    limit?: number
  ): Promise<SearchResultDto<ConversationSearchResult>> {
    const params = new URLSearchParams({ q: query });
    if (limit) params.append('limit', limit.toString());

    return apiClient.get<SearchResultDto<ConversationSearchResult>>(
      `/workspaces/${workspaceId}/conversations/search?${params.toString()}`
    );
  }

  /**
   * Search messages only
   */
  async searchMessages(
    query: string,
    workspaceId?: string,
    conversationId?: string,
    limit?: number
  ): Promise<SearchResultDto<MessageSearchResult>> {
    const params = new URLSearchParams({ q: query });
    if (workspaceId) params.append('workspaceId', workspaceId);
    if (conversationId) params.append('conversationId', conversationId);
    if (limit) params.append('limit', limit.toString());

    return apiClient.get<SearchResultDto<MessageSearchResult>>(
      `/search/messages?${params.toString()}`
    );
  }

  /**
   * Search knowledge base only
   */
  async searchKnowledge(query: string, limit?: number): Promise<SearchResultDto<KnowledgeSearchResult>> {
    const params = new URLSearchParams({ q: query });
    if (limit) params.append('limit', limit.toString());

    return apiClient.get<SearchResultDto<KnowledgeSearchResult>>(
      `/knowledge/search?${params.toString()}`
    );
  }

  /**
   * Search with filters
   */
  async searchWithFilters(options: {
    query: string;
    types?: ('conversations' | 'messages' | 'knowledge')[];
    workspaceId?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  }): Promise<GlobalSearchResultDto> {
    const params = new URLSearchParams({ q: options.query });
    
    if (options.types && options.types.length > 0) {
      options.types.forEach(type => params.append('types', type));
    }
    
    if (options.workspaceId) params.append('workspaceId', options.workspaceId);
    if (options.dateFrom) params.append('dateFrom', options.dateFrom);
    if (options.dateTo) params.append('dateTo', options.dateTo);
    if (options.limit) params.append('limit', options.limit.toString());

    return apiClient.get<GlobalSearchResultDto>(`/search?${params.toString()}`);
  }

  /**
   * Get search suggestions/autocomplete
   */
  async getSearchSuggestions(query: string, limit: number = 5): Promise<string[]> {
    const params = new URLSearchParams({ q: query, limit: limit.toString() });
    return apiClient.get<string[]>(`/search/suggestions?${params.toString()}`);
  }

  /**
   * Get recent searches for current user
   */
  async getRecentSearches(limit: number = 10): Promise<string[]> {
    return apiClient.get<string[]>(`/search/recent?limit=${limit}`);
  }

  /**
   * Clear recent searches
   */
  async clearRecentSearches(): Promise<{ success: boolean }> {
    return apiClient.delete<{ success: boolean }>('/search/recent');
  }

  /**
   * Save search to history
   */
  async saveSearch(query: string): Promise<void> {
    await apiClient.post('/search/history', { query });
  }

  /**
   * Highlight search terms in text
   */
  highlightSearchTerms(text: string, query: string): string {
    if (!query || !text) return text;

    const terms = query.split(' ').filter(term => term.length > 0);
    let highlightedText = text;

    terms.forEach(term => {
      const regex = new RegExp(`(${term})`, 'gi');
      highlightedText = highlightedText.replace(
        regex,
        '<mark class="search-highlight">$1</mark>'
      );
    });

    return highlightedText;
  }

  /**
   * Calculate search relevance score
   */
  calculateRelevance(item: { title?: string; content?: string }, query: string): number {
    const terms = query.toLowerCase().split(' ');
    let score = 0;

    const titleText = (item.title || '').toLowerCase();
    const contentText = (item.content || '').toLowerCase();

    terms.forEach(term => {
      // Title matches are worth more
      if (titleText.includes(term)) {
        score += 10;
      }

      // Content matches
      const contentMatches = (contentText.match(new RegExp(term, 'g')) || []).length;
      score += contentMatches * 2;

      // Exact phrase match bonus
      if (titleText.includes(query.toLowerCase())) {
        score += 20;
      }
    });

    return score;
  }
}

export const searchService = new SearchService();
export default searchService;
