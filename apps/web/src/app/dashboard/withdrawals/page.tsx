'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, fmtMoney, fmtDate } from '@/lib/api';
import { TableSkeleton } from '@/components/DashboardSkeleton';

interface Withdrawal {
  id: string;
  amount: number;
  fee: number;
  netAmount: number | null;
  currency: string;
  method: string | null;
  destinationReference: string;
  status: string;
  createdAt: string;
  completedAt: string | null;
}

export default function WithdrawalsPage() {
  const [items, setItems] = useState<Withdrawal[]>([]);
  const [amount, setAmount] = useState('');
  const [destination, setDestination] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [listLoaded, setListLoaded] = useState(false);

  const load = useCallback(() => {
    return api<Withdrawal[]>('/accounts/withdrawals')
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
    if (!destination.trim()) {
      setError('Enter a destination reference (e.g. bank account or wallet address).');
      return;
    }
    setLoading(true);
    const { res, data } = await api('/accounts/withdrawals', {
      method: 'POST',
      body: JSON.stringify({
        amount: value,
        currency: 'USD',
        method: 'BANK_TRANSFER',
        destinationReference: destination.trim(),
      }),
    });
    setLoading(false);
    if (!res.ok) {
      setError(typeof data.message === 'string' ? data.message : 'Withdrawal failed. Try again.');
      return;
    }
    setAmount('');
    setDestination('');
    setSuccess('Withdrawal requested. It will be reviewed by the platform.');
    load();
  }

  const statusLabel: Record<string, string> = {
    PENDING: 'Pending',
    UNDER_REVIEW: 'Under review',
    APPROVED: 'Approved',
    PROCESSING: 'Processing',
    COMPLETED: 'Completed',
    REJECTED: 'Rejected',
    CANCELLED: 'Cancelled',
    FAILED: 'Failed',
  };

  return (
    <div>
      <div className="dash-grid">
        <div className="card">
          <h3>Request withdrawal</h3>
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
                placeholder="50.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="destination">Destination reference</label>
              <input
                id="destination"
                type="text"
                placeholder="Bank account or wallet address"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                required
              />
            </div>
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? 'Submitting…' : 'Request withdrawal'}
            </button>
          </form>
        </div>
        <div className="card">
          <h3>Withdrawal rules</h3>
          <ul className="steps">
            <li>Requested amount must not exceed your available balance.</li>
            <li>A platform review is required before processing.</li>
            <li>Withdrawals reduces your balance immediately on completion.</li>
          </ul>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h3>Withdrawal history</h3>
        </div>
        {!listLoaded ? (
          <TableSkeleton rows={3} cols={6} />
        ) : items.length === 0 ? (
          <p className="hint">No withdrawals yet.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Amount</th>
                  <th>Fee</th>
                  <th>Net</th>
                  <th>Destination</th>
                  <th>Status</th>
                  <th>Requested</th>
                </tr>
              </thead>
              <tbody>
                {items.map((w) => (
                  <tr key={w.id}>
                    <td className="neg">{fmtMoney(w.amount, w.currency)}</td>
                    <td className="muted">{fmtMoney(w.fee, w.currency)}</td>
                    <td>{w.netAmount === null ? '—' : fmtMoney(w.netAmount, w.currency)}</td>
                    <td className="muted">{w.destinationReference}</td>
                    <td><span className="badge badge-status">{statusLabel[w.status] || w.status}</span></td>
                    <td className="muted">{fmtDate(w.createdAt)}</td>
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