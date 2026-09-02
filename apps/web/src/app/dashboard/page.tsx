'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, fmtMoney, fmtDate } from '@/lib/api';
import PortfolioChart from '@/components/PortfolioChart';
import { DashboardSkeleton } from '@/components/DashboardSkeleton';

interface Summary {
  balance: number;
  totalDeposits: number;
  totalDepositsCount: number;
  totalTestCredits: number;
  totalTestCreditsCount: number;
  depositReturnRate: number;
  pendingWithdrawal: number;
  currency: string;
  periodHours: number;
  recentActivity: Array<{
    id: string;
    type: string;
    amount: number;
    currency: string;
    status: string;
    createdAt: string;
  }>;
}

export default function DashboardHome() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [chart, setChart] = useState<Array<{ date: string; balance: number | null }>>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api<Summary>('/accounts/summary'),
      api<Array<{ date: string; balance: number | null }>>('/accounts/chart'),
    ])
      .then(([s, c]) => {
        setSummary(s.data);
        setChart(c.data);
      })
      .catch((e) => setError(e?.message || 'Failed to load dashboard'));
  }, []);

  if (error) return <div className="alert alert-error" role="alert">{error}</div>;
  if (!summary) return <DashboardSkeleton />;

  const cur = summary.currency;
  const typeLabel: Record<string, string> = {
    DEPOSIT: 'Deposit',
    TEST_CREDIT: 'Test credit',
    WITHDRAWAL: 'Withdrawal',
    FEE: 'Fee',
    ADJUSTMENT: 'Adjustment',
    REVERSAL: 'Reversal',
    REFUND: 'Refund',
    TRADING_PNL: 'Trading P&L',
  };

  return (
    <div>
      <div className="stat-grid">
        <div className="stat-card accent">
          <span className="stat-label">Available balance</span>
          <span className="stat-value">{fmtMoney(summary.balance, cur)}</span>
          <span className="stat-hint">Reconstructed from ledger</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total deposits</span>
          <span className="stat-value">{fmtMoney(summary.totalDeposits, cur)}</span>
          <span className="stat-hint">{summary.totalDepositsCount} deposit{summary.totalDepositsCount === 1 ? '' : 's'} confirmed</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Test credits earned</span>
          <span className="stat-value">{fmtMoney(summary.totalTestCredits, cur)}</span>
          <span className="stat-hint">{summary.totalTestCreditsCount} period{summary.totalTestCreditsCount === 1 ? '' : 's'} credited</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Test return rate</span>
          <span className="stat-value stat-green">
            {(summary.depositReturnRate * 100).toFixed(2)}%
          </span>
          <span className="stat-hint">per {summary.periodHours}h period, simulated</span>
        </div>
      </div>

      <div className="dash-grid">
        <div className="card">
          <div className="card-head">
            <h3>Portfolio growth</h3>
            <span className="badge badge-test">Simulated</span>
          </div>
          <PortfolioChart data={chart} />
        </div>
        <div className="card">
          <h3>Quick actions</h3>
          <div className="quick-actions">
            <Link href="/dashboard/deposits" className="btn-primary">Make a deposit</Link>
            <Link href="/dashboard/withdrawals" className="btn-secondary">Request withdrawal</Link>
          </div>
          <p className="hint">
            Deposits are confirmed by the platform, then the test-return engine credits 2% per
            24-hour period. Earnings are simulated test credits, not real profit.
          </p>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h3>Recent activity</h3>
          <Link className="btn-link" href="/dashboard/transactions">View all</Link>
        </div>
        {summary.recentActivity.length === 0 ? (
          <p className="hint">No activity yet. Make your first deposit to get started.</p>
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
                {summary.recentActivity.map((t) => (
                  <tr key={t.id}>
                    <td>{typeLabel[t.type] || t.type}</td>
                    <td className={t.amount >= 0 ? 'pos' : 'neg'}>{fmtMoney(t.amount, t.currency)}</td>
                    <td><span className="badge badge-status">{t.status}</span></td>
                    <td className="muted">{fmtDate(t.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}