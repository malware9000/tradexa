'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function DashboardTopbar({ title }: { title: string }) {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let mounted = true;
    api<{ count: number }>('/notifications/unread-count')
      .then(({ data }) => mounted && setUnread(Number(data.count) || 0))
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="dash-topbar">
      <h1>{title}</h1>
      <div className="dash-topbar-actions">
        <span className="pill">Phase 1 · Test environment</span>
        {unread > 0 && (
          <a href="/dashboard/profile" className="bell">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
              <path d="M12 2a7 7 0 00-7 7v4l-2 3v1h18v-1l-2-3V9a7 7 0 00-7-7zm2 16h-4v1a2 2 0 004 0v-1zm-2-13a6 6 0 00-6 6v4.2L8 19.5v.5h8v-.5l2-2.3V11a6 6 0 00-6-6z" />
            </svg>
            <span className="bell-badge">{unread}</span>
          </a>
        )}
      </div>
    </div>
  );
}