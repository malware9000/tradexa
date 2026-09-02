'use client';

import { useEffect, useState } from 'react';
import { api, fmtMoney, fmtDate } from '@/lib/api';
import { TableSkeleton } from '@/components/DashboardSkeleton';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  reference: string | null;
  createdAt: string;
}

const typeLabel: Record<string, { label: string; tone: 'pos' | 'neg' | 'neutral' }> = {
  DEPOSIT: { label: 'Deposit', tone: 'pos' },
  TEST_CREDIT: { label: 'Test credit', tone: 'pos' },
  WITHDRAWAL: { label: 'Withdrawal', tone: 'neg' },
  FEE: { label: 'Fee', tone: 'neg' },
  ADJUSTMENT: { label: 'Adjustment', tone: 'neutral' },
  REVERSAL: { label: 'Reversal', tone: 'neutral' },
  REFUND: { label: 'Refund', tone: 'pos' },
  TRADING_PNL: { label: 'Trading P&L', tone: 'neutral' },
};

export default function TransactionsPage() {
  const [items, setItems] = useState<Transaction[]>([]);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api<Transaction[]>('/accounts/transactions')
      .then(({ data }) => setItems(data))
      .catch((e) => setError(e?.message || 'Failed to load transactions'))
      .finally(() => setLoaded(true));
  }, []);

  if (error) return <div className="alert alert-error" role="alert">{error}</div>;

  const types = ['ALL', ...Array.from(new Set(items.map((t) => t.type)))];
  const filtered = filter === 'ALL' ? items : items.filter((t) => t.type === filter);

  return (
    <div>
      <div className="card">
        <div className="card-head">
          <h3>Transaction history</h3>
          <select className="select" value={filter} onChange={(e) => setFilter(e.target.value)}>
            {types.map((t) => (
              <option key={t} value={t}>{t === 'ALL' ? 'All types' : (typeLabel[t]?.label || t)}</option>
            ))}
          </select>
        </div>
        {!loaded ? (
          <TableSkeleton rows={5} cols={5} />
        ) : filtered.length === 0 ? (
          <p className="hint">No transactions yet.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Reference</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => {
                  const meta = typeLabel[t.type] || { label: t.type, tone: 'neutral' as const };
                  return (
                    <tr key={t.id}>
                      <td>{meta.label}</td>
                      <td className={meta.tone === 'pos' ? 'pos' : meta.tone === 'neg' ? 'neg' : ''}>
                        {meta.tone === 'pos' ? '+' : meta.tone === 'neg' ? '-' : ''}
                        {fmtMoney(t.amount, t.currency)}
                      </td>
                      <td><span className="badge badge-status">{t.status}</span></td>
                      <td className="muted mono">{t.reference || '—'}</td>
                      <td className="muted">{fmtDate(t.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}