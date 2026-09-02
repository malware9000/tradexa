'use client';

import { useCallback, useRef } from 'react';

export default function Reactive({
  children,
  className = '',
  tilt = true,
  glare = true,
  spotlight = true,
  maxTilt = 8,
}: {
  children: React.ReactNode;
  className?: string;
  tilt?: boolean;
  glare?: boolean;
  spotlight?: boolean;
  maxTilt?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      el.style.setProperty('--px', `${px}px`);
      el.style.setProperty('--py', `${py}px`);
      if (tilt) {
        const rx = ((py / rect.height) - 0.5) * -2 * maxTilt;
        const ry = ((px / rect.width) - 0.5) * 2 * maxTilt;
        el.style.setProperty('--rx', `${rx}deg`);
        el.style.setProperty('--ry', `${ry}deg`);
        el.style.transform = `perspective(700px) rotateX(${rx}deg) rotateY(${ry}deg)`;
      }
    },
    [tilt, maxTilt],
  );

  const onLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--px', '-400px');
    el.style.setProperty('--py', '-400px');
    if (tilt) el.style.transform = 'perspective(700px) rotateX(0) rotateY(0)';
  }, [tilt]);

  const cls = [
    className,
    spotlight ? 'reactive' : '',
    glare ? 'glare' : '',
    tilt ? 'tilt' : '',
  ].filter(Boolean).join(' ');

  return (
    <div ref={ref} className={cls} onMouseMove={onMove} onMouseLeave={onLeave}>
      {children}
    </div>
  );
}
