import { useEffect, useRef, useCallback } from 'react';
import { useThemeStore } from '../../stores/theme.store';

interface ParticleCanvasProps {
  particleCount?: number;
  lineDistance?: number;
  className?: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
}

export default function ParticleCanvas({
  particleCount = 120,
  lineDistance = 140,
  className = '',
}: ParticleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const particlesRef = useRef<Particle[]>([]);
  const theme = useThemeStore((s) => s.theme);

  const initParticles = useCallback(
    (w: number, h: number) => {
      const particles: Particle[] = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
          radius: Math.random() * 1.5 + 0.5,
          opacity: Math.random() * 0.5 + 0.15,
        });
      }
      particlesRef.current = particles;
    },
    [particleCount],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isDark = theme === 'dark';
    const dotColor = isDark ? '212,175,55' : '79,70,229';
    const lineColor = isDark ? '212,175,55' : '99,102,241';

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initParticles(canvas.offsetWidth, canvas.offsetHeight);
    };
    resize();
    window.addEventListener('resize', resize);

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    canvas.addEventListener('mousemove', onMove);

    const w = () => canvas.offsetWidth;
    const h = () => canvas.offsetHeight;

    const draw = () => {
      ctx.clearRect(0, 0, w(), h());
      const particles = particlesRef.current;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w()) p.vx *= -1;
        if (p.y < 0 || p.y > h()) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${dotColor},${p.opacity})`;
        ctx.fill();
      }

      // Draw lines between nearby particles
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        if (!p1) continue;
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          if (!p2) continue;
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < lineDistance) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(${lineColor},${0.08 * (1 - dist / lineDistance)})`;
            ctx.stroke();
          }
        }
        // Lines to mouse
        const mdx = p1.x - mx;
        const mdy = p1.y - my;
        const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mDist < lineDistance * 1.3) {
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(mx, my);
          ctx.strokeStyle = `rgba(${lineColor},${0.15 * (1 - mDist / (lineDistance * 1.3))})`;
          ctx.stroke();
        }
      }

      animRef.current = requestAnimationFrame(draw);
    };
    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', onMove);
    };
  }, [theme, initParticles, lineDistance]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-auto ${className}`}
      style={{ zIndex: 0 }}
    />
  );
}
