import type { Metadata } from 'next';
import AdminAppShell from '@/components/AdminAppShell';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://tradexa.example.com'),
  title: {
    default: 'Tradexa Admin',
    template: '%s | Tradexa Admin',
  },
  description: 'Tradexa admin dashboard for user, payment, and account management.',
  icons: { icon: '/icon.svg' },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AdminAppShell>{children}</AdminAppShell>
      </body>
    </html>
  );
}