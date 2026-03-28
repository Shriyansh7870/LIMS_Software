import React, { useState } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { TableSkeleton } from './LoadingSkeleton';
import EmptyState from './EmptyState';

export interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps<T extends Record<string, unknown>> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  onRowClick?: (row: T) => void;
  pageSize?: number;
  total?: number;
  page?: number;
  onPageChange?: (page: number) => void;
  keyField?: string;
  emptyMessage?: string;
}

export default function DataTable<T extends Record<string, unknown>>({
  columns, data, loading = false, onRowClick, pageSize = 20, total, page = 1, onPageChange,
  keyField = 'id', emptyMessage = 'No records found',
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  if (loading) return <TableSkeleton rows={pageSize > 10 ? 8 : pageSize} />;

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const sorted = sortKey
    ? [...data].sort((a, b) => {
        const av = a[sortKey as keyof T];
        const bv = b[sortKey as keyof T];
        const cmp = String(av || '').localeCompare(String(bv || ''), undefined, { numeric: true });
        return sortDir === 'asc' ? cmp : -cmp;
      })
    : data;

  const totalPages = total ? Math.ceil(total / pageSize) : undefined;

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-bg/50">
              {columns.map((col) => (
                <th key={String(col.key)}
                  className={`px-4 py-3 text-left font-semibold text-xs text-text-muted uppercase tracking-wide whitespace-nowrap ${col.width || ''} ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : ''}`}
                >
                  {col.sortable ? (
                    <button onClick={() => handleSort(String(col.key))}
                      className="flex items-center gap-1 hover:text-text transition-colors">
                      {col.label}
                      {sortKey === String(col.key)
                        ? sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                        : <ChevronsUpDown size={12} className="text-text-dim" />}
                    </button>
                  ) : col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <EmptyState description={emptyMessage} />
                </td>
              </tr>
            ) : (
              sorted.map((row, i) => (
                <tr key={String(row[keyField as keyof T]) || i}
                  onClick={() => onRowClick?.(row)}
                  className={`border-b border-border/50 last:border-0 transition-colors hover:bg-bg/70 ${onRowClick ? 'cursor-pointer' : ''}`}
                >
                  {columns.map((col) => (
                    <td key={String(col.key)}
                      className={`px-4 py-3 text-text ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : ''}`}>
                      {col.render ? col.render(row) : String(row[col.key as keyof T] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages && totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-bg/30">
          <p className="text-xs text-text-muted">
            Page {page} of {totalPages} · {total} total
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => onPageChange?.(page - 1)} disabled={page <= 1}
              className="btn-ghost p-1 disabled:opacity-40">
              <ChevronLeft size={14} />
            </button>
            <button onClick={() => onPageChange?.(page + 1)} disabled={page >= totalPages}
              className="btn-ghost p-1 disabled:opacity-40">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
