import { useEffect, useRef, useState } from 'react';

/**
 * Observes when an element enters the viewport and marks it visible
 * for CSS-driven entrance animations (fade-up, etc.).
 */
export function useScrollAnimation<T extends HTMLElement = HTMLDivElement>(
  threshold = 0.12,
) {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, visible };
}
