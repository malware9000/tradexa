'use client';

import { useEffect, useState } from 'react';
import { api, fmtMoney, fmtDate } from '@/lib/api';
import { TableSkeleton } from '@/components/DashboardSkeleton';

interface TestReturn {
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
  const [items, setItems] = useState<TestReturn[]>([]);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api<TestReturn[]>('/accounts/test-returns')
      .then(({ data }) => setItems(data))
      .catch((e) => setError(e?.message || 'Failed to load test credits'))
      .finally(() => setLoaded(true));
  }, []);

  if (error) return <div className="alert alert-error" role="alert">{error}</div>;

  const total = items.reduce((sum, r) => sum + Number(r.creditAmount), 0);

  return (
    <div>
      <div className="card">
        <div className="card-head">
          <h3>Simulated test returns</h3>
          <span className="badge badge-test">Phase 1 · Not real profit</span>
        </div>
        <p className="hint">
          The test-return engine replays completed 24-hour periods and credits a simulated return
          on your confirmed deposits. Total credited:{' '}
          <strong>{fmtMoney(total, items[0]?.currency || 'USD')}</strong>
        </p>
        {!loaded ? (
          <TableSkeleton rows={3} cols={6} />
        ) : items.length === 0 ? (
          <p>No test credits yet. Confirmed deposits start earning simulated returns after a full 24-hour period.</p>
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