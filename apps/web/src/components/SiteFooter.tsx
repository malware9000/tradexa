'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function SiteFooter() {
  const pathname = usePathname();
  const year = new Date().getFullYear();

  if (pathname.startsWith('/dashboard')) {
    return null;
  }

  return (
    <footer className="site-footer">
      <div className="footer-col">
        <div className="brand">
          <Link href="/" className="logo-link" aria-label="Tradexa home">
            <div className="logo-mark-wrap">
              <span className="logo-mark">T</span>
            </div>
            <span className="logo-text">Tradexa</span>
          </Link>
        </div>
        <p className="footer-tagline">A transparent investment and trading platform.</p>
      </div>
      <div className="footer-col">
        <h4>Company</h4>
        <Link href="/about">About</Link>
        <Link href="/how-it-works">How It Works</Link>
        <Link href="/security">Security</Link>
      </div>
      <div className="footer-col">
        <h4>Support</h4>
        <Link href="/help">Help Center</Link>
        <Link href="/faq">FAQ</Link>
        <Link href="/contact">Contact</Link>
      </div>
      <div className="footer-col">
        <h4>Contact</h4>
        <a href="mailto:support@tradexa.example.com">support@tradexa.example.com</a>
        <a href="tel:+15551234567">+1 (555) 123-4567</a>
      </div>
      <div className="footer-legal">
        <Link href="/terms">Terms of Service</Link>
        <Link href="/privacy">Privacy Policy</Link>
        <Link href="/risk">Risk Disclosure</Link>
        <span>&copy; {year} Tradexa. All rights reserved.</span>
      </div>
    </footer>
  );
}