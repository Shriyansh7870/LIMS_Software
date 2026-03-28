import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Download, Award, AlertTriangle } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import api from '@/lib/api';
import PageHeader from '@/components/ui/PageHeader';
import DataTable, { Column } from '@/components/ui/DataTable';
import PillBadge from '@/components/ui/PillBadge';
import ChartCard from '@/components/ui/ChartCard';
import Modal from '@/components/ui/Modal';
import { ChartSkeleton } from '@/components/ui/LoadingSkeleton';
import { format, differenceInDays } from 'date-fns';

interface Cert {
  id: string;
  certCode: string;
  name: string;
  body: string;
  type: string;
  lab: { name: string; labCode: string };
  status: string;
  issueDate: string;
  expiryDate: string;
  daysLeft: number;
  nextAuditDate: string;
  scope: string;
}

export default function Certifications() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedCert, setSelectedCert] = useState<Cert | null>(null);
  const [form, setForm] = useState({
    name: '', body: '', type: '', labId: '',
    issueDate: '', expiryDate: '', scope: '',
  });
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['certs', { search, status: statusFilter, type: typeFilter, page }],
    queryFn: () =>
      api.get('/certifications', { params: { search, status: statusFilter, type: typeFilter, page, limit: 20 } })
        .then((r) => r.data),
  });

  const { data: labs } = useQuery({
    queryKey: ['labs-list'],
    queryFn: () => api.get('/labs', { params: { limit: 100 } }).then((r) => r.data.data),
  });

  const { data: healthData, isLoading: healthLoading } = useQuery({
    queryKey: ['cert-health-chart'],
    queryFn: () => api.get('/certifications/health-chart').then((r) => r.data.data),
    staleTime: 300000,
  });

  const { data: timelineData } = useQuery({
    queryKey: ['cert-expiry-timeline'],
    queryFn: () => api.get('/certifications/expiry-timeline').then((r) => r.data.data),
    staleTime: 300000,
  });

  const createMutation = useMutation({
    mutationFn: (payload: typeof form) => api.post('/certifications', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setShowCreate(false);
      setForm({ name: '', body: '', type: '', labId: '', issueDate: '', expiryDate: '', scope: '' });
    },
  });

  const getDaysLeftColor = (days: number) => {
    if (days < 0) return 'text-risk-high font-semibold';
    if (days <= 30) return 'text-risk-high';
    if (days <= 90) return 'text-risk-medium';
    return 'text-risk-low';
  };

  const columns: Column<Record<string, unknown>>[] = [
    { key: 'certCode', label: 'Cert ID', width: 'w-28',
      render: (row) => <span className="font-mono text-xs text-text-muted">{String(row.certCode)}</span> },
    { key: 'name', label: 'Certification',
      render: (row) => (
        <div>
          <p className="font-medium text-text text-sm">{String(row.name)}</p>
          <p className="text-xs text-text-dim">{String(row.body)} · {String(row.type)}</p>
        </div>
      )},
    { key: 'lab', label: 'Lab',
      render: (row) => {
        const lab = row.lab as { name: string; labCode: string } | null;
        return <span className="text-sm text-text">{lab?.name || '—'}</span>;
      }},
    { key: 'status', label: 'Status', render: (row) => <PillBadge value={String(row.status)} showDot /> },
    { key: 'expiryDate', label: 'Expiry',
      render: (row) => {
        const daysLeft = Number(row.daysLeft);
        return (
          <div>
            <p className="text-xs font-mono">{format(new Date(String(row.expiryDate)), 'd MMM yyyy')}</p>
            <p className={`text-[10px] font-semibold ${getDaysLeftColor(daysLeft)}`}>
              {daysLeft < 0 ? `${Math.abs(daysLeft)}d expired` : `${daysLeft}d left`}
            </p>
          </div>
        );
      }},
    { key: 'nextAuditDate', label: 'Next Audit',
      render: (row) => (
        <span className="text-xs font-mono text-text-muted">
          {row.nextAuditDate ? format(new Date(String(row.nextAuditDate)), 'd MMM yyyy') : '—'}
        </span>
      )},
  ];

  const handleExport = () => {
    const rows = data?.data as Cert[] || [];
    const csv = ['Code,Name,Body,Type,Lab,Status,Issue Date,Expiry Date,Days Left'].concat(
      rows.map((c) => `${c.certCode},"${c.name}",${c.body},${c.type},"${c.lab?.name}",${c.status},${c.issueDate},${c.expiryDate},${c.daysLeft}`)
    ).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'certifications.csv'; a.click();
  };

  const HEALTH_COLORS: Record<string, string> = {
    valid: '#16A34A', renewal_due: '#D97706', expired: '#DC2626', suspended: '#6B7280',
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Certifications"
        subtitle={`${data?.meta?.total || 0} certifications monitored`}
        actions={
          <>
            <button onClick={handleExport} className="btn-secondary"><Download size={13} /> Export</button>
            <button onClick={() => setShowCreate(true)} className="btn-primary"><Plus size={13} /> Add Cert</button>
          </>
        }
      />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {healthLoading ? <ChartSkeleton height={200} /> : (
          <ChartCard title="Certification Health" subtitle="Status breakdown by lab" height={200}>
            <ResponsiveContainer>
              <BarChart data={healthData || []} margin={{ top: 5, right: 20, bottom: 5, left: 0 }} barSize={14}>
                <CartesianGrid strokeDasharray="3 3" stroke="#C6D8D8" strokeOpacity={0.5} />
                <XAxis dataKey="lab" tick={{ fontSize: 9, fill: '#6899A0' }} />
                <YAxis tick={{ fontSize: 10, fill: '#6899A0' }} width={25} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="valid" name="Valid" stackId="a" fill="#16A34A" radius={[0, 0, 0, 0]} />
                <Bar dataKey="renewal_due" name="Renewal Due" stackId="a" fill="#D97706" />
                <Bar dataKey="expired" name="Expired" stackId="a" fill="#DC2626" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        <ChartCard title="12-Month Expiry Timeline" subtitle="Certs expiring per month" height={200}>
          <ResponsiveContainer>
            <BarChart data={timelineData || []} margin={{ top: 5, right: 20, bottom: 5, left: 0 }} barSize={18}>
              <CartesianGrid strokeDasharray="3 3" stroke="#C6D8D8" strokeOpacity={0.5} />
              <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#6899A0' }} />
              <YAxis tick={{ fontSize: 10, fill: '#6899A0' }} width={25} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="count" name="Expiring" radius={[3, 3, 0, 0]}>
                {(timelineData || []).map((entry: { urgent: boolean }, i: number) => (
                  <Cell key={i} fill={entry.urgent ? '#DC2626' : '#C49A2C'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Alert for expiring soon */}
      {(data?.data as Cert[] || []).some((c) => c.daysLeft >= 0 && c.daysLeft <= 30) && (
        <div className="flex items-start gap-3 p-3 rounded-xl bg-risk-high/5 border border-risk-high/20">
          <AlertTriangle size={15} className="text-risk-high mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-risk-high">Certifications expiring within 30 days</p>
            <p className="text-xs text-text-muted mt-0.5">
              {(data?.data as Cert[] || []).filter((c) => c.daysLeft >= 0 && c.daysLeft <= 30).map((c) => c.name).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
          <input placeholder="Search certifications..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="input pl-8" />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="select w-36">
          <option value="">All Status</option>
          <option value="valid">Valid</option>
          <option value="renewal_due">Renewal Due</option>
          <option value="expired">Expired</option>
          <option value="suspended">Suspended</option>
        </select>
        <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }} className="select w-36">
          <option value="">All Types</option>
          <option value="ISO">ISO</option>
          <option value="GMP">GMP</option>
          <option value="NABL">NABL</option>
          <option value="WHO">WHO</option>
          <option value="FDA">FDA</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={(data?.data || []) as Record<string, unknown>[]}
        loading={isLoading}
        onRowClick={(row) => setSelectedCert(row as unknown as Cert)}
        total={data?.meta?.total}
        page={page}
        pageSize={20}
        onPageChange={setPage}
      />

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Add Certification"
        subtitle="Register a new certification" size="lg"
        footer={
          <>
            <button onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
            <button onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending} className="btn-primary">
              {createMutation.isPending ? 'Adding...' : 'Add Certification'}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">Certification Name *</label>
            <input className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. ISO 9001:2015" />
          </div>
          <div>
            <label className="label">Certifying Body</label>
            <input className="input" value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} placeholder="e.g. Bureau Veritas" />
          </div>
          <div>
            <label className="label">Type</label>
            <select className="select" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
              <option value="">Select type...</option>
              {['ISO', 'GMP', 'NABL', 'WHO', 'FDA', 'Other'].map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Lab *</label>
            <select className="select" value={form.labId} onChange={(e) => setForm((f) => ({ ...f, labId: e.target.value }))}>
              <option value="">Select lab...</option>
              {(labs || []).map((l: { id: string; name: string }) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Issue Date *</label>
            <input type="date" className="input" value={form.issueDate} onChange={(e) => setForm((f) => ({ ...f, issueDate: e.target.value }))} />
          </div>
          <div>
            <label className="label">Expiry Date *</label>
            <input type="date" className="input" value={form.expiryDate} onChange={(e) => setForm((f) => ({ ...f, expiryDate: e.target.value }))} />
          </div>
          <div className="col-span-2">
            <label className="label">Scope</label>
            <textarea className="input resize-none" rows={2} value={form.scope}
              onChange={(e) => setForm((f) => ({ ...f, scope: e.target.value }))} placeholder="Certification scope..." />
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal isOpen={!!selectedCert} onClose={() => setSelectedCert(null)}
        title={selectedCert?.name || ''} subtitle={selectedCert?.certCode} size="md">
        {selectedCert && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-bg rounded-lg"><p className="text-xs text-text-muted">Status</p><PillBadge value={selectedCert.status} showDot /></div>
              <div className="p-3 bg-bg rounded-lg"><p className="text-xs text-text-muted">Type</p><p className="text-sm font-medium text-text mt-0.5">{selectedCert.type}</p></div>
              <div className="p-3 bg-bg rounded-lg"><p className="text-xs text-text-muted">Issued</p><p className="text-sm font-mono mt-0.5">{format(new Date(selectedCert.issueDate), 'd MMM yyyy')}</p></div>
              <div className="p-3 bg-bg rounded-lg">
                <p className="text-xs text-text-muted">Expires</p>
                <p className={`text-sm font-mono mt-0.5 ${getDaysLeftColor(selectedCert.daysLeft)}`}>
                  {format(new Date(selectedCert.expiryDate), 'd MMM yyyy')}
                </p>
                <p className={`text-[10px] mt-0.5 ${getDaysLeftColor(selectedCert.daysLeft)}`}>
                  {selectedCert.daysLeft < 0 ? `${Math.abs(selectedCert.daysLeft)}d expired` : `${selectedCert.daysLeft}d remaining`}
                </p>
              </div>
            </div>
            <div className="p-3 bg-bg rounded-lg">
              <p className="text-xs text-text-muted mb-1">Certifying Body</p>
              <p className="text-sm font-medium text-text">{selectedCert.body}</p>
            </div>
            {selectedCert.scope && (
              <div>
                <p className="text-xs font-semibold text-text-muted mb-1">Scope</p>
                <p className="text-sm text-text leading-relaxed">{selectedCert.scope}</p>
              </div>
            )}
            {selectedCert.nextAuditDate && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-teal/5 border border-teal/20">
                <Award size={14} className="text-teal flex-shrink-0" />
                <p className="text-xs text-teal">
                  Next surveillance audit: <span className="font-semibold">{format(new Date(selectedCert.nextAuditDate), 'd MMM yyyy')}</span>
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
