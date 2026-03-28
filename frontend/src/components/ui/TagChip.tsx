import React from 'react';

interface TagChipProps {
  label: string;
  color?: 'teal' | 'blue' | 'orange' | 'purple' | 'gray' | 'green' | 'red';
  onRemove?: () => void;
}

const colorMap = {
  teal:   'bg-teal/10 text-teal-dark border-teal/20',
  blue:   'bg-blue-50 text-blue-700 border-blue-200',
  orange: 'bg-orange-50 text-orange-700 border-orange-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
  gray:   'bg-gray-100 text-gray-600 border-gray-200',
  green:  'bg-green-50 text-green-700 border-green-200',
  red:    'bg-red-50 text-red-700 border-red-200',
};

export default function TagChip({ label, color = 'teal', onRemove }: TagChipProps) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-md border ${colorMap[color]}`}>
      {label}
      {onRemove && (
        <button onClick={onRemove} className="hover:opacity-70 transition-opacity ml-0.5">×</button>
      )}
    </span>
  );
}
