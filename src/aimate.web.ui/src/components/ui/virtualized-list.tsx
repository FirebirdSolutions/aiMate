/**
 * Virtualized List Component
 *
 * A reusable virtualized list using @tanstack/react-virtual for performance
 * optimization when rendering long lists.
 */

import { useRef, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { cn } from './utils';

export interface VirtualizedListProps<T> {
  /** Array of items to render */
  items: T[];
  /** Estimated height of each item in pixels */
  estimatedItemHeight: number;
  /** Height of the container (required for virtualization) */
  height: number | string;
  /** Render function for each item */
  renderItem: (item: T, index: number) => React.ReactNode;
  /** Optional key extractor function */
  getItemKey?: (item: T, index: number) => string | number;
  /** Optional className for the container */
  className?: string;
  /** Optional className for the inner scroll container */
  innerClassName?: string;
  /** Number of items to overscan (render beyond visible area) */
  overscan?: number;
  /** Optional callback when scrolling near the end */
  onEndReached?: () => void;
  /** Threshold (in items) from end to trigger onEndReached */
  endReachedThreshold?: number;
  /** Whether more items are loading */
  isLoading?: boolean;
  /** Optional empty state component */
  emptyState?: React.ReactNode;
  /** Optional header component (fixed, not virtualized) */
  header?: React.ReactNode;
  /** Optional footer component (fixed, not virtualized) */
  footer?: React.ReactNode;
}

export function VirtualizedList<T>({
  items,
  estimatedItemHeight,
  height,
  renderItem,
  getItemKey,
  className,
  innerClassName,
  overscan = 5,
  onEndReached,
  endReachedThreshold = 5,
  isLoading,
  emptyState,
  header,
  footer,
}: VirtualizedListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);
  const endReachedCalledRef = useRef(false);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimatedItemHeight,
    overscan,
    getItemKey: getItemKey
      ? (index) => getItemKey(items[index], index)
      : undefined,
  });

  const virtualItems = virtualizer.getVirtualItems();

  // Handle infinite scroll
  const handleScroll = useCallback(() => {
    if (!onEndReached || isLoading || items.length === 0) return;

    const lastItem = virtualItems[virtualItems.length - 1];
    if (!lastItem) return;

    // Check if we're near the end
    if (lastItem.index >= items.length - endReachedThreshold) {
      if (!endReachedCalledRef.current) {
        endReachedCalledRef.current = true;
        onEndReached();
      }
    } else {
      endReachedCalledRef.current = false;
    }
  }, [virtualItems, items.length, endReachedThreshold, onEndReached, isLoading]);

  // Empty state
  if (items.length === 0 && emptyState) {
    return (
      <div className={cn('flex flex-col', className)} style={{ height }}>
        {header}
        <div className="flex-1 flex items-center justify-center">
          {emptyState}
        </div>
        {footer}
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col', className)} style={{ height }}>
      {header}
      <div
        ref={parentRef}
        className={cn('flex-1 overflow-auto', innerClassName)}
        onScroll={handleScroll}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualItems.map((virtualItem) => (
            <div
              key={virtualItem.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
              data-index={virtualItem.index}
            >
              {renderItem(items[virtualItem.index], virtualItem.index)}
            </div>
          ))}
        </div>
      </div>
      {footer}
    </div>
  );
}

/**
 * Simple virtualized list without header/footer for use in dropdowns/popovers
 */
export interface SimpleVirtualListProps<T> {
  items: T[];
  estimatedItemHeight: number;
  maxHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  getItemKey?: (item: T, index: number) => string | number;
  className?: string;
  overscan?: number;
}

export function SimpleVirtualList<T>({
  items,
  estimatedItemHeight,
  maxHeight,
  renderItem,
  getItemKey,
  className,
  overscan = 3,
}: SimpleVirtualListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Calculate actual height - don't exceed content height
  const contentHeight = items.length * estimatedItemHeight;
  const actualHeight = Math.min(contentHeight, maxHeight);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimatedItemHeight,
    overscan,
    getItemKey: getItemKey
      ? (index) => getItemKey(items[index], index)
      : undefined,
  });

  const virtualItems = virtualizer.getVirtualItems();

  if (items.length === 0) {
    return null;
  }

  return (
    <div
      ref={parentRef}
      className={cn('overflow-auto', className)}
      style={{ height: actualHeight, maxHeight }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualItems.map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {renderItem(items[virtualItem.index], virtualItem.index)}
          </div>
        ))}
      </div>
    </div>
  );
}

export default VirtualizedList;
