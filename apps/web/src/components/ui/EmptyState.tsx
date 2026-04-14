import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  message: string;
  action?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  compact?: boolean;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  message,
  action,
  actionLabel,
  onAction,
  className = '',
  compact = false,
}: EmptyStateProps) {
  const actionEl = action ?? (actionLabel && onAction ? (
    <button onClick={onAction} className="btn-primary text-sm">{actionLabel}</button>
  ) : null);
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? 'py-6' : 'py-12'} ${className}`}>
      <div className={`${compact ? 'h-10 w-10' : 'h-12 w-12'} rounded-2xl bg-theme-surface-hover flex items-center justify-center mb-3`}>
        <Icon className={`${compact ? 'h-5 w-5' : 'h-6 w-6'} text-theme-tertiary`} />
      </div>
      {title && (
        <p className="text-sm font-semibold text-theme-secondary mb-1">{title}</p>
      )}
      <p className={`${compact ? 'text-xs' : 'text-sm'} text-theme-tertiary max-w-xs`}>{message}</p>
      {actionEl && <div className="mt-4">{actionEl}</div>}
    </div>
  );
}
