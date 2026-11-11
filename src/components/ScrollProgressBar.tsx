import { useEffect, useState } from 'react';
import { useReducedMotion } from '../hooks/useReducedMotion';

export function ScrollProgressBar() {
  const [progress, setProgress] = useState(0);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    const update = () => {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      if (scrollable <= 0) {
        setProgress(0);
        return;
      }
      const next = Math.min(1, Math.max(0, window.scrollY / scrollable));
      setProgress(next);
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  if (prefersReduced) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[2.5px] bg-ivory/10"
    >
      <div
        className="h-full origin-left bg-gradient-to-r from-chocolate via-gold to-rose transition-transform duration-75"
        style={{ transform: `scaleX(${progress})` }}
      />
    </div>
  );
}
