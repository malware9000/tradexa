import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Help Center',
  description: 'Help articles for Tradexa accounts, payments, withdrawals, security, and returns.',
};

const sections = [
  {
    title: 'Getting Started',
    items: [
      'Creating an account',
      'Verifying an account',
      'Depositing funds',
      'Understanding the dashboard',
    ],
  },
  {
    title: 'Payments',
    items: [
      'Deposit problems',
      'Payment verification',
      'Failed payments',
      'Refunds',
    ],
  },
  {
    title: 'Withdrawals',
    items: [
      'Requesting a withdrawal',
      'Processing times',
      'Failed withdrawals',
    ],
  },
  {
    title: 'Security',
    items: ['Password', 'Two-factor authentication', 'Suspicious activity'],
  },
  {
    title: 'Returns',
    items: [
      'How returns are credited',
      'Return calculation periods',
      'Account limitations',
    ],
  },
];

export default function HelpPage() {
  return (
    <section className="content">
      <h1>Help Center</h1>
      {sections.map((s) => (
        <div className="card" key={s.title}>
          <h3>{s.title}</h3>
          <ul className="check-list">
            {s.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ))}
      <div className="card">
        <h3>Returns</h3>
        <p>
          Returns are credited for each completed period based on confirmed
          deposits, applied at the configured rate. Every entry is recorded in
          the ledger. Trading and investing involve risk and returns are not
          guaranteed.
        </p>
      </div>
    </section>
  );
}
