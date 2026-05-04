/**
 * Card — themed surface container.
 *
 * Variants:  default | elevated | flat | glass
 * Padding:   sm | md | lg | none
 */

import type { HTMLAttributes, ReactNode } from 'react';

export type CardVariant = 'default' | 'elevated' | 'flat' | 'glass';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: CardPadding;
  children?: ReactNode;
}

const variantClasses: Record<CardVariant, string> = {
  default: 'bg-white/5 border border-white/10 rounded-2xl',
  elevated: 'bg-white/[0.08] border border-white/15 rounded-2xl shadow-xl shadow-black/20',
  flat: 'bg-white/5 rounded-xl',
  glass:
    'bg-white/5 backdrop-blur-sm border border-white/15 rounded-2xl',
};

const paddingClasses: Record<CardPadding, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-7',
};

export function Card({
  variant = 'default',
  padding = 'md',
  className = '',
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={[variantClasses[variant], paddingClasses[padding], className]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {children}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────

export interface CardHeaderProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  // Override the native HTML `title` attribute (which is just a tooltip
  // string) with a richer ReactNode for the header text.
  title?: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
}

export function CardHeader({ title, subtitle, action, className = '', children, ...rest }: CardHeaderProps) {
  return (
    <div className={`flex items-start justify-between gap-3 ${className}`} {...rest}>
      <div className="min-w-0">
        {title && (
          <h3 className="text-sm font-semibold text-white/90 truncate">{title}</h3>
        )}
        {subtitle && <p className="text-xs text-white/50 mt-0.5">{subtitle}</p>}
        {children}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
CardHeader.displayName = 'CardHeader';

export function CardContent({ className = '', children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`mt-4 ${className}`} {...rest}>
      {children}
    </div>
  );
}
CardContent.displayName = 'CardContent';

export function CardFooter({ className = '', children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`mt-4 pt-4 border-t border-white/[0.08] flex items-center justify-end gap-3 ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
CardFooter.displayName = 'CardFooter';
