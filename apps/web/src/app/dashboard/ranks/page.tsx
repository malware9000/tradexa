'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, fmtMoney } from '@/lib/api';

interface RankTier {
  rank: string;
  label: string;
  minDeposit: number;
  bonusRate: number;
  bonusPercent: string;
  description: string;
}

interface RanksData {
  enabled: boolean;
  ranks: RankTier[];
}

interface UserRankData {
  enabled: boolean;
  currentRank: RankTier;
  totalDeposits: number;
  nextRank: (RankTier & { depositNeeded: number }) | null;
}

export default function RanksPage() {
  const [ranks, setRanks] = useState<RanksData | null>(null);
  const [userRank, setUserRank] = useState<UserRankData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api<RanksData>('/ranks'), api<UserRankData>('/ranks/me')])
      .then(([r, u]) => {
        setRanks(r.data);
        setUserRank(u.data);
      })
      .catch((e) => setError(e?.message || 'Failed to load ranks'));
  }, []);

  if (error) return <div className="alert alert-error" role="alert">{error}</div>;
  if (!ranks || !userRank) return <div className="loading">Loading ranks...</div>;

  const rankColors: Record<string, string> = {
    BRONZE: '#cd7f32',
    SILVER: '#c0c0c0',
    GOLD: '#ffd700',
    PLATINUM: '#e5e4e2',
    DIAMOND: '#b9f2ff',
    EMERALD: '#50c878',
    RUBY: '#e0115f',
    OBSIDIAN: '#36454f',
    LEGENDARY: '#ff8c00',
    MYTHIC: '#9b59b6',
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Ranks &amp; Bonuses</h1>
          <p className="muted">Earn rank bonuses on every deposit based on your total deposits</p>
        </div>
      </div>

      {!ranks.enabled && (
        <div className="alert alert-warn" role="alert">
          The rank bonus system is currently disabled.
        </div>
      )}

      <div className="stat-grid">
        <div className="stat-card accent">
          <span className="stat-label">Your rank</span>
          <span className="stat-value" style={{ color: rankColors[userRank.currentRank.rank] || '#fff' }}>
            {userRank.currentRank.label}
          </span>
          <span className="stat-hint">{userRank.currentRank.bonusPercent} bonus on deposits</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total deposits</span>
          <span className="stat-value">{fmtMoney(userRank.totalDeposits)}</span>
          <span className="stat-hint">lifetime confirmed deposits</span>
        </div>
        {userRank.nextRank && (
          <div className="stat-card">
            <span className="stat-label">Next rank</span>
            <span className="stat-value" style={{ color: rankColors[userRank.nextRank.rank] || '#fff' }}>
              {userRank.nextRank.label}
            </span>
            <span className="stat-hint">{fmtMoney(userRank.nextRank.depositNeeded)} more needed</span>
          </div>
        )}
      </div>

      {userRank.nextRank && (
        <div className="card">
          <h3>Progress to {userRank.nextRank.label}</h3>
          <div style={{ marginTop: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
              <span>{userRank.currentRank.label}</span>
              <span>{userRank.nextRank.label}</span>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '8px', height: '12px', overflow: 'hidden' }}>
              <div
                style={{
                  background: rankColors[userRank.currentRank.rank] || '#50c878',
                  height: '100%',
                  borderRadius: '8px',
                  width: `${Math.min(
                    ((userRank.totalDeposits - userRank.currentRank.minDeposit) /
                      (userRank.nextRank.minDeposit - userRank.currentRank.minDeposit)) *
                      100,
                    100,
                  )}%`,
                  transition: 'width 0.5s ease',
                }}
              />
            </div>
            <p className="hint" style={{ marginTop: '0.5rem' }}>
              {fmtMoney(userRank.totalDeposits)} of {fmtMoney(userRank.nextRank.minDeposit)}
            </p>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-head">
          <h3>All Ranks</h3>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Min. Deposits</th>
                <th>Bonus</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {ranks.ranks.map((r) => (
                <tr
                  key={r.rank}
                  style={{
                    background:
                      r.rank === userRank.currentRank.rank
                        ? 'rgba(80, 200, 120, 0.1)'
                        : undefined,
                  }}
                >
                  <td>
                    <span style={{ color: rankColors[r.rank] || '#fff', fontWeight: 600 }}>
                      {r.label}
                      {r.rank === userRank.currentRank.rank && ' (You)'}
                    </span>
                  </td>
                  <td>{fmtMoney(r.minDeposit)}</td>
                  <td className="pos">{r.bonusPercent}</td>
                  <td className="muted">{r.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ marginTop: '1rem' }}>
        <h3>How it works</h3>
        <p className="hint" style={{ lineHeight: 1.7 }}>
          Your rank is determined by your total confirmed deposits. When you make a deposit,
          a bonus is automatically credited to your account based on your current rank.
          The higher your rank, the bigger the bonus percentage. Your rank updates in
          real-time as your deposits are confirmed.
        </p>
      </div>
    </div>
  );
}
