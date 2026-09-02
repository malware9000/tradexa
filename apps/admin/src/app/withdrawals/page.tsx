'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api, fmtMoney, fmtDate } from '@/lib/api';
import { TableSkeleton } from '@/components/AdminSkeleton';

interface WithdrawalRow {
  id: string;
  amount: number;
  fee: number;
  netAmount: number | null;
  currency: string;
  method: string | null;
  destinationReference: string;
  status: string;
  createdAt: string;
  user: { id: string; email: string; profile: { fullName: string | null } | null };
}

interface ListResponse {
  items: WithdrawalRow[];
  total: number;
  page: number;
  pageSize: number;
}

const statuses = ['ALL', 'PENDING', 'UNDER_REVIEW', 'PROCESSING', 'COMPLETED', 'REJECTED', 'CANCELLED', 'FAILED'];

export default function AdminWithdrawalsPage() {
  const searchParams = useSearchParams();
  const [rows, setRows] = useState<WithdrawalRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [status, setStatus] = useState(searchParams.get('status') || 'ALL');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [reason, setReason] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const qs = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (status !== 'ALL') qs.set('status', status);
    api<ListResponse>(`/admin/payments/withdrawals?${qs.toString()}`)
      .then(({ data }) => {
        setRows(data.items || []);
        setTotal(data.total || 0);
      })
      .catch((e) => setError(e?.message || 'Failed to load withdrawals'))
      .finally(() => setLoaded(true));
  }, [page, pageSize, status]);

  async function act(id: string, action: 'approve' | 'reject' | 'complete') {
    setBusy(`${action}:${id}`);
    const { res, data } = await api(`/admin/payments/withdrawals/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ action, reason: reason[id] }),
    });
    setBusy('');
    if (!res.ok) {
      setError(typeof data.message === 'string' ? data.message : 'Action failed');
      return;
    }
    setReason((prev) => ({ ...prev, [id]: '' }));
    const qs = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (status !== 'ALL') qs.set('status', status);
    api<ListResponse>(`/admin/payments/withdrawals?${qs.toString()}`).then(({ data }) => setRows(data.items || []));
  }

  const totalPages = Math.max(Math.ceil(total / pageSize), 1);

  return (
    <div>
      <div className="page-head">
        <h1>Withdrawals</h1>
        <p className="muted">{total} request{total === 1 ? '' : 's'}</p>
      </div>

      {error && <div className="alert alert-error" role="alert">{error}</div>}

      <div className="toolbar">
        <select className="select" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          {statuses.map((s) => (
            <option key={s} value={s}>{s === 'ALL' ? 'All statuses' : s}</option>
          ))}
        </select>
      </div>

      <div className="card">
        {!loaded ? (
          <TableSkeleton rows={5} cols={7} />
        ) : rows.length === 0 ? (
          <p className="hint">No withdrawals match the filter.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Amount</th>
                  <th>Fee</th>
                  <th>Destination</th>
                  <th>Status</th>
                  <th>Requested</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((w) => (
                  <tr key={w.id}>
                    <td>
                      <strong>{w.user?.profile?.fullName || w.user?.email || '—'}</strong>
                      <div className="muted small">{w.user?.email}</div>
                    </td>
                    <td>{fmtMoney(w.amount, w.currency)}</td>
                    <td className="muted">{fmtMoney(w.fee, w.currency)}</td>
                    <td className="muted small">{w.destinationReference}</td>
                    <td><span className={`badge badge-status st-${w.status.toLowerCase()}`}>{w.status}</span></td>
                    <td className="muted">{fmtDate(w.createdAt)}</td>
                    <td>
                      <div className="row-actions">
                        {(w.status === 'PENDING' || w.status === 'UNDER_REVIEW') && (
                          <button className="btn-xs ok" disabled={busy !== ''} onClick={() => act(w.id, 'approve')}>
                            {busy === `approve:${w.id}` ? '…' : 'Approve'}
                          </button>
                        )}
                        {w.status === 'PROCESSING' && (
                          <button className="btn-xs ok" disabled={busy !== ''} onClick={() => act(w.id, 'complete')}>
                            {busy === `complete:${w.id}` ? '…' : 'Complete'}
                          </button>
                        )}
                        {w.status !== 'COMPLETED' && w.status !== 'REJECTED' && (
                          <button className="btn-xs danger" disabled={busy !== ''} onClick={() => act(w.id, 'reject')}>
                            {busy === `reject:${w.id}` ? '…' : 'Reject'}
                          </button>
                        )}
                        {(w.status === 'PENDING' || w.status === 'UNDER_REVIEW' || w.status === 'PROCESSING') && (
                          <input
                            className="reason-input"
                            placeholder="reason (optional)"
                            value={reason[w.id] || ''}
                            onChange={(e) => setReason((prev) => ({ ...prev, [w.id]: e.target.value }))}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="pagination">
          <button className="btn-secondary" disabled={page <= 1} onClick={() => setPage((p) => Math.max(p - 1, 1))}>
            Previous
          </button>
          <span className="muted">Page {page} of {totalPages}</span>
          <button className="btn-secondary" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(p + 1, totalPages))}>
            Next
          </button>
        </div>
      </div>
    </div>
  );
}