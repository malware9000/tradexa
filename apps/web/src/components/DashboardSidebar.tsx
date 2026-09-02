'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const links = [
  { href: '/dashboard', label: 'Overview', icon: 'M3 3h7v7H3V3zm11 0h7v7h-7V3zm0 11h7v7h-7v-7zM3 14h7v7H3v-7z' },
  { href: '/dashboard/deposits', label: 'Deposits', icon: 'M12 2l8 4v6c0 5-3.5 8.4-8 10-4.5-1.6-8-5-8-10V6l8-4zm-1 5v7.6l-3.3-3.3-1.4 1.4L12 18l5.7-5.3-1.4-1.4L13 14.6V7h-2z' },
  { href: '/dashboard/withdrawals', label: 'Withdrawals', icon: 'M12 3c4.4 0 8 3.6 8 8s-3.6 8-8 8-8-3.6-8-8 3.6-8 8-8zm0 2a6 6 0 100 12 6 6 0 000-12zm1 2v3h3v2h-3v3h-2v-3H8v-2h3V7h2z' },
  { href: '/dashboard/test-credits', label: 'Test Credits', icon: 'M12 2l3.6 7.2 8 1.2-5.8 5.7 1.4 8L12 20.7 4.8 24.1l1.4-8L.4 10.4l8-1.2L12 2z' },
  { href: '/dashboard/transactions', label: 'Transactions', icon: 'M6 2c1.1 0 2 .9 2 2v16c0 1.1-.9 2-2 2H4V2h2zm14 0c1.1 0 2 .9 2 2v16c0 1.1-.9 2-2 2H10c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10zm-7 4v2H20V6h-7zm0 4v2h7v-2h-7zm0 4v2h6v-2h-6z' },
  { href: '/dashboard/support', label: 'Support', icon: 'M21 6h-2v2h-2V6h-2V4h2V2h2v2h2v2zm-10 3c1.7 0 3 1.3 3 3s-1.3 3-3 3-3-1.3-3-3 1.3-3 3-3zm7 2h2v5c0 1.7-1.3 3-3 3h-2v3l-4-2H8a5 5 0 01-5-5v-3a5 5 0 015-5h5v2H8a3 3 0 00-3 3v3a3 3 0 003 3h3.2l2.3 1.1V18h1a1 1 0 001-1v-6z' },
  { href: '/dashboard/profile', label: 'Profile', icon: 'M12 2a5 5 0 015 5 5 5 0 01-10 0 5 5 0 015-5zm0 12c4.4 0 8 2.2 8 5v3H4v-3c0-2.8 3.6-5 8-5z' },
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  function logout() {
    localStorage.removeItem('tradexa_token');
    localStorage.removeItem('tradexa_user');
    router.replace('/login');
  }

  return (
    <aside className="dash-sidebar">
      <Link href="/" className="dash-brand" aria-label="Tradexa home">
        <span className="logo-mark">T</span>
        <span>Tradexa</span>
      </Link>
      <nav className="dash-nav">
        {links.map((l) => {
          const active =
            l.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(l.href);
          return (
            <Link key={l.href} href={l.href} className={active ? 'active' : ''}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
                <path d={l.icon} />
              </svg>
              <span>{l.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="dash-user">
        <button className="btn-link" onClick={logout}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
            <path d="M16 13v-2H7V8l-5 4 5 4v-3h9zM5 3h14c1.1 0 2 .9 2 2v14c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2v-3h2v3h14V5H5v3H3V5c0-1.1.9-2 2-2z" />
          </svg>
          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
}