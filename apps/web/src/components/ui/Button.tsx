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
    'border border-[#8B6914] dark:border-[#D4AF37] bg-transparent text-[#8B6914] dark:text-[#D4AF37] hover:bg-[#8B6914] dark:hover:bg-[#D4AF37] hover:text-white dark:hover:text-[#0D1324] hover:font-semibold disabled:opacity-50',
  secondary:
    'border border-[#8B6914] dark:border-[#D4AF37] bg-transparent text-[#8B6914] dark:text-[#D4AF37] hover:bg-[#8B6914] dark:hover:bg-[#D4AF37] hover:text-white dark:hover:text-[#0D1324] hover:font-semibold disabled:opacity-50',
  ghost:
    'border border-[#8B6914] dark:border-[#D4AF37] bg-transparent text-[#8B6914] dark:text-[#D4AF37] hover:bg-[#8B6914] dark:hover:bg-[#D4AF37] hover:text-white dark:hover:text-[#0D1324] hover:font-semibold disabled:opacity-40',
  danger:
    'bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 disabled:opacity-50',
  outline:
    'border border-[#8B6914] dark:border-[#D4AF37] bg-transparent text-[#8B6914] dark:text-[#D4AF37] hover:bg-[#8B6914] dark:hover:bg-[#D4AF37] hover:text-white dark:hover:text-[#0D1324] hover:font-semibold disabled:opacity-50',
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
