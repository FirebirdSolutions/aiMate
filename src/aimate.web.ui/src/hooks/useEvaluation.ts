/**
 * useEvaluation Hook
 *
 * Central hook for model evaluation, arena mode, and leaderboard
 */

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { evaluationService } from '../api/services/evaluation.service';
import { feedbackService } from '../api/services/feedback.service';
import {
  EvaluationTagDto,
  CreateEvaluationTagDto,
  ArenaMatchDto,
  CreateArenaMatchDto,
  LeaderboardEntryDto,
  LeaderboardFilterDto,
  EvaluationStatsByTopicDto,
  EvaluationSnapshotDto,
  ExportEvaluationDataDto,
  CreateFeedbackDto,
  FeedbackTag,
} from '../api/types';

interface UseEvaluationOptions {
  autoLoadTags?: boolean;
  autoLoadLeaderboard?: boolean;
}

interface UseEvaluationReturn {
  // State
  tags: EvaluationTagDto[];
  leaderboard: LeaderboardEntryDto[];
  currentMatch: ArenaMatchDto | null;
  isArenaMode: boolean;
  isLoading: boolean;
  topicStats: EvaluationStatsByTopicDto[];

  // Actions
  loadTags: () => Promise<void>;
  loadLeaderboard: (filters?: LeaderboardFilterDto) => Promise<void>;
  createTag: (data: CreateEvaluationTagDto) => Promise<EvaluationTagDto>;
  deleteTag: (id: string) => Promise<void>;

  // Arena mode
  toggleArenaMode: () => void;
  createArenaMatch: (prompt: string, modelPool?: string[]) => Promise<ArenaMatchDto>;
  submitArenaVote: (winner: 'a' | 'b' | 'tie', tags?: string[], feedback?: string) => Promise<void>;
  clearCurrentMatch: () => void;

  // Feedback with evaluation tags
  submitEvaluation: (params: {
    messageId: string;
    modelId: string;
    rating: number;
    tags: string[];
    feedback?: string;
    conversationId?: string;
    prompt?: string;
    response?: string;
  }) => Promise<void>;

  // Export
  exportData: (options: ExportEvaluationDataDto) => Promise<void>;
  loadTopicStats: () => Promise<void>;
}

export function useEvaluation(options: UseEvaluationOptions = {}): UseEvaluationReturn {
  const { autoLoadTags = true, autoLoadLeaderboard = false } = options;

  const [tags, setTags] = useState<EvaluationTagDto[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntryDto[]>([]);
  const [currentMatch, setCurrentMatch] = useState<ArenaMatchDto | null>(null);
  const [isArenaMode, setIsArenaMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [topicStats, setTopicStats] = useState<EvaluationStatsByTopicDto[]>([]);

  // Load tags on mount
  useEffect(() => {
    if (autoLoadTags) {
      loadTags();
    }
  }, [autoLoadTags]);

  // Load leaderboard on mount if requested
  useEffect(() => {
    if (autoLoadLeaderboard) {
      loadLeaderboard();
    }
  }, [autoLoadLeaderboard]);

  const loadTags = useCallback(async () => {
    try {
      const result = await evaluationService.getActiveEvaluationTags();
      setTags(result);
    } catch (error) {
      console.error('Failed to load evaluation tags:', error);
    }
  }, []);

  const loadLeaderboard = useCallback(async (filters?: LeaderboardFilterDto) => {
    try {
      setIsLoading(true);
      const result = await evaluationService.getLeaderboard(filters);
      setLeaderboard(result);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
      toast.error('Failed to load leaderboard');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createTag = useCallback(async (data: CreateEvaluationTagDto): Promise<EvaluationTagDto> => {
    try {
      const newTag = await evaluationService.createEvaluationTag(data);
      setTags(prev => [...prev, newTag]);
      toast.success('Tag created');
      return newTag;
    } catch (error) {
      console.error('Failed to create tag:', error);
      toast.error('Failed to create tag');
      throw error;
    }
  }, []);

  const deleteTag = useCallback(async (id: string) => {
    try {
      await evaluationService.deleteEvaluationTag(id);
      setTags(prev => prev.filter(t => t.id !== id));
      toast.success('Tag deleted');
    } catch (error) {
      console.error('Failed to delete tag:', error);
      toast.error('Failed to delete tag');
    }
  }, []);

  const toggleArenaMode = useCallback(() => {
    setIsArenaMode(prev => {
      const newValue = !prev;
      if (newValue) {
        toast.info('Arena mode enabled - responses will be compared');
      } else {
        toast.info('Arena mode disabled');
        setCurrentMatch(null);
      }
      return newValue;
    });
  }, []);

  const createArenaMatch = useCallback(async (prompt: string, modelPool?: string[]): Promise<ArenaMatchDto> => {
    try {
      setIsLoading(true);
      const match = await evaluationService.createArenaMatch({
        prompt,
        modelPool,
      });
      setCurrentMatch(match);
      return match;
    } catch (error) {
      console.error('Failed to create arena match:', error);
      toast.error('Failed to create arena match');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const submitArenaVote = useCallback(async (
    winner: 'a' | 'b' | 'tie',
    voteTags?: string[],
    feedback?: string
  ) => {
    if (!currentMatch) {
      toast.error('No active arena match');
      return;
    }

    try {
      setIsLoading(true);
      const updatedMatch = await evaluationService.submitArenaVote({
        matchId: currentMatch.id,
        winner,
        tags: voteTags,
        feedback,
      });
      setCurrentMatch(updatedMatch);

      // Show which model won
      const winnerModel = winner === 'a'
        ? currentMatch.modelA.name
        : winner === 'b'
          ? currentMatch.modelB.name
          : 'Tie';
      toast.success(`Vote recorded: ${winnerModel}`);

      // Reload leaderboard
      loadLeaderboard();
    } catch (error) {
      console.error('Failed to submit arena vote:', error);
      toast.error('Failed to submit vote');
    } finally {
      setIsLoading(false);
    }
  }, [currentMatch, loadLeaderboard]);

  const clearCurrentMatch = useCallback(() => {
    setCurrentMatch(null);
  }, []);

  const submitEvaluation = useCallback(async (params: {
    messageId: string;
    modelId: string;
    rating: number;
    tags: string[];
    feedback?: string;
    conversationId?: string;
    prompt?: string;
    response?: string;
  }) => {
    try {
      // Convert tag keys to FeedbackTag format
      const feedbackTags: FeedbackTag[] = params.tags.map(tagKey => {
        const tagDef = tags.find(t => t.key === tagKey);
        return {
          key: tagKey,
          value: tagDef?.label || tagKey,
          color: tagDef?.color || '#6b7280',
          sentiment: tagDef?.sentiment || 'neutral',
        };
      });

      // Submit feedback to backend
      const feedbackData: CreateFeedbackDto = {
        userId: 'current-user', // TODO: Get from auth context
        rating: params.rating,
        textFeedback: params.feedback,
        tags: feedbackTags,
        modelId: params.modelId,
        responseTimeMs: 0, // TODO: Track actual response time
      };

      await feedbackService.createFeedback(feedbackData);

      // If we have full context, save a snapshot for fine-tuning
      if (params.conversationId && params.prompt && params.response) {
        await evaluationService.saveSnapshot({
          conversationId: params.conversationId,
          messageId: params.messageId,
          prompt: params.prompt,
          response: params.response,
          modelId: params.modelId,
          rating: params.rating,
          tags: params.tags,
          feedback: params.feedback,
          isPositive: params.rating >= 6, // Consider 6+ as positive
        });
      }

      toast.success('Evaluation saved');
    } catch (error) {
      console.error('Failed to submit evaluation:', error);
      toast.error('Failed to save evaluation');
    }
  }, [tags]);

  const exportData = useCallback(async (options: ExportEvaluationDataDto) => {
    try {
      setIsLoading(true);
      const blob = await evaluationService.exportEvaluationData(options);

      // Download the file
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `evaluations.${options.format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Evaluation data exported');
    } catch (error) {
      console.error('Failed to export data:', error);
      toast.error('Failed to export data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadTopicStats = useCallback(async () => {
    try {
      setIsLoading(true);
      const stats = await evaluationService.getStatsByTopic();
      setTopicStats(stats);
    } catch (error) {
      console.error('Failed to load topic stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    // State
    tags,
    leaderboard,
    currentMatch,
    isArenaMode,
    isLoading,
    topicStats,

    // Actions
    loadTags,
    loadLeaderboard,
    createTag,
    deleteTag,

    // Arena mode
    toggleArenaMode,
    createArenaMatch,
    submitArenaVote,
    clearCurrentMatch,

    // Feedback
    submitEvaluation,

    // Export
    exportData,
    loadTopicStats,
  };
}

export default useEvaluation;
