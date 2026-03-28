import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FlaskConical, Cpu, TestTube, Users, AlertTriangle, Award, Package, Clock, RefreshCw } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import api from '@/lib/api';
import StatCard from '@/components/ui/StatCard';
import ChartCard from '@/components/ui/ChartCard';
import PillBadge from '@/components/ui/PillBadge';
import PageHeader from '@/components/ui/PageHeader';
import AlertBanner from '@/components/ui/AlertBanner';
import { CardSkeleton, ChartSkeleton } from '@/components/ui/LoadingSkeleton';
import { format, differenceInDays } from 'date-fns';

type DateRange = '30d' | '3m' | '6m' | '12m';

const dateRanges: { label: string; value: DateRange }[] = [
  { label: 'Last 30 Days', value: '30d' },
  { label: '3 Months', value: '3m' },
  { label: '6 Months', value: '6m' },
  { label: '12 Months', value: '12m' },
];

const TEAL = '#C49A2C';
const TEAL_L = '#DDB84A';
const ORANGE = '#D97706';
const RED = '#DC2626';
const BLUE = '#2563EB';
const GREEN = '#16A34A';

const KPI_ICONS = [FlaskConical, Cpu, TestTube, Users, AlertTriangle, Award, Package, Clock];
const KPI_COLORS = [TEAL, BLUE, '#7C3AED', '#0891B2', RED, ORANGE, '#D97706', '#6B7280'];

const urgencyColor = { critical: RED, high: ORANGE, medium: TEAL, low: GREEN };

export default function Dashboard() {
  const [dateRange, setDateRange] = useState<DateRange>('12m');

  const { data: kpis, isLoading: kpisLoading } = useQuery({
    queryKey: ['dashboard', 'kpis'],
    queryFn: () => api.get('/dashboard/kpis').then((r) => r.data.data),
    staleTime: 60000,
  });

  const { data: trends, isLoading: trendsLoading } = useQuery({
    queryKey: ['dashboard', 'trends', dateRange],
    queryFn: () => api.get(`/dashboard/trends?range=${dateRange}`).then((r) => r.data.data),
    staleTime: 300000,
  });

  const { data: upcoming, isLoading: upcomingLoading } = useQuery({
    queryKey: ['dashboard', 'upcoming'],
    queryFn: () => api.get('/dashboard/upcoming').then((r) => r.data.data),
  });

  const { data: equipmentDist } = useQuery({
    queryKey: ['dashboard', 'equipment-dist'],
    queryFn: () => api.get('/dashboard/equipment-dist').then((r) => r.data.data),
  });

  const { data: certHealth } = useQuery({
    queryKey: ['dashboard', 'cert-health'],
    queryFn: () => api.get('/dashboard/cert-health').then((r) => r.data.data),
  });

  const { data: partnerMap } = useQuery({
    queryKey: ['dashboard', 'partner-map'],
    queryFn: () => api.get('/dashboard/partner-map').then((r) => r.data.data),
  });

  const kpiEntries = kpis
    ? [
        { label: 'Active Labs',        key: 'activeLabs',      icon: KPI_ICONS[0], color: KPI_COLORS[0] },
        { label: 'Equipment Types',    key: 'equipmentTypes',  icon: KPI_ICONS[1], color: KPI_COLORS[1] },
        { label: 'Test Capabilities',  key: 'testCapabilities',icon: KPI_ICONS[2], color: KPI_COLORS[2] },
        { label: 'Partner Labs',       key: 'partnerLabs',     icon: KPI_ICONS[3], color: KPI_COLORS[3] },
        { label: 'Open CAPAs',         key: 'openCapas',       icon: KPI_ICONS[4], color: KPI_COLORS[4] },
        { label: 'Cert Alerts',        key: 'certAlerts',      icon: KPI_ICONS[5], color: KPI_COLORS[5] },
        { label: 'Batches on Hold',    key: 'batchesOnHold',   icon: KPI_ICONS[6], color: KPI_COLORS[6] },
        { label: 'Pending Requests',   key: 'pendingRequests', icon: KPI_ICONS[7], color: KPI_COLORS[7] },
      ]
    : [];

  const certPieData = certHealth
    ? [
        { name: 'Valid', value: certHealth.valid, color: GREEN },
        { name: 'Renewal Due', value: certHealth.renewalDue, color: ORANGE },
        { name: 'Expired', value: certHealth.expired, color: RED },
      ]
    : [];

  const eqPieData = (equipmentDist || []).slice(0, 8).map((e: { type: string; count: number }, i: number) => ({
    name: e.type,
    value: e.count,
    color: [TEAL, TEAL_L, BLUE, ORANGE, RED, '#7C3AED', '#0891B2', '#DB2777'][i % 8],
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Executive Dashboard"
        subtitle="Quality + Lab + Partner Intelligence · March 2025 – March 2026"
        actions={
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-border overflow-hidden">
              {dateRanges.map((r) => (
                <button key={r.value} onClick={() => setDateRange(r.value)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${dateRange === r.value ? 'bg-teal text-white' : 'text-text-muted hover:bg-bg'}`}>
                  {r.label}
                </button>
              ))}
            </div>
            <button onClick={() => window.location.reload()} className="btn-ghost">
              <RefreshCw size={13} /> Refresh
            </button>
          </div>
        }
      />

      {/* Cert expiry alert */}
      {certHealth?.expired > 0 && (
        <AlertBanner variant="red"
          title={`${certHealth.expired} certification${certHealth.expired > 1 ? 's' : ''} expired`}
          message="Immediate action required — expired certifications may affect lab operations and regulatory compliance." />
      )}

      {/* KPI cards — 4 per row × 2 rows */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {kpisLoading
          ? Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)
          : kpiEntries.map((entry) => {
              const kpi = kpis?.[entry.key];
              return (
                <StatCard
                  key={entry.key}
                  label={entry.label}
                  value={kpi?.value ?? 0}
                  sparkline={kpi?.sparkline}
                  trend={Math.abs(kpi?.trend ?? 0)}
                  trendDir={kpi?.trendDir}
                  accentColor={entry.color}
                  icon={<entry.icon size={14} style={{ color: entry.color }} />}
                />
              );
            })}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* CAPA Trend — spans 2 cols */}
        <div className="lg:col-span-2">
          {trendsLoading ? <ChartSkeleton height={240} /> : (
            <ChartCard title="CAPA Monthly Trend" subtitle="Open vs Closed vs Overdue — 12 months" height={240}>
              <ResponsiveContainer>
                <AreaChart data={trends || []} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                  <defs>
                    <linearGradient id="gOpen" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={RED} stopOpacity={0.15} />
                      <stop offset="95%" stopColor={RED} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gClosed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={GREEN} stopOpacity={0.15} />
                      <stop offset="95%" stopColor={GREEN} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#C6D8D8" strokeOpacity={0.5} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#6899A0' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#6899A0' }} width={28} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #C6D8D8' }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="openCapas" name="Open" stroke={RED} fill="url(#gOpen)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="closedCapas" name="Closed" stroke={GREEN} fill="url(#gClosed)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="overdueCapas" name="Overdue" stroke={ORANGE} fill="none" strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
        </div>

        {/* Cert Health Doughnut */}
        <ChartCard title="Certification Health" subtitle="Status breakdown" height={240}>
          <ResponsiveContainer>
            <PieChart>
              <Pie data={certPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={85}
                paddingAngle={3} dataKey="value">
                {certPieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Equipment Distribution */}
        <ChartCard title="Equipment Distribution" subtitle="Instrument types across all labs" height={220}>
          <ResponsiveContainer>
            <PieChart>
              <Pie data={eqPieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${Math.round((percent || 0) * 100)}%`} labelLine={false}>
                {eqPieData.map((e: { color: string }, i: number) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Batch Output */}
        <div className="lg:col-span-2">
          {trendsLoading ? <ChartSkeleton height={220} /> : (
            <ChartCard title="Batch Monthly Output" subtitle="Released vs On Hold per month" height={220}>
              <ResponsiveContainer>
                <BarChart data={trends || []} margin={{ top: 5, right: 10, bottom: 5, left: 0 }} barSize={12}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#C6D8D8" strokeOpacity={0.5} vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#6899A0' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#6899A0' }} width={28} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="batchReleased" name="Released" fill={GREEN} radius={[2, 2, 0, 0]} />
                  <Bar dataKey="batchHold" name="On Hold" fill={ORANGE} radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Upcoming Events */}
        <div className="lg:col-span-2">
          <div className="card p-4">
            <h3 className="font-syne font-semibold text-sm text-text mb-3">Upcoming Events — Next 30 Days</h3>
            {upcomingLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 bg-card2 rounded-lg animate-pulse" />)}
              </div>
            ) : !upcoming?.length ? (
              <p className="text-sm text-text-muted">No upcoming events in the next 30 days.</p>
            ) : (
              <div className="space-y-2">
                {upcoming.slice(0, 8).map((e: { id: string; type: string; title: string; subtitle: string; date: string; urgency: keyof typeof urgencyColor; daysLeft?: number }) => (
                  <div key={e.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-bg/60 hover:bg-bg transition-colors">
                    <div className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: urgencyColor[e.urgency] || TEAL }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-text truncate">{e.title}</p>
                      <p className="text-[10px] text-text-dim">{e.subtitle}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[10px] font-mono text-text-muted">{format(new Date(e.date), 'd MMM')}</p>
                      {e.daysLeft !== undefined && (
                        <span className={`text-[9px] font-semibold ${e.urgency === 'critical' ? 'text-risk-high' : e.urgency === 'high' ? 'text-risk-medium' : 'text-text-dim'}`}>
                          {e.daysLeft === 0 ? 'Today' : `${e.daysLeft}d`}
                        </span>
                      )}
                    </div>
                    <PillBadge value={e.urgency} size="xs" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Partner Map — India SVG */}
        <div className="card p-4">
          <h3 className="font-syne font-semibold text-sm text-text mb-3">Partner Lab Map</h3>
          <div className="relative bg-card2 rounded-xl overflow-hidden" style={{ height: 220 }}>
            {/* Simplified India outline SVG */}
            <svg viewBox="0 0 300 340" className="w-full h-full opacity-20">
              <path d="M150,20 L200,40 L240,80 L260,120 L270,160 L250,200 L230,230 L200,260 L170,280 L150,300 L130,280 L100,260 L70,230 L50,200 L40,160 L50,120 L80,80 L120,40 Z"
                fill="none" stroke="#C49A2C" strokeWidth="1.5" />
            </svg>
            {/* Partner dots */}
            {(partnerMap || []).map((lab: { id: string; name: string; city: string; riskScore: number }) => {
              // Map city to approximate SVG coordinates
              const coords: Record<string, [number, number]> = {
                'Mumbai': [100, 160], 'Pune': [105, 175], 'Bangalore': [130, 210],
                'Hyderabad': [150, 185], 'Chennai': [165, 220], 'Delhi': [155, 100],
                'Ahmedabad': [90, 145], 'Kolkata': [200, 155],
              };
              const [cx, cy] = coords[lab.city] || [150, 170];
              const color = lab.riskScore < 40 ? GREEN : lab.riskScore < 70 ? ORANGE : RED;
              return (
                <div key={lab.id} className="absolute transform -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${(cx / 300) * 100}%`, top: `${(cy / 340) * 100}%` }}
                  title={`${lab.name} · Risk: ${Math.round(lab.riskScore)}`}>
                  <div className="w-3 h-3 rounded-full animate-pulse opacity-80 cursor-pointer"
                    style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }} />
                </div>
              );
            })}
            <div className="absolute bottom-2 left-2 right-2 flex items-center gap-3 text-[9px] text-text-dim">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-risk-low" />Low risk</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-risk-medium" />Medium</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-risk-high" />High</span>
            </div>
          </div>
          <p className="text-xs text-text-muted mt-2">{partnerMap?.length || 0} partner labs mapped</p>
        </div>
      </div>
    </div>
  );
}
