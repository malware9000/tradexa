import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Security',
  description: 'How Tradexa protects your data, passwords, and financial records.',
};

export default function SecurityPage() {
  return (
    <section className="content">
      <h1>Security</h1>
      <div className="card">
        <ul className="check-list">
          <li>Passwords hashed with Argon2id &mdash; never stored in plaintext.</li>
          <li>TLS 1.2+ for all traffic; sensitive data encrypted at rest.</li>
          <li>Financial records stored as an immutable, audited ledger.</li>
          <li>Rate limiting, brute-force protection, and session management.</li>
          <li>Payment webhooks verified server-side and idempotent.</li>
        </ul>
      </div>
    </section>
  );
}
