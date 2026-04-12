interface MiniDonutProps {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  showLabel?: boolean;
  label?: string;
  className?: string;
}

export function MiniDonut({
  value,
  size = 48,
  strokeWidth = 4,
  color = '#6366F1',
  trackColor = '#F3F4F6',
  showLabel = true,
  label,
  className = '',
}: MiniDonutProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className={`inline-flex flex-col items-center gap-1 ${className}`}>
      <svg width={size} height={size} className="shrink-0 -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-500 ease-out"
        />
        <text
          x={size / 2}
          y={size / 2}
          textAnchor="middle"
          dominantBaseline="central"
          className="rotate-90 origin-center fill-gray-700 font-mono font-bold"
          style={{ fontSize: size * 0.24 }}
        >
          {Math.round(clamped)}%
        </text>
      </svg>
      {showLabel && label && (
        <span className="text-[10px] text-gray-400 font-medium text-center leading-tight">{label}</span>
      )}
    </div>
  );
}
