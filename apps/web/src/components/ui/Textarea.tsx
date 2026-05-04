import { forwardRef, useId, useState, useCallback, useRef, useEffect, type TextareaHTMLAttributes } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  label?: string;
  error?: string;
  size?: 'sm' | 'md' | 'lg';
  helperText?: string;
  errorText?: string;
  successText?: string;
  showCounter?: boolean;
  autoResize?: boolean;
  validate?: (value: string) => string | null;
  onValueChange?: (value: string) => void;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label, error, size = 'md', className = '', id: externalId,
      helperText, errorText, successText, showCounter, autoResize,
      validate, onValueChange,
      ...props
    },
    forwardedRef
  ) => {
    const autoId = useId();
    const id = externalId || autoId;
    const [touched, setTouched] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [isValid, setIsValid] = useState(false);
    const innerRef = useRef<HTMLTextAreaElement>(null);

    const effectiveError = errorText ?? error ?? (touched ? validationError : null) ?? null;
    const showSuccess = !effectiveError && isValid && touched && successText;

    const py = size === 'sm' ? 'py-1.5' : size === 'lg' ? 'py-3' : 'py-2.5';
    const textSz = size === 'sm' ? 'text-xs' : 'text-sm';

    const currentValue = String(props.value ?? props.defaultValue ?? '');
    const charCount = currentValue.length;
    const maxLen = props.maxLength;

    // Auto-resize logic
    const adjustHeight = useCallback(() => {
      const el = innerRef.current;
      if (!el || !autoResize) return;
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    }, [autoResize]);

    useEffect(() => {
      adjustHeight();
    }, [currentValue, adjustHeight]);

    const handleBlur = useCallback((e: React.FocusEvent<HTMLTextAreaElement>) => {
      setTouched(true);
      if (validate) {
        const result = validate(e.target.value);
        setValidationError(result);
        setIsValid(result === null && e.target.value.length > 0);
      }
      props.onBlur?.(e);
    }, [validate, props.onBlur]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onValueChange?.(e.target.value);
      props.onChange?.(e);
      adjustHeight();
      if (touched && validate) {
        const result = validate(e.target.value);
        setValidationError(result);
        setIsValid(result === null && e.target.value.length > 0);
      }
    }, [touched, validate, onValueChange, adjustHeight, props.onChange]); // eslint-disable-line react-hooks/exhaustive-deps

    // Merge refs
    const setRef = useCallback((el: HTMLTextAreaElement | null) => {
      (innerRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = el;
      if (typeof forwardedRef === 'function') forwardedRef(el);
      else if (forwardedRef) (forwardedRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = el;
    }, [forwardedRef]);

    return (
      <div className={className}>
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-theme-primary mb-1">
            {label}
          </label>
        )}
        <div className="relative">
          <textarea
            ref={setRef}
            id={id}
            {...props}
            onChange={handleChange}
            onBlur={handleBlur}
            className={[
              'w-full resize-none',
              py,
              'px-3',
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
          {/* Status icon top-right corner */}
          {(effectiveError || showSuccess) && (
            <span className="absolute right-3 top-3 pointer-events-none">
              {effectiveError
                ? <AlertCircle className="h-4 w-4 text-red-400" />
                : <CheckCircle2 className="h-4 w-4 text-green-500" />
              }
            </span>
          )}
        </div>

        {/* Bottom row: message + counter */}
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

Textarea.displayName = 'Textarea';
