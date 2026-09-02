'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import DashboardSidebar from '@/components/DashboardSidebar';

const titles: Record<string, string> = {
  '/dashboard': 'Overview',
  '/dashboard/deposits': 'Deposits',
  '/dashboard/withdrawals': 'Withdrawals',
  '/dashboard/test-credits': 'Test Credits',
  '/dashboard/transactions': 'Transactions',
  '/dashboard/support': 'Support',
  '/dashboard/profile': 'Profile',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('tradexa_token');
    if (!token) {
      router.replace('/login');
      return;
    }
    setAuthed(true);
  }, [router]);

  if (!authed) {
    return null;
  }

  const title = titles[pathname] || 'Dashboard';

  return (
    <div className="dash-shell">
      <DashboardSidebar />
      <div className="dash-main">
        <div className="dash-content">
          {children}
        </div>
      </div>
    </div>
  );
}