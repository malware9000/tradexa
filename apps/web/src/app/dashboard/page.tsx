'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, fmtMoney, fmtDate } from '@/lib/api';
import PortfolioChart from '@/components/PortfolioChart';
import LiveTradingChart from '@/components/LiveTradingChart';
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
  recentActivity?: Array<{
    id: string;
    type: string;
    amount: number;
    currency: string;
    status: string;
    createdAt: string;
  }>;
  rank?: string;
  rankLabel?: string;
  rankBonusPercent?: string;
}

export default function DashboardHome() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [chart, setChart] = useState<Array<{ date: string; balance: number | null }>>([]);
  const [prices, setPrices] = useState<Record<string, number>>({});
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

  useEffect(() => {
    const pairs = JSON.stringify(['BTCUSDT', 'ETHUSDT', 'ETCUSDT']);
    const fetchPrices = () =>
      fetch(`https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(pairs)}`)
        .then((r) => r.json())
        .then((data: Array<{ symbol: string; lastPrice: string }>) => {
          const map: Record<string, number> = {};
          for (const d of data) map[d.symbol] = parseFloat(d.lastPrice);
          setPrices(map);
        })
        .catch(() => {});
    fetchPrices();
    const iv = setInterval(fetchPrices, 30000);
    return () => clearInterval(iv);
  }, []);

  if (error) return <div className="alert alert-error" role="alert">{error}</div>;
  if (!summary) return <DashboardSkeleton />;

  const cur = summary.currency;
  const typeLabel: Record<string, string> = {
    DEPOSIT: 'Deposit',
    TEST_CREDIT: 'Return',
    WITHDRAWAL: 'Withdrawal',
    FEE: 'Fee',
    ADJUSTMENT: 'Adjustment',
    REVERSAL: 'Reversal',
    REFUND: 'Refund',
    TRADING_PNL: 'Trading P&L',
    REFERRAL_BONUS: 'Referral bonus',
    REFERRAL_WELCOME_BONUS: 'Welcome bonus',
    RANK_BONUS: 'Rank bonus',
  };

  const btcPrice = prices.BTCUSDT || 0;
  const ethPrice = prices.ETHUSDT || 0;
  const etcPrice = prices.ETCUSDT || 0;

  function cryptoEquiv(usdAmount: number) {
    if (!btcPrice) return null;
    const parts = [];
    if (btcPrice) parts.push(`${(usdAmount / btcPrice).toFixed(6)} BTC`);
    if (ethPrice) parts.push(`${(usdAmount / ethPrice).toFixed(4)} ETH`);
    if (etcPrice) parts.push(`${(usdAmount / etcPrice).toFixed(2)} ETC`);
    return parts.length ? `≈ ${parts.join('  ·  ')}` : null;
  }

  return (
    <div>
      <div className="stat-grid">
        <div className="stat-card accent">
          <span className="stat-label">Available balance</span>
          <span className="stat-value">{fmtMoney(summary.balance, cur)}</span>
          {cryptoEquiv(summary.balance) && (
            <span className="stat-crypto">{cryptoEquiv(summary.balance)}</span>
          )}
          <span className="stat-hint">Reconstructed from ledger</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total deposits</span>
          <span className="stat-value">{fmtMoney(summary.totalDeposits, cur)}</span>
          {cryptoEquiv(summary.totalDeposits) && (
            <span className="stat-crypto">{cryptoEquiv(summary.totalDeposits)}</span>
          )}
          <span className="stat-hint">{summary.totalDepositsCount} deposit{summary.totalDepositsCount === 1 ? '' : 's'} confirmed</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Current rank</span>
          <span className="stat-value stat-green">{summary.rankLabel || 'Bronze'}</span>
          <span className="stat-hint">{summary.rankBonusPercent || '0.5%'} deposit bonus</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Returns earned</span>
          <span className="stat-value">{fmtMoney(summary.totalTestCredits, cur)}</span>
          {cryptoEquiv(summary.totalTestCredits) && (
            <span className="stat-crypto">{cryptoEquiv(summary.totalTestCredits)}</span>
          )}
          <span className="stat-hint">{summary.totalTestCreditsCount} period{summary.totalTestCreditsCount === 1 ? '' : 's'} credited</span>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h3>Live market</h3>
          <span className="badge badge-live">Live</span>
        </div>
        <LiveTradingChart />
      </div>

      <div className="dash-grid">
        <div className="card">
          <div className="card-head">
            <h3>Portfolio growth</h3>
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
            Deposits are confirmed by the platform, then returns are credited
            at the configured rate. Your balance updates in real-time.
          </p>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h3>Recent activity</h3>
          <Link className="btn-link" href="/dashboard/transactions">View all</Link>
        </div>
        {(summary.recentActivity ?? []).length === 0 ? (
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
                {(summary.recentActivity ?? []).map((t) => (
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