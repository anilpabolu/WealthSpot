import type { ReactNode } from 'react';

type BadgeVariant =
  | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'teal' | 'neutral'
  | 'live' | 'pending' | 'funded' | 'closed' | 'rejected' | 'draft';

const VARIANT_MAP: Record<BadgeVariant, string> = {
  success:  'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning:  'bg-amber-50 text-amber-700 border-amber-200',
  danger:   'bg-red-50 text-red-600 border-red-200',
  info:     'bg-blue-50 text-blue-700 border-blue-200',
  purple:   'bg-purple-50 text-purple-700 border-purple-200',
  teal:     'bg-teal-50 text-teal-700 border-teal-200',
  neutral:  'bg-gray-100 text-gray-600 border-gray-200',
  live:     'bg-emerald-50 text-emerald-700 border-emerald-200',
  pending:  'bg-amber-50 text-amber-700 border-amber-200',
  funded:   'bg-purple-50 text-purple-700 border-purple-200',
  closed:   'bg-gray-100 text-gray-500 border-gray-200',
  rejected: 'bg-red-50 text-red-600 border-red-200',
  draft:    'bg-gray-100 text-gray-500 border-gray-200',
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
