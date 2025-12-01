/**
 * Evaluation Service
 *
 * Handles model evaluation, arena comparisons, Elo ratings, and leaderboard
 */

import { apiClient } from '../client';
import {
  EvaluationTagDto,
  CreateEvaluationTagDto,
  ModelEloRatingDto,
  ArenaMatchDto,
  CreateArenaMatchDto,
  ArenaVoteDto,
  LeaderboardEntryDto,
  LeaderboardFilterDto,
  EvaluationSnapshotDto,
  ExportEvaluationDataDto,
  EvaluationStatsByTopicDto,
  ApiSuccessResponse,
} from '../types';
import { AppConfig } from '../../utils/config';

// Default evaluation tags - behavior-focused as requested
const DEFAULT_EVALUATION_TAGS: EvaluationTagDto[] = [
  // Tool Use
  { id: 'tag-1', key: 'correct_tool_choice', label: 'Correct Tool Choice', category: 'tool_use', description: 'Selected the right tool for the task', sentiment: 'positive', color: '#22c55e', isDefault: true, isActive: true, displayOrder: 1 },
  { id: 'tag-2', key: 'tool_params_correct', label: 'Tool Params Correct', category: 'tool_use', description: 'Tool parameters were correctly specified', sentiment: 'positive', color: '#22c55e', isDefault: true, isActive: true, displayOrder: 2 },
  { id: 'tag-3', key: 'unnecessary_tool', label: 'Unnecessary Tool Use', category: 'tool_use', description: 'Used a tool when not needed', sentiment: 'negative', color: '#ef4444', isDefault: true, isActive: true, displayOrder: 3 },
  { id: 'tag-4', key: 'missed_tool', label: 'Missed Tool Opportunity', category: 'tool_use', description: 'Should have used a tool but didn\'t', sentiment: 'negative', color: '#ef4444', isDefault: true, isActive: true, displayOrder: 4 },

  // General Chat
  { id: 'tag-5', key: 'factually_correct', label: 'Factually Correct', category: 'general_chat', description: 'Information provided was accurate', sentiment: 'positive', color: '#3b82f6', isDefault: true, isActive: true, displayOrder: 5 },
  { id: 'tag-6', key: 'friendly_tone', label: 'Friendly Tone', category: 'general_chat', description: 'Response had appropriate friendliness', sentiment: 'positive', color: '#3b82f6', isDefault: true, isActive: true, displayOrder: 6 },
  { id: 'tag-7', key: 'coherent', label: 'Coherent', category: 'general_chat', description: 'Response was logically structured', sentiment: 'positive', color: '#3b82f6', isDefault: true, isActive: true, displayOrder: 7 },
  { id: 'tag-8', key: 'hallucination', label: 'Hallucination', category: 'general_chat', description: 'Made up facts or information', sentiment: 'negative', color: '#ef4444', isDefault: true, isActive: true, displayOrder: 8 },

  // Safety
  { id: 'tag-9', key: 'appropriate_refusal', label: 'Appropriate Refusal', category: 'safety', description: 'Correctly refused harmful request', sentiment: 'positive', color: '#a855f7', isDefault: true, isActive: true, displayOrder: 9 },
  { id: 'tag-10', key: 'over_refusal', label: 'Over Refusal', category: 'safety', description: 'Refused a safe request unnecessarily', sentiment: 'negative', color: '#f97316', isDefault: true, isActive: true, displayOrder: 10 },
  { id: 'tag-11', key: 'unsafe_content', label: 'Unsafe Content', category: 'safety', description: 'Generated potentially harmful content', sentiment: 'negative', color: '#ef4444', isDefault: true, isActive: true, displayOrder: 11 },

  // Instruction Following
  { id: 'tag-12', key: 'followed_format', label: 'Followed Format', category: 'instruction_following', description: 'Adhered to requested output format', sentiment: 'positive', color: '#06b6d4', isDefault: true, isActive: true, displayOrder: 12 },
  { id: 'tag-13', key: 'complete_answer', label: 'Complete Answer', category: 'instruction_following', description: 'Addressed all parts of the request', sentiment: 'positive', color: '#06b6d4', isDefault: true, isActive: true, displayOrder: 13 },
  { id: 'tag-14', key: 'ignored_instruction', label: 'Ignored Instruction', category: 'instruction_following', description: 'Missed or ignored part of the request', sentiment: 'negative', color: '#ef4444', isDefault: true, isActive: true, displayOrder: 14 },

  // Creativity
  { id: 'tag-15', key: 'creative_solution', label: 'Creative Solution', category: 'creativity', description: 'Provided novel or creative approach', sentiment: 'positive', color: '#ec4899', isDefault: true, isActive: true, displayOrder: 15 },

  // Code Quality
  { id: 'tag-16', key: 'working_code', label: 'Working Code', category: 'code_quality', description: 'Code runs without errors', sentiment: 'positive', color: '#84cc16', isDefault: true, isActive: true, displayOrder: 16 },
  { id: 'tag-17', key: 'buggy_code', label: 'Buggy Code', category: 'code_quality', description: 'Code has errors or bugs', sentiment: 'negative', color: '#ef4444', isDefault: true, isActive: true, displayOrder: 17 },
  { id: 'tag-18', key: 'well_documented', label: 'Well Documented', category: 'code_quality', description: 'Code includes helpful comments', sentiment: 'positive', color: '#84cc16', isDefault: true, isActive: true, displayOrder: 18 },

  // Helpfulness
  { id: 'tag-19', key: 'solved_problem', label: 'Solved Problem', category: 'helpfulness', description: 'Actually solved the user\'s problem', sentiment: 'positive', color: '#14b8a6', isDefault: true, isActive: true, displayOrder: 19 },
  { id: 'tag-20', key: 'unhelpful', label: 'Unhelpful', category: 'helpfulness', description: 'Response didn\'t help with the task', sentiment: 'negative', color: '#ef4444', isDefault: true, isActive: true, displayOrder: 20 },
];

// Mock leaderboard data
const MOCK_LEADERBOARD: LeaderboardEntryDto[] = [
  {
    rank: 1,
    modelId: 'gpt-4-turbo',
    modelName: 'GPT-4 Turbo',
    provider: 'OpenAI',
    eloRating: 1250,
    totalEvaluations: 156,
    averageRating: 8.2,
    winRate: 0.68,
    strengthsByTag: { tool_use: 9.1, code_quality: 8.8, instruction_following: 8.5 },
    weaknessesByTag: { creativity: 7.2 },
    trendDirection: 'up',
    trendDelta: 15,
  },
  {
    rank: 2,
    modelId: 'claude-3-opus',
    modelName: 'Claude 3 Opus',
    provider: 'Anthropic',
    eloRating: 1230,
    totalEvaluations: 142,
    averageRating: 8.4,
    winRate: 0.65,
    strengthsByTag: { general_chat: 9.0, safety: 9.2, creativity: 8.6 },
    weaknessesByTag: { code_quality: 7.8 },
    trendDirection: 'stable',
    trendDelta: 2,
  },
  {
    rank: 3,
    modelId: 'gemini-pro',
    modelName: 'Gemini Pro',
    provider: 'Google',
    eloRating: 1180,
    totalEvaluations: 98,
    averageRating: 7.8,
    winRate: 0.55,
    strengthsByTag: { accuracy: 8.5, helpfulness: 8.2 },
    weaknessesByTag: { tool_use: 6.8, instruction_following: 7.0 },
    trendDirection: 'up',
    trendDelta: 25,
  },
  {
    rank: 4,
    modelId: 'llama-3-70b',
    modelName: 'Llama 3 70B',
    provider: 'Meta',
    eloRating: 1120,
    totalEvaluations: 67,
    averageRating: 7.4,
    winRate: 0.48,
    strengthsByTag: { code_quality: 7.9, creativity: 7.6 },
    weaknessesByTag: { safety: 6.5, instruction_following: 6.8 },
    trendDirection: 'down',
    trendDelta: -10,
  },
];

// Storage keys for localStorage persistence
const STORAGE_KEYS = {
  EVALUATION_TAGS: 'aiMate_evaluationTags',
  LEADERBOARD: 'aiMate_leaderboard',
  ARENA_MATCHES: 'aiMate_arenaMatches',
  SNAPSHOTS: 'aiMate_evaluationSnapshots',
};

class EvaluationService {
  // ============================================================================
  // EVALUATION TAGS
  // ============================================================================

  /**
   * Get all evaluation tags
   */
  async getEvaluationTags(): Promise<EvaluationTagDto[]> {
    if (AppConfig.isOfflineMode()) {
      const stored = localStorage.getItem(STORAGE_KEYS.EVALUATION_TAGS);
      if (stored) {
        const custom = JSON.parse(stored) as EvaluationTagDto[];
        return [...DEFAULT_EVALUATION_TAGS, ...custom];
      }
      return DEFAULT_EVALUATION_TAGS;
    }
    return apiClient.get<EvaluationTagDto[]>('/evaluation/tags');
  }

  /**
   * Get active evaluation tags only
   */
  async getActiveEvaluationTags(): Promise<EvaluationTagDto[]> {
    const tags = await this.getEvaluationTags();
    return tags.filter(t => t.isActive);
  }

  /**
   * Create custom evaluation tag
   */
  async createEvaluationTag(data: CreateEvaluationTagDto): Promise<EvaluationTagDto> {
    if (AppConfig.isOfflineMode()) {
      const newTag: EvaluationTagDto = {
        id: `tag-custom-${Date.now()}`,
        ...data,
        color: data.color || '#6b7280',
        isDefault: false,
        isActive: true,
        displayOrder: 100,
      };

      const stored = localStorage.getItem(STORAGE_KEYS.EVALUATION_TAGS);
      const existing = stored ? JSON.parse(stored) : [];
      existing.push(newTag);
      localStorage.setItem(STORAGE_KEYS.EVALUATION_TAGS, JSON.stringify(existing));

      return newTag;
    }
    return apiClient.post<EvaluationTagDto>('/evaluation/tags', data);
  }

  /**
   * Update evaluation tag
   */
  async updateEvaluationTag(id: string, data: Partial<CreateEvaluationTagDto>): Promise<EvaluationTagDto> {
    if (AppConfig.isOfflineMode()) {
      const stored = localStorage.getItem(STORAGE_KEYS.EVALUATION_TAGS);
      const existing = stored ? JSON.parse(stored) : [];
      const index = existing.findIndex((t: EvaluationTagDto) => t.id === id);
      if (index >= 0) {
        existing[index] = { ...existing[index], ...data };
        localStorage.setItem(STORAGE_KEYS.EVALUATION_TAGS, JSON.stringify(existing));
        return existing[index];
      }
      throw new Error('Tag not found');
    }
    return apiClient.put<EvaluationTagDto>(`/evaluation/tags/${id}`, data);
  }

  /**
   * Delete evaluation tag
   */
  async deleteEvaluationTag(id: string): Promise<ApiSuccessResponse> {
    if (AppConfig.isOfflineMode()) {
      const stored = localStorage.getItem(STORAGE_KEYS.EVALUATION_TAGS);
      const existing = stored ? JSON.parse(stored) : [];
      const filtered = existing.filter((t: EvaluationTagDto) => t.id !== id);
      localStorage.setItem(STORAGE_KEYS.EVALUATION_TAGS, JSON.stringify(filtered));
      return { success: true, message: 'Tag deleted' };
    }
    return apiClient.delete<ApiSuccessResponse>(`/evaluation/tags/${id}`);
  }

  // ============================================================================
  // ARENA MODE
  // ============================================================================

  /**
   * Create arena match - sends prompt to two random models
   */
  async createArenaMatch(data: CreateArenaMatchDto): Promise<ArenaMatchDto> {
    if (AppConfig.isOfflineMode()) {
      // Simulate arena match with mock responses
      const models = ['gpt-4-turbo', 'claude-3-opus', 'gemini-pro', 'llama-3-70b'];
      const availablePool = data.modelPool || models;
      const shuffled = [...availablePool].sort(() => Math.random() - 0.5);

      const match: ArenaMatchDto = {
        id: `arena-${Date.now()}`,
        prompt: data.prompt,
        conversationId: data.conversationId,
        modelA: {
          id: shuffled[0],
          name: shuffled[0],
          response: `This is a mock response from Model A (${shuffled[0]}) to: "${data.prompt.substring(0, 50)}..."`,
          responseTimeMs: Math.floor(Math.random() * 2000) + 500,
          tokenCount: Math.floor(Math.random() * 200) + 50,
        },
        modelB: {
          id: shuffled[1],
          name: shuffled[1],
          response: `This is a mock response from Model B (${shuffled[1]}) to: "${data.prompt.substring(0, 50)}..."`,
          responseTimeMs: Math.floor(Math.random() * 2000) + 500,
          tokenCount: Math.floor(Math.random() * 200) + 50,
        },
        winner: null,
        tags: [],
        createdAt: new Date().toISOString(),
      };

      // Store match
      const stored = localStorage.getItem(STORAGE_KEYS.ARENA_MATCHES);
      const matches = stored ? JSON.parse(stored) : [];
      matches.push(match);
      localStorage.setItem(STORAGE_KEYS.ARENA_MATCHES, JSON.stringify(matches));

      return match;
    }
    return apiClient.post<ArenaMatchDto>('/evaluation/arena/match', data);
  }

  /**
   * Submit vote for arena match
   */
  async submitArenaVote(data: ArenaVoteDto): Promise<ArenaMatchDto> {
    if (AppConfig.isOfflineMode()) {
      const stored = localStorage.getItem(STORAGE_KEYS.ARENA_MATCHES);
      const matches: ArenaMatchDto[] = stored ? JSON.parse(stored) : [];
      const index = matches.findIndex(m => m.id === data.matchId);

      if (index >= 0) {
        matches[index].winner = data.winner;
        matches[index].votedAt = new Date().toISOString();
        matches[index].tags = data.tags || [];
        localStorage.setItem(STORAGE_KEYS.ARENA_MATCHES, JSON.stringify(matches));

        // Update Elo ratings
        await this.updateEloRatings(matches[index]);

        return matches[index];
      }
      throw new Error('Match not found');
    }
    return apiClient.post<ArenaMatchDto>(`/evaluation/arena/vote`, data);
  }

  /**
   * Get arena match history
   */
  async getArenaMatches(params?: { limit?: number; offset?: number }): Promise<ArenaMatchDto[]> {
    if (AppConfig.isOfflineMode()) {
      const stored = localStorage.getItem(STORAGE_KEYS.ARENA_MATCHES);
      const matches: ArenaMatchDto[] = stored ? JSON.parse(stored) : [];
      const offset = params?.offset || 0;
      const limit = params?.limit || 50;
      return matches.slice(offset, offset + limit);
    }
    const query = new URLSearchParams();
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.offset) query.append('offset', params.offset.toString());
    return apiClient.get<ArenaMatchDto[]>(`/evaluation/arena/matches?${query}`);
  }

  // ============================================================================
  // LEADERBOARD & ELO
  // ============================================================================

  /**
   * Get model leaderboard
   */
  async getLeaderboard(filters?: LeaderboardFilterDto): Promise<LeaderboardEntryDto[]> {
    if (AppConfig.isOfflineMode()) {
      let leaderboard = [...MOCK_LEADERBOARD];

      // Apply filters
      if (filters?.providers?.length) {
        leaderboard = leaderboard.filter(e => filters.providers!.includes(e.provider));
      }
      if (filters?.minMatches) {
        leaderboard = leaderboard.filter(e => e.totalEvaluations >= filters.minMatches!);
      }

      // Sort by Elo
      leaderboard.sort((a, b) => b.eloRating - a.eloRating);

      // Update ranks
      leaderboard.forEach((e, i) => { e.rank = i + 1; });

      return leaderboard;
    }
    return apiClient.post<LeaderboardEntryDto[]>('/evaluation/leaderboard', filters || {});
  }

  /**
   * Get Elo rating for a specific model
   */
  async getModelEloRating(modelId: string): Promise<ModelEloRatingDto> {
    if (AppConfig.isOfflineMode()) {
      const entry = MOCK_LEADERBOARD.find(e => e.modelId === modelId);
      if (entry) {
        return {
          modelId: entry.modelId,
          modelName: entry.modelName,
          provider: entry.provider,
          eloRating: entry.eloRating,
          wins: Math.floor(entry.totalEvaluations * entry.winRate),
          losses: Math.floor(entry.totalEvaluations * (1 - entry.winRate) * 0.7),
          ties: Math.floor(entry.totalEvaluations * (1 - entry.winRate) * 0.3),
          totalMatches: entry.totalEvaluations,
          winRate: entry.winRate,
          confidenceInterval: {
            lower: entry.eloRating - 50,
            upper: entry.eloRating + 50
          },
          lastUpdated: new Date().toISOString(),
        };
      }
      throw new Error('Model not found');
    }
    return apiClient.get<ModelEloRatingDto>(`/evaluation/elo/${modelId}`);
  }

  /**
   * Update Elo ratings after a match (internal)
   */
  private async updateEloRatings(match: ArenaMatchDto): Promise<void> {
    if (!match.winner || match.winner === null) return;

    // Elo calculation constants
    const K = 32; // K-factor

    // Get current ratings (or default to 1000)
    const stored = localStorage.getItem(STORAGE_KEYS.LEADERBOARD);
    const ratings: Record<string, number> = stored ? JSON.parse(stored) : {};

    const ratingA = ratings[match.modelA.id] || 1000;
    const ratingB = ratings[match.modelB.id] || 1000;

    // Calculate expected scores
    const expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
    const expectedB = 1 / (1 + Math.pow(10, (ratingA - ratingB) / 400));

    // Actual scores
    let scoreA: number, scoreB: number;
    if (match.winner === 'a') {
      scoreA = 1; scoreB = 0;
    } else if (match.winner === 'b') {
      scoreA = 0; scoreB = 1;
    } else {
      scoreA = 0.5; scoreB = 0.5;
    }

    // Update ratings
    ratings[match.modelA.id] = Math.round(ratingA + K * (scoreA - expectedA));
    ratings[match.modelB.id] = Math.round(ratingB + K * (scoreB - expectedB));

    localStorage.setItem(STORAGE_KEYS.LEADERBOARD, JSON.stringify(ratings));
  }

  // ============================================================================
  // STATISTICS BY TOPIC
  // ============================================================================

  /**
   * Get evaluation statistics grouped by topic
   */
  async getStatsByTopic(): Promise<EvaluationStatsByTopicDto[]> {
    if (AppConfig.isOfflineMode()) {
      // Return mock topic stats
      return [
        {
          topic: 'tool_use',
          totalEvaluations: 45,
          averageRating: 7.8,
          topModels: [
            { modelId: 'gpt-4-turbo', modelName: 'GPT-4 Turbo', averageRating: 9.1, evaluationCount: 20 },
            { modelId: 'claude-3-opus', modelName: 'Claude 3 Opus', averageRating: 8.2, evaluationCount: 15 },
          ],
          tagBreakdown: { correct_tool_choice: 35, tool_params_correct: 28, unnecessary_tool: 5, missed_tool: 7 },
        },
        {
          topic: 'general_chat',
          totalEvaluations: 120,
          averageRating: 8.1,
          topModels: [
            { modelId: 'claude-3-opus', modelName: 'Claude 3 Opus', averageRating: 9.0, evaluationCount: 50 },
            { modelId: 'gpt-4-turbo', modelName: 'GPT-4 Turbo', averageRating: 8.5, evaluationCount: 45 },
          ],
          tagBreakdown: { factually_correct: 95, friendly_tone: 88, coherent: 102, hallucination: 12 },
        },
        {
          topic: 'code_quality',
          totalEvaluations: 68,
          averageRating: 7.5,
          topModels: [
            { modelId: 'gpt-4-turbo', modelName: 'GPT-4 Turbo', averageRating: 8.8, evaluationCount: 30 },
            { modelId: 'llama-3-70b', modelName: 'Llama 3 70B', averageRating: 7.9, evaluationCount: 22 },
          ],
          tagBreakdown: { working_code: 52, buggy_code: 16, well_documented: 38 },
        },
      ];
    }
    return apiClient.get<EvaluationStatsByTopicDto[]>('/evaluation/stats/topics');
  }

  // ============================================================================
  // SNAPSHOTS & EXPORT
  // ============================================================================

  /**
   * Save evaluation snapshot for fine-tuning
   */
  async saveSnapshot(snapshot: Omit<EvaluationSnapshotDto, 'id' | 'createdAt'>): Promise<EvaluationSnapshotDto> {
    const fullSnapshot: EvaluationSnapshotDto = {
      ...snapshot,
      id: `snapshot-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    if (AppConfig.isOfflineMode()) {
      const stored = localStorage.getItem(STORAGE_KEYS.SNAPSHOTS);
      const snapshots = stored ? JSON.parse(stored) : [];
      snapshots.push(fullSnapshot);
      localStorage.setItem(STORAGE_KEYS.SNAPSHOTS, JSON.stringify(snapshots));
      return fullSnapshot;
    }
    return apiClient.post<EvaluationSnapshotDto>('/evaluation/snapshots', snapshot);
  }

  /**
   * Get evaluation snapshots
   */
  async getSnapshots(params?: { limit?: number; modelId?: string }): Promise<EvaluationSnapshotDto[]> {
    if (AppConfig.isOfflineMode()) {
      const stored = localStorage.getItem(STORAGE_KEYS.SNAPSHOTS);
      let snapshots: EvaluationSnapshotDto[] = stored ? JSON.parse(stored) : [];
      if (params?.modelId) {
        snapshots = snapshots.filter(s => s.modelId === params.modelId);
      }
      return snapshots.slice(0, params?.limit || 100);
    }
    const query = new URLSearchParams();
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.modelId) query.append('modelId', params.modelId);
    return apiClient.get<EvaluationSnapshotDto[]>(`/evaluation/snapshots?${query}`);
  }

  /**
   * Export evaluation data for fine-tuning
   */
  async exportEvaluationData(options: ExportEvaluationDataDto): Promise<Blob> {
    if (AppConfig.isOfflineMode()) {
      const stored = localStorage.getItem(STORAGE_KEYS.SNAPSHOTS);
      let snapshots: EvaluationSnapshotDto[] = stored ? JSON.parse(stored) : [];

      // Apply filters
      if (options.minRating) {
        snapshots = snapshots.filter(s => s.rating >= options.minRating!);
      }
      if (options.maxRating) {
        snapshots = snapshots.filter(s => s.rating <= options.maxRating!);
      }
      if (options.models?.length) {
        snapshots = snapshots.filter(s => options.models!.includes(s.modelId));
      }
      if (!options.includeNegative) {
        snapshots = snapshots.filter(s => s.isPositive);
      }

      // Format output
      let content: string;
      if (options.format === 'jsonl') {
        content = snapshots.map(s => JSON.stringify(s)).join('\n');
      } else if (options.format === 'csv') {
        const headers = 'id,conversationId,messageId,prompt,response,modelId,rating,tags,isPositive,createdAt\n';
        const rows = snapshots.map(s =>
          `"${s.id}","${s.conversationId}","${s.messageId}","${s.prompt.replace(/"/g, '""')}","${s.response.replace(/"/g, '""')}","${s.modelId}",${s.rating},"${s.tags.join(';')}",${s.isPositive},"${s.createdAt}"`
        ).join('\n');
        content = headers + rows;
      } else {
        content = JSON.stringify(snapshots, null, 2);
      }

      return new Blob([content], { type: 'application/json' });
    }

    const response = await apiClient.post<Blob>('/evaluation/export', options, {
      responseType: 'blob',
    });
    return response;
  }
}

export const evaluationService = new EvaluationService();
export default evaluationService;
