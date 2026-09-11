'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [referralCode, setReferralCode] = useState(searchParams.get('ref') || '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName,
        email,
        password,
        referralCode: referralCode.trim() || undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok || !data.accessToken) {
      setError(
        typeof data.message === 'string'
          ? data.message
          : 'Registration failed. Please try again.',
      );
      return;
    }
    localStorage.setItem('tradexa_token', data.accessToken);
    setSuccess('Account created successfully.');
    router.push('/dashboard');
  }

  return (
    <div className="content" style={{ maxWidth: 400 }}>
      <h1>Create Account</h1>
      {error && <div className="alert alert-error" role="alert">{error}</div>}
      {success && (
        <div className="alert alert-success" role="status">{success}</div>
      )}
      <form className="card" onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="fullName">Full Name</label>
          <input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="confirm">Confirm Password</label>
          <input
            id="confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="referral">Referral Code (optional)</label>
          <input
            id="referral"
            placeholder="e.g. TX1A2B3C4D"
            maxLength={20}
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value)}
          />
          <p className="hint">Have an invite code? Enter it here to earn a welcome bonus.</p>
        </div>
        <div className="form-buttons">
          <button type="submit" disabled={loading}>
            {loading ? 'Creating account…' : 'Register'}
          </button>
        </div>
      </form>
      <p style={{ color: 'var(--muted)' }}>
        Already registered? <Link href="/login">Log in</Link>.
      </p>
    </div>
  );
}
