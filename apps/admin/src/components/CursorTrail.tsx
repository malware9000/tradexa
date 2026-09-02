'use client';

import { useEffect, useRef } from 'react';

const TRAIL_LENGTH = 16;

export default function CursorTrail() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const dots: HTMLDivElement[] = [];
    const positions: Array<{ x: number; y: number; t: number }> = [];
    for (let i = 0; i < TRAIL_LENGTH; i++) {
      const dot = document.createElement('div');
      dot.className = 'cursor-trail-dot';
      container.appendChild(dot);
      dots.push(dot);
      positions.push({ x: 0, y: 0, t: 0 });
    }

    let raf = 0;
    let index = 0;

    const onMove = (e: MouseEvent) => {
      positions[index] = { x: e.clientX, y: e.clientY, t: performance.now() };
      index = (index + 1) % TRAIL_LENGTH;
    };

    const animate = () => {
      const now = performance.now();
      dots.forEach((dot, i) => {
        const p = positions[i];
        const age = now - p.t;
        if (age < 600) {
          const k = 1 - age / 600;
          dot.style.opacity = String(k * 0.6);
          dot.style.transform = `translate(-50%, -50%) scale(${0.5 + k * 0.7})`;
          dot.style.left = `${p.x}px`;
          dot.style.top = `${p.y}px`;
        } else {
          dot.style.opacity = '0';
        }
      });
      raf = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', onMove);
    raf = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf);
      container.innerHTML = '';
    };
  }, []);

  return <div ref={containerRef} className="cursor-trail-container" aria-hidden />;
}
