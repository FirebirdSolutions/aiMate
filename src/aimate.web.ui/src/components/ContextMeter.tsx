/**
 * ContextMeter Component
 *
 * Visual indicator showing context window usage with breakdown tooltip
 */

import { useMemo } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "./ui/tooltip";
import { Progress } from "./ui/progress";
import { formatTokenCount } from '../utils/tokenCounter';
import { formatContextLimit } from '../utils/modelLimits';
import { Info, AlertTriangle, Zap } from 'lucide-react';

export interface TokenBreakdown {
  systemPrompt: number;
  knowledge: number;
  memories: number;
  conversation: number;
  total: number;
}

export interface CompressionInfo {
  enabled: boolean;
  originalTokens: number;
  compressedTokens: number;
  strategy: string;
}

interface ContextMeterProps {
  usedTokens: number;
  maxTokens: number;
  breakdown?: TokenBreakdown;
  compression?: CompressionInfo;
  compact?: boolean;
}

export function ContextMeter({
  usedTokens,
  maxTokens,
  breakdown,
  compression,
  compact = false,
}: ContextMeterProps) {
  const percentage = useMemo(() => {
    if (maxTokens === 0) return 0;
    return Math.min(Math.round((usedTokens / maxTokens) * 100), 100);
  }, [usedTokens, maxTokens]);

  const originalPercentage = useMemo(() => {
    if (!compression?.enabled || maxTokens === 0) return null;
    return Math.round((compression.originalTokens / maxTokens) * 100);
  }, [compression, maxTokens]);

  const isWarning = percentage > 80;
  const isCritical = percentage > 95;

  const progressColor = useMemo(() => {
    if (isCritical) return 'bg-red-500';
    if (isWarning) return 'bg-yellow-500';
    return 'bg-primary';
  }, [isWarning, isCritical]);

  const StatusIcon = useMemo(() => {
    if (isCritical) return AlertTriangle;
    if (compression?.enabled) return Zap;
    return Info;
  }, [isCritical, compression?.enabled]);

  if (compact) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-help">
            <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full ${progressColor} transition-all duration-300`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="font-mono">{percentage}%</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <ContextMeterTooltip
            usedTokens={usedTokens}
            maxTokens={maxTokens}
            breakdown={breakdown}
            compression={compression}
          />
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-muted/50 transition-colors cursor-help">
          <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full ${progressColor} transition-all duration-300`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span className="font-mono">{percentage}%</span>
            {compression?.enabled && originalPercentage && (
              <span className="text-emerald-500 font-mono">
                ↓{originalPercentage}%
              </span>
            )}
            <StatusIcon className={`h-3 w-3 ${isCritical ? 'text-red-500' : compression?.enabled ? 'text-emerald-500' : ''}`} />
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-xs">
        <ContextMeterTooltip
          usedTokens={usedTokens}
          maxTokens={maxTokens}
          breakdown={breakdown}
          compression={compression}
        />
      </TooltipContent>
    </Tooltip>
  );
}

interface ContextMeterTooltipProps {
  usedTokens: number;
  maxTokens: number;
  breakdown?: TokenBreakdown;
  compression?: CompressionInfo;
}

function ContextMeterTooltip({
  usedTokens,
  maxTokens,
  breakdown,
  compression,
}: ContextMeterTooltipProps) {
  const percentage = Math.round((usedTokens / maxTokens) * 100);

  return (
    <div className="space-y-2 text-sm">
      <div className="font-medium">
        Context Usage: {formatTokenCount(usedTokens)} / {formatContextLimit(maxTokens)} tokens
      </div>

      {breakdown && (
        <div className="space-y-1 text-xs">
          <div className="text-muted-foreground font-medium">Breakdown:</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
            {breakdown.systemPrompt > 0 && (
              <>
                <span className="text-muted-foreground">System prompt:</span>
                <span className="font-mono">{formatTokenCount(breakdown.systemPrompt)}</span>
              </>
            )}
            {breakdown.knowledge > 0 && (
              <>
                <span className="text-muted-foreground">Knowledge/RAG:</span>
                <span className="font-mono">{formatTokenCount(breakdown.knowledge)}</span>
              </>
            )}
            {breakdown.memories > 0 && (
              <>
                <span className="text-muted-foreground">Memories:</span>
                <span className="font-mono">{formatTokenCount(breakdown.memories)}</span>
              </>
            )}
            <span className="text-muted-foreground">Conversation:</span>
            <span className="font-mono">{formatTokenCount(breakdown.conversation)}</span>
          </div>
        </div>
      )}

      {compression?.enabled && (
        <div className="pt-1 border-t border-border">
          <div className="flex items-center gap-1 text-emerald-500">
            <Zap className="h-3 w-3" />
            <span className="text-xs font-medium">Compression active</span>
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Saved {formatTokenCount(compression.originalTokens - compression.compressedTokens)} tokens
            ({compression.strategy})
          </div>
        </div>
      )}

      {percentage > 80 && (
        <div className="pt-1 border-t border-border text-xs text-yellow-500">
          {percentage > 95
            ? '⚠️ Context nearly full. Consider starting a new chat.'
            : '💡 Context filling up. Compression may activate soon.'}
        </div>
      )}
    </div>
  );
}

/**
 * Hook to calculate context usage
 */
import { useState, useEffect } from 'react';
import type { ChatMessage } from '../hooks/useChat';
import { calculateTokenBreakdown } from '../utils/tokenCounter';
import { getContextLimit } from '../utils/modelLimits';

interface UseContextMeterOptions {
  messages: ChatMessage[];
  modelId: string;
  systemPrompt?: string;
  knowledgeContext?: string;
  memoryContext?: string;
}

export function useContextMeter({
  messages,
  modelId,
  systemPrompt = '',
  knowledgeContext = '',
  memoryContext = '',
}: UseContextMeterOptions) {
  const [breakdown, setBreakdown] = useState<TokenBreakdown>({
    systemPrompt: 0,
    knowledge: 0,
    memories: 0,
    conversation: 0,
    total: 0,
  });

  const maxTokens = useMemo(() => getContextLimit(modelId), [modelId]);

  // Debounce token calculation to avoid blocking UI
  useEffect(() => {
    const timer = setTimeout(() => {
      const newBreakdown = calculateTokenBreakdown(
        systemPrompt,
        knowledgeContext,
        memoryContext,
        messages
      );
      setBreakdown(newBreakdown);
    }, 100);

    return () => clearTimeout(timer);
  }, [messages, systemPrompt, knowledgeContext, memoryContext]);

  return {
    usedTokens: breakdown.total,
    maxTokens,
    breakdown,
    percentage: maxTokens > 0 ? Math.round((breakdown.total / maxTokens) * 100) : 0,
  };
}
