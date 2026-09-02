import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Frequently asked questions about Tradexa and the Phase 1 test environment.',
};

const faqs = [
  {
    q: 'What is the difference between the test environment and real trading?',
    a: 'During Phase 1, returns shown on the platform are simulated test credits applied at a configured test rate. They are not actual trading profits and are not guaranteed returns.',
  },
  {
    q: 'How does the test credit calculation work?',
    a: 'A configurable rate is applied per completed 24-hour period, based on the deposited principal. Each eligible period creates one ledger entry, and a period is never credited twice.',
  },
  {
    q: 'Do the website and mobile app show the same data?',
    a: 'Yes. The website and mobile app share a single backend API and database, so balances, deposits, transactions, and test credits are identical everywhere.',
  },
  {
    q: 'Is my password stored securely?',
    a: 'Passwords are hashed using Argon2id and are never stored in plaintext.',
  },
];

export default function FaqPage() {
  return (
    <section className="content">
      <h1>Frequently Asked Questions</h1>
      {faqs.map((f) => (
        <div className="card" key={f.q}>
          <h3>{f.q}</h3>
          <p>{f.a}</p>
        </div>
      ))}
    </section>
  );
}