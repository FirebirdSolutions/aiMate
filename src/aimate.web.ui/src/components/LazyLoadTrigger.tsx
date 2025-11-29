import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

interface LazyLoadTriggerProps {
  onLoadMore: () => void;
  hasMore: boolean;
  loading: boolean;
}

export function LazyLoadTrigger({ onLoadMore, hasMore, loading }: LazyLoadTriggerProps) {
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trigger = triggerRef.current;
    if (!trigger || !hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          console.log('[LazyLoadTrigger] Triggering load more');
          onLoadMore();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px',
      }
    );

    observer.observe(trigger);

    return () => {
      observer.disconnect();
    };
  }, [onLoadMore, hasMore, loading]);

  if (!hasMore) return null;

  return (
    <div ref={triggerRef} className="flex justify-center py-4">
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading more...</span>
        </div>
      ) : (
        <div className="text-xs text-gray-400 dark:text-gray-600">
          Scroll for more
        </div>
      )}
    </div>
  );
}
