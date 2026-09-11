import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Frequently asked questions about Tradexa, returns, deposits, and withdrawals.',
};

const faqs = [
  {
    q: 'How do returns work?',
    a: 'A configurable rate is applied per completed 24-hour period, based on the confirmed deposit principal. Each eligible period creates one ledger entry, and a period is never credited twice.',
  },
  {
    q: 'Are returns guaranteed?',
    a: 'Returns are credited for completed periods on confirmed deposits, but trading and investing involve risk and returns are not guaranteed investment profits.',
  },
  {
    q: 'Do the website and mobile app show the same data?',
    a: 'Yes. The website and mobile app share a single backend API and database, so balances, deposits, transactions, and returns are identical everywhere.',
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