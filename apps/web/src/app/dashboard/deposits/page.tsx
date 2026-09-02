'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, fmtMoney, fmtDate } from '@/lib/api';
import { TableSkeleton } from '@/components/DashboardSkeleton';

interface Deposit {
  id: string;
  amount: number;
  currency: string;
  paymentProvider: string;
  status: string;
  createdAt: string;
  confirmedAt: string | null;
}

export default function DepositsPage() {
  const [items, setItems] = useState<Deposit[]>([]);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [listLoaded, setListLoaded] = useState(false);

  const load = useCallback(() => {
    return api<Deposit[]>('/accounts/deposits')
      .then(({ data }) => setItems(data))
      .catch(() => {})
      .finally(() => setListLoaded(true));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    const value = Number(amount);
    if (!value || value <= 0) {
      setError('Enter a valid amount.');
      return;
    }
    setLoading(true);
    const { res, data } = await api('/accounts/deposits', {
      method: 'POST',
      body: JSON.stringify({ amount: value, provider: 'TEST', currency: 'USD' }),
    });
    setLoading(false);
    if (!res.ok) {
      setError(typeof data.message === 'string' ? data.message : 'Deposit failed. Try again.');
      return;
    }
    setAmount('');
    setSuccess('Deposit initiated. It will be confirmed by the platform.');
    load();
  }

  const statusLabel: Record<string, string> = {
    PENDING: 'Pending',
    PROCESSING: 'Processing',
    SUCCESSFUL: 'Confirmed',
    FAILED: 'Failed',
    CANCELLED: 'Cancelled',
    REFUNDED: 'Refunded',
    REVERSED: 'Reversed',
  };

  return (
    <div>
      <div className="dash-grid">
        <div className="card">
          <h3>New deposit</h3>
          <p className="hint">
            Submit a deposit to fund your test account. Deposits are confirmed by the platform
            in a controlled Phase 1 test flow.
          </p>
          {error && <div className="alert alert-error" role="alert">{error}</div>}
          {success && <div className="alert alert-success" role="status">{success}</div>}
          <form onSubmit={onSubmit}>
            <div className="field">
              <label htmlFor="amount">Amount (USD)</label>
              <input
                id="amount"
                type="number"
                min="1"
                step="0.01"
                placeholder="100.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? 'Submitting…' : 'Initiate deposit'}
            </button>
          </form>
        </div>
        <div className="card">
          <h3>How it works</h3>
          <ul className="steps">
            <li>1. You initiate a deposit.</li>
            <li>2. Platform reviews and confirms it.</li>
            <li>3. Funds are credited to your balance.</li>
            <li>4. Returns are simulated test credits.</li>
          </ul>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h3>Deposit history</h3>
        </div>
        {!listLoaded ? (
          <TableSkeleton rows={3} cols={5} />
        ) : items.length === 0 ? (
          <p className="hint">No deposits yet.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Amount</th>
                  <th>Provider</th>
                  <th>Status</th>
                  <th>Initiated</th>
                  <th>Confirmed</th>
                </tr>
              </thead>
              <tbody>
                {items.map((d) => (
                  <tr key={d.id}>
                    <td className="pos">{fmtMoney(d.amount, d.currency)}</td>
                    <td>{d.paymentProvider}</td>
                    <td><span className="badge badge-status">{statusLabel[d.status] || d.status}</span></td>
                    <td className="muted">{fmtDate(d.createdAt)}</td>
                    <td className="muted">{fmtDate(d.confirmedAt)}</td>
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