'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { UTCTimestamp, IChartApi, ISeriesApi } from 'lightweight-charts';
import Reactive from '@/components/Reactive';

interface Coin {
  id: string;
  symbol: string;
  name: string;
  color: string;
  pair: string;
}

interface Interval {
  label: string;
  value: string;
  limit: number;
}

const COINS: Coin[] = [
  { id: 'BTC', symbol: 'BTC', name: 'Bitcoin', color: '#f7931a', pair: 'BTCUSDT' },
  { id: 'ETH', symbol: 'ETH', name: 'Ethereum', color: '#627eea', pair: 'ETHUSDT' },
  { id: 'ETC', symbol: 'ETC', name: 'Ethereum Classic', color: '#328332', pair: 'ETCUSDT' },
];

const INTERVALS: Interval[] = [
  { label: '1s', value: '1s', limit: 90 },
  { label: '1m', value: '1m', limit: 75 },
  { label: '5m', value: '5m', limit: 60 },
  { label: '15m', value: '15m', limit: 60 },
  { label: '1h', value: '1h', limit: 60 },
  { label: '4h', value: '4h', limit: 60 },
  { label: '1d', value: '1d', limit: 60 },
];

interface Kline {
  time: UTCTimestamp;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const MA_OPTIONS = [
  { id: 'MA7', period: 7, color: '#f59e0b' },
  { id: 'MA25', period: 25, color: '#8b5cf6' },
];

const UP_COLOR = '#4ade80';
const DOWN_COLOR = '#f87171';

function formatPrice(price: number): string {
  if (price >= 1000) {
    return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (price >= 1) return `$${price.toFixed(2)}`;
  return `$${price.toFixed(4)}`;
}

function formatChange(change24h: number): string {
  return `${change24h >= 0 ? '+' : ''}${change24h.toFixed(2)}%`;
}

function formatVolume(vol: number): string {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(vol);
}

export default function LiveTradingChart() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const maSeriesRef = useRef<Record<string, ISeriesApi<'Line'> | null>>({});
  const klinesRef = useRef<Kline[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const wsLiveRef = useRef(false);
  const activeMAsRef = useRef<Set<string>>(new Set());

  const [activeCoin, setActiveCoin] = useState<Coin>(COINS[0]);
  const [activeInterval, setActiveInterval] = useState<Interval>(INTERVALS[2]);
  const [prices, setPrices] = useState<Record<string, { current: number; change24h: number }>>({});
  const [activeMAs, setActiveMAs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [connection, setConnection] = useState<'connecting' | 'live'>('connecting');

  useEffect(() => {
    activeMAsRef.current = activeMAs;
  }, [activeMAs]);

  const fetchKlines = useCallback(async (coin: Coin, iv: Interval): Promise<Kline[]> => {
    const res = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=${coin.pair}&interval=${iv.value}&limit=${iv.limit}`
    );
    if (!res.ok) throw new Error('Failed to fetch chart data');
    const raw: [number, string, string, string, string, string, ...unknown[]][] = await res.json();
    return raw.map(([time, open, high, low, close, volume]) => ({
      time: Math.floor(time / 1000) as UTCTimestamp,
      open: parseFloat(open),
      high: parseFloat(high),
      low: parseFloat(low),
      close: parseFloat(close),
      volume: parseFloat(volume),
    }));
  }, []);

  const fetchPrices = useCallback(async (): Promise<
    Record<string, { current: number; change24h: number }>
  > => {
    const pairs = JSON.stringify(COINS.map((c) => c.pair));
    const res = await fetch(
      `https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(pairs)}`
    );
    if (!res.ok) throw new Error('Failed to fetch prices');
    const data: Array<{ symbol: string; lastPrice: string; priceChangePercent: string }> =
      await res.json();
    const result: Record<string, { current: number; change24h: number }> = {};
    for (const coin of COINS) {
      const d = data.find((t) => t.symbol === coin.pair);
      if (d) {
        result[coin.id] = {
          current: parseFloat(d.lastPrice),
          change24h: parseFloat(d.priceChangePercent),
        };
      }
    }
    return result;
  }, []);

  const computeMA = useCallback((period: number) => {
    const arr = klinesRef.current;
    const out: Array<{ time: UTCTimestamp; value: number }> = [];
    let sum = 0;
    for (let i = 0; i < arr.length; i++) {
      sum += arr[i].close;
      if (i >= period) sum -= arr[i - period].close;
      if (i >= period - 1) out.push({ time: arr[i].time, value: sum / period });
    }
    return out;
  }, []);

  const ensureMAs = useCallback(async () => {
    const chart = chartRef.current;
    if (!chart) return;
    const { LineSeries } = await import('lightweight-charts');
    const active = activeMAsRef.current;
    for (const opt of MA_OPTIONS) {
      if (active.has(opt.id)) {
        if (!maSeriesRef.current[opt.id]) {
          maSeriesRef.current[opt.id] = chart.addSeries(LineSeries, {
            color: opt.color,
            lineWidth: 2,
            priceLineVisible: false,
            lastValueVisible: true,
            crosshairMarkerVisible: true,
          });
        }
        const data = computeMA(opt.period);
        if (data.length) maSeriesRef.current[opt.id]?.setData(data);
      } else {
        const existing = maSeriesRef.current[opt.id];
        if (existing) {
          chart.removeSeries(existing);
          maSeriesRef.current[opt.id] = null;
        }
      }
    }
  }, [computeMA]);

  const applyKlines = useCallback(
    async (klines: Kline[]) => {
      klinesRef.current = klines;
      const candles = klines.map(({ time, open, high, low, close }) => ({ time, open, high, low, close }));
      const volumes = klines.map((k) => ({
        time: k.time,
        value: k.volume,
        color: k.close >= k.open ? UP_COLOR : DOWN_COLOR,
      }));
      candleSeriesRef.current?.setData(candles);
      volumeSeriesRef.current?.setData(volumes);
      await ensureMAs();
    },
    [ensureMAs],
  );

  const applyKlineTick = useCallback(
    async (kline: Kline) => {
      const arr = klinesRef.current;
      const last = arr[arr.length - 1];
      if (!last || kline.time > last.time) {
        arr.push(kline);
        if (arr.length > 200) arr.shift();
      } else if (kline.time === last.time) {
        arr[arr.length - 1] = kline;
      } else {
        return;
      }
      klinesRef.current = arr;
      candleSeriesRef.current?.update({ time: kline.time, open: kline.open, high: kline.high, low: kline.low, close: kline.close });
      volumeSeriesRef.current?.update({ time: kline.time, value: kline.volume, color: kline.close >= kline.open ? UP_COLOR : DOWN_COLOR });
      await ensureMAs();
    },
    [ensureMAs],
  );

  useEffect(() => {
    let mounted = true;
    let intervalTimer: ReturnType<typeof setInterval>;
    let wsTimer: ReturnType<typeof setTimeout>;

    async function init() {
      try {
        setLoading(true);
        setError('');
        const [klines, priceData] = await Promise.all([
          fetchKlines(activeCoin, activeInterval),
          fetchPrices(),
        ]);
        if (!mounted) return;

        setPrices((prev) => ({ ...prev, ...priceData }));
        setLoading(false);

        const { createChart, CandlestickSeries, HistogramSeries } = await import('lightweight-charts');

        if (chartRef.current) {
          chartRef.current.remove();
          chartRef.current = null;
          candleSeriesRef.current = null;
          volumeSeriesRef.current = null;
          maSeriesRef.current = {};
        }

        if (!chartContainerRef.current) return;

        const chart = createChart(chartContainerRef.current, {
          width: chartContainerRef.current.clientWidth,
          height: 340,
          layout: {
            background: { color: 'transparent' },
            textColor: '#94a3b8',
            fontSize: 12,
          },
          grid: {
            vertLines: { color: 'rgba(148,163,184,0.08)' },
            horzLines: { color: 'rgba(148,163,184,0.08)' },
          },
          crosshair: {
            mode: 0,
            vertLine: { color: 'rgba(148,163,184,0.3)', width: 1, style: 2 },
            horzLine: { color: 'rgba(148,163,184,0.3)', width: 1, style: 2 },
          },
          rightPriceScale: {
            borderColor: 'rgba(148,163,184,0.15)',
          },
          timeScale: {
            borderColor: 'rgba(148,163,184,0.15)',
            timeVisible: true,
            secondsVisible: activeInterval.value === '1s',
            rightOffset: 2,
            barSpacing: 6,
          },
        });

        const candleSeries = chart.addSeries(CandlestickSeries, {
          upColor: UP_COLOR,
          downColor: DOWN_COLOR,
          borderUpColor: UP_COLOR,
          borderDownColor: DOWN_COLOR,
          wickUpColor: UP_COLOR,
          wickDownColor: DOWN_COLOR,
        });

        const volumeSeries = chart.addSeries(HistogramSeries, {
          priceFormat: { type: 'volume' },
          priceScaleId: 'vol',
          priceLineVisible: false,
          lastValueVisible: false,
        });
        chart.priceScale('vol').applyOptions({
          scaleMargins: { top: 0.82, bottom: 0 },
        });

        chartRef.current = chart;
        candleSeriesRef.current = candleSeries;
        volumeSeriesRef.current = volumeSeries;

        await applyKlines(klines);
        chart.timeScale().fitContent();

        const handleResize = () => {
          if (chartContainerRef.current && chartRef.current) {
            chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
          }
        };
        window.addEventListener('resize', handleResize);

        const connectWS = () => {
          if (!mounted) return;
          if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
          }
          setConnection('connecting');
          wsLiveRef.current = false;
          const streams = COINS.map((c) => `${c.pair.toLowerCase()}@ticker`).concat(
            `${activeCoin.pair.toLowerCase()}@kline_${activeInterval.value}`,
          );
          try {
            const ws = new WebSocket(
              `wss://stream.binance.com:9443/stream?streams=${streams.join('/')}`,
            );
            wsRef.current = ws;
            ws.onopen = () => {
              if (mounted && wsRef.current === ws) {
                wsLiveRef.current = true;
                setConnection('live');
              }
            };
            ws.onmessage = (ev) => {
              let msg: any;
              try {
                msg = JSON.parse(ev.data);
              } catch {
                return;
              }
              if (msg.data) msg = msg.data;
              if (!msg || typeof msg !== 'object') return;
              if (msg.e === 'kline' && msg.k) {
                const k = msg.k;
                const t = Math.floor(k.t / 1000) as UTCTimestamp;
                void applyKlineTick({
                  time: t,
                  open: parseFloat(k.o),
                  high: parseFloat(k.h),
                  low: parseFloat(k.l),
                  close: parseFloat(k.c),
                  volume: parseFloat(k.v),
                });
              } else if (msg.e === '24hrTicker' && msg.s) {
                const coin = COINS.find((c) => c.pair === msg.s);
                if (!coin) return;
                setPrices((prev) => ({
                  ...prev,
                  [coin.id]: {
                    current: parseFloat(msg.c),
                    change24h: parseFloat(msg.P),
                  },
                }));
              }
            };
            ws.onerror = () => {
              wsLiveRef.current = false;
              if (mounted && wsRef.current === ws) setConnection('connecting');
            };
            ws.onclose = () => {
              if (wsRef.current !== ws) return;
              wsRef.current = null;
              wsLiveRef.current = false;
              if (mounted) {
                setConnection('connecting');
                wsTimer = setTimeout(connectWS, 4000);
              }
            };
          } catch {
            wsTimer = setTimeout(connectWS, 4000);
          }
        };
        connectWS();

        intervalTimer = setInterval(async () => {
          if (wsLiveRef.current) return;
          if (!mounted) return;
          try {
            const newKlines = await fetchKlines(activeCoin, activeInterval);
            await applyKlines(newKlines);
            const newPrices = await fetchPrices();
            if (mounted) setPrices((prev) => ({ ...prev, ...newPrices }));
          } catch {
            // silently ignore fallback errors
          }
        }, 30000);

        return () => {
          window.removeEventListener('resize', handleResize);
        };
      } catch (e: any) {
        if (mounted) {
          setError(e?.message || 'Failed to load chart');
          setLoading(false);
        }
      }
    }

    init();

    return () => {
      mounted = false;
      clearTimeout(wsTimer);
      clearInterval(intervalTimer);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        candleSeriesRef.current = null;
        volumeSeriesRef.current = null;
        maSeriesRef.current = {};
      }
    };
  }, [activeCoin.id, activeInterval.value, fetchKlines, fetchPrices, applyKlines, applyKlineTick]);

  useEffect(() => {
    if (!chartRef.current) return;
    void ensureMAs();
  }, [activeMAs, ensureMAs]);

  const handleCoinChange = (coin: Coin) => {
    setActiveCoin(coin);
    setLoading(true);
  };

  const handleIntervalChange = (iv: Interval) => {
    setActiveInterval(iv);
    setLoading(true);
  };

  const toggleMA = (id: string) => {
    setActiveMAs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <Reactive tilt glare spotlight maxTilt={3}>
      <div className="trading-chart">
        <div className="trading-chart-header">
          <div className="trading-chart-tabs">
            {COINS.map((coin) => (
              <button
                key={coin.id}
                className={`trading-tab ${activeCoin.id === coin.id ? 'active' : ''}`}
                onClick={() => handleCoinChange(coin)}
              >
                <span className="trading-tab-dot" style={{ background: coin.color }} />
                {coin.symbol}
              </button>
            ))}
          </div>
          {prices[activeCoin.id] && (
            <div className="trading-chart-price">
              <span className="trading-current-price">
                {formatPrice(prices[activeCoin.id].current)}
              </span>
              <span
                className={`trading-price-change ${
                  prices[activeCoin.id].change24h >= 0 ? 'positive' : 'negative'
                }`}
              >
                {formatChange(prices[activeCoin.id].change24h)}
              </span>
            </div>
          )}
        </div>

        <div className="trading-chart-controls">
          <div className="trading-chart-intervals">
            {INTERVALS.map((iv) => (
              <button
                key={iv.value}
                className={`trading-tab trading-tab-sm ${
                  activeInterval.value === iv.value ? 'active' : ''
                }`}
                onClick={() => handleIntervalChange(iv)}
              >
                {iv.label}
              </button>
            ))}
          </div>
          <div className="trading-chart-mas">
            {MA_OPTIONS.map((ma) => (
              <button
                key={ma.id}
                className={`trading-ma-btn ${activeMAs.has(ma.id) ? 'active' : ''}`}
                onClick={() => toggleMA(ma.id)}
              >
                {ma.id}
              </button>
            ))}
          </div>
        </div>

        <div className="trading-chart-label">
          {activeCoin.name} / USDT &middot; {activeInterval.label} &middot; Candlestick
          <span className={`trading-chart-conn ${connection}`}>
            <span className="dot" />
            {connection === 'live' ? 'Live' : 'Connecting'}
          </span>
        </div>

        {error && <div className="trading-chart-error">{error}</div>}
        {loading && (
          <div className="trading-chart-loading">
            <div className="trading-chart-spinner" />
            Loading chart...
          </div>
        )}
        <div
          ref={chartContainerRef}
          className={`trading-chart-container ${loading ? 'hidden' : ''}`}
        />

        <div className="trading-chart-footer">
          {COINS.map((coin) => {
            const p = prices[coin.id];
            if (!p) return null;
            return (
              <div key={coin.id} className="trading-chart-ticker">
                <span className="trading-ticker-symbol" style={{ color: coin.color }}>
                  {coin.symbol}
                </span>
                <span className="trading-ticker-price">{formatPrice(p.current)}</span>
                <span
                  className={`trading-ticker-change ${p.change24h >= 0 ? 'positive' : 'negative'}`}
                >
                  {formatChange(p.change24h)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </Reactive>
  );
}