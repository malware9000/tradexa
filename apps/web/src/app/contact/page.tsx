import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with the Tradexa support team.',
};

export default function ContactPage() {
  return (
    <section className="content">
      <h1>Contact Us</h1>
      <div className="card contact-grid">
        <div>
          <h3>Email</h3>
          <a href="mailto:support@tradexa.example.com">support@tradexa.example.com</a>
        </div>
        <div>
          <h3>Phone</h3>
          <a href="tel:+15551234567">+1 (555) 123-4567</a>
        </div>
        <div>
          <h3>Help Center</h3>
          <p>
            Browse guided articles, or open a support ticket from your account
            dashboard.
          </p>
          <a href="/help">Visit Help Center</a>
        </div>
      </div>
    </section>
  );
}