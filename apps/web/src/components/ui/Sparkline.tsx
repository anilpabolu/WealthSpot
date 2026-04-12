import { useMemo } from 'react';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  filled?: boolean;
  className?: string;
}

export function Sparkline({
  data,
  width = 80,
  height = 28,
  color = '#6366F1',
  filled = true,
  className = '',
}: SparklineProps) {
  const path = useMemo(() => {
    if (!data || data.length < 2) return '';
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const step = width / (data.length - 1);
    const pad = 2;
    const h = height - pad * 2;

    const points = data.map((v, i) => ({
      x: i * step,
      y: pad + h - ((v - min) / range) * h,
    }));

    // smooth curve using cardinal spline
    let d = `M ${points[0]!.x},${points[0]!.y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)]!;
      const p1 = points[i]!;
      const p2 = points[i + 1]!;
      const p3 = points[Math.min(points.length - 1, i + 2)]!;
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }
    return d;
  }, [data, width, height]);

  if (!data || data.length < 2) return null;

  const trend = data[data.length - 1]! >= data[0]!;
  const lineColor = color === 'auto' ? (trend ? '#10B981' : '#EF4444') : color;

  return (
    <svg width={width} height={height} className={`shrink-0 ${className}`} viewBox={`0 0 ${width} ${height}`}>
      {filled && (
        <path
          d={`${path} L ${width},${height} L 0,${height} Z`}
          fill={lineColor}
          fillOpacity={0.08}
        />
      )}
      <path d={path} fill="none" stroke={lineColor} strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  );
}
