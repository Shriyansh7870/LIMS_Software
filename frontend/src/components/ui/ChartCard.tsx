import React from 'react';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  height?: number;
}

export default function ChartCard({ title, subtitle, action, children, className = '', height = 240 }: ChartCardProps) {
  return (
    <div className={`card p-4 ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-syne font-semibold text-sm text-text">{title}</h3>
          {subtitle && <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
      <div style={{ height }}>{children}</div>
    </div>
  );
}
