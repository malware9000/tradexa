'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, fmtMoney, fmtDate } from '@/lib/api';
import { AdminStatsSkeleton } from '@/components/AdminSkeleton';

interface Stats {
  users: number;
  activeUsers: number;
  suspendedUsers: number;
  pendingUsers: number;
  deposits: { total: number; successful: number };
  withdrawals: { total: number; pending: number };
  testCredits: { total: number };
  recentUsers: Array<{ id: string; email: string; fullName: string | null; status: string; createdAt: string }>;
}

export default function AdminHome() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api<Stats>('/admin/stats')
      .then(({ data }) => setStats(data))
      .catch((e) => setError(e?.message || 'Failed to load admin stats'));
  }, []);

  if (error) return <div className="alert alert-error" role="alert">{error}</div>;
  if (!stats) return <AdminStatsSkeleton />;

  return (
    <div>
      <div className="page-head">
        <h1>Overview</h1>
        <p className="muted">Platform performance and pending actions.</p>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-label">Total users</span>
          <span className="stat-value">{stats.users}</span>
          <span className="stat-hint">{stats.activeUsers} active · {stats.suspendedUsers} suspended</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Pending users</span>
          <span className="stat-value stat-warn">{stats.pendingUsers}</span>
          <Link className="btn-sm" href="/users?status=PENDING">Review</Link>
        </div>
        <div className="stat-card">
          <span className="stat-label">Successful deposits</span>
          <span className="stat-value">{fmtMoney(stats.deposits.successful)}</span>
          <span className="stat-hint">{stats.deposits.total} total deposit requests</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Pending withdrawals</span>
          <span className="stat-value stat-warn">{fmtMoney(stats.withdrawals.pending)}</span>
          <Link className="btn-sm" href="/withdrawals?status=PENDING">Review</Link>
        </div>
        <div className="stat-card accent">
          <span className="stat-label">Test credits issued</span>
          <span className="stat-value stat-green">{fmtMoney(stats.testCredits.total)}</span>
          <span className="stat-hint">Simulated returns (Phase 1)</span>
        </div>
      </div>

      <div className="dash-grid">
        <div className="card">
          <div className="card-head">
            <h3>Quick actions</h3>
          </div>
          <div className="quick-actions">
            <Link className="btn-primary" href="/deposits?status=PENDING">Confirm pending deposits</Link>
            <Link className="btn-secondary" href="/withdrawals?status=PENDING">Process withdrawals</Link>
            <Link className="btn-secondary" href="/users">Browse users</Link>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h3>Recently registered</h3>
          </div>
          {stats.recentUsers.length === 0 ? (
            <p className="hint">No users yet.</p>
          ) : (
            <div className="user-mini-list">
              {stats.recentUsers.map((u) => (
                <Link key={u.id} href={`/users/${u.id}`} className="user-mini">
                  <div>
                    <strong>{u.fullName || u.email}</strong>
                    <span className="muted">{u.email}</span>
                  </div>
                  <span className="badge badge-status">{u.status}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <p className="muted">
          All financial movements are recorded in the ledger. This console is read-mostly:
          money is only ever moved by confirming deposits or completing withdrawals,
          which write immutable ledger entries.
        </p>
      </div>
    </div>
  );
}