import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'How It Works',
  description: 'How Tradexa works: create an account, fund it, and track your portfolio.',
};

export default function HowItWorks() {
  return (
    <section className="content">
      <h1>How It Works</h1>
      <div className="card">
        <h3>1. Create an account</h3>
        <p>Register with an email and password to get started.</p>
        <h3>2. Fund your account</h3>
        <p>
          Make a deposit. The backend verifies the payment before crediting
          your ledger.
        </p>
        <h3>3. Track your portfolio</h3>
        <p>
          Watch your balance and the Phase 1 simulated test credits accumulate.
        </p>
        <h3>4. Withdraw when ready</h3>
        <p>
          Submit a withdrawal request from your dashboard. Admin review and
          processing follow before completion.
        </p>
      </div>
    </section>
  );
}
