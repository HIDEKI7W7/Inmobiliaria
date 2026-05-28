'use client';

import { useEffect, useState } from 'react';

interface Snapshot {
  month: string;
  avgPrice: number;
  count: number;
}

interface PriceTrendChartProps {
  zona: string;
  /** Altura del SVG en px */
  height?: number;
  showSummary?: boolean;
}

const ZONE_COLORS: Record<string, { stroke: string; fill: string }> = {
  'Cala Cala':   { stroke: '#04045E', fill: 'rgba(4,4,94,0.08)' },
  'Queru Queru': { stroke: '#7c3aed', fill: 'rgba(124,58,237,0.08)' },
  'El Prado':    { stroke: '#0ea5e9', fill: 'rgba(14,165,233,0.08)' },
  'Sarco':       { stroke: '#b9fa3c', fill: 'rgba(185,250,60,0.12)' },
};

function formatUSD(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
  return `$${n}`;
}

export function PriceTrendChart({ zona, height = 200, showSummary = true }: PriceTrendChartProps) {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; snap: Snapshot } | null>(null);

  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
    fetch(`${API}/market/trends/${encodeURIComponent(zona)}`)
      .then(r => r.json())
      .then(data => {
        setSnapshots(data.monthlySnapshots ?? []);
        setPriceChange(data.priceChange30d ?? 0);
      })
      .catch(() => {
        // Fallback mock
        setSnapshots([
          { month: 'Dic 2024', avgPrice: 290000, count: 8 },
          { month: 'Ene 2025', avgPrice: 298000, count: 11 },
          { month: 'Feb 2025', avgPrice: 305000, count: 9 },
          { month: 'Mar 2025', avgPrice: 310000, count: 13 },
          { month: 'Abr 2025', avgPrice: 315000, count: 10 },
          { month: 'May 2025', avgPrice: 320000, count: 14 },
        ]);
        setPriceChange(1.58);
      })
      .finally(() => setLoading(false));
  }, [zona]);

  const colors = ZONE_COLORS[zona] ?? { stroke: '#04045E', fill: 'rgba(4,4,94,0.08)' };
  const W = 600;
  const H = height;
  const PADDING = { top: 20, right: 20, bottom: 36, left: 52 };
  const chartW = W - PADDING.left - PADDING.right;
  const chartH = H - PADDING.top - PADDING.bottom;

  const prices = snapshots.map(s => s.avgPrice);
  const minP = prices.length ? Math.min(...prices) * 0.97 : 0;
  const maxP = prices.length ? Math.max(...prices) * 1.03 : 1;

  const xScale = (i: number) => PADDING.left + (i / Math.max(snapshots.length - 1, 1)) * chartW;
  const yScale = (p: number) => PADDING.top + chartH - ((p - minP) / (maxP - minP)) * chartH;

  const points = snapshots.map((s, i) => ({ x: xScale(i), y: yScale(s.avgPrice) }));

  const linePath = points.length > 0
    ? `M ${points[0].x} ${points[0].y} ` +
      points.slice(1).map((p, i) => {
        const cp1x = (points[i].x + p.x) / 2;
        return `C ${cp1x} ${points[i].y} ${cp1x} ${p.y} ${p.x} ${p.y}`;
      }).join(' ')
    : '';

  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x} ${PADDING.top + chartH} L ${points[0].x} ${PADDING.top + chartH} Z`
    : '';

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-32 mb-3" />
        <div className="bg-slate-100 rounded-2xl" style={{ height }} />
      </div>
    );
  }

  if (snapshots.length === 0) {
    return (
      <div className="flex items-center justify-center bg-slate-50 rounded-2xl text-slate-400 text-sm" style={{ height }}>
        Sin datos de tendencia para {zona}
      </div>
    );
  }

  const isUp = priceChange >= 0;
  const latest = snapshots[snapshots.length - 1];
  const oldest = snapshots[0];

  return (
    <div className="relative">
      {showSummary && (
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-slate-400 text-xs uppercase tracking-wide">Precio promedio · {zona}</p>
            <p className="font-heading font-bold text-propio-blue text-2xl">
              {formatUSD(latest.avgPrice)}
              <span className={`ml-2 text-sm font-semibold ${isUp ? 'text-emerald-500' : 'text-red-500'}`}>
                {isUp ? '▲' : '▼'} {Math.abs(priceChange).toFixed(1)}%
              </span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-slate-400 text-xs">vs hace 6 meses</p>
            <p className={`font-semibold text-sm ${isUp ? 'text-emerald-500' : 'text-red-500'}`}>
              {isUp ? '+' : ''}{formatUSD(latest.avgPrice - oldest.avgPrice)}
            </p>
          </div>
        </div>
      )}

      <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-100 select-none">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          style={{ height }}
          onMouseLeave={() => { setHoveredIdx(null); setTooltip(null); }}
        >
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map(t => {
            const y = PADDING.top + chartH * (1 - t);
            const price = minP + (maxP - minP) * t;
            return (
              <g key={t}>
                <line x1={PADDING.left} y1={y} x2={W - PADDING.right} y2={y}
                  stroke="#f1f5f9" strokeWidth="1" />
                <text x={PADDING.left - 6} y={y + 4} textAnchor="end"
                  className="text-slate-400" fontSize="10" fill="#94a3b8">
                  {formatUSD(Math.round(price))}
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          <path d={areaPath} fill={colors.fill} />

          {/* Line */}
          <path d={linePath} fill="none" stroke={colors.stroke} strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round" />

          {/* Points */}
          {points.map((p, i) => (
            <g key={i}
              onMouseEnter={() => {
                setHoveredIdx(i);
                setTooltip({ x: p.x, y: p.y, snap: snapshots[i] });
              }}
            >
              <circle cx={p.x} cy={p.y} r={hoveredIdx === i ? 6 : 4}
                fill={hoveredIdx === i ? colors.stroke : 'white'}
                stroke={colors.stroke} strokeWidth="2"
                className="transition-all duration-150 cursor-pointer" />
              {/* X label */}
              <text x={p.x} y={H - 6} textAnchor="middle" fontSize="9" fill="#94a3b8">
                {snapshots[i].month.split(' ')[0]}
              </text>
            </g>
          ))}

          {/* Tooltip */}
          {tooltip && hoveredIdx !== null && (
            <g>
              <line x1={tooltip.x} y1={PADDING.top} x2={tooltip.x} y2={PADDING.top + chartH}
                stroke={colors.stroke} strokeWidth="1" strokeDasharray="4 3" opacity="0.4" />
              <rect
                x={tooltip.x + (hoveredIdx > snapshots.length / 2 ? -130 : 8)}
                y={tooltip.y - 30}
                width="118" height="52" rx="8"
                fill="white" stroke={colors.stroke} strokeWidth="1" opacity="0.95"
                filter="drop-shadow(0 4px 6px rgba(0,0,0,0.1))"
              />
              <text
                x={tooltip.x + (hoveredIdx > snapshots.length / 2 ? -72 : 67)}
                y={tooltip.y - 10} textAnchor="middle" fontSize="11"
                fontWeight="700" fill={colors.stroke}
              >
                {formatUSD(tooltip.snap.avgPrice)}
              </text>
              <text
                x={tooltip.x + (hoveredIdx > snapshots.length / 2 ? -72 : 67)}
                y={tooltip.y + 6} textAnchor="middle" fontSize="9" fill="#94a3b8"
              >
                {tooltip.snap.month} · {tooltip.snap.count} props.
              </text>
            </g>
          )}
        </svg>
      </div>

      <p className="text-slate-400 text-[10px] mt-2 text-right">
        Datos basados en {snapshots.reduce((s, x) => s + x.count, 0)} propiedades · Propio Analytics
      </p>
    </div>
  );
}
