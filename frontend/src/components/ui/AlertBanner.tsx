import React from 'react';
import { AlertTriangle, Info, CheckCircle, XCircle, X } from 'lucide-react';

type AlertVariant = 'teal' | 'red' | 'orange' | 'blue' | 'green';

interface AlertBannerProps {
  variant?: AlertVariant;
  title?: string;
  message: string;
  onDismiss?: () => void;
}

const variantConfig = {
  teal:   { bg: 'bg-teal/10',   border: 'border-teal/20',    text: 'text-teal-dark',   icon: Info,          iconColor: '#C49A2C' },
  red:    { bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-800',     icon: XCircle,       iconColor: '#DC2626' },
  orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800',  icon: AlertTriangle, iconColor: '#D97706' },
  blue:   { bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-800',    icon: Info,          iconColor: '#2563EB' },
  green:  { bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-800',   icon: CheckCircle,   iconColor: '#16A34A' },
};

export default function AlertBanner({ variant = 'teal', title, message, onDismiss }: AlertBannerProps) {
  const cfg = variantConfig[variant];
  const Icon = cfg.icon;

  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${cfg.bg} ${cfg.border}`}>
      <Icon size={16} style={{ color: cfg.iconColor, flexShrink: 0, marginTop: 2 }} />
      <div className="flex-1 min-w-0">
        {title && <p className={`text-sm font-semibold ${cfg.text}`}>{title}</p>}
        <p className={`text-sm ${title ? 'text-text-muted mt-0.5' : cfg.text}`}>{message}</p>
      </div>
      {onDismiss && (
        <button onClick={onDismiss} className="text-text-dim hover:text-text transition-colors flex-shrink-0">
          <X size={14} />
        </button>
      )}
    </div>
  );
}
