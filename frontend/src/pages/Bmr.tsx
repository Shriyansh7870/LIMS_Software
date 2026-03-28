import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Download, TrendingUp, Package } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area, Legend,
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

interface BatchRecord {
  id: string;
  batchCode: string;
  productName: string;
  productCode: string;
  lab: { name: string };
  status: string;
  batchSize: number;
  unit: string;
  yieldActual: number;
  yieldExpected: number;
  yieldPercent: number;
  startDate: string;
  endDate: string | null;
  releaseDate: string | null;
  operator: string;
  reviewedBy: string | null;
  deviations: number;
  remarks: string | null;
}

export default function Bmr() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<BatchRecord | null>(null);
  const [form, setForm] = useState({
    productName: '', productCode: '', labId: '', batchSize: '', unit: 'kg',
    yieldExpected: '', startDate: '', operator: '',
  });
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['batches', { search, status: statusFilter, page }],
    queryFn: () =>
      api.get('/batches', { params: { search, status: statusFilter, page, limit: 20 } })
        .then((r) => r.data),
  });

  const { data: monthlyOutput, isLoading: outputLoading } = useQuery({
    queryKey: ['batch-monthly-output'],
    queryFn: () => api.get('/batches/monthly-output').then((r) => r.data.data),
    staleTime: 300000,
  });

  const { data: yieldTrend, isLoading: yieldLoading } = useQuery({
    queryKey: ['batch-yield-trend'],
    queryFn: () => api.get('/batches/yield-trend').then((r) => r.data.data),
    staleTime: 300000,
  });

  const { data: labs } = useQuery({
    queryKey: ['labs-list'],
    queryFn: () => api.get('/labs', { params: { limit: 100 } }).then((r) => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (payload: typeof form) => api.post('/batches', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      setShowCreate(false);
    },
  });

  const columns: Column<Record<string, unknown>>[] = [
    { key: 'batchCode', label: 'Batch ID', width: 'w-32',
      render: (row) => <span className="font-mono text-xs text-text-muted">{String(row.batchCode)}</span> },
    { key: 'productName', label: 'Product',
      render: (row) => (
        <div>
          <p className="font-medium text-text text-sm">{String(row.productName)}</p>
          <p className="text-xs font-mono text-text-dim">{String(row.productCode || '—')}</p>
        </div>
      )},
    { key: 'lab', label: 'Lab',
      render: (row) => {
        const lab = row.lab as { name: string } | null;
        return <span className="text-sm text-text">{lab?.name || '—'}</span>;
      }},
    { key: 'status', label: 'Status', render: (row) => <PillBadge value={String(row.status)} showDot /> },
    { key: 'batchSize', label: 'Batch Size',
      render: (row) => (
        <span className="text-sm font-mono">{Number(row.batchSize).toLocaleString()} {String(row.unit)}</span>
      )},
    { key: 'yieldPercent', label: 'Yield', align: 'center',
      render: (row) => {
        const yld = Number(row.yieldPercent);
        return (
          <div className="w-20">
            <p className={`text-xs font-bold text-center mb-0.5 ${yld >= 95 ? 'text-risk-low' : yld >= 90 ? 'text-risk-medium' : 'text-risk-high'}`}>
              {yld.toFixed(1)}%
            </p>
            <ProgressBar value={yld} size="sm" />
          </div>
        );
      }},
    { key: 'startDate', label: 'Start Date',
      render: (row) => <span className="text-xs font-mono">{format(new Date(String(row.startDate)), 'd MMM yyyy')}</span> },
    { key: 'deviations', label: 'Dev', align: 'center',
      render: (row) => {
        const n = Number(row.deviations);
        return n > 0
          ? <span className="text-xs font-bold text-risk-high bg-risk-high/10 px-2 py-0.5 rounded-full">{n}</span>
          : <span className="text-xs text-text-dim">—</span>;
      }},
  ];

  const handleExport = () => {
    const rows = data?.data as BatchRecord[] || [];
    const csv = ['Batch Code,Product,Lab,Status,Batch Size,Unit,Yield %,Start Date'].concat(
      rows.map((b) => `${b.batchCode},"${b.productName}","${b.lab?.name}",${b.status},${b.batchSize},${b.unit},${b.yieldPercent},${b.startDate}`)
    ).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'batch-records.csv'; a.click();
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Batch Manufacturing Records"
        subtitle={`${data?.meta?.total || 0} batch records`}
        actions={
          <>
            <button onClick={handleExport} className="btn-secondary"><Download size={13} /> Export</button>
            <button onClick={() => setShowCreate(true)} className="btn-primary"><Plus size={13} /> New Batch</button>
          </>
        }
      />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {outputLoading ? <ChartSkeleton height={200} /> : (
          <ChartCard title="Monthly Batch Output" subtitle="Batches produced per month" height={200}>
            <ResponsiveContainer>
              <BarChart data={monthlyOutput || []} margin={{ top: 5, right: 20, bottom: 5, left: 0 }} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="#C6D8D8" strokeOpacity={0.5} />
                <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#6899A0' }} />
                <YAxis tick={{ fontSize: 10, fill: '#6899A0' }} width={25} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="count" name="Batches" fill="#C49A2C" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {yieldLoading ? <ChartSkeleton height={200} /> : (
          <ChartCard title="Yield Trend" subtitle="Average yield % per month" height={200}>
            <ResponsiveContainer>
              <AreaChart data={yieldTrend || []} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <defs>
                  <linearGradient id="yieldGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C49A2C" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#C49A2C" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#C6D8D8" strokeOpacity={0.5} />
                <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#6899A0' }} />
                <YAxis domain={[85, 100]} tick={{ fontSize: 10, fill: '#6899A0' }} width={35} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v) => [`${Number(v).toFixed(1)}%`, 'Avg Yield']} />
                <Area type="monotone" dataKey="avgYield" stroke="#C49A2C" strokeWidth={2} fill="url(#yieldGrad)" name="Avg Yield %" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
          <input placeholder="Search batches..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="input pl-8" />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="select w-36">
          <option value="">All Status</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="released">Released</option>
          <option value="rejected">Rejected</option>
          <option value="quarantine">Quarantine</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={(data?.data || []) as Record<string, unknown>[]}
        loading={isLoading}
        onRowClick={(row) => setSelectedBatch(row as unknown as BatchRecord)}
        total={data?.meta?.total}
        page={page}
        pageSize={20}
        onPageChange={setPage}
      />

      {/* Detail Drawer */}
      <SideDrawer isOpen={!!selectedBatch} onClose={() => setSelectedBatch(null)}
        title={selectedBatch?.batchCode || ''} subtitle={selectedBatch?.productName} width={460}>
        {selectedBatch && (
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <PillBadge value={selectedBatch.status} showDot />
              {selectedBatch.deviations > 0 && (
                <span className="text-xs font-semibold text-risk-high bg-risk-high/10 px-2 py-0.5 rounded-full">
                  {selectedBatch.deviations} deviation{selectedBatch.deviations > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Product Code', value: selectedBatch.productCode || '—' },
                { label: 'Lab', value: selectedBatch.lab?.name || '—' },
                { label: 'Batch Size', value: `${selectedBatch.batchSize.toLocaleString()} ${selectedBatch.unit}` },
                { label: 'Yield Expected', value: `${selectedBatch.yieldExpected} ${selectedBatch.unit}` },
                { label: 'Yield Actual', value: `${selectedBatch.yieldActual} ${selectedBatch.unit}` },
                { label: 'Operator', value: selectedBatch.operator || '—' },
                { label: 'Start Date', value: format(new Date(selectedBatch.startDate), 'd MMM yyyy') },
                { label: 'End Date', value: selectedBatch.endDate ? format(new Date(selectedBatch.endDate), 'd MMM yyyy') : '—' },
              ].map((item) => (
                <div key={item.label} className="p-3 bg-bg rounded-lg">
                  <p className="text-xs text-text-muted mb-0.5">{item.label}</p>
                  <p className="text-sm font-medium text-text">{item.value}</p>
                </div>
              ))}
            </div>
            <div className="p-3 bg-bg rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs text-text-muted">Yield</p>
                <p className={`text-sm font-bold ${selectedBatch.yieldPercent >= 95 ? 'text-risk-low' : selectedBatch.yieldPercent >= 90 ? 'text-risk-medium' : 'text-risk-high'}`}>
                  {selectedBatch.yieldPercent.toFixed(2)}%
                </p>
              </div>
              <ProgressBar value={selectedBatch.yieldPercent} size="md" />
            </div>
            {selectedBatch.remarks && (
              <div>
                <p className="text-xs font-semibold text-text-muted mb-1">Remarks</p>
                <p className="text-sm text-text leading-relaxed">{selectedBatch.remarks}</p>
              </div>
            )}
          </div>
        )}
      </SideDrawer>

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Batch Record"
        size="md"
        footer={
          <>
            <button onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
            <button onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending} className="btn-primary">
              {createMutation.isPending ? 'Creating...' : 'Create Batch'}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">Product Name *</label>
            <input className="input" value={form.productName} onChange={(e) => setForm((f) => ({ ...f, productName: e.target.value }))} />
          </div>
          <div>
            <label className="label">Product Code</label>
            <input className="input" value={form.productCode} onChange={(e) => setForm((f) => ({ ...f, productCode: e.target.value }))} />
          </div>
          <div>
            <label className="label">Lab *</label>
            <select className="select" value={form.labId} onChange={(e) => setForm((f) => ({ ...f, labId: e.target.value }))}>
              <option value="">Select lab...</option>
              {(labs || []).map((l: { id: string; name: string }) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Batch Size *</label>
            <input type="number" className="input" value={form.batchSize} onChange={(e) => setForm((f) => ({ ...f, batchSize: e.target.value }))} />
          </div>
          <div>
            <label className="label">Unit</label>
            <select className="select" value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}>
              {['kg', 'L', 'units', 'vials', 'tablets'].map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Expected Yield</label>
            <input type="number" className="input" value={form.yieldExpected} onChange={(e) => setForm((f) => ({ ...f, yieldExpected: e.target.value }))} />
          </div>
          <div>
            <label className="label">Start Date *</label>
            <input type="date" className="input" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
          </div>
          <div className="col-span-2">
            <label className="label">Operator</label>
            <input className="input" value={form.operator} onChange={(e) => setForm((f) => ({ ...f, operator: e.target.value }))} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
