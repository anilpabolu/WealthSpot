import { useThemeStore } from '../../stores/theme.store';

interface GradientMeshProps {
  className?: string;
}

export default function GradientMesh({ className = '' }: GradientMeshProps) {
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === 'dark';

  const bg = isDark
    ? `radial-gradient(ellipse 60% 50% at 20% 30%, rgba(123,94,167,0.18) 0%, transparent 70%),
       radial-gradient(ellipse 50% 40% at 75% 60%, rgba(59,47,130,0.15) 0%, transparent 70%),
       radial-gradient(ellipse 40% 35% at 50% 80%, rgba(32,227,178,0.06) 0%, transparent 70%)`
    : `radial-gradient(ellipse 60% 50% at 25% 30%, rgba(212,175,55,0.06) 0%, transparent 70%),
       radial-gradient(ellipse 50% 40% at 70% 60%, rgba(79,70,229,0.04) 0%, transparent 70%),
       radial-gradient(ellipse 40% 35% at 50% 80%, rgba(209,196,157,0.05) 0%, transparent 70%)`;

  return (
    <div
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ background: bg, zIndex: 0 }}
      aria-hidden="true"
    />
  );
}
