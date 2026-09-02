'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api, fmtDate } from '@/lib/api';
import { DetailSkeleton } from '@/components/AdminSkeleton';

interface Message {
  id: string;
  authorType: string;
  authorId: string | null;
  message: string;
  createdAt: string;
}

interface TicketDetail {
  ticket: {
    id: string;
    userId: string;
    category: string;
    subject: string;
    message: string;
    priority: number;
    status: string;
    createdAt: string;
    updatedAt: string;
    user: {
      id: string;
      email: string;
      status: string;
      createdAt: string;
      profile: { fullName: string | null; phone: string | null; country: string | null } | null;
    };
  };
  messages: Message[];
}

const statuses = ['OPEN', 'IN_PROGRESS', 'WAITING_FOR_USER', 'RESOLVED', 'CLOSED'];

export default function SupportDetailPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<TicketDetail | null>(null);
  const [error, setError] = useState('');
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const [success, setSuccess] = useState('');

  async function load() {
    const { res, data } = await api<TicketDetail>(`/admin/support/tickets/${params.id}`);
    if (!res.ok) {
      setError(typeof data === 'string' ? data : (data as any)?.message || 'Failed to load ticket');
      return;
    }
    setData(data);
  }

  useEffect(() => {
    setError('');
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  if (error && !data) return <div className="alert alert-error" role="alert">{error}</div>;
  if (!data) return <DetailSkeleton />;

  const { ticket, messages } = data;

  async function sendReply() {
    const text = reply.trim();
    if (!text) return;
    setSending(true);
    setSuccess('');
    setError('');
    const { res, data: d } = await api(`/admin/support/tickets/${ticket.id}/reply`, {
      method: 'POST',
      body: JSON.stringify({ message: text }),
    });
    setSending(false);
    if (!res.ok) {
      setError(typeof d.message === 'string' ? d.message : 'Failed to send reply');
      return;
    }
    setReply('');
    setSuccess('Reply sent. The customer has been notified.');
    load();
  }

  async function changeStatus(next: string) {
    setStatusBusy(true);
    setError('');
    setSuccess('');
    const { res, data: d } = await api(`/admin/support/tickets/${ticket.id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: next }),
    });
    setStatusBusy(false);
    if (!res.ok) {
      setError(typeof d.message === 'string' ? d.message : 'Failed to update status');
      return;
    }
    setSuccess(`Ticket status changed to ${next.replace(/_/g, ' ')}.`);
    load();
  }

  const userLabel = ticket.user?.profile?.fullName || ticket.user?.email || 'Unknown user';

  return (
    <div>
      <div className="page-head">
        <div>
          <Link className="btn-link" href="/support">← Back to tickets</Link>
          <h1>{ticket.subject}</h1>
          <p className="muted">{ticket.category} · by {userLabel} · opened {fmtDate(ticket.createdAt)}</p>
        </div>
        <span className={`badge badge-status st-${ticket.status.toLowerCase()}`}>{ticket.status.replace(/_/g, ' ')}</span>
      </div>

      {error && <div className="alert alert-error" role="alert">{error}</div>}
      {success && <div className="alert alert-success" role="alert">{success}</div>}

      <div className="dash-grid">
        <div className="card span-2">
          <div className="card-head">
            <h3>Conversation</h3>
            <div className="row-actions">
              <select
                className="select"
                value={ticket.status}
                disabled={statusBusy}
                onChange={(e) => changeStatus(e.target.value)}
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="thread">
            <div className="msg-msg msg-msg-user">
              <div className="msg-meta">
                <strong>{userLabel}</strong>
                <span className="muted">{fmtDate(ticket.createdAt)}</span>
              </div>
              <div className="msg-body">{ticket.message}</div>
            </div>

            {messages.map((m) =>
              m.authorType === 'ADMIN' ? (
                <div className="msg-msg msg-msg-admin" key={m.id}>
                  <div className="msg-meta">
                    <strong>Support</strong>
                    <span className="muted">{fmtDate(m.createdAt)}</span>
                  </div>
                  <div className="msg-body">{m.message}</div>
                </div>
              ) : (
                <div className="msg-msg msg-msg-user" key={m.id}>
                  <div className="msg-meta">
                    <strong>{userLabel}</strong>
                    <span className="muted">{fmtDate(m.createdAt)}</span>
                  </div>
                  <div className="msg-body">{m.message}</div>
                </div>
              ),
            )}
          </div>

          {ticket.status === 'CLOSED' ? (
            <p className="hint">This ticket is closed. Change its status to reopen and reply.</p>
          ) : (
            <div className="reply-box">
              <textarea
                rows={4}
                placeholder="Write a reply to the customer…"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
              />
              <div className="reply-actions">
                <button className="btn-primary" disabled={sending || !reply.trim()} onClick={sendReply}>
                  {sending ? 'Sending…' : 'Send reply'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <h3>Customer</h3>
          <div className="kv">
            <div><span>Name</span><strong>{ticket.user?.profile?.fullName || '—'}</strong></div>
            <div><span>Email</span><strong>{ticket.user?.email}</strong></div>
            <div><span>Phone</span><strong>{ticket.user?.profile?.phone || '—'}</strong></div>
            <div><span>Country</span><strong>{ticket.user?.profile?.country || '—'}</strong></div>
            <div><span>Account status</span><strong>{ticket.user?.status}</strong></div>
            <div><span>Joined</span><strong>{fmtDate(ticket.user?.createdAt)}</strong></div>
          </div>
        </div>
      </div>
    </div>
  );
}
