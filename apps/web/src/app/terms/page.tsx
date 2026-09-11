import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'The terms that govern your use of the Tradexa platform.',
};

export default function Terms() {
  return (
    <section className="content">
      <h1>Terms of Service</h1>
      <div className="card">
        <h3>Acceptance of Terms</h3>
        <p>
          By accessing or using Tradexa, you agree to be bound by these terms of
          service and all applicable laws and regulations. If you do not agree,
          you may not use the platform.
        </p>
        <h3>Returns</h3>
        <p>
          Returns are credited for each completed 24-hour period based on
          confirmed deposits, applied at the configured rate. Returns are not
          guaranteed investment profits, do not represent the performance of
          any trading strategy, and may vary with platform configuration.
        </p>
        <h3>Account Responsibilities</h3>
        <p>
          You are responsible for maintaining the confidentiality of your
          credentials and for all activity under your account. Notify support
          immediately of any unauthorized use.
        </p>
        <h3>Changes to Terms</h3>
        <p>
          Tradexa may revise these terms from time to time. Continued use of the
          platform after changes are posted constitutes acceptance of the
          revised terms.
        </p>
      </div>
    </section>
  );
}
