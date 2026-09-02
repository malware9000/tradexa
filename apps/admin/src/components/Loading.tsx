'use client';

export function Skeleton({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`skeleton ${className}`} style={style} aria-hidden />;
}

export function SkeletonText({
  width = '100%',
  as,
  className = '',
}: {
  width?: number | string;
  as?: 'line' | 'heading' | 'title' | 'block';
  className?: string;
}) {
  return <Skeleton className={`${as || ''} ${className}`} style={{ width }} />;
}

export function BrandSpinner({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="page-loader" role="status" aria-live="polite">
      <div className="spinner-brand" aria-hidden>
        <span>T</span>
      </div>
      <p className="page-loader-label">{label}…</p>
    </div>
  );
}
