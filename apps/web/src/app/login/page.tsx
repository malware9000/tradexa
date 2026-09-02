'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok || !data.accessToken) {
      setError(
        typeof data.message === 'string'
          ? data.message
          : 'Unable to log in. Please try again.',
      );
      return;
    }
    localStorage.setItem('tradexa_token', data.accessToken);
    setSuccess('Logged in successfully.');
    router.push('/dashboard');
  }

  return (
    <div className="content" style={{ maxWidth: 400 }}>
      <h1>Log In</h1>
      {error && <div className="alert alert-error" role="alert">{error}</div>}
      {success && (
        <div className="alert alert-success" role="status">{success}</div>
      )}
      <form className="card" onSubmit={onSubmit}>
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
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="form-buttons">
          <button type="submit" disabled={loading}>
            {loading ? 'Logging in…' : 'Log In'}
          </button>
        </div>
      </form>
      <p style={{ color: 'var(--muted)' }}>
        No account yet? <Link href="/register">Create one</Link>.
      </p>
    </div>
  );
}
