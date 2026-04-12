import { useState, useRef, type ReactNode } from 'react';

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  position?: 'top' | 'bottom';
  className?: string;
}

export function Tooltip({ content, children, position = 'top', className = '' }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const show = () => {
    clearTimeout(timeoutRef.current);
    setVisible(true);
  };

  const hide = () => {
    timeoutRef.current = setTimeout(() => setVisible(false), 100);
  };

  const posClass = position === 'top'
    ? 'bottom-full left-1/2 -translate-x-1/2 mb-2'
    : 'top-full left-1/2 -translate-x-1/2 mt-2';

  return (
    <span
      className={`relative inline-flex ${className}`}
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      {children}
      {visible && (
        <span
          className={`absolute z-50 ${posClass} pointer-events-none
            px-2.5 py-1.5 rounded-lg bg-gray-900 text-white text-[11px] font-medium
            shadow-lg whitespace-nowrap
            animate-in fade-in zoom-in-95 duration-150`}
        >
          {content}
        </span>
      )}
    </span>
  );
}

// Convenience wrapper for numeric intellisense
interface NumberTooltipProps {
  value: number;
  format?: 'currency' | 'percent' | 'number';
  children: ReactNode;
  className?: string;
}

export function NumberTooltip({ value, format = 'number', children, className }: NumberTooltipProps) {
  const formatted = (() => {
    if (format === 'currency') {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }).format(value);
    }
    if (format === 'percent') {
      return `${value.toFixed(2)}%`;
    }
    return new Intl.NumberFormat('en-IN').format(value);
  })();

  const abs = Math.abs(value);
  const inWords =
    abs >= 1e7 ? `${(value / 1e7).toFixed(2)} Cr`
    : abs >= 1e5 ? `${(value / 1e5).toFixed(2)} L`
    : abs >= 1e3 ? `${(value / 1e3).toFixed(1)} K`
    : formatted;

  return (
    <Tooltip
      content={
        <span className="flex flex-col gap-0.5">
          <span className="font-mono">{formatted}</span>
          {inWords !== formatted && <span className="text-gray-400">{inWords}</span>}
        </span>
      }
      className={className}
    >
      {children}
    </Tooltip>
  );
}
