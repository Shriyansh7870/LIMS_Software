import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Calendar, CheckCircle2, Clock, XCircle } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import api from '@/lib/api';
import PageHeader from '@/components/ui/PageHeader';
import DataTable, { Column } from '@/components/ui/DataTable';
import PillBadge from '@/components/ui/PillBadge';
import ChartCard from '@/components/ui/ChartCard';
import Modal from '@/components/ui/Modal';
import SideDrawer from '@/components/ui/SideDrawer';
import { ChartSkeleton } from '@/components/ui/LoadingSkeleton';
import ProgressBar from '@/components/ui/ProgressBar';
import { format } from 'date-fns';

interface Audit {
  id: string;
  auditCode: string;
  lab: { name: string; labCode: string };
  type: string;
  status: string;
  auditDate: string;
  auditorName: string;
  score: number;
  findings: number;
  criticalFindings: number;
  summary: string;
  nextAuditDate: string;
}

const AUDIT_TYPES = ['internal', 'external', 'regulatory', 'supplier', 'certification'];

export default function Audits() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState<Audit | null>(null);
  const [form, setForm] = useState({
    labId: '', type: 'internal', auditDate: '', auditorName: '', score: '', findings: '', criticalFindings: '', summary: '', nextAuditDate: '',
  });
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['audits', { search, type: typeFilter, status: statusFilter, page }],
    queryFn: () =>
      api.get('/audits', { params: { search, type: typeFilter, status: statusFilter, page, limit: 20 } })
        .then((r) => r.data),
  });

  const { data: trendData, isLoading: trendLoading } = useQuery({
    queryKey: ['audit-score-trend'],
    queryFn: () => api.get('/audits/score-trend').then((r) => r.data.data),
    staleTime: 300000,
  });

  const { data: calendarData } = useQuery({
    queryKey: ['audit-calendar', year],
    queryFn: () => api.get('/audits/calendar', { params: { year } }).then((r) => r.data.data),
    staleTime: 300000,
  });

  const { data: labs } = useQuery({
    queryKey: ['labs-list'],
    queryFn: () => api.get('/labs', { params: { limit: 100 } }).then((r) => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (payload: typeof form) => api.post('/audits', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audits'] });
      setShowCreate(false);
      setForm({ labId: '', type: 'internal', auditDate: '', auditorName: '', score: '', findings: '', criticalFindings: '', summary: '', nextAuditDate: '' });
    },
  });

  const getScoreColor = (score: number) =>
    score >= 85 ? 'text-risk-low' : score >= 70 ? 'text-risk-medium' : 'text-risk-high';

  const columns: Column<Record<string, unknown>>[] = [
    { key: 'auditCode', label: 'Code', width: 'w-28',
      render: (row) => <span className="font-mono text-xs text-text-muted">{String(row.auditCode)}</span> },
    { key: 'lab', label: 'Lab',
      render: (row) => {
        const lab = row.lab as { name: string; labCode: string } | null;
        return <span className="text-sm text-text">{lab?.name || '—'}</span>;
      }},
    { key: 'type', label: 'Type', render: (row) => <PillBadge value={String(row.type)} /> },
    { key: 'status', label: 'Status', render: (row) => <PillBadge value={String(row.status)} showDot /> },
    { key: 'auditDate', label: 'Audit Date',
      render: (row) => <span className="text-xs font-mono">{format(new Date(String(row.auditDate)), 'd MMM yyyy')}</span> },
    { key: 'score', label: 'Score', align: 'center',
      render: (row) => {
        const score = Number(row.score);
        return (
          <div className="w-20">
            <p className={`text-sm font-bold font-mono text-center ${getScoreColor(score)}`}>{score}</p>
            <ProgressBar value={score} size="sm" />
          </div>
        );
      }},
    { key: 'criticalFindings', label: 'Critical', align: 'center',
      render: (row) => {
        const n = Number(row.criticalFindings);
        return n > 0
          ? <span className="text-xs font-bold text-risk-high bg-risk-high/10 px-2 py-0.5 rounded-full">{n}</span>
          : <span className="text-xs text-text-dim">—</span>;
      }},
    { key: 'auditorName', label: 'Auditor',
      render: (row) => <span className="text-sm text-text">{String(row.auditorName || '—')}</span> },
  ];

  const TREND_COLORS = ['#C49A2C', '#DDB84A', '#A67D16', '#F0D080', '#F5C842', '#6EE7B7', '#A7F3D0'];
  const trendLabs = trendData && trendData.length > 0 ? Object.keys(trendData[0]).filter((k) => k !== 'month') : [];

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Audit Management"
        subtitle={`${data?.meta?.total || 0} audits recorded`}
        actions={
          <button onClick={() => setShowCreate(true)} className="btn-primary"><Plus size={13} /> Schedule Audit</button>
        }
      />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {trendLoading ? <ChartSkeleton height={220} /> : (
          <ChartCard title="Score Trend by Lab" subtitle="Monthly average audit scores" height={220}>
            <ResponsiveContainer>
              <LineChart data={trendData || []} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#C6D8D8" strokeOpacity={0.5} />
                <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#6899A0' }} />
                <YAxis domain={[60, 100]} tick={{ fontSize: 10, fill: '#6899A0' }} width={25} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                {trendLabs.map((lab, i) => (
                  <Line key={lab} type="monotone" dataKey={lab} stroke={TREND_COLORS[i % TREND_COLORS.length]}
                    strokeWidth={2} dot={false} name={lab} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Calendar heatmap */}
        <ChartCard
          title="Audit Calendar"
          subtitle={`Audit activity ${year}`}
          height={220}
          action={
            <div className="flex items-center gap-1">
              <button onClick={() => setYear((y) => y - 1)} className="p-1 hover:bg-bg rounded text-text-muted text-xs">◀</button>
              <span className="text-xs font-mono text-text-muted w-12 text-center">{year}</span>
              <button onClick={() => setYear((y) => y + 1)} className="p-1 hover:bg-bg rounded text-text-muted text-xs">▶</button>
            </div>
          }
        >
          <div className="grid grid-cols-12 gap-1 h-full items-center pt-2">
            {MONTHS.map((month, idx) => {
              const monthData = calendarData?.find((d: { month: number; count: number; avgScore: number }) => d.month === idx + 1);
              const count = monthData?.count || 0;
              const avg = monthData?.avgScore || 0;
              return (
                <div key={month} className="flex flex-col items-center gap-1">
                  <div
                    className="w-full aspect-square rounded flex items-center justify-center text-[9px] font-bold"
                    style={{
                      backgroundColor: count === 0 ? '#E8F4F4' : avg >= 85 ? '#D1FAE5' : avg >= 70 ? '#FEF3C7' : '#FEE2E2',
                      color: count === 0 ? '#9ABCBC' : avg >= 85 ? '#16A34A' : avg >= 70 ? '#D97706' : '#DC2626',
                    }}
                  >
                    {count > 0 ? count : ''}
                  </div>
                  <span className="text-[9px] text-text-dim">{month}</span>
                </div>
              );
            })}
          </div>
        </ChartCard>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
          <input placeholder="Search audits..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="input pl-8" />
        </div>
        <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }} className="select w-36">
          <option value="">All Types</option>
          {AUDIT_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="select w-36">
          <option value="">All Status</option>
          <option value="scheduled">Scheduled</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={(data?.data || []) as Record<string, unknown>[]}
        loading={isLoading}
        onRowClick={(row) => setSelectedAudit(row as unknown as Audit)}
        total={data?.meta?.total}
        page={page}
        pageSize={20}
        onPageChange={setPage}
      />

      {/* Detail Drawer */}
      <SideDrawer isOpen={!!selectedAudit} onClose={() => setSelectedAudit(null)}
        title={selectedAudit?.auditCode || ''} subtitle={`${selectedAudit?.lab?.name} · ${selectedAudit?.type}`} width={460}>
        {selectedAudit && (
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <PillBadge value={selectedAudit.status} showDot />
              <PillBadge value={selectedAudit.type} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-bg rounded-lg">
                <p className="text-xs text-text-muted">Audit Date</p>
                <p className="text-sm font-mono mt-0.5">{format(new Date(selectedAudit.auditDate), 'd MMM yyyy')}</p>
              </div>
              <div className="p-3 bg-bg rounded-lg">
                <p className="text-xs text-text-muted">Score</p>
                <p className={`text-2xl font-bold font-syne mt-0.5 ${getScoreColor(selectedAudit.score)}`}>{selectedAudit.score}</p>
              </div>
              <div className="p-3 bg-bg rounded-lg">
                <p className="text-xs text-text-muted">Total Findings</p>
                <p className="text-sm font-semibold mt-0.5">{selectedAudit.findings}</p>
              </div>
              <div className="p-3 bg-bg rounded-lg">
                <p className="text-xs text-text-muted">Critical</p>
                <p className={`text-sm font-semibold mt-0.5 ${selectedAudit.criticalFindings > 0 ? 'text-risk-high' : 'text-risk-low'}`}>
                  {selectedAudit.criticalFindings}
                </p>
              </div>
            </div>
            <div>
              <p className="text-xs text-text-muted mb-1">Auditor</p>
              <p className="text-sm font-medium text-text">{selectedAudit.auditorName || '—'}</p>
            </div>
            {selectedAudit.summary && (
              <div>
                <p className="text-xs font-semibold text-text-muted mb-1">Summary</p>
                <p className="text-sm text-text leading-relaxed">{selectedAudit.summary}</p>
              </div>
            )}
            {selectedAudit.nextAuditDate && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-teal/5 border border-teal/20">
                <Calendar size={14} className="text-teal flex-shrink-0" />
                <p className="text-xs text-teal">Next audit: <span className="font-semibold">{format(new Date(selectedAudit.nextAuditDate), 'd MMM yyyy')}</span></p>
              </div>
            )}
          </div>
        )}
      </SideDrawer>

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Schedule Audit"
        subtitle="Record a new audit" size="lg"
        footer={
          <>
            <button onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
            <button onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending} className="btn-primary">
              {createMutation.isPending ? 'Saving...' : 'Save Audit'}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Lab *</label>
            <select className="select" value={form.labId} onChange={(e) => setForm((f) => ({ ...f, labId: e.target.value }))}>
              <option value="">Select lab...</option>
              {(labs || []).map((l: { id: string; name: string }) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Audit Type *</label>
            <select className="select" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
              {AUDIT_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Audit Date *</label>
            <input type="date" className="input" value={form.auditDate} onChange={(e) => setForm((f) => ({ ...f, auditDate: e.target.value }))} />
          </div>
          <div>
            <label className="label">Auditor Name</label>
            <input className="input" value={form.auditorName} onChange={(e) => setForm((f) => ({ ...f, auditorName: e.target.value }))} />
          </div>
          <div>
            <label className="label">Score (0–100)</label>
            <input type="number" className="input" min="0" max="100" value={form.score} onChange={(e) => setForm((f) => ({ ...f, score: e.target.value }))} />
          </div>
          <div>
            <label className="label">Total Findings</label>
            <input type="number" className="input" min="0" value={form.findings} onChange={(e) => setForm((f) => ({ ...f, findings: e.target.value }))} />
          </div>
          <div>
            <label className="label">Critical Findings</label>
            <input type="number" className="input" min="0" value={form.criticalFindings} onChange={(e) => setForm((f) => ({ ...f, criticalFindings: e.target.value }))} />
          </div>
          <div>
            <label className="label">Next Audit Date</label>
            <input type="date" className="input" value={form.nextAuditDate} onChange={(e) => setForm((f) => ({ ...f, nextAuditDate: e.target.value }))} />
          </div>
          <div className="col-span-2">
            <label className="label">Summary</label>
            <textarea className="input resize-none" rows={3} value={form.summary}
              onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))} placeholder="Audit summary and key observations..." />
          </div>
        </div>
      </Modal>
    </div>
  );
}
