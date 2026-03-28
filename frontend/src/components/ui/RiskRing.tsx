import React from 'react';

interface RiskRingProps {
  score: number; // 0-100
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
}

export default function RiskRing({ score, size = 44, strokeWidth = 4, showLabel = true }: RiskRingProps) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  const color = score < 40 ? '#16A34A' : score < 70 ? '#D97706' : '#DC2626';
  const label = score < 40 ? 'Low' : score < 70 ? 'Med' : 'High';

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="#E2ECEC" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.5s ease' }} />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-[9px] font-bold leading-none" style={{ color }}>
            {Math.round(score)}
          </span>
        </div>
      )}
    </div>
  );
}
