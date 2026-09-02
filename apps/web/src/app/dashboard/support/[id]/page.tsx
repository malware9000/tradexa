'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api, fmtDate } from '@/lib/api';
import { TableSkeleton } from '@/components/DashboardSkeleton';

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
    category: string;
    subject: string;
    message: string;
    priority: number;
    status: string;
    createdAt: string;
    updatedAt: string;
  };
  messages: Message[];
}

export default function SupportTicketDetailPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<TicketDetail | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const { res, data } = await api<TicketDetail>(`/support/tickets/${params.id}`);
    if (!res.ok) {
      setError(typeof data === 'string' ? data : (data as any)?.message || 'Failed to load ticket');
      return;
    }
    setData(data);
  }, [params.id]);

  useEffect(() => {
    setError('');
    load();
  }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [data?.messages.length]);

  if (error && !data) return <div className="alert alert-error" role="alert">{error}</div>;
  if (!data) return <TableSkeleton rows={4} cols={3} />;

  const { ticket, messages } = data;

  async function sendReply() {
    const text = reply.trim();
    if (!text) return;
    setSending(true);
    setError('');
    setSuccess('');
    const { res, data: d } = await api(`/support/tickets/${ticket.id}/reply`, {
      method: 'POST',
      body: JSON.stringify({ message: text }),
    });
    setSending(false);
    if (!res.ok) {
      setError(typeof d.message === 'string' ? d.message : 'Failed to send message');
      return;
    }
    setReply('');
    load();
  }

  async function changeStatus(next: string) {
    setStatusBusy(true);
    setError('');
    setSuccess('');
    const { res, data: d } = await api(`/support/tickets/${ticket.id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: next }),
    });
    setStatusBusy(false);
    if (!res.ok) {
      setError(typeof d.message === 'string' ? d.message : 'Failed to update status');
      return;
    }
    setSuccess('Ticket updated.');
    load();
  }

  const closed = ticket.status === 'CLOSED';

  return (
    <div className="dash-grid">
      <div className="card span-2">
        <div className="card-head">
          <div>
            <Link className="btn-link" href="/dashboard/support">← Back to support</Link>
            <h3>{ticket.subject}</h3>
            <p className="hint">
              {ticket.category} · opened {fmtDate(ticket.createdAt)}
            </p>
          </div>
          <div className="row-actions">
            <span className={`badge badge-status st-${ticket.status.toLowerCase()}`}>
              {ticket.status.replace(/_/g, ' ')}
            </span>
            {!closed && ticket.status !== 'RESOLVED' && (
              <button className="btn-secondary" disabled={statusBusy} onClick={() => changeStatus('RESOLVED')}>
                {statusBusy ? '…' : 'Mark resolved'}
              </button>
            )}
            {ticket.status === 'RESOLVED' && !closed && (
              <button className="btn-secondary" disabled={statusBusy} onClick={() => changeStatus('OPEN')}>
                {statusBusy ? '…' : 'Reopen'}
              </button>
            )}
          </div>
        </div>

        {error && <div className="alert alert-error" role="alert">{error}</div>}
        {success && <div className="alert alert-success" role="status">{success}</div>}

        <div className="thread">
          <div className="msg-msg msg-msg-user">
            <div className="msg-meta">
              <strong>You</strong>
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
                  <strong>You</strong>
                  <span className="muted">{fmtDate(m.createdAt)}</span>
                </div>
                <div className="msg-body">{m.message}</div>
              </div>
            ),
          )}
          <div ref={bottomRef} />
        </div>

        {closed ? (
          <p className="hint">This ticket is closed. If you need further help, open a new ticket.</p>
        ) : (
          <div className="reply-box">
            <textarea
              rows={3}
              placeholder={ticket.status === 'WAITING_FOR_USER' ? 'Support is waiting on you…' : 'Write a message to our support team…'}
              value={reply}
              onChange={(e) => setReply(e.target.value)}
            />
            <div className="reply-actions">
              <button className="btn-primary" disabled={sending || !reply.trim()} onClick={sendReply}>
                {sending ? 'Sending…' : 'Send message'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
