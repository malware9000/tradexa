import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How Tradexa collects, uses, and protects your personal information.',
};

export default function Privacy() {
  return (
    <section className="content">
      <h1>Privacy Policy</h1>
      <div className="card">
        <h3>Information We Collect</h3>
        <p>
          Tradexa only collects information necessary to provide the service,
          including account, contact, and transaction details.
        </p>
        <h3>How We Use Information</h3>
        <p>
          We use your information to operate your account, process transactions,
          provide support, and meet legal and security obligations.
        </p>
        <h3>Data Protection</h3>
        <p>
          Sensitive data is encrypted, transmitted over TLS, and stored in
          secured environments. Passwords are hashed and never stored in
          plaintext.
        </p>
        <h3>Your Rights</h3>
        <p>
          Depending on your jurisdiction, you may be able to access, correct,
          export, or request deletion of your personal information. Contact
          support to exercise these rights.
        </p>
      </div>
    </section>
  );
}
