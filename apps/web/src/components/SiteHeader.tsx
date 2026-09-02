'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import MobileNav from '@/components/MobileNav';

export default function SiteHeader() {
  const pathname = usePathname();
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    setAuthed(Boolean(localStorage.getItem('tradexa_token')));
  }, [pathname]);

  if (pathname.startsWith('/dashboard')) {
    return null;
  }

  return (
    <header className="site-header">
      <div className="brand">
        <Link href="/" className="logo-link" aria-label="Tradexa home">
          <div className="logo-mark-wrap">
            <span className="logo-mark">T</span>
            <span className="logo-pulse" />
          </div>
          <span className="logo-text">Tradexa</span>
        </Link>
      </div>
      <nav className="desktop-nav" aria-label="Main">
        <Link href="/" className={pathname === '/' ? 'active' : ''}>
          Home
        </Link>
        <Link href="/how-it-works" className={pathname === '/how-it-works' ? 'active' : ''}>
          How It Works
        </Link>
        <Link href="/help" className={pathname === '/help' ? 'active' : ''}>
          Help Center
        </Link>
        {authed ? (
          <>
            <Link href="/dashboard" className={pathname === '/dashboard' ? 'active' : ''}>
              Dashboard
            </Link>
            <Link
              href="/login"
              onClick={() => {
                localStorage.removeItem('tradexa_token');
                localStorage.removeItem('tradexa_user');
              }}
            >
              Log out
            </Link>
          </>
        ) : (
          <>
            <Link href="/login">Login</Link>
            <Link href="/register" className="btn-nav-cta">
              Get Started
            </Link>
          </>
        )}
      </nav>
      <MobileNav />
    </header>
  );
}