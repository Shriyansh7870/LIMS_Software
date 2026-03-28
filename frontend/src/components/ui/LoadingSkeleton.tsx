import React from 'react';

export function CardSkeleton() {
  return (
    <div className="card p-4 animate-pulse">
      <div className="h-2 w-2/3 bg-card2 rounded mb-3" />
      <div className="h-7 w-1/2 bg-card2 rounded mb-2" />
      <div className="h-10 w-full bg-card2 rounded" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="card overflow-hidden animate-pulse">
      <div className="h-11 bg-card2 border-b border-border" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-border last:border-0">
          <div className="h-3 w-24 bg-card2 rounded" />
          <div className="h-3 flex-1 bg-card2 rounded" />
          <div className="h-3 w-16 bg-card2 rounded" />
          <div className="h-5 w-14 bg-card2 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton({ height = 240 }: { height?: number }) {
  return (
    <div className="card p-4 animate-pulse">
      <div className="h-3 w-1/3 bg-card2 rounded mb-1" />
      <div className="h-2 w-1/4 bg-card2 rounded mb-4" />
      <div className="bg-card2 rounded-lg" style={{ height }} />
    </div>
  );
}

export default function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-6 w-48 bg-card2 rounded" />
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
      </div>
      <TableSkeleton />
    </div>
  );
}
