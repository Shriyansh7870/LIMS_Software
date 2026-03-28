import React from 'react';

interface ProgressBarProps {
  value: number; // 0-100
  max?: number;
  label?: string;
  showValue?: boolean;
  size?: 'sm' | 'md';
  colorize?: boolean; // true = red<30, orange 30-70, green>70
}

export default function ProgressBar({ value, max = 100, label, showValue = true, size = 'sm', colorize = false }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  let color = '#C49A2C';
  if (colorize) {
    color = pct < 30 ? '#DC2626' : pct < 70 ? '#D97706' : '#16A34A';
  }

  const h = size === 'sm' ? 'h-1.5' : 'h-2.5';

  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-1">
          {label && <span className="text-xs text-text-muted">{label}</span>}
          {showValue && <span className="text-xs font-mono text-text-dim">{Math.round(pct)}%</span>}
        </div>
      )}
      <div className={`w-full ${h} bg-card2 rounded-full overflow-hidden`}>
        <div
          className={`${h} rounded-full transition-all duration-500`}
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
