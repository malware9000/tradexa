'use client';

export default function GridBackground() {
  return (
    <div className="grid-bg" aria-hidden="true">
      <div className="grid-lines" />
      <div className="grid-glow" />
      <div className="grid-orb grid-orb-1" />
      <div className="grid-orb grid-orb-2" />
      <div className="grid-orb grid-orb-3" />
    </div>
  );
}