import { useEffect, useRef, useState } from 'react';

/**
 * Tracks whether a 3D viewport is currently visible (or near the viewport) so
 * only active canvases mount WebGL contexts and fetch .glb assets.
 */
export function useInViewLazy(rootMargin = '220px 0px', keepMountedAfterSeen = false) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (keepMountedAfterSeen) {
            observer.disconnect();
          }
        } else if (!keepMountedAfterSeen) {
          setIsVisible(false);
        }
      },
      { rootMargin, threshold: 0.05 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin, keepMountedAfterSeen]);

  return { ref, isVisible };
}
