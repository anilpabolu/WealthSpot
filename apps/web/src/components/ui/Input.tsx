import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  icon?: ReactNode;
  rightIcon?: ReactNode;
  size?: 'sm' | 'md';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, rightIcon, size = 'md', className = '', id: externalId, ...props }, ref) => {
    const autoId = useId();
    const id = externalId || autoId;
    const py = size === 'sm' ? 'py-1.5' : 'py-2.5';
    const textSz = size === 'sm' ? 'text-xs' : 'text-sm';

    return (
      <div className={className}>
        {label && (
          <label htmlFor={id} className="block text-xs font-semibold text-theme-secondary uppercase tracking-wider mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-tertiary pointer-events-none">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={id}
            {...props}
            className={`
              w-full ${py} ${icon ? 'pl-10' : 'px-3'} ${rightIcon ? 'pr-10' : 'pr-3'} ${textSz}
              bg-[var(--bg-surface)] border rounded-xl
              transition-all duration-150
              placeholder:text-theme-tertiary
              hover:border-theme
              focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
              disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-theme-surface
              ${error
                ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
                : 'border-theme'
              }
            `}
          />
          {rightIcon && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-tertiary">
              {rightIcon}
            </span>
          )}
        </div>
        {error && (
          <p className="mt-1 text-xs text-red-500">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
