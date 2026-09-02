import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Risk Disclosure',
  description: 'Important risks associated with trading and investing on Tradexa.',
};

export default function Risk() {
  return (
    <section className="content">
      <h1>Risk Disclosure</h1>
      <div className="card">
        <h3>Investing and Trading Involve Risk</h3>
        <p>
          Trading and investing involve risk, including the possible loss of
          principal. Past performance is not indicative of future results.
        </p>
        <h3>Phase 1 Test Environment</h3>
        <p>
          Any returns shown during the Phase 1 test environment are simulated
          test credits. They are not actual trading profits and are not
          guaranteed returns. You should not rely on them as a representation
          of future performance.
        </p>
        <h3>Seek Advice</h3>
        <p>
          Before making any investment decisions, consider seeking guidance from
          a qualified financial, legal, and tax professional.
        </p>
      </div>
    </section>
  );
}
