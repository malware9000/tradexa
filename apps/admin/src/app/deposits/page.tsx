'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api, fmtMoney, fmtDate } from '@/lib/api';
import { TableSkeleton } from '@/components/AdminSkeleton';

interface DepositRow {
  id: string;
  amount: number;
  currency: string;
  paymentProvider: string;
  status: string;
  createdAt: string;
  user: { id: string; email: string; profile: { fullName: string | null } | null };
}

interface ListResponse {
  items: DepositRow[];
  total: number;
  page: number;
  pageSize: number;
}

const statuses = ['ALL', 'PENDING', 'PROCESSING', 'SUCCESSFUL', 'FAILED', 'CANCELLED'];

export default function AdminDepositsPage() {
  const searchParams = useSearchParams();
  const [rows, setRows] = useState<DepositRow[]>([]);
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
    api<ListResponse>(`/admin/payments/deposits?${qs.toString()}`)
      .then(({ data }) => {
        setRows(data.items || []);
        setTotal(data.total || 0);
      })
      .catch((e) => setError(e?.message || 'Failed to load deposits'))
      .finally(() => setLoaded(true));
  }, [page, pageSize, status]);

  async function act(id: string, action: 'confirm' | 'reject') {
    setBusy(`${action}:${id}`);
    const { res, data } = await api(`/admin/payments/deposits/${id}`, {
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
    api<ListResponse>(`/admin/payments/deposits?${qs.toString()}`).then(({ data }) => setRows(data.items || []));
  }

  const totalPages = Math.max(Math.ceil(total / pageSize), 1);

  return (
    <div>
      <div className="page-head">
        <h1>Deposits</h1>
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
          <TableSkeleton rows={5} cols={6} />
        ) : rows.length === 0 ? (
          <p className="hint">No deposits match the filter.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Amount</th>
                  <th>Provider</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <strong>{d.user?.profile?.fullName || d.user?.email || '—'}</strong>
                      <div className="muted small">{d.user?.email}</div>
                    </td>
                    <td>{fmtMoney(d.amount, d.currency)}</td>
                    <td className="muted">{d.paymentProvider}</td>
                    <td><span className={`badge badge-status st-${d.status.toLowerCase()}`}>{d.status}</span></td>
                    <td className="muted">{fmtDate(d.createdAt)}</td>
                    <td>
                      {(d.status === 'PENDING' || d.status === 'PROCESSING') && (
                        <div className="row-actions">
                          <button className="btn-xs ok" disabled={busy !== ''} onClick={() => act(d.id, 'confirm')}>
                            {busy === `confirm:${d.id}` ? '…' : 'Confirm'}
                          </button>
                          <button className="btn-xs danger" disabled={busy !== ''} onClick={() => act(d.id, 'reject')}>
                            {busy === `reject:${d.id}` ? '…' : 'Reject'}
                          </button>
                          <input
                            className="reason-input"
                            placeholder="reason (optional)"
                            value={reason[d.id] || ''}
                            onChange={(e) => setReason((prev) => ({ ...prev, [d.id]: e.target.value }))}
                          />
                        </div>
                      )}
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