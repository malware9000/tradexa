'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';

export type Theme = 'dark' | 'light' | 'system';

const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (t: Theme) => void;
  resolved: 'dark' | 'light';
}>({ theme: 'dark', setTheme: () => {}, resolved: 'dark' });

export function useTheme() {
  return useContext(ThemeContext);
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [resolved, setResolved] = useState<'dark' | 'light'>('dark');
  const [mounted, setMounted] = useState(false);

  const applyTheme = useCallback((t: Theme) => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const effective = t === 'system' ? (prefersDark ? 'dark' : 'light') : t;
    document.documentElement.setAttribute('data-theme', effective);
    setResolved(effective);
  }, []);

  const setTheme = useCallback(
    (t: Theme) => {
      setThemeState(t);
      localStorage.setItem('tradexa_theme', t);
      applyTheme(t);
    },
    [applyTheme],
  );

  useEffect(() => {
    const saved = (localStorage.getItem('tradexa_theme') as Theme) || 'dark';
    setThemeState(saved);
    applyTheme(saved);
    setMounted(true);
  }, [applyTheme]);

  useEffect(() => {
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme('system');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme, applyTheme]);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolved }}>
      {children}
    </ThemeContext.Provider>
  );
}
