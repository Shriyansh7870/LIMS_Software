import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer } from 'recharts';

interface StatCardProps {
  label: string;
  value: number | string;
  sparkline?: number[];
  trend?: number;
  trendDir?: 'up' | 'down' | 'flat';
  accentColor?: string;
  icon?: React.ReactNode;
  suffix?: string;
  loading?: boolean;
}

export default function StatCard({
  label, value, sparkline = [], trend, trendDir = 'flat',
  accentColor = '#C49A2C', icon, suffix = '', loading = false,
}: StatCardProps) {
  if (loading) {
    return (
      <div className="card p-4 animate-pulse">
        <div className="h-2 w-3/4 bg-card2 rounded mb-3" />
        <div className="h-7 w-1/2 bg-card2 rounded mb-2" />
        <div className="h-10 w-full bg-card2 rounded" />
      </div>
    );
  }

  const trendColor = trendDir === 'up' ? '#16A34A' : trendDir === 'down' ? '#DC2626' : '#6899A0';
  const TrendIcon = trendDir === 'up' ? TrendingUp : trendDir === 'down' ? TrendingDown : Minus;
  const chartData = sparkline.map((v) => ({ v }));

  return (
    <motion.div
      className="card p-4 card-hover relative overflow-hidden"
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    >
      {/* Accent bar */}
      <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-xl"
        style={{ background: accentColor }} />

      <div className="flex items-start justify-between mb-2">
        <p className="text-xs font-medium text-text-muted leading-tight">{label}</p>
        {icon && <div className="text-text-dim">{icon}</div>}
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className="font-syne font-bold text-2xl text-text leading-none">
            {typeof value === 'number' ? value.toLocaleString() : value}
            {suffix && <span className="text-sm text-text-muted ml-1 font-sans font-normal">{suffix}</span>}
          </p>
          {trend !== undefined && (
            <div className="flex items-center gap-1 mt-1">
              <TrendIcon size={11} style={{ color: trendColor }} />
              <span className="text-xs font-medium" style={{ color: trendColor }}>
                {Math.abs(trend)}% vs last month
              </span>
            </div>
          )}
        </div>

        {chartData.length > 0 && (
          <div className="w-20 h-10">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barSize={4} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <Bar dataKey="v" fill={accentColor} opacity={0.7} radius={[1, 1, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </motion.div>
  );
}
