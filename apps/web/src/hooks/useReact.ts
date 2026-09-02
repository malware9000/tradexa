'use client';

import { useCallback, useEffect, useRef } from 'react';

/**
 * A hook that attaches a mousemove/leave handler to a container element and
 * updates CSS custom properties (--mx, --my, --px, --py) used by the reactive
 * CSS effects (spotlight, tilt, glow). Falls back to window-level tracking so
 * effects work anywhere on the page.
 */
export function useReact() {
  const ref = useRef<HTMLDivElement | null>(null);

  const onMove = useCallback((e: MouseEvent) => {
    const target = ref.current;
    if (target) {
      const rect = target.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      target.style.setProperty('--mx', String(e.clientX));
      target.style.setProperty('--my', String(e.clientY));
      target.style.setProperty('--px', String(x));
      target.style.setProperty('--py', String(y));
    }
  }, []);

  const onLeave = useCallback(() => {
    const target = ref.current;
    if (!target) return;
    target.style.setProperty('--px', '-400px');
    target.style.setProperty('--py', '-400px');
  }, []);

  useEffect(() => {
    const el = ref.current || document.body;
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
    };
  }, [onMove, onLeave]);

  return ref;
}
