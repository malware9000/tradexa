import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://tradexa.example.com'),
  title: {
    default: 'Tradexa — Investment & Trading Platform',
    template: '%s | Tradexa',
  },
  description:
    'Tradexa is a transparent investment and trading platform. Phase 1 runs a controlled test environment with simulated returns clearly labelled as test credits.',
  icons: {
    icon: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}