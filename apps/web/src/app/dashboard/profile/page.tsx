'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, fmtDate } from '@/lib/api';
import { ProfileSkeleton } from '@/components/DashboardSkeleton';

interface Profile {
  fullName?: string | null;
  phone?: string | null;
  country?: string | null;
  address?: string | null;
}

interface Me {
  email: string;
  emailVerified: boolean;
  status: string;
  kycStatus: string;
  twoFactorEnabled: boolean;
  createdAt: string;
  profile: Profile | null;
  investmentAccount: { currency: string; status: string } | null;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export default function ProfilePage() {
  const [me, setMe] = useState<Me | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [form, setForm] = useState({ fullName: '', phone: '', country: '', address: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    return Promise.all([
      api<Me>('/users/me'),
      api<Notification[]>('/notifications', { auth: true }),
    ]).then(([u, n]) => {
      setMe(u.data);
      setNotifications(n.data);
      setForm({
        fullName: u.data.profile?.fullName || '',
        phone: u.data.profile?.phone || '',
        country: u.data.profile?.country || '',
        address: u.data.profile?.address || '',
      });
    });
  }, []);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    const { res, data } = await api('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (!res.ok) {
      setError(typeof data.message === 'string' ? data.message : 'Failed to update profile.');
      return;
    }
    setSuccess('Profile updated.');
    localStorage.setItem('tradexa_user', JSON.stringify(data));
    load();
  }

  async function markRead(id: string) {
    await api(`/notifications/${id}/read`, { method: 'PATCH' });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }

  async function markAllRead() {
    await api('/notifications/read-all', { method: 'POST' });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  if (!me) return <ProfileSkeleton />;

  return (
    <div className="dash-grid">
      <div className="card">
        <h3>Account</h3>
        <div className="kv">
          <div><span>Email</span><strong>{me.email}</strong></div>
          <div><span>Status</span><strong>{me.status}</strong></div>
          <div><span>KYC</span><strong>{me.kycStatus}</strong></div>
          <div><span>Currency</span><strong>{me.investmentAccount?.currency || 'USD'}</strong></div>
          <div><span>Member since</span><strong>{fmtDate(me.createdAt)}</strong></div>
        </div>
      </div>

      <div className="card">
        <h3>Profile</h3>
        {error && <div className="alert alert-error" role="alert">{error}</div>}
        {success && <div className="alert alert-success" role="status">{success}</div>}
        <form onSubmit={saveProfile}>
          <div className="field">
            <label htmlFor="fullName">Full name</label>
            <input id="fullName" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          </div>
          <div className="field">
            <label htmlFor="phone">Phone</label>
            <input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="field">
            <label htmlFor="country">Country</label>
            <input id="country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
          </div>
          <div className="field">
            <label htmlFor="address">Address</label>
            <input id="address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Saving…' : 'Save profile'}
          </button>
        </form>
      </div>

      <div className="card span-2">
        <div className="card-head">
          <h3>Notifications</h3>
          <button className="btn-link" onClick={markAllRead}>Mark all read</button>
        </div>
        {notifications.length === 0 ? (
          <p className="hint">No notifications.</p>
        ) : (
          <div className="notif-list">
            {notifications.map((n) => (
              <div key={n.id} className={`notif ${n.read ? '' : 'unread'}`} onClick={() => n.read || markRead(n.id)}>
                <div className="notif-head">
                  <strong>{n.title}</strong>
                  <span className="muted">{fmtDate(n.createdAt)}</span>
                </div>
                <p>{n.body}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}