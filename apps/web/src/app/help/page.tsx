import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Help Center',
  description: 'Help articles for Tradexa accounts, payments, withdrawals, security, and the test environment.',
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
    title: 'Test Environment',
    items: [
      'What simulated returns mean',
      'How the test credit calculation works',
      'Test account limitations',
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
        <h3>Test Environment</h3>
        <p>
          Returns shown during the testing phase are simulated test credits
          applied at the configured rate. They are not representations of
          actual trading performance and are not guaranteed returns.
        </p>
      </div>
    </section>
  );
}
