import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Download, FlaskConical, TrendingUp, IndianRupee } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend,
} from 'recharts';
import api from '@/lib/api';
import PageHeader from '@/components/ui/PageHeader';
import DataTable, { Column } from '@/components/ui/DataTable';
import PillBadge from '@/components/ui/PillBadge';
import ChartCard from '@/components/ui/ChartCard';
import Modal from '@/components/ui/Modal';
import SideDrawer from '@/components/ui/SideDrawer';
import { ChartSkeleton } from '@/components/ui/LoadingSkeleton';
import TagChip from '@/components/ui/TagChip';
import { format } from 'date-fns';

interface TestRequest {
  id: string;
  requestCode: string;
  title: string;
  type: string;
  status: string;
  priority: string;
  lab?: { name: string };
  partner?: { name: string };
  requester: { name: string };
  requestDate: string;
  dueDate: string;
  completedDate?: string;
  quoteAmount?: number;
  parameters: string[];
  remarks?: string;
}

export default function Requests() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<TestRequest | null>(null);
  const [form, setForm] = useState({
    title: '', type: '', labId: '', partnerId: '', priority: 'normal',
    dueDate: '', quoteAmount: '', parameters: '', remarks: '',
  });
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['requests', { search, status: statusFilter, priority: priorityFilter, page }],
    queryFn: () =>
      api.get('/requests', { params: { search, status: statusFilter, priority: priorityFilter, page, limit: 20 } })
        .then((r) => r.data),
  });

  const { data: monthlyVolume, isLoading: volumeLoading } = useQuery({
    queryKey: ['requests-monthly-volume'],
    queryFn: () => api.get('/requests/monthly-volume').then((r) => r.data.data),
    staleTime: 300000,
  });

  const { data: byLab } = useQuery({
    queryKey: ['requests-by-lab'],
    queryFn: () => api.get('/requests/by-lab').then((r) => r.data.data),
    staleTime: 300000,
  });

  const { data: labs } = useQuery({
    queryKey: ['labs-list'],
    queryFn: () => api.get('/labs', { params: { limit: 100 } }).then((r) => r.data.data),
  });

  const { data: partners } = useQuery({
    queryKey: ['partners-list'],
    queryFn: () => api.get('/partners', { params: { limit: 100 } }).then((r) => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (payload: typeof form) =>
      api.post('/requests', {
        ...payload,
        parameters: payload.parameters.split(',').map((p) => p.trim()).filter(Boolean),
        quoteAmount: payload.quoteAmount ? Number(payload.quoteAmount) : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      setShowCreate(false);
    },
  });

  const formatINR = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

  const columns: Column<Record<string, unknown>>[] = [
    { key: 'requestCode', label: 'Request ID', width: 'w-32',
      render: (row) => <span className="font-mono text-xs text-text-muted">{String(row.requestCode)}</span> },
    { key: 'title', label: 'Request',
      render: (row) => (
        <div>
          <p className="font-medium text-text text-sm">{String(row.title)}</p>
          <p className="text-xs text-text-dim">{String(row.type || '—')}</p>
        </div>
      )},
    { key: 'priority', label: 'Priority', render: (row) => <PillBadge value={String(row.priority)} /> },
    { key: 'status', label: 'Status', render: (row) => <PillBadge value={String(row.status)} showDot /> },
    { key: 'lab', label: 'Lab',
      render: (row) => {
        const lab = row.lab as { name: string } | null;
        const partner = row.partner as { name: string } | null;
        return <span className="text-sm text-text">{lab?.name || partner?.name || '—'}</span>;
      }},
    { key: 'dueDate', label: 'Due Date',
      render: (row) => {
        const date = new Date(String(row.dueDate));
        const overdue = date < new Date() && String(row.status) !== 'completed';
        return (
          <span className={`text-xs font-mono ${overdue ? 'text-risk-high font-semibold' : 'text-text'}`}>
            {format(date, 'd MMM yyyy')}
          </span>
        );
      }},
    { key: 'quoteAmount', label: 'Quote', align: 'right',
      render: (row) => {
        const amt = Number(row.quoteAmount);
        return amt > 0 ? (
          <span className={`text-xs font-mono font-medium ${amt > 50000 ? 'text-teal' : 'text-text'}`}>
            {formatINR(amt)}
          </span>
        ) : <span className="text-text-dim text-xs">—</span>;
      }},
  ];

  const handleExport = () => {
    const rows = data?.data as TestRequest[] || [];
    const csv = ['Code,Title,Type,Status,Priority,Lab,Due Date,Quote Amount'].concat(
      rows.map((r) => `${r.requestCode},"${r.title}",${r.type},${r.status},${r.priority},"${r.lab?.name || r.partner?.name || ''}",${r.dueDate},${r.quoteAmount || ''}`)
    ).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'test-requests.csv'; a.click();
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Test Requests"
        subtitle={`${data?.meta?.total || 0} test requests`}
        actions={
          <>
            <button onClick={handleExport} className="btn-secondary"><Download size={13} /> Export</button>
            <button onClick={() => setShowCreate(true)} className="btn-primary"><Plus size={13} /> New Request</button>
          </>
        }
      />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {volumeLoading ? <ChartSkeleton height={200} /> : (
          <ChartCard title="Monthly Request Volume" subtitle="Requests submitted per month" height={200}>
            <ResponsiveContainer>
              <AreaChart data={monthlyVolume || []} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <defs>
                  <linearGradient id="reqGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C49A2C" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#C49A2C" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#C6D8D8" strokeOpacity={0.5} />
                <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#6899A0' }} />
                <YAxis tick={{ fontSize: 10, fill: '#6899A0' }} width={25} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Area type="monotone" dataKey="count" stroke="#C49A2C" strokeWidth={2} fill="url(#reqGrad)" name="Requests" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        <ChartCard title="Requests by Lab" subtitle="Volume breakdown per lab" height={200}>
          <ResponsiveContainer>
            <BarChart data={byLab || []} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 60 }} barSize={12}>
              <CartesianGrid strokeDasharray="3 3" stroke="#C6D8D8" strokeOpacity={0.5} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#6899A0' }} />
              <YAxis type="category" dataKey="lab" tick={{ fontSize: 9, fill: '#6899A0' }} width={60} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="count" name="Requests" fill="#C49A2C" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
          <input placeholder="Search requests..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="input pl-8" />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="select w-36">
          <option value="">All Status</option>
          <option value="submitted">Submitted</option>
          <option value="under_review">Under Review</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select value={priorityFilter} onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }} className="select w-36">
          <option value="">All Priority</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="normal">Normal</option>
          <option value="low">Low</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={(data?.data || []) as Record<string, unknown>[]}
        loading={isLoading}
        onRowClick={(row) => setSelectedRequest(row as unknown as TestRequest)}
        total={data?.meta?.total}
        page={page}
        pageSize={20}
        onPageChange={setPage}
      />

      {/* Detail Drawer */}
      <SideDrawer isOpen={!!selectedRequest} onClose={() => setSelectedRequest(null)}
        title={selectedRequest?.requestCode || ''} subtitle={selectedRequest?.title} width={480}>
        {selectedRequest && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 flex-wrap">
              <PillBadge value={selectedRequest.status} showDot />
              <PillBadge value={selectedRequest.priority} />
              {selectedRequest.quoteAmount && selectedRequest.quoteAmount > 50000 && (
                <span className="flex items-center gap-1 text-xs bg-teal/10 text-teal px-2 py-0.5 rounded-full font-medium">
                  <TrendingUp size={10} /> High Value
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Lab / Partner', value: selectedRequest.lab?.name || selectedRequest.partner?.name || '—' },
                { label: 'Requested By', value: selectedRequest.requester?.name || '—' },
                { label: 'Request Date', value: format(new Date(selectedRequest.requestDate), 'd MMM yyyy') },
                { label: 'Due Date', value: format(new Date(selectedRequest.dueDate), 'd MMM yyyy') },
              ].map((item) => (
                <div key={item.label} className="p-3 bg-bg rounded-lg">
                  <p className="text-xs text-text-muted mb-0.5">{item.label}</p>
                  <p className="text-sm font-medium text-text">{item.value}</p>
                </div>
              ))}
            </div>
            {selectedRequest.quoteAmount && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-teal/5 border border-teal/20">
                <IndianRupee size={14} className="text-teal flex-shrink-0" />
                <p className="text-sm font-semibold text-teal">{formatINR(selectedRequest.quoteAmount)}</p>
                {selectedRequest.quoteAmount > 50000 && (
                  <span className="ml-auto text-xs text-text-muted">Auto-workflow triggered</span>
                )}
              </div>
            )}
            {selectedRequest.parameters && selectedRequest.parameters.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-text-muted mb-2">Test Parameters</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedRequest.parameters.map((p) => <TagChip key={p} label={p} color="teal" />)}
                </div>
              </div>
            )}
            {selectedRequest.remarks && (
              <div>
                <p className="text-xs font-semibold text-text-muted mb-1">Remarks</p>
                <p className="text-sm text-text leading-relaxed">{selectedRequest.remarks}</p>
              </div>
            )}
          </div>
        )}
      </SideDrawer>

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Test Request"
        size="lg"
        footer={
          <>
            <button onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
            <button onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending} className="btn-primary">
              {createMutation.isPending ? 'Submitting...' : 'Submit Request'}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">Request Title *</label>
            <input className="input" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          </div>
          <div>
            <label className="label">Test Type</label>
            <input className="input" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} placeholder="e.g. Stability, Assay" />
          </div>
          <div>
            <label className="label">Priority</label>
            <select className="select" value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}>
              {['low', 'normal', 'high', 'urgent'].map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Lab</label>
            <select className="select" value={form.labId} onChange={(e) => setForm((f) => ({ ...f, labId: e.target.value }))}>
              <option value="">Select lab...</option>
              {(labs || []).map((l: { id: string; name: string }) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Partner</label>
            <select className="select" value={form.partnerId} onChange={(e) => setForm((f) => ({ ...f, partnerId: e.target.value }))}>
              <option value="">Select partner...</option>
              {(partners || []).map((p: { id: string; name: string }) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Due Date *</label>
            <input type="date" className="input" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} />
          </div>
          <div>
            <label className="label">Quote Amount (₹)</label>
            <input type="number" className="input" value={form.quoteAmount} onChange={(e) => setForm((f) => ({ ...f, quoteAmount: e.target.value }))}
              placeholder="Auto-triggers WF-005 if > ₹50,000" />
          </div>
          <div className="col-span-2">
            <label className="label">Test Parameters (comma-separated)</label>
            <input className="input" value={form.parameters} onChange={(e) => setForm((f) => ({ ...f, parameters: e.target.value }))} placeholder="e.g. pH, Viscosity, Assay" />
          </div>
          <div className="col-span-2">
            <label className="label">Remarks</label>
            <textarea className="input resize-none" rows={2} value={form.remarks} onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
