'use client';

import { useEffect, useState } from 'react';
import { api, fmtMoney, fmtDate } from '@/lib/api';
import { TableSkeleton } from '@/components/DashboardSkeleton';

interface ReturnRecord {
  id: string;
  principalAmount: number;
  creditAmount: number;
  rate: number;
  periodStart: string;
  periodEnd: string;
  status: string;
  currency: string;
}

export default function TestCreditsPage() {
  const [items, setItems] = useState<ReturnRecord[]>([]);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api<ReturnRecord[]>('/accounts/test-returns')
      .then(({ data }) => setItems(data))
      .catch((e) => setError(e?.message || 'Failed to load returns'))
      .finally(() => setLoaded(true));
  }, []);

  if (error) return <div className="alert alert-error" role="alert">{error}</div>;

  const total = items.reduce((sum, r) => sum + Number(r.creditAmount), 0);

  return (
    <div>
      <div className="card">
        <div className="card-head">
          <h3>Return history</h3>
        </div>
        <p className="hint">
          Returns are credited to your account on confirmed deposits. Total earned:{' '}
          <strong>{fmtMoney(total, items[0]?.currency || 'USD')}</strong>
        </p>
        {!loaded ? (
          <TableSkeleton rows={3} cols={6} />
        ) : items.length === 0 ? (
          <p>No returns yet. Confirmed deposits start earning returns after the first period.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Period start</th>
                  <th>Period end</th>
                  <th>Principal</th>
                  <th>Rate</th>
                  <th>Credit</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((r) => (
                  <tr key={r.id}>
                    <td className="muted">{fmtDate(r.periodStart)}</td>
                    <td className="muted">{fmtDate(r.periodEnd)}</td>
                    <td>{fmtMoney(r.principalAmount, r.currency)}</td>
                    <td>{(r.rate * 100).toFixed(2)}%</td>
                    <td className="pos">+{fmtMoney(r.creditAmount, r.currency)}</td>
                    <td><span className="badge badge-status">{r.status}</span></td>
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