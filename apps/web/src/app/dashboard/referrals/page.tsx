'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, fmtMoney, fmtDate } from '@/lib/api';
import { TableSkeleton } from '@/components/DashboardSkeleton';

interface ReferredUser {
  id: string;
  email: string;
  fullName: string | null;
  status: string;
  createdAt: string;
}

interface Reward {
  id: string;
  type: 'bonus' | 'welcome';
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
}

interface Overview {
  code: string;
  enabled: boolean;
  referralRate: number;
  welcomeBonus: number;
  referredCount: number;
  activeReferrals: number;
  depositedReferrals: number;
  totalBonusEarned: number;
  bonusRewardsCount: number;
  totalWelcomeReceived: number;
  referredUsers: ReferredUser[];
  rewards: Reward[];
}

export default function ReferralsPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [link, setLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(() => {
    return Promise.all([
      api<Overview>('/referrals/me'),
      api<{ url: string }>('/referrals/link'),
    ])
      .then(([ov, ln]) => {
        setData(ov.data);
        setLink(ln.data?.url || '');
      })
      .catch((e) => setError(e?.message || 'Failed to load referral data'))
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Could not copy to clipboard.');
    }
  }

  return (
    <div>
      <div className="dash-grid">
        <div className="card">
          <h3>Your referral code</h3>
          <p className="hint">
            Share your code or link. When someone registers with it and makes their first
            deposit, you earn a bonus and they get a welcome bonus.
          </p>
          {!loaded ? (
            <div className="hint">Loading…</div>
          ) : (
            <>
              <div className="stat-grid">
                <div className="stat-card">
                  <span className="stat-label">Your code</span>
                  <span className="stat-value" style={{ fontSize: '1.3rem' }}>{data?.code || '—'}</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Share link</span>
                  <span className="stat-value">
                    <button className="btn-secondary" onClick={copyLink} disabled={!link}>
                      {copied ? 'Copied!' : 'Copy link'}
                    </button>
                  </span>
                </div>
              </div>
              <div className="hint">
                Bonus: {((data?.referralRate || 0) * 100).toFixed(0)}% of their first deposit · Welcome: {fmtMoney(data?.welcomeBonus || 0)}
              </div>
              <div className="hint" style={{ wordBreak: 'break-all' }}>
                {link || 'Your referral link will appear here.'}
              </div>
            </>
          )}
        </div>

        <div className="card">
          <h3>Referral summary</h3>
          {!loaded ? (
            <div className="hint">Loading…</div>
          ) : (
            <div className="stat-grid">
              <div className="stat-card">
                <span className="stat-label">Referred users</span>
                <span className="stat-value">{data?.referredCount ?? 0}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Active referrals</span>
                <span className="stat-value">{data?.activeReferrals ?? 0}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Deposited referrals</span>
                <span className="stat-value">{data?.depositedReferrals ?? 0}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Bonus earned</span>
                <span className="stat-value">{fmtMoney(data?.totalBonusEarned || 0)}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Bonus rewards</span>
                <span className="stat-value">{data?.bonusRewardsCount ?? 0}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Welcome received</span>
                <span className="stat-value">{fmtMoney(data?.totalWelcomeReceived || 0)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h3>People you referred</h3>
        </div>
        {!loaded ? (
          <TableSkeleton rows={3} cols={3} />
        ) : !data?.referredUsers.length ? (
          <p className="hint">No referrals yet. Share your code to get started.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Status</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {data.referredUsers.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <strong>{u.fullName || u.email}</strong>
                      <div className="muted">{u.email}</div>
                    </td>
                    <td><span className="badge badge-status">{u.status}</span></td>
                    <td className="muted">{fmtDate(u.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-head">
          <h3>Rewards history</h3>
        </div>
        {!loaded ? (
          <TableSkeleton rows={3} cols={3} />
        ) : !data?.rewards.length ? (
          <p className="hint">No rewards yet.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {data.rewards.map((r) => (
                  <tr key={r.id}>
                    <td>{r.type === 'welcome' ? 'Welcome bonus' : 'Referral bonus'}</td>
                    <td className={r.type === 'welcome' ? '' : 'pos'}>
                      {fmtMoney(r.amount, r.currency)}
                    </td>
                    <td><span className="badge badge-status">{r.status}</span></td>
                    <td className="muted">{fmtDate(r.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {error && <div className="alert alert-error" role="alert">{error}</div>}
    </div>
  );
}
