'use client';

import { useMemo } from 'react';

interface Point {
  date: string;
  balance: number | null;
}

export default function PortfolioChart({ data }: { data: Point[] }) {
  const chart = useMemo(() => {
    const pts = data
      .filter((d) => d.balance !== null)
      .map((d) => ({ ...d, balance: Number(d.balance) }));
    if (pts.length === 0) {
      return null;
    }
    const W = 600;
    const H = 220;
    const pad = 24;
    const values = pts.map((p) => p.balance);
    const min = Math.min(0, ...values);
    const max = Math.max(...values);
    const span = max - min || 1;
    const x = (i: number) => pad + (i * (W - pad * 2)) / Math.max(pts.length - 1, 1);
    const y = (v: number) => H - pad - ((v - min) / span) * (H - pad * 2);
    const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(p.balance)}`).join(' ');
    const area = `${line} L${x(pts.length - 1)},${H - pad} L${x(0)},${H - pad} Z`;
    const last = pts[pts.length - 1];
    const first = pts[0];
    const delta = last.balance - first.balance;
    const pct = first.balance > 0 ? (delta / first.balance) * 100 : 0;
    return { line, area, last, delta, pct, W, H, min, max };
  }, [data]);

  if (!chart) {
    return (
      <div className="chart-empty">
        <p>Balance history will appear here once your account starts generating activity.</p>
      </div>
    );
  }

  const { line, area, last, delta, pct, W, H, min, max } = chart;

  return (
    <div>
      <div className="chart-summary">
        <span className="chart-value">${last.balance.toFixed(2)}</span>
        <span className={delta >= 0 ? 'trend-up' : 'trend-down'}>
          {delta >= 0 ? '+' : ''}
          {delta.toFixed(2)} ({pct >= 0 ? '+' : ''}
          {pct.toFixed(1)}%)
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="chart-svg" role="img" aria-label="Portfolio balance over time">
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((t) => (
          <line
            key={t}
            x1={24}
            x2={W - 24}
            y1={24 + t * (H - 48)}
            y2={24 + t * (H - 48)}
            stroke="rgba(148,163,184,0.15)"
            strokeDasharray="4 4"
          />
        ))}
        <path d={area} fill="url(#areaFill)" />
        <path d={line} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={W - 24} cy={24 + ((H - 48) * (max - last.balance)) / (max - min || 1)} r="4" fill="var(--accent)" />
      </svg>
      <div className="chart-labels">
        <span>min {min.toFixed(2)}</span>
        <span>max {max.toFixed(2)}</span>
      </div>
    </div>
  );
}