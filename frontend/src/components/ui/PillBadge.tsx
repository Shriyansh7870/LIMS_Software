import React from 'react';

type PillVariant =
  | 'active' | 'inactive' | 'suspended' | 'under_review'
  | 'valid' | 'renewal_due' | 'expired' | 'pending'
  | 'open' | 'in_progress' | 'closed' | 'overdue' | 'pending_verification'
  | 'critical' | 'major' | 'minor' | 'observation'
  | 'completed' | 'scheduled' | 'cancelled'
  | 'approved' | 'draft' | 'under_review' | 'obsolete'
  | 'released' | 'qc_hold' | 'rejected' | 'pending_release'
  | 'connected' | 'planned' | 'disconnected' | 'error'
  | 'high' | 'medium' | 'low' | 'urgent'
  | string;

const variantMap: Record<string, { bg: string; text: string; dot?: string }> = {
  // Status
  active:               { bg: 'bg-teal/10',         text: 'text-teal-dark',    dot: 'bg-teal' },
  inactive:             { bg: 'bg-gray-100',         text: 'text-gray-600' },
  suspended:            { bg: 'bg-red-100',          text: 'text-red-700' },
  under_review:         { bg: 'bg-blue-100',         text: 'text-blue-700' },
  // Cert
  valid:                { bg: 'bg-green-100',        text: 'text-green-700',    dot: 'bg-green-500' },
  renewal_due:          { bg: 'bg-orange-100',       text: 'text-orange-700' },
  expired:              { bg: 'bg-red-100',          text: 'text-red-700' },
  pending:              { bg: 'bg-gray-100',         text: 'text-gray-600' },
  // CAPA
  open:                 { bg: 'bg-blue-100',         text: 'text-blue-700',     dot: 'bg-blue-500' },
  in_progress:          { bg: 'bg-teal/10',          text: 'text-teal-dark' },
  closed:               { bg: 'bg-gray-100',         text: 'text-gray-600' },
  overdue:              { bg: 'bg-red-100',          text: 'text-red-700',      dot: 'bg-red-500' },
  pending_verification: { bg: 'bg-purple-100',       text: 'text-purple-700' },
  // Severity
  critical:             { bg: 'bg-red-100',          text: 'text-red-700' },
  major:                { bg: 'bg-orange-100',       text: 'text-orange-700' },
  minor:                { bg: 'bg-blue-100',         text: 'text-blue-700' },
  observation:          { bg: 'bg-gray-100',         text: 'text-gray-600' },
  // Audit
  completed:            { bg: 'bg-green-100',        text: 'text-green-700' },
  scheduled:            { bg: 'bg-blue-100',         text: 'text-blue-700' },
  cancelled:            { bg: 'bg-gray-100',         text: 'text-gray-500' },
  // SOP
  approved:             { bg: 'bg-green-100',        text: 'text-green-700' },
  draft:                { bg: 'bg-gray-100',         text: 'text-gray-600' },
  obsolete:             { bg: 'bg-gray-200',         text: 'text-gray-500' },
  superseded:           { bg: 'bg-gray-100',         text: 'text-gray-500' },
  // Batch
  released:             { bg: 'bg-green-100',        text: 'text-green-700' },
  qc_hold:              { bg: 'bg-orange-100',       text: 'text-orange-700' },
  rejected:             { bg: 'bg-red-100',          text: 'text-red-700' },
  pending_release:      { bg: 'bg-yellow-100',       text: 'text-yellow-700' },
  // Priority
  high:                 { bg: 'bg-red-100',          text: 'text-red-700' },
  medium:               { bg: 'bg-blue-100',         text: 'text-blue-700' },
  low:                  { bg: 'bg-gray-100',         text: 'text-gray-600' },
  urgent:               { bg: 'bg-purple-100',       text: 'text-purple-700' },
  // Integration
  connected:            { bg: 'bg-green-100',        text: 'text-green-700',    dot: 'bg-green-500' },
  planned:              { bg: 'bg-gray-100',         text: 'text-gray-600' },
  disconnected:         { bg: 'bg-gray-200',         text: 'text-gray-500' },
  error:                { bg: 'bg-red-100',          text: 'text-red-700' },
  // Generic
  partner:              { bg: 'bg-purple-100',       text: 'text-purple-700' },
  internal:             { bg: 'bg-teal/10',          text: 'text-teal-dark' },
  contract:             { bg: 'bg-blue-100',         text: 'text-blue-700' },
};

interface PillBadgeProps {
  value: PillVariant;
  label?: string;
  showDot?: boolean;
  size?: 'xs' | 'sm';
}

export default function PillBadge({ value, label, showDot = false, size = 'sm' }: PillBadgeProps) {
  const variant = variantMap[value] || { bg: 'bg-gray-100', text: 'text-gray-600' };
  const displayLabel = label || value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const textSize = size === 'xs' ? 'text-[10px]' : 'text-xs';
  const padding = size === 'xs' ? 'px-1.5 py-px' : 'px-2 py-0.5';

  return (
    <span className={`inline-flex items-center gap-1 ${padding} ${textSize} font-semibold rounded-full ${variant.bg} ${variant.text}`}>
      {showDot && variant.dot && <span className={`w-1.5 h-1.5 rounded-full ${variant.dot}`} />}
      {displayLabel}
    </span>
  );
}
