const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export async function api<T = any>(
  path: string,
  options: RequestInit & { auth?: boolean } = {},
): Promise<{ res: Response; data: T }> {
  const { auth = true, ...rest } = options;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(rest.headers as Record<string, string>),
  };
  if (auth) {
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('tradexa_admin_token') : null;
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${API_URL}${path}`, { ...rest, headers });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && auth && typeof window !== 'undefined') {
    localStorage.removeItem('tradexa_admin_token');
    localStorage.removeItem('tradexa_admin');
    if (!location.pathname.startsWith('/login')) {
      location.href = '/login';
    }
  }
  return { res, data };
}

export function fmtMoney(n: number | string | null | undefined, currency = 'USD'): string {
  const value = Number(n || 0);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}