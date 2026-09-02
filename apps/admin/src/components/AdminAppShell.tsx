'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import CursorTrail from '@/components/CursorTrail';

export default function AdminAppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('tradexa_admin_token');
    if (!token && pathname !== '/login') {
      router.replace('/login');
      return;
    }
    setAuthed(true);
  }, [pathname, router]);

  if (pathname === '/login') {
    return <>{children}</>;
  }

  if (!authed) {
    return null;
  }

  return (
    <div className="dash-shell">
      <CursorTrail />
      <AdminSidebar />
      <div className="dash-main">
        <div className="dash-content">{children}</div>
      </div>
    </div>
  );
}