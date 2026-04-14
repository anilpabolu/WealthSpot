import type { ReactNode } from 'react';

type BadgeVariant =
  | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'teal' | 'neutral'
  | 'live' | 'pending' | 'funded' | 'closed' | 'rejected' | 'draft';

const VARIANT_MAP: Record<BadgeVariant, string> = {
  success:  'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700/40',
  warning:  'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700/40',
  danger:   'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700/40',
  info:     'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700/40',
  purple:   'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-700/40',
  teal:     'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-900/40 dark:text-teal-300 dark:border-teal-700/40',
  neutral:  'bg-theme-surface-hover text-theme-secondary border-theme',
  live:     'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700/40',
  pending:  'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700/40',
  funded:   'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-700/40',
  closed:   'bg-theme-surface-hover text-theme-secondary border-theme',
  rejected: 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700/40',
  draft:    'bg-theme-surface-hover text-theme-secondary border-theme',
};

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  icon?: ReactNode;
  pulse?: boolean;
  dot?: boolean;
  size?: 'xs' | 'sm';
  className?: string;
}

export function Badge({
  variant = 'neutral',
  children,
  icon,
  pulse = false,
  dot = false,
  size = 'xs',
  className = '',
}: BadgeProps) {
  const colors = VARIANT_MAP[variant] || VARIANT_MAP.neutral;
  const sz = size === 'xs' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full border whitespace-nowrap ${colors} ${sz} ${className}`}
    >
      {dot && (
        <span className="relative flex h-1.5 w-1.5">
          {pulse && (
            <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping bg-current" />
          )}
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
        </span>
      )}
      {icon}
      {children}
    </span>
  );
}

export type { BadgeVariant };
