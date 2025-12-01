/**
 * SiblingMessageNavigator Component
 *
 * Navigation controls for browsing message variants/regenerations
 */

import { useState, useCallback, useMemo } from 'react';
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "./ui/tooltip";
import {
  ChevronLeft,
  ChevronRight,
  Star,
  StarOff,
  RotateCw,
  GitBranch,
} from "lucide-react";
import { MessageVariantInfo } from "../api/types";

interface SiblingMessageNavigatorProps {
  variantInfo: MessageVariantInfo;
  onNavigate: (direction: 'prev' | 'next') => void;
  onSelectVariant: (variantId: string) => void;
  onSetPreferred?: (variantId: string) => void;
  onRegenerate?: () => void;
  isPreferred?: boolean;
  compact?: boolean;
}

export function SiblingMessageNavigator({
  variantInfo,
  onNavigate,
  onSelectVariant,
  onSetPreferred,
  onRegenerate,
  isPreferred = false,
  compact = false,
}: SiblingMessageNavigatorProps) {
  const { variantIndex, totalVariants, siblingIds, regeneratedWith } = variantInfo;

  // Only show if there are multiple variants
  if (totalVariants <= 1) {
    return null;
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5"
          onClick={() => onNavigate('prev')}
          disabled={variantIndex === 0}
        >
          <ChevronLeft className="h-3 w-3" />
        </Button>
        <span className="font-mono">
          {variantIndex + 1}/{totalVariants}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5"
          onClick={() => onNavigate('next')}
          disabled={variantIndex === totalVariants - 1}
        >
          <ChevronRight className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 py-1 px-2 bg-muted/50 rounded-md">
      <GitBranch className="h-3 w-3 text-muted-foreground" />

      {/* Navigation arrows */}
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => onNavigate('prev')}
              disabled={variantIndex === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Previous variant</TooltipContent>
        </Tooltip>

        <span className="text-xs font-mono min-w-[40px] text-center">
          {variantIndex + 1} / {totalVariants}
        </span>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => onNavigate('next')}
              disabled={variantIndex === totalVariants - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Next variant</TooltipContent>
        </Tooltip>
      </div>

      {/* Variant indicator badges */}
      <div className="flex gap-0.5">
        {siblingIds.map((id, idx) => (
          <Tooltip key={id}>
            <TooltipTrigger asChild>
              <button
                className={`w-2 h-2 rounded-full transition-colors ${
                  idx === variantIndex
                    ? 'bg-primary'
                    : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                }`}
                onClick={() => onSelectVariant(id)}
              />
            </TooltipTrigger>
            <TooltipContent>
              Variant {idx + 1}
              {idx === 0 && ' (Original)'}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>

      {/* Variant info */}
      {regeneratedWith && (
        <Badge variant="outline" className="text-xs py-0 h-5">
          {regeneratedWith.model || 'Same model'}
        </Badge>
      )}

      {/* Mark as preferred */}
      {onSetPreferred && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => onSetPreferred(siblingIds[variantIndex])}
            >
              {isPreferred ? (
                <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
              ) : (
                <StarOff className="h-3 w-3" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isPreferred ? 'Preferred response' : 'Mark as preferred'}
          </TooltipContent>
        </Tooltip>
      )}

      {/* Regenerate button */}
      {onRegenerate && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onRegenerate}
            >
              <RotateCw className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Generate another variant</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

/**
 * Helper hook for managing sibling navigation state
 */
export function useSiblingNavigation(
  initialSiblings: string[] = [],
  onVariantChange?: (variantId: string, index: number) => void
) {
  const [siblings, setSiblings] = useState<string[]>(initialSiblings);
  const [currentIndex, setCurrentIndex] = useState(0);

  const totalVariants = useMemo(() => Math.max(siblings.length, 1), [siblings]);

  const navigateTo = useCallback((index: number) => {
    if (index >= 0 && index < siblings.length) {
      setCurrentIndex(index);
      onVariantChange?.(siblings[index], index);
    }
  }, [siblings, onVariantChange]);

  const navigatePrev = useCallback(() => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      onVariantChange?.(siblings[newIndex], newIndex);
    }
  }, [currentIndex, siblings, onVariantChange]);

  const navigateNext = useCallback(() => {
    if (currentIndex < siblings.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      onVariantChange?.(siblings[newIndex], newIndex);
    }
  }, [currentIndex, siblings, onVariantChange]);

  const addVariant = useCallback((variantId: string) => {
    setSiblings(prev => [...prev, variantId]);
    // Optionally navigate to the new variant
    const newIndex = siblings.length;
    setCurrentIndex(newIndex);
    onVariantChange?.(variantId, newIndex);
  }, [siblings.length, onVariantChange]);

  const currentVariantId = useMemo(
    () => siblings[currentIndex] || null,
    [siblings, currentIndex]
  );

  return {
    currentIndex,
    totalVariants,
    siblings,
    currentVariantId,
    navigateTo,
    navigatePrev,
    navigateNext,
    addVariant,
    setSiblings,
  };
}
