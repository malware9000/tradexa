'use client';

import { useTheme } from './ThemeProvider';
import type { Theme } from './ThemeProvider';

const ICONS = {
  dark: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden>
      <path d="M12 3a9 9 0 109 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 01-4.4 2.26 5.403 5.403 0 01-3.14-9.8c-.44-.06-.9-.1-1.36-.1z" />
    </svg>
  ),
  light: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden>
      <path d="M12 7a5 5 0 100 10 5 5 0 000-10zm0-5a1 1 0 01-1-1V1a1 1 0 112 0v1a1 1 0 01-1 1zm0 20a1 1 0 01-1-1v-1a1 1 0 112 0v1a1 1 0 01-1 1zm9-9a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5 12a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zm12.07-6.07a1 1 0 01-.7-.29l-.71-.71a1 1 0 011.41-1.41l.71.71a1 1 0 01-.71 1.71zM6.34 17.66a1 1 0 01-.7-.29l-.71-.71a1 1 0 011.41-1.41l.71.71a1 1 0 01-.71 1.71zm12.02 0a1 1 0 01-.71-1.71l.71-.71a1 1 0 011.41 1.41l-.71.71a1 1 0 01-.7.3zM6.34 6.34a1 1 0 01-.7-.29 1 1 0 010-1.41l.71-.71a1 1 0 011.41 1.41l-.71.71a1 1 0 01-.71.29z" />
    </svg>
  ),
  system: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden>
      <path d="M4 6h16a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2zm0 2v8h16V8H4zm4 12h8v1a1 1 0 01-1 1H9a1 1 0 01-1-1v-1z" />
    </svg>
  ),
};

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const next: Record<Theme, Theme> = { dark: 'light', light: 'system', system: 'dark' };
  const label: Record<Theme, string> = {
    dark: 'Dark',
    light: 'Light',
    system: 'System',
  };

  return (
    <button
      className="theme-toggle"
      onClick={() => setTheme(next[theme])}
      title={`Theme: ${label[theme]} (click for ${label[next[theme]]})`}
      aria-label={`Switch theme, current: ${label[theme]}`}
    >
      {ICONS[theme]}
      <span className="theme-toggle-label">{label[theme]}</span>
    </button>
  );
}
