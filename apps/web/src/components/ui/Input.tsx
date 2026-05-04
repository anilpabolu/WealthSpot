import { forwardRef, useId, useState, useCallback, type InputHTMLAttributes, type ReactNode } from 'react';
import { Eye, EyeOff, X, Search, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix'> {
  // Existing props (backward compat)
  label?: string;
  error?: string;
  icon?: ReactNode;
  rightIcon?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  // New props
  prefix?: string;
  suffix?: string;
  clearable?: boolean;
  showCounter?: boolean;
  loading?: boolean;
  helperText?: string;
  errorText?: string;
  successText?: string;
  validate?: (value: string) => string | null;
  onValueChange?: (value: string) => void;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label, error, icon, rightIcon,
      size = 'md', className = '', id: externalId,
      prefix, suffix, clearable, showCounter, loading,
      helperText, errorText, successText, validate,
      onValueChange,
      type,
      ...props
    },
    ref
  ) => {
    const autoId = useId();
    const id = externalId || autoId;
    const [showPassword, setShowPassword] = useState(false);
    const [touched, setTouched] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [isValid, setIsValid] = useState(false);

    const isPassword = type === 'password';
    const isSearch = type === 'search';
    const resolvedType = isPassword ? (showPassword ? 'text' : 'password') : type;

    const effectiveError = errorText ?? error ?? (touched ? validationError : null) ?? null;
    const showSuccess = !effectiveError && isValid && touched && successText;

    const py = size === 'sm' ? 'py-1.5' : size === 'lg' ? 'py-3' : 'py-2.5';
    const textSz = size === 'sm' ? 'text-xs' : 'text-sm';

    const currentValue = String(props.value ?? props.defaultValue ?? '');
    const charCount = currentValue.length;
    const maxLen = props.maxLength;

    const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
      setTouched(true);
      if (validate) {
        const result = validate(e.target.value);
        setValidationError(result);
        setIsValid(result === null && e.target.value.length > 0);
      }
      props.onBlur?.(e);
    }, [validate, props.onBlur]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      onValueChange?.(e.target.value);
      props.onChange?.(e);
      if (touched && validate) {
        const result = validate(e.target.value);
        setValidationError(result);
        setIsValid(result === null && e.target.value.length > 0);
      }
    }, [touched, validate, onValueChange, props.onChange]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleClear = useCallback(() => {
      onValueChange?.('');
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
      if (ref && 'current' in ref && ref.current && nativeInputValueSetter) {
        nativeInputValueSetter.call(ref.current, '');
        ref.current.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, [onValueChange, ref]);

    // Determine how much right padding to apply
    const hasRightSlot = isPassword || (clearable && currentValue) || loading || effectiveError || showSuccess || suffix || rightIcon;
    const leftHasContent = icon || prefix || isSearch;

    return (
      <div className={className}>
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-theme-primary mb-1">
            {label}
          </label>
        )}
        <div className="relative">
          {/* Left slot: icon or prefix */}
          {(icon || (isSearch && !icon && !prefix)) && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-tertiary pointer-events-none">
              {icon ?? <Search className="h-4 w-4" />}
            </span>
          )}
          {prefix && !icon && !(isSearch && !icon) && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-theme-secondary pointer-events-none select-none">
              {prefix}
            </span>
          )}

          <input
            ref={ref}
            id={id}
            type={resolvedType}
            {...props}
            onChange={handleChange}
            onBlur={handleBlur}
            className={[
              'w-full',
              py,
              leftHasContent ? 'pl-9' : 'px-3',
              hasRightSlot ? 'pr-10' : suffix ? 'pr-12' : 'pr-3',
              textSz,
              'bg-[var(--bg-surface)] border rounded-xl',
              'transition-all duration-150',
              'placeholder:text-theme-tertiary',
              'hover:border-theme',
              'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-theme-surface',
              effectiveError
                ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
                : showSuccess
                  ? 'border-green-300 focus:ring-green-200 focus:border-green-400'
                  : 'border-theme',
            ].join(' ')}
          />

          {/* Right slot — priority: eye > clear > loading > error/success icon > suffix > rightIcon */}
          <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {isPassword && (
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="text-theme-tertiary hover:text-theme-primary transition-colors"
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            )}
            {!isPassword && clearable && currentValue && (
              <button
                type="button"
                onClick={handleClear}
                className="text-theme-tertiary hover:text-theme-primary transition-colors"
                tabIndex={-1}
                aria-label="Clear"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            {!isPassword && !clearable && loading && (
              <Loader2 className="h-4 w-4 text-theme-tertiary animate-spin" />
            )}
            {!isPassword && !clearable && !loading && effectiveError && (
              <AlertCircle className="h-4 w-4 text-red-400 pointer-events-none" />
            )}
            {!isPassword && !clearable && !loading && !effectiveError && showSuccess && (
              <CheckCircle2 className="h-4 w-4 text-green-500 pointer-events-none" />
            )}
            {!isPassword && !clearable && !loading && !effectiveError && !showSuccess && suffix && (
              <span className="text-sm text-theme-secondary select-none pointer-events-none">{suffix}</span>
            )}
            {!isPassword && !clearable && !loading && !effectiveError && !showSuccess && !suffix && rightIcon && (
              <span className="text-theme-tertiary">{rightIcon}</span>
            )}
          </span>
        </div>

        {/* Bottom row: error/success/helper + counter */}
        <div className="flex items-start justify-between mt-1 gap-2">
          <div className="flex-1 min-w-0">
            {effectiveError && (
              <p className="text-xs text-red-500">{effectiveError}</p>
            )}
            {!effectiveError && showSuccess && successText && (
              <p className="text-xs text-green-600">{successText}</p>
            )}
            {!effectiveError && !showSuccess && helperText && (
              <p className="text-xs text-theme-tertiary">{helperText}</p>
            )}
          </div>
          {showCounter && maxLen != null && (
            <p className={`text-xs shrink-0 ${charCount > maxLen ? 'text-red-500' : 'text-theme-tertiary'}`}>
              {charCount}/{maxLen}
            </p>
          )}
        </div>
      </div>
    );
  }
);

Input.displayName = 'Input';
