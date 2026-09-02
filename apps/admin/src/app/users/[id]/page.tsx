'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api, fmtMoney, fmtDate } from '@/lib/api';
import { DetailSkeleton } from '@/components/AdminSkeleton';

interface UserDetail {
  id: string;
  email: string;
  emailVerified: boolean;
  status: string;
  kycStatus: string;
  twoFactorEnabled: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  profile: { fullName?: string | null; phone?: string | null; country?: string | null; address?: string | null } | null;
  investmentAccount: { currency: string; status: string } | null;
  deposits: Array<{ id: string; amount: number; currency: string; status: string; createdAt: string }>;
  withdrawals: Array<{ id: string; amount: number; currency: string; status: string; createdAt: string }>;
  testReturns: Array<{ id: string; creditAmount: number; currency: string; periodEnd: string; status: string }>;
  securityEvents: Array<{ id: string; eventType: string; createdAt: string; detail: unknown }>;
}

export default function UserDetailPage() {
  const params = useParams<{ id: string }>();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api<UserDetail>(`/admin/users/${params.id}`)
      .then(({ data }) => setUser(data))
      .catch((e) => setError(e?.message || 'Failed to load user'));
  }, [params.id]);

  if (error) return <div className="alert alert-error" role="alert">{error}</div>;
  if (!user) return <DetailSkeleton />;

  return (
    <div>
      <div className="page-head">
        <div>
          <Link className="btn-link" href="/users">← Back to users</Link>
          <h1>{user.profile?.fullName || user.email}</h1>
          <p className="muted">{user.email}</p>
        </div>
        <span className={`badge badge-status st-${user.status.toLowerCase()}`}>{user.status}</span>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-label">Status</span>
          <span className="stat-value stat-warn">{user.status}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">KYC</span>
          <span className="stat-value">{user.kycStatus}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">2FA</span>
          <span className="stat-value">{user.twoFactorEnabled ? 'On' : 'Off'}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Joined</span>
          <span className="stat-value small">{fmtDate(user.createdAt)}</span>
        </div>
      </div>

      <div className="dash-grid">
        <div className="card">
          <h3>Properties</h3>
          <div className="kv">
            <div><span>Email verified</span><strong>{user.emailVerified ? 'Yes' : 'No'}</strong></div>
            <div><span>Country</span><strong>{user.profile?.country || '—'}</strong></div>
            <div><span>Phone</span><strong>{user.profile?.phone || '—'}</strong></div>
            <div><span>Address</span><strong>{user.profile?.address || '—'}</strong></div>
            <div><span>Currency</span><strong>{user.investmentAccount?.currency || 'USD'}</strong></div>
            <div><span>Last login</span><strong>{fmtDate(user.lastLoginAt)}</strong></div>
          </div>
        </div>

        <div className="card">
          <h3>Recent deposits</h3>
          {user.deposits.length === 0 ? (
            <p className="hint">None.</p>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
                <tbody>
                  {user.deposits.map((d) => (
                    <tr key={d.id}>
                      <td>{fmtMoney(d.amount, d.currency)}</td>
                      <td><span className="badge badge-status">{d.status}</span></td>
                      <td className="muted">{fmtDate(d.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <h3>Recent withdrawals</h3>
          {user.withdrawals.length === 0 ? (
            <p className="hint">None.</p>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
                <tbody>
                  {user.withdrawals.map((w) => (
                    <tr key={w.id}>
                      <td>{fmtMoney(w.amount, w.currency)}</td>
                      <td><span className="badge badge-status">{w.status}</span></td>
                      <td className="muted">{fmtDate(w.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <h3>Test returns</h3>
          {user.testReturns.length === 0 ? (
            <p className="hint">None.</p>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Credit</th><th>Period end</th><th>Status</th></tr></thead>
                <tbody>
                  {user.testReturns.map((r) => (
                    <tr key={r.id}>
                      <td className="pos">{fmtMoney(r.creditAmount, r.currency)}</td>
                      <td className="muted">{fmtDate(r.periodEnd)}</td>
                      <td><span className="badge badge-status">{r.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card span-2">
          <h3>Security events</h3>
          {user.securityEvents.length === 0 ? (
            <p className="hint">No security events recorded.</p>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Event</th><th>Detail</th><th>Date</th></tr></thead>
                <tbody>
                  {user.securityEvents.map((e) => (
                    <tr key={e.id}>
                      <td className="mono">{e.eventType}</td>
                      <td className="muted">{JSON.stringify(e.detail || {})}</td>
                      <td className="muted">{fmtDate(e.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}