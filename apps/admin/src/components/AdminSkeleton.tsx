'use client';

import { Skeleton, SkeletonText } from './Loading';

export function StatCardSkeleton() {
  return (
    <div className="skeleton-card">
      <SkeletonText as="line" width="55%" />
      <SkeletonText as="heading" width="70%" />
      <SkeletonText as="line" width="55%" />
    </div>
  );
}

export function AdminStatsSkeleton() {
  return (
    <div className="skeleton-screen">
      <div className="stat-grid">
        {[0, 1, 2, 3, 4].map((i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <div className="dash-grid">
        <div className="skeleton-card">
          <SkeletonText as="title" width="50%" />
          <Skeleton style={{ height: 140, borderRadius: 10 }} />
        </div>
        <div className="skeleton-card">
          <SkeletonText as="title" width="50%" />
          <Skeleton style={{ height: 180, borderRadius: 10 }} />
        </div>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="skeleton-card">
      <SkeletonText as="title" width="35%" />
      <div className="skeleton-table">
        <div className="skeleton-tr">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="skeleton-th" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, r) => (
          <div className="skeleton-tr" key={r}>
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton key={c} className="skeleton-td" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="skeleton-screen">
      <div className="stat-grid">
        {[0, 1, 2, 3].map((i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <div className="dash-grid">
        <div className="skeleton-card">
          <SkeletonText as="title" width="40%" />
          <Skeleton style={{ height: 180, borderRadius: 10 }} />
        </div>
        <div className="skeleton-card">
          <SkeletonText as="title" width="45%" />
          <Skeleton style={{ height: 180, borderRadius: 10 }} />
        </div>
      </div>
    </div>
  );
}
