'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const links = [
  { href: '/', label: 'Overview', icon: 'M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z' },
  { href: '/users', label: 'Users', icon: 'M16 11c1.7 0 3-1.3 3-3s-1.3-3-3-3-3 1.3-3 3 1.3 3 3 3zm-8 0c1.7 0 3-1.3 3-3S9.7 5 8 5 5 6.3 5 8s1.3 3 3 3zm8 1c-2.3 0-7 1.2-7 3.5V19h14v-3.5c0-2.3-4.7-3.5-7-3.5zM8 12c-2.5 0-8 1.3-8 3.5V19h7v-3c0-1.5.6-2.6 1.5-3.5C8.1 12.2 8 12 8 12z' },
  { href: '/deposits', label: 'Deposits', icon: 'M12 2l9 4.5v7.1L21 11v9H3v-9l1.5-2.4V5.9L12 2zm0 2.9L5.9 7.4 12 9.9l6.1-2.5L12 4.9zM8 13v4h8v-4H8z' },
  { href: '/withdrawals', label: 'Withdrawals', icon: 'M11 3l2 5h3l1.5 1.5h-12L7 8h3l2-5zM5 12h14v2H5v-2zm1 4h12v2H6v-2zm2 4h8v2H8v-2z' },
  { href: '/support', label: 'Support', icon: 'M21 6h-2v2h-2V6h-2V4h2V2h2v2h2v2zm-10 3c1.7 0 3 1.3 3 3s-1.3 3-3 3-3-1.3-3-3 1.3-3 3-3zm7 2h2v5c0 1.7-1.3 3-3 3h-2v3l-4-2H8a5 5 0 01-5-5v-3a5 5 0 015-5h5v2H8a3 3 0 00-3 3v3a3 3 0 003 3h3.2l2.3 1.1V18h1a1 1 0 001-1v-6z' },
  { href: '/settings', label: 'Settings', icon: 'M19.4 13a7.9 7.9 0 000-2l2.1-1.6-2-3.4-2.5 1a7.9 7.9 0 00-1.7-1L15 3.5h-4l-.4 2.5c-.6.2-1.2.5-1.7 1l-2.5-1-2 3.4L6.6 11c0 .7 0 1.4-.1 2L4.4 14.6l2 3.4 2.5-1c.5.4 1.1.8 1.7 1l.4 2.5h4l.4-2.5c.6-.3 1.2-.6 1.7-1l2.5 1 2-3.4-2.2-1.6zM13 15.5A3.5 3.5 0 1113 8a3.5 3.5 0 010 7.5z' },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const admin = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('tradexa_admin') || 'null') : null;

  function logout() {
    localStorage.removeItem('tradexa_admin_token');
    localStorage.removeItem('tradexa_admin');
    router.replace('/login');
  }

  return (
    <aside className="dash-sidebar">
      <div className="dash-brand">
        <span className="logo-mark">A</span>
        <span>Tradexa Admin</span>
      </div>
      <nav className="dash-nav">
        {links.map((l) => {
          const active = l.href === '/' ? pathname === '/' : pathname.startsWith(l.href);
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
        <div className="admin-chip">
          <strong>{admin?.fullName || admin?.email || 'Admin'}</strong>
          <span>{admin?.role || ''}</span>
        </div>
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