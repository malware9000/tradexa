import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About',
  description: 'Learn about Tradexa, a transparent investment and trading platform.',
};

export default function AboutPage() {
  return (
    <section className="content">
      <h1>About Tradexa</h1>
      <div className="card">
        <p>
          Tradexa is an investment and trading platform designed around
          transparency and the principle that the backend is the source of
          truth for all financial data.
        </p>
        <p>
          Users can register, fund an account, watch returns accrue on a
          per-period basis, and request withdrawals — all backed by a single
          shared API and database for both the website and mobile app.
        </p>
      </div>
    </section>
  );
}
