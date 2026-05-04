/**
 * Button — themed button primitive supporting all WealthSpot visual variants.
 *
 * Variants:  primary | secondary | ghost | danger | outline
 * Sizes:     sm | md | lg
 */

import { Loader2 } from 'lucide-react';
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50',
  secondary:
    'bg-white/10 text-white border border-white/20 hover:bg-white/15 disabled:opacity-50',
  ghost:
    'text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-40',
  danger:
    'bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 disabled:opacity-50',
  outline:
    'border border-amber-500/50 text-amber-400 hover:bg-amber-500/10 disabled:opacity-50',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5 rounded-lg',
  md: 'px-4 py-2 text-sm gap-2 rounded-xl',
  lg: 'px-6 py-3 text-base gap-2.5 rounded-xl',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      className = '',
      children,
      type,
      ...rest
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;
    return (
      <button
        ref={ref}
        // Default to type="button" so a Button placed inside a <form> doesn't
        // accidentally trigger form submission. Callers can still opt in via
        // type="submit".
        type={type ?? 'button'}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-busy={loading || undefined}
        className={[
          'inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 active:scale-[0.97]',
          variantClasses[variant],
          sizeClasses[size],
          fullWidth ? 'w-full' : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...rest}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden />
        ) : leftIcon ? (
          <span className="shrink-0" aria-hidden>
            {leftIcon}
          </span>
        ) : null}
        {children}
        {!loading && rightIcon && (
          <span className="shrink-0" aria-hidden>
            {rightIcon}
          </span>
        )}
      </button>
    );
  },
);
Button.displayName = 'Button';
