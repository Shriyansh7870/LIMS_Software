import React from 'react';
import { Search, Database, FileText, AlertCircle } from 'lucide-react';

interface EmptyStateProps {
  icon?: 'search' | 'data' | 'file' | 'alert';
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

const iconMap = { search: Search, data: Database, file: FileText, alert: AlertCircle };

export default function EmptyState({
  icon = 'data',
  title = 'No data found',
  description = 'There are no records to display at this time.',
  action,
}: EmptyStateProps) {
  const Icon = iconMap[icon];

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-card2 flex items-center justify-center mb-4">
        <Icon size={24} className="text-text-dim" />
      </div>
      <h3 className="font-syne font-semibold text-base text-text mb-1">{title}</h3>
      <p className="text-sm text-text-muted max-w-xs">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
