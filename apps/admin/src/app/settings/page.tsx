'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Skeleton, SkeletonText } from '@/components/Loading';

interface Setting {
  key: string;
  value: unknown;
  description: string | null;
  updatedAt?: string;
}

const fields: Array<{ key: string; label: string; type: 'number' | 'bool' }> = [
  { key: 'test_return_rate', label: 'Test return rate (per period)', type: 'number' },
  { key: 'test_return_period_hours', label: 'Test return period (hours)', type: 'number' },
  { key: 'minimum_deposit', label: 'Minimum deposit', type: 'number' },
  { key: 'maximum_deposit', label: 'Maximum deposit', type: 'number' },
  { key: 'minimum_withdrawal', label: 'Minimum withdrawal', type: 'number' },
  { key: 'maximum_withdrawal', label: 'Maximum withdrawal', type: 'number' },
  { key: 'withdrawal_fee', label: 'Withdrawal fee', type: 'number' },
  { key: 'maintenance_mode', label: 'Maintenance mode', type: 'bool' },
  { key: 'registration_enabled', label: 'Registration enabled', type: 'bool' },
  { key: 'withdrawals_enabled', label: 'Withdrawals enabled', type: 'bool' },
  { key: 'deposits_enabled', label: 'Deposits enabled', type: 'bool' },
];

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api<Setting[]>('/admin/settings')
      .then(({ data }) => setSettings(data))
      .catch((e) => setError(e?.message || 'Failed to load settings'))
      .finally(() => setLoaded(true));
  }, []);

  function get(key: string) {
    return settings.find((s) => s.key === key);
  }

  function setValue(key: string, value: unknown) {
    const existing = get(key);
    setSettings((prev) =>
      existing
        ? prev.map((s) => (s.key === key ? { ...s, value } : s))
        : [...prev, { key, value, description: null }],
    );
  }

  async function save() {
    setError('');
    setSuccess('');
    setSaving(true);
    const payload: Record<string, unknown> = {};
    for (const f of fields) {
      const s = get(f.key);
      if (s) payload[f.key] = f.type === 'bool' ? Boolean(s.value) : Number(s.value);
    }
    const { res, data } = await api('/admin/settings', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (!res.ok) {
      setError(typeof data.message === 'string' ? data.message : 'Failed to save settings');
      return;
    }
    setSuccess('Settings saved.');
  }

  return (
    <div>
      <div className="page-head">
        <h1>Settings</h1>
        <p className="muted">
          These control the Phase 1 simulated environment. The test-return worker reads the
          return rate and period on its next run.
        </p>
      </div>

      {error && <div className="alert alert-error" role="alert">{error}</div>}
      {success && <div className="alert alert-success" role="status">{success}</div>}

      <div className="card">
        {!loaded ? (
          <div className="settings-list">
            {fields.map((f) => (
              <div className="setting-row" key={f.key}>
                <div>
                  <SkeletonText as="line" width={200} />
                  <SkeletonText as="line" width={120} />
                </div>
                <Skeleton style={{ width: 60, height: 24, borderRadius: 6 }} />
              </div>
            ))}
          </div>
        ) : (
        <div className="settings-list">
          {fields.map((f, i) => {
            const s = get(f.key);
            const value = f.type === 'bool' ? Boolean(s?.value) : Number(s?.value ?? 0);
            return (
              <div className="setting-row" key={f.key}>
                <div>
                  <strong>{f.label}</strong>
                  <div className="muted small mono">{f.key}</div>
                  {s?.description && <div className="muted small">{s.description}</div>}
                </div>
                {f.type === 'bool' ? (
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={value as boolean}
                      onChange={(e) => setValue(f.key, e.target.checked)}
                    />
                    <span className="switch-track" />
                  </label>
                ) : (
                  <label className="inline-field">
                    <input
                      type="number"
                      step={f.key === 'test_return_rate' ? '0.000001' : '0.01'}
                      value={value as number}
                      onChange={(e) => setValue(f.key, Number(e.target.value))}
                    />
                  </label>
                )}
              </div>
            );
          })}
        </div>
        )}
        <div className="settings-actions">
          <button className="btn-primary" onClick={save} disabled={saving || settings.length === 0}>
            {saving ? 'Saving…' : 'Save settings'}
          </button>
        </div>
      </div>
    </div>
  );
}