import { useId } from 'react';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  size?: 'sm' | 'md';
  disabled?: boolean;
}

export function Toggle({ checked, onChange, label, size = 'md', disabled = false }: ToggleProps) {
  const id = useId();
  const w = size === 'sm' ? 'w-8' : 'w-10';
  const h = size === 'sm' ? 'h-[18px]' : 'h-[22px]';
  const knob = size === 'sm' ? 'h-3.5 w-3.5' : 'h-[18px] w-[18px]';
  const travel = size === 'sm' ? 'translate-x-[14px]' : 'translate-x-[18px]';

  return (
    <label
      htmlFor={id}
      className={`inline-flex items-center gap-2.5 select-none ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      }`}
    >
      <button
        id={id}
        role="switch"
        type="button"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`
          relative inline-flex shrink-0 ${w} ${h} items-center rounded-full
          transition-colors duration-200 ease-in-out
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2
          ${checked ? 'bg-primary' : 'bg-[var(--bg-surface-hover)]'}
        `}
      >
        <span
          className={`
            ${knob} rounded-full bg-[var(--bg-surface)] shadow-sm
            transition-transform duration-200 ease-in-out
            ${checked ? travel : 'translate-x-0.5'}
          `}
        />
      </button>
      {label && (
        <span className="text-sm text-theme-secondary">{label}</span>
      )}
    </label>
  );
}
