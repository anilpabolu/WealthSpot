/**
 * DataState — unified loading / error / empty / data render pattern.
 *
 * Eliminates repetitive boilerplate in every page/component that wraps a
 * TanStack Query result.  Supports all four states:
 *   1. loading  — shows skeleton or spinner
 *   2. error    — shows inline error with optional retry button
 *   3. empty    — shows empty-state illustration (when data array is empty)
 *   4. data     — renders children via render-prop
 *
 * Usage:
 *   <DataState
 *     loading={isLoading}
 *     error={error}
 *     data={items}
 *     isEmpty={(d) => d.length === 0}
 *     emptyMessage="No investments yet"
 *     onRetry={refetch}
 *   >
 *     {(items) => items.map(i => <ItemCard key={i.id} item={i} />)}
 *   </DataState>
 */

import { AlertCircle, RefreshCw } from 'lucide-react';
import type { ReactNode } from 'react';

interface DataStateProps<T> {
  loading: boolean;
  error: Error | null | unknown;
  data: T | undefined;

  /** Called with `data` to determine if the empty-state should show. */
  isEmpty?: (data: T) => boolean;

  /** Message shown in the empty state. */
  emptyMessage?: string;

  /** JSX shown while loading. Falls back to a default skeleton. */
  skeleton?: ReactNode;

  /** Number of skeleton rows to render for the default skeleton. */
  skeletonRows?: number;

  /** Called when the user clicks the retry button in the error state. */
  onRetry?: () => void;

  /** Render prop called only when data is available and not empty. */
  children: (data: NonNullable<T>) => ReactNode;

  className?: string;
}

function DefaultSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3" role="status" aria-label="Loading…">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="h-4 bg-white/10 rounded w-3/4 mb-1" />
          <div className="h-3 bg-white/5 rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function DataState<T>({
  loading,
  error,
  data,
  isEmpty,
  emptyMessage = 'Nothing to show here yet.',
  skeleton,
  skeletonRows = 3,
  onRetry,
  children,
  className = '',
}: DataStateProps<T>) {
  if (loading) {
    return (
      <div className={className}>
        {skeleton ?? <DefaultSkeleton rows={skeletonRows} />}
      </div>
    );
  }

  if (error) {
    const message =
      error instanceof Error ? error.message : 'Something went wrong. Please try again.';
    return (
      <div className={`flex flex-col items-center gap-3 py-10 text-center ${className}`}>
        <AlertCircle className="h-8 w-8 text-red-400" aria-hidden />
        <p className="text-sm text-red-300 max-w-xs">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Try again
          </button>
        )}
      </div>
    );
  }

  if (!data || (isEmpty && isEmpty(data))) {
    return (
      <div className={`flex flex-col items-center gap-2 py-10 text-center ${className}`}>
        <p className="text-sm text-white/40">{emptyMessage}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-xs text-white/40 hover:text-white/60 transition-colors"
          >
            Refresh
          </button>
        )}
      </div>
    );
  }

  return <>{children(data as NonNullable<T>)}</>;
}
