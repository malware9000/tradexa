'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { api, fmtDate } from '@/lib/api';
import { TableSkeleton } from '@/components/AdminSkeleton';

interface TicketRow {
  id: string;
  category: string;
  subject: string;
  priority: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  lastAuthor: string;
  user: { id: string; email: string; profile: { fullName: string | null } | null };
}

interface ListResponse {
  items: TicketRow[];
  total: number;
  page: number;
  pageSize: number;
}

const statuses = ['ALL', 'OPEN', 'IN_PROGRESS', 'WAITING_FOR_USER', 'RESOLVED', 'CLOSED'];

export default function AdminSupportPage() {
  const searchParams = useSearchParams();
  const [rows, setRows] = useState<TicketRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [status, setStatus] = useState(searchParams.get('status') || 'ALL');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const qs = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (status !== 'ALL') qs.set('status', status);
    if (search) qs.set('search', search);
    api<ListResponse>(`/admin/support/tickets?${qs.toString()}`)
      .then(({ data }) => {
        setRows(data.items || []);
        setTotal(data.total || 0);
      })
      .catch((e) => setError(e?.message || 'Failed to load tickets'))
      .finally(() => setLoaded(true));
  }, [page, pageSize, status, search]);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  }

  const totalPages = Math.max(Math.ceil(total / pageSize), 1);

  return (
    <div>
      <div className="page-head">
        <h1>Support Tickets</h1>
        <p className="muted">{total} ticket{total === 1 ? '' : 's'}</p>
      </div>

      {error && <div className="alert alert-error" role="alert">{error}</div>}

      <div className="toolbar">
        <form className="search-form" onSubmit={submitSearch}>
          <input
            type="search"
            placeholder="Search by subject, category, email, or name…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button className="btn-primary" type="submit">Search</button>
        </form>
        <select className="select" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          {statuses.map((s) => (
            <option key={s} value={s}>{s === 'ALL' ? 'All statuses' : s.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>

      <div className="card">
        {!loaded ? (
          <TableSkeleton rows={6} cols={6} />
        ) : rows.length === 0 ? (
          <p className="hint">No support tickets match your filters.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Subject</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Messages</th>
                  <th>Status</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <Link href={`/support/${t.id}`} className="link">
                        <strong>{t.user?.profile?.fullName || t.user?.email || '—'}</strong>
                      </Link>
                      <div className="muted small">{t.user?.email}</div>
                    </td>
                    <td>
                      <Link href={`/support/${t.id}`} className="link">
                        {t.subject}
                      </Link>
                    </td>
                    <td><span className="badge badge-status">{t.category}</span></td>
                    <td><span className={`badge priority-${t.priority}`}>{t.priority}</span></td>
                    <td className="muted">{t.messageCount}</td>
                    <td><span className={`badge badge-status st-${t.status.toLowerCase()}`}>{t.status.replace(/_/g, ' ')}</span></td>
                    <td className="muted">{fmtDate(t.updatedAt)}</td>
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
