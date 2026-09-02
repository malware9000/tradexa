import type { Metadata } from 'next';
import Link from 'next/link';
import GridBackground from '@/components/GridBackground';

export const metadata: Metadata = {
  title: 'Home',
  description:
    'Tradexa is a transparent investment and trading platform. See what the Phase 1 test environment offers.',
};

export default function Home() {
  return (
    <>
      <section className="hero-section">
        <GridBackground />
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-dot" />
            Phase 1 Test Environment
          </div>
          <h1 className="hero-title">
            Trade with
            <span className="gradient-text"> transparency</span>
          </h1>
          <p className="hero-subtitle">
            A transparent investment and trading platform. Watch simulated returns
            accrue in real-time with our Phase 1 test environment.
          </p>
          <div className="hero-actions">
            <Link href="/register" className="btn-hero-primary">
              Get Started
              <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <Link href="/how-it-works" className="btn-hero-secondary">
              Learn More
            </Link>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-value">100%</span>
              <span className="hero-stat-label">Transparent</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-value">24/7</span>
              <span className="hero-stat-label">Monitoring</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-value">Phase 1</span>
              <span className="hero-stat-label">Test Mode</span>
            </div>
          </div>
        </div>
      </section>

      <section className="features-section">
        <div className="features-grid">
          <div className="feature-card reactive glare tilt">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <h3>Secure by Design</h3>
            <p>Backend is the source of truth for all financial data. Every transaction is verified and logged.</p>
          </div>
          <div className="feature-card reactive glare tilt">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            <h3>Real-time Tracking</h3>
            <p>Watch your portfolio evolve with live updates and simulated test credit accrual.</p>
          </div>
          <div className="feature-card reactive glare tilt">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0022 16z" />
              </svg>
            </div>
            <h3>Cross-platform</h3>
            <p>Access from web or mobile. Single shared API powers both experiences seamlessly.</p>
          </div>
        </div>
      </section>

      <section className="disclosure-section">
        <div className="disclosure-card reactive">
          <div className="disclosure-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
          </div>
          <div>
            <h3>Test Account Disclosure</h3>
            <p>
              During Phase 1, all returns shown are simulated test credits applied
              at the configured test rate. They are NOT representations of actual
              trading performance and are NOT guaranteed investment returns.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
