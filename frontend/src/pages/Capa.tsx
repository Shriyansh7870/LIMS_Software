import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, AlertTriangle, Download } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, Cell,
} from 'recharts';
import api from '@/lib/api';
import PageHeader from '@/components/ui/PageHeader';
import DataTable, { Column } from '@/components/ui/DataTable';
import PillBadge from '@/components/ui/PillBadge';
import ChartCard from '@/components/ui/ChartCard';
import Modal from '@/components/ui/Modal';
import { ChartSkeleton } from '@/components/ui/LoadingSkeleton';
import { format, differenceInDays } from 'date-fns';

interface Capa {
  id: string;
  capaCode: string;
  source: string;
  product: string;
  batchNo: string;
  severity: string;
  status: string;
  owner?: { name: string };
  dueDate: string;
  daysOverdue: number;
  title: string;
  description: string;
  rootCause: string;
  actionPlan: string;
  createdAt: string;
}

export default function Capa() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedCapa, setSelectedCapa] = useState<Capa | null>(null);
  const [form, setForm] = useState({ title: '', source: '', product: '', severity: 'major', description: '', dueDate: '', department: '' });
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['capass', { search, status: statusFilter, severity: severityFilter, page }],
    queryFn: () =>
      api.get('/capa', { params: { search, status: statusFilter, severity: severityFilter, page, limit: 20 } })
        .then((r) => r.data),
  });

  const { data: trendData, isLoading: trendLoading } = useQuery({
    queryKey: ['capa-trend'],
    queryFn: () => api.get('/capa/monthly-trend').then((r) => r.data.data),
    staleTime: 300000,
  });

  const { data: severityData } = useQuery({
    queryKey: ['capa-severity'],
    queryFn: () => api.get('/capa/by-severity').then((r) => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (payload: typeof form) => api.post('/capa', { ...payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capass'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setShowCreate(false);
      setForm({ title: '', source: '', product: '', severity: 'major', description: '', dueDate: '', department: '' });
    },
  });

  const columns: Column<Record<string, unknown>>[] = [
    { key: 'capaCode', label: 'ID', width: 'w-28',
      render: (row) => <span className="font-mono text-xs text-text-muted">{String(row.capaCode)}</span> },
    { key: 'title', label: 'Title',
      render: (row) => (
        <div>
          <p className="font-medium text-text text-sm truncate max-w-xs">{String(row.title)}</p>
          <p className="text-xs text-text-dim">{String(row.source)} · {String(row.product || '—')}</p>
        </div>
      )},
    { key: 'severity', label: 'Severity',
      render: (row) => <PillBadge value={String(row.severity)} /> },
    { key: 'status', label: 'Status',
      render: (row) => <PillBadge value={String(row.status)} showDot /> },
    { key: 'owner', label: 'Owner',
      render: (row) => {
        const owner = row.owner as { name: string } | null;
        return <span className="text-xs text-text-muted">{owner?.name || '—'}</span>;
      }},
    { key: 'dueDate', label: 'Due Date',
      render: (row) => {
        const daysOverdue = Number(row.daysOverdue);
        return (
          <div>
            <p className="text-xs font-mono">{format(new Date(String(row.dueDate)), 'd MMM yyyy')}</p>
            {daysOverdue > 0 && (
              <p className="text-[10px] text-risk-high font-semibold">{daysOverdue}d overdue</p>
            )}
          </div>
        );
      }},
  ];

  const handleExport = () => {
    const rows = data?.data as Capa[] || [];
    const csv = ['ID,Title,Source,Severity,Status,Owner,Due Date'].concat(
      rows.map((c) => `${c.capaCode},"${c.title}",${c.source},${c.severity},${c.status},${c.owner?.name || ''},${c.dueDate}`)
    ).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'capa-list.csv'; a.click();
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="CAPA / Deviations"
        subtitle={`${data?.meta?.total || 0} total records · Active quality events`}
        actions={
          <>
            <button onClick={handleExport} className="btn-secondary"><Download size={13} /> Export</button>
            <button onClick={() => setShowCreate(true)} className="btn-primary"><Plus size={13} /> New CAPA</button>
          </>
        }
      />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          {trendLoading ? <ChartSkeleton height={200} /> : (
            <ChartCard title="12-Month CAPA Trend" subtitle="Open / Closed / Overdue" height={200}>
              <ResponsiveContainer>
                <AreaChart data={trendData || []} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                  <defs>
                    <linearGradient id="gOv2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#DC2626" stopOpacity={0.15} /><stop offset="95%" stopColor="#DC2626" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gCv2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16A34A" stopOpacity={0.15} /><stop offset="95%" stopColor="#16A34A" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#C6D8D8" strokeOpacity={0.5} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#6899A0' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#6899A0' }} width={25} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="open" name="Open" stroke="#DC2626" fill="url(#gOv2)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="closed" name="Closed" stroke="#16A34A" fill="url(#gCv2)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="overdue" name="Overdue" stroke="#D97706" fill="none" strokeDasharray="4 2" strokeWidth={1.5} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
        </div>
        <ChartCard title="By Severity" subtitle="Open CAPAs breakdown" height={200}>
          <ResponsiveContainer>
            <BarChart data={severityData || []} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 10 }} barSize={14}>
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="severity" tick={{ fontSize: 10 }} width={70} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="count" name="Count" radius={[0, 2, 2, 0]}>
                {(severityData || []).map((entry: { color: string }, i: number) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
          <input placeholder="Search CAPAs..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="input pl-8" />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="select w-36">
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="overdue">Overdue</option>
          <option value="closed">Closed</option>
        </select>
        <select value={severityFilter} onChange={(e) => { setSeverityFilter(e.target.value); setPage(1); }} className="select w-36">
          <option value="">All Severity</option>
          <option value="critical">Critical</option>
          <option value="major">Major</option>
          <option value="minor">Minor</option>
          <option value="observation">Observation</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={(data?.data || []) as Record<string, unknown>[]}
        loading={isLoading}
        onRowClick={(row) => setSelectedCapa(row as unknown as Capa)}
        total={data?.meta?.total}
        page={page}
        onPageChange={setPage}
      />

      {/* Create CAPA Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create New CAPA"
        subtitle="Corrective & Preventive Action record" size="lg"
        footer={
          <>
            <button onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
            <button onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending} className="btn-primary">
              {createMutation.isPending ? 'Creating...' : 'Create CAPA'}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">Title *</label>
            <input className="input" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="CAPA title..." />
          </div>
          <div>
            <label className="label">Source</label>
            <select className="select" value={form.source} onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}>
              <option value="">Select source...</option>
              {['Manufacturing', 'QC Testing', 'Audit Finding', 'Customer Complaint', 'OOS Result', 'Equipment Failure'].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Severity *</label>
            <select className="select" value={form.severity} onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value }))}>
              <option value="observation">Observation</option>
              <option value="minor">Minor</option>
              <option value="major">Major</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div>
            <label className="label">Product / Batch</label>
            <input className="input" value={form.product} onChange={(e) => setForm((f) => ({ ...f, product: e.target.value }))} placeholder="Product name..." />
          </div>
          <div>
            <label className="label">Due Date *</label>
            <input type="date" className="input" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} />
          </div>
          <div className="col-span-2">
            <label className="label">Description *</label>
            <textarea className="input resize-none" rows={3} value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Describe the deviation..." />
          </div>
        </div>
      </Modal>

      {/* CAPA Detail Modal */}
      <Modal isOpen={!!selectedCapa} onClose={() => setSelectedCapa(null)} title={selectedCapa?.capaCode || ''}
        subtitle={selectedCapa?.title} size="lg">
        {selectedCapa && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-bg rounded-lg"><p className="text-xs text-text-muted">Severity</p><PillBadge value={selectedCapa.severity} /></div>
              <div className="p-3 bg-bg rounded-lg"><p className="text-xs text-text-muted">Status</p><PillBadge value={selectedCapa.status} showDot /></div>
              <div className="p-3 bg-bg rounded-lg"><p className="text-xs text-text-muted">Due</p><p className="text-sm font-mono mt-0.5">{format(new Date(selectedCapa.dueDate), 'd MMM yyyy')}</p></div>
            </div>
            <div>
              <p className="text-xs font-semibold text-text-muted mb-1">Description</p>
              <p className="text-sm text-text leading-relaxed">{selectedCapa.description}</p>
            </div>
            {selectedCapa.rootCause && (
              <div>
                <p className="text-xs font-semibold text-text-muted mb-1">Root Cause</p>
                <p className="text-sm text-text leading-relaxed">{selectedCapa.rootCause}</p>
              </div>
            )}
            {selectedCapa.actionPlan && (
              <div>
                <p className="text-xs font-semibold text-text-muted mb-1">Action Plan</p>
                <p className="text-sm text-text leading-relaxed">{selectedCapa.actionPlan}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
