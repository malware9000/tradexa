'use client';

import { Skeleton, SkeletonText } from './Loading';

export function StatCardSkeleton() {
  return (
    <div className="skeleton-card">
      <SkeletonText as="line" width="55%" />
      <SkeletonText as="heading" width="70%" />
      <SkeletonText as="line" width="40%" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="skeleton-screen">
      <div className="stat-grid">
        {[0, 1, 2, 3].map((i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <div className="dash-grid">
        <div className="skeleton-card">
          <SkeletonText as="title" width="45%" />
          <Skeleton style={{ aspectRatio: '2.2 / 1', borderRadius: 12 }} />
        </div>
        <div className="skeleton-card">
          <SkeletonText as="title" width="55%" />
          <Skeleton style={{ height: 120, borderRadius: 10 }} />
          <SkeletonText as="line" width="90%" />
          <SkeletonText as="line" width="75%" />
        </div>
      </div>
      <TableSkeleton />
    </div>
  );
}

export function TableSkeleton({ rows = 4, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="skeleton-card">
      <SkeletonText as="title" width="40%" />
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

export function ProfileSkeleton() {
  return (
    <div className="dash-grid">
      <div className="skeleton-card">
        <SkeletonText as="title" width="40%" />
        <Skeleton style={{ height: 200, borderRadius: 10 }} />
      </div>
      <div className="skeleton-card">
        <SkeletonText as="title" width="40%" />
        <Skeleton style={{ height: 280, borderRadius: 10 }} />
      </div>
    </div>
  );
}
