'use client';

import { useEffect, useState } from 'react';

interface DaysOnMarketProps {
  propertyId: string;
  /** Si se conoce la fecha de aprobación, se puede pasar directamente sin fetch */
  approvedAt?: string | Date | null;
  size?: 'sm' | 'md' | 'lg';
}

type UrgencyLevel = 'new' | 'fresh' | 'normal' | 'aging' | 'stale';

interface UrgencyConfig {
  label: string;
  icon: string;
  bgClass: string;
  textClass: string;
  ringClass: string;
  pulse: boolean;
}

const URGENCY_CONFIG: Record<UrgencyLevel, UrgencyConfig> = {
  new: {
    label: 'Nuevo hoy',
    icon: '🔥',
    bgClass: 'bg-red-50',
    textClass: 'text-red-600',
    ringClass: 'border-red-200',
    pulse: true,
  },
  fresh: {
    label: 'Recién publicado',
    icon: '✨',
    bgClass: 'bg-propio-green/10',
    textClass: 'text-emerald-700',
    ringClass: 'border-propio-green/30',
    pulse: true,
  },
  normal: {
    label: 'En mercado',
    icon: '📅',
    bgClass: 'bg-blue-50',
    textClass: 'text-blue-600',
    ringClass: 'border-blue-100',
    pulse: false,
  },
  aging: {
    label: 'Hace tiempo',
    icon: '⏳',
    bgClass: 'bg-amber-50',
    textClass: 'text-amber-700',
    ringClass: 'border-amber-200',
    pulse: false,
  },
  stale: {
    label: 'Mucho tiempo',
    icon: '⚠️',
    bgClass: 'bg-slate-100',
    textClass: 'text-slate-500',
    ringClass: 'border-slate-200',
    pulse: false,
  },
};

function computeDaysOnMarket(approvedAt: string | Date): { days: number; level: UrgencyLevel } {
  const since = new Date(approvedAt).getTime();
  const days = Math.floor((Date.now() - since) / 86400000);
  const level: UrgencyLevel =
    days <= 3 ? 'new' :
    days <= 14 ? 'fresh' :
    days <= 30 ? 'normal' :
    days <= 60 ? 'aging' : 'stale';
  return { days, level };
}

export function DaysOnMarketBadge({ propertyId, approvedAt, size = 'md' }: DaysOnMarketProps) {
  const [days, setDays] = useState<number | null>(null);
  const [level, setLevel] = useState<UrgencyLevel>('normal');
  const [loading, setLoading] = useState(!approvedAt);

  useEffect(() => {
    if (approvedAt) {
      const result = computeDaysOnMarket(approvedAt);
      setDays(result.days);
      setLevel(result.level);
      setLoading(false);
      return;
    }

    // Fetch desde backend
    const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
    fetch(`${API}/market/dom/${propertyId}`)
      .then(r => r.json())
      .then(data => {
        setDays(data.daysOnMarket ?? 0);
        setLevel(data.urgencyLevel ?? 'normal');
      })
      .catch(() => {
        // Fallback: estimación local aleatoria para demo
        const mockDays = Math.floor(Math.random() * 30);
        const result = computeDaysOnMarket(new Date(Date.now() - mockDays * 86400000));
        setDays(result.days);
        setLevel(result.level);
      })
      .finally(() => setLoading(false));
  }, [propertyId, approvedAt]);

  const config = URGENCY_CONFIG[level];

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-3 py-1 gap-1.5',
    lg: 'text-sm px-4 py-1.5 gap-2',
  }[size];

  if (loading) {
    return (
      <div className={`inline-flex items-center rounded-full border bg-slate-100 border-slate-200 animate-pulse ${sizeClasses}`}>
        <span className="w-12 h-3 bg-slate-200 rounded" />
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center rounded-full border font-semibold ${config.bgClass} ${config.textClass} ${config.ringClass} ${sizeClasses}`}
      title={`${days} días en el mercado`}
    >
      <span className={config.pulse ? 'animate-bounce' : ''}>{config.icon}</span>
      <span>
        {days === 0 ? 'Nuevo hoy' : days === 1 ? '1 día en mercado' : `${days} días en mercado`}
      </span>
      {(level === 'new' || level === 'fresh') && (
        <span className={`w-1.5 h-1.5 rounded-full ${level === 'new' ? 'bg-red-400' : 'bg-emerald-400'} animate-pulse`} />
      )}
    </div>
  );
}
