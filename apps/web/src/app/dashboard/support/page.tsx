'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { api, fmtDate } from '@/lib/api';
import { TableSkeleton } from '@/components/DashboardSkeleton';

interface TicketRow {
  id: string;
  category: string;
  subject: string;
  status: string;
  priority: number;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  lastAuthor: string;
  lastMessageAt: string;
}

interface ListResponse {
  items: TicketRow[];
  total: number;
  page: number;
  pageSize: number;
}

const statuses = ['ALL', 'OPEN', 'IN_PROGRESS', 'WAITING_FOR_USER', 'RESOLVED', 'CLOSED'];
const categories = ['Account', 'Deposits', 'Withdrawals', 'Payments', 'Security', 'Test Credits', 'Other'];

export default function SupportTicketsPage() {
  const [rows, setRows] = useState<TicketRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [status, setStatus] = useState('ALL');
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');

  // Create form state
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ category: 'Account', subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');

  const load = useCallback(
    (p = page) => {
      setLoaded(false);
      const qs = new URLSearchParams({ page: String(p), pageSize: String(pageSize) });
      if (status !== 'ALL') qs.set('status', status);
      api<ListResponse>(`/support/tickets?${qs.toString()}`)
        .then(({ data }) => {
          setRows(data.items || []);
          setTotal(data.total || 0);
        })
        .catch((e) => setError(e?.message || 'Failed to load tickets'))
        .finally(() => setLoaded(true));
    },
    [status, pageSize],
  );

  useEffect(() => {
    load();
  }, [load, page]);

  async function createTicket(e: React.FormEvent) {
    e.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) return;
    setSending(true);
    setCreateError('');
    setCreateSuccess('');
    const { res, data } = await api('/support/tickets', {
      method: 'POST',
      body: JSON.stringify(form),
    });
    setSending(false);
    if (!res.ok) {
      setCreateError(typeof data.message === 'string' ? data.message : 'Failed to create ticket.');
      return;
    }
    setForm({ category: 'Account', subject: '', message: '' });
    setShowCreate(false);
    setCreateSuccess('Your support ticket has been created. We’ll get back to you soon.');
    setPage(1);
    load(1);
  }

  const totalPages = Math.max(Math.ceil(total / pageSize), 1);

  return (
    <div className="dash-grid">
      <div className="card span-2">
        <div className="card-head">
          <div>
            <h3>Support Center</h3>
            <p className="hint">Chat with our support team about your account.</p>
          </div>
          <div className="row-actions">
            <select
              className="select"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              {statuses.map((s) => (
                <option key={s} value={s}>{s === 'ALL' ? 'All statuses' : s.replace(/_/g, ' ')}</option>
              ))}
            </select>
            <button className="btn-primary" onClick={() => setShowCreate((v) => !v)}>
              {showCreate ? 'Cancel' : '+ New ticket'}
            </button>
          </div>
        </div>

        {createSuccess && <div className="alert alert-success" role="status">{createSuccess}</div>}
        {error && <div className="alert alert-error" role="alert">{error}</div>}

        {showCreate && (
          <form className="ticket-create" onSubmit={createTicket}>
            {createError && <div className="alert alert-error" role="alert">{createError}</div>}
            <div className="field">
              <label htmlFor="category">Category</label>
              <select
                id="category"
                className="select"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="subject">Subject</label>
              <input
                id="subject"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="Brief summary of your issue"
              />
            </div>
            <div className="field">
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                rows={4}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Describe your issue in detail…"
              />
            </div>
            <div className="form-buttons">
              <button className="btn-primary" type="submit" disabled={sending || !form.subject.trim() || !form.message.trim()}>
                {sending ? 'Submitting…' : 'Submit ticket'}
              </button>
            </div>
          </form>
        )}

        {!loaded ? (
          <TableSkeleton rows={5} cols={5} />
        ) : rows.length === 0 ? (
          <p className="hint">You have no support tickets yet. Open one now and we’ll help you out.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Replies</th>
                  <th>Last updated</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <Link href={`/dashboard/support/${t.id}`} className="link">
                        <strong>{t.subject}</strong>
                      </Link>
                      <div className="muted small">{t.id.slice(0, 8)}</div>
                    </td>
                    <td><span className="badge badge-test">{t.category}</span></td>
                    <td><span className={`badge badge-status st-${t.status.toLowerCase()}`}>{t.status.replace(/_/g, ' ')}</span></td>
                    <td className="muted">{t.messageCount || 1}</td>
                    <td className="muted">{fmtDate(t.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {rows.length > 0 && (
          <div className="pagination">
            <button className="btn-secondary" disabled={page <= 1} onClick={() => setPage((p) => Math.max(p - 1, 1))}>
              Previous
            </button>
            <span className="muted">Page {page} of {totalPages}</span>
            <button className="btn-secondary" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(p + 1, totalPages))}>
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
