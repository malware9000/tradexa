'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { api, fmtMoney, fmtDate } from '@/lib/api';
import { TableSkeleton } from '@/components/AdminSkeleton';

interface UserRow {
  id: string;
  email: string;
  fullName: string | null;
  status: string;
  kycStatus: string;
  currency: string;
  totalDeposits: number;
  balance: number;
  createdAt: string;
  lastLoginAt: string | null;
}

interface ListResponse {
  items: UserRow[];
  total: number;
  page: number;
  pageSize: number;
}

const statuses = ['ALL', 'PENDING', 'ACTIVE', 'VERIFIED', 'SUSPENDED', 'CLOSED'];

export default function AdminUsersPage() {
  const searchParams = useSearchParams();
  const [rows, setRows] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [status, setStatus] = useState(searchParams.get('status') || 'ALL');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const qs = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (search) qs.set('search', search);
    if (status !== 'ALL') qs.set('status', status);
    api<ListResponse>(`/admin/users?${qs.toString()}`)
      .then(({ data }) => {
        setRows(data.items || []);
        setTotal(data.total || 0);
      })
      .catch((e) => setError(e?.message || 'Failed to load users'))
      .finally(() => setLoaded(true));
  }, [page, pageSize, search, status]);

  async function changeStatus(id: string, next: string) {
    setBusy(id);
    const { res, data } = await api(`/admin/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: next }),
    });
    setBusy('');
    if (!res.ok) {
      setError(typeof data.message === 'string' ? data.message : 'Failed to update status');
      return;
    }
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: next } : r)));
  }

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  }

  const totalPages = Math.max(Math.ceil(total / pageSize), 1);

  return (
    <div>
      <div className="page-head">
        <h1>Users</h1>
        <p className="muted">{total} account{total === 1 ? '' : 's'}</p>
      </div>

      {error && <div className="alert alert-error" role="alert">{error}</div>}

      <div className="toolbar">
        <form className="search-form" onSubmit={submitSearch}>
          <input
            type="search"
            placeholder="Search by email or name…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button className="btn-primary" type="submit">Search</button>
        </form>
        <select className="select" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          {statuses.map((s) => (
            <option key={s} value={s}>{s === 'ALL' ? 'All statuses' : s}</option>
          ))}
        </select>
      </div>

      <div className="card">
        {!loaded ? (
          <TableSkeleton rows={6} cols={6} />
        ) : rows.length === 0 ? (
          <p className="hint">No users match your filters.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Status</th>
                  <th>KYC</th>
                  <th>Deposits</th>
                  <th>Balance</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <Link href={`/users/${u.id}`} className="link">
                        <strong>{u.fullName || u.email}</strong>
                      </Link>
                      <div className="muted small">{u.email}</div>
                    </td>
                    <td><span className={`badge badge-status st-${u.status.toLowerCase()}`}>{u.status}</span></td>
                    <td className="muted">{u.kycStatus}</td>
                    <td>{fmtMoney(u.totalDeposits, u.currency)}</td>
                    <td>{fmtMoney(u.balance, u.currency)}</td>
                    <td className="muted">{fmtDate(u.createdAt)}</td>
                    <td>
                      <div className="row-actions">
                        <Link href={`/users/${u.id}`} className="btn-xs">View</Link>
                        {u.status !== 'ACTIVE' && u.status !== 'VERIFIED' && (
                          <button className="btn-xs ok" disabled={busy === u.id} onClick={() => changeStatus(u.id, 'ACTIVE')}>Activate</button>
                        )}
                        {u.status !== 'SUSPENDED' && u.status !== 'CLOSED' && (
                          <button className="btn-xs warn" disabled={busy === u.id} onClick={() => changeStatus(u.id, 'SUSPENDED')}>Suspend</button>
                        )}
                        {u.status !== 'CLOSED' && (
                          <button className="btn-xs danger" disabled={busy === u.id} onClick={() => changeStatus(u.id, 'CLOSED')}>Close</button>
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