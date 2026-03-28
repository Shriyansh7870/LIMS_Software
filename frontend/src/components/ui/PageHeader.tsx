import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  badge?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, actions, badge }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="font-syne font-bold text-2xl text-text">{title}</h1>
          {badge}
        </div>
        {subtitle && <p className="text-sm text-text-muted mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
