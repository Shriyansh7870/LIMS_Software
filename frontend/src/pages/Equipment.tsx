import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Download, Wrench, AlertTriangle } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell,
} from 'recharts';
import api from '@/lib/api';
import PageHeader from '@/components/ui/PageHeader';
import DataTable, { Column } from '@/components/ui/DataTable';
import PillBadge from '@/components/ui/PillBadge';
import ChartCard from '@/components/ui/ChartCard';
import Modal from '@/components/ui/Modal';
import { ChartSkeleton } from '@/components/ui/LoadingSkeleton';
import ProgressBar from '@/components/ui/ProgressBar';
import { format } from 'date-fns';

interface Equipment {
  id: string;
  equipmentCode: string;
  name: string;
  type: string;
  lab: { name: string; labCode: string };
  status: string;
  calibrationDue: string;
  maintenanceDue: string;
  utilizationRate: number;
  manufacturer: string;
  model: string;
  serialNo: string;
  installDate: string;
}

const EQUIPMENT_TYPES = ['HPLC', 'GC', 'Spectrophotometer', 'Balance', 'Autoclave', 'Centrifuge', 'pH Meter', 'Viscometer'];

export default function Equipment() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedEquip, setSelectedEquip] = useState<Equipment | null>(null);
  const [form, setForm] = useState({
    name: '', type: '', labId: '', manufacturer: '', model: '',
    serialNo: '', installDate: '', calibrationDue: '', maintenanceDue: '',
  });
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['equipment', { search, type: typeFilter, status: statusFilter, page }],
    queryFn: () =>
      api.get('/equipment', { params: { search, type: typeFilter, status: statusFilter, page, limit: 20 } })
        .then((r) => r.data),
  });

  const { data: labs } = useQuery({
    queryKey: ['labs-list'],
    queryFn: () => api.get('/labs', { params: { limit: 100 } }).then((r) => r.data.data),
  });

  const { data: utilisationData, isLoading: utilisLoading } = useQuery({
    queryKey: ['equipment-utilisation'],
    queryFn: () => api.get('/equipment/utilisation').then((r) => r.data.data),
    staleTime: 300000,
  });

  const { data: matrixData } = useQuery({
    queryKey: ['equipment-matrix'],
    queryFn: () => api.get('/equipment/matrix').then((r) => r.data.data),
    staleTime: 300000,
  });

  const createMutation = useMutation({
    mutationFn: (payload: typeof form) => api.post('/equipment', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      setShowCreate(false);
      setForm({ name: '', type: '', labId: '', manufacturer: '', model: '', serialNo: '', installDate: '', calibrationDue: '', maintenanceDue: '' });
    },
  });

  const columns: Column<Record<string, unknown>>[] = [
    { key: 'equipmentCode', label: 'ID', width: 'w-28',
      render: (row) => <span className="font-mono text-xs text-text-muted">{String(row.equipmentCode)}</span> },
    { key: 'name', label: 'Equipment',
      render: (row) => (
        <div>
          <p className="font-medium text-text text-sm">{String(row.name)}</p>
          <p className="text-xs text-text-dim">{String(row.type)} · {String(row.manufacturer || '—')}</p>
        </div>
      )},
    { key: 'lab', label: 'Lab',
      render: (row) => {
        const lab = row.lab as { name: string; labCode: string } | null;
        return (
          <div>
            <p className="text-sm text-text">{lab?.name || '—'}</p>
            <p className="text-xs font-mono text-text-dim">{lab?.labCode}</p>
          </div>
        );
      }},
    { key: 'status', label: 'Status', render: (row) => <PillBadge value={String(row.status)} showDot /> },
    { key: 'calibrationDue', label: 'Calibration Due',
      render: (row) => {
        const date = new Date(String(row.calibrationDue));
        const overdue = date < new Date();
        return (
          <p className={`text-xs font-mono ${overdue ? 'text-risk-high font-semibold' : 'text-text'}`}>
            {format(date, 'd MMM yyyy')}
          </p>
        );
      }},
    { key: 'utilizationRate', label: 'Utilisation', align: 'center',
      render: (row) => {
        const val = Number(row.utilizationRate);
        return (
          <div className="w-20">
            <div className="flex justify-between text-[10px] mb-0.5">
              <span className="text-text-dim">{val}%</span>
            </div>
            <ProgressBar value={val} size="sm" />
          </div>
        );
      }},
  ];

  const handleExport = () => {
    const rows = data?.data as Equipment[] || [];
    const csv = ['Code,Name,Type,Lab,Status,Calibration Due,Utilisation %'].concat(
      rows.map((e) => `${e.equipmentCode},"${e.name}",${e.type},"${e.lab?.name}",${e.status},${e.calibrationDue},${e.utilizationRate}`)
    ).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'equipment.csv'; a.click();
  };

  const UTIL_COLORS = ['#C49A2C', '#DDB84A', '#A67D16', '#F0D080', '#99F6E4', '#CCFBF1', '#F0FDFA', '#D1FAE5'];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Equipment & Capabilities"
        subtitle={`${data?.meta?.total || 0} equipment items tracked`}
        actions={
          <>
            <button onClick={handleExport} className="btn-secondary"><Download size={13} /> Export</button>
            <button onClick={() => setShowCreate(true)} className="btn-primary"><Plus size={13} /> Add Equipment</button>
          </>
        }
      />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {utilisLoading ? <ChartSkeleton height={200} /> : (
          <ChartCard title="Utilisation by Type" subtitle="Quarterly average %" height={200}>
            <ResponsiveContainer>
              <BarChart data={utilisationData || []} margin={{ top: 5, right: 20, bottom: 5, left: 0 }} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="#C6D8D8" strokeOpacity={0.5} />
                <XAxis dataKey="type" tick={{ fontSize: 9, fill: '#6899A0' }} />
                <YAxis tick={{ fontSize: 10, fill: '#6899A0' }} width={30} domain={[0, 100]} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v) => [`${v}%`, 'Utilisation']} />
                <Bar dataKey="avg" name="Avg %" radius={[3, 3, 0, 0]}>
                  {(utilisationData || []).map((_: unknown, i: number) => (
                    <Cell key={i} fill={UTIL_COLORS[i % UTIL_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        <ChartCard title="Lab × Capability Matrix" subtitle="Equipment count per lab" height={200}>
          <div className="overflow-auto h-full">
            {matrixData && (
              <table className="w-full text-[10px]">
                <thead>
                  <tr>
                    <th className="text-left text-text-muted font-medium pb-2 pr-3">Lab</th>
                    {(matrixData.types || []).map((t: string) => (
                      <th key={t} className="text-center text-text-muted font-medium pb-2 px-1.5 whitespace-nowrap">{t}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(matrixData.rows || []).map((row: { lab: string; counts: Record<string, number> }) => (
                    <tr key={row.lab} className="border-t border-border/50">
                      <td className="py-1.5 pr-3 text-text font-medium whitespace-nowrap">{row.lab}</td>
                      {(matrixData.types || []).map((t: string) => {
                        const count = row.counts[t] || 0;
                        return (
                          <td key={t} className="text-center py-1.5 px-1.5">
                            {count > 0 ? (
                              <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-teal/10 text-teal font-semibold">{count}</span>
                            ) : (
                              <span className="text-border">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </ChartCard>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
          <input placeholder="Search equipment..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="input pl-8" />
        </div>
        <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }} className="select w-40">
          <option value="">All Types</option>
          {EQUIPMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="select w-36">
          <option value="">All Status</option>
          <option value="operational">Operational</option>
          <option value="maintenance">Maintenance</option>
          <option value="calibration_due">Calibration Due</option>
          <option value="offline">Offline</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={(data?.data || []) as Record<string, unknown>[]}
        loading={isLoading}
        onRowClick={(row) => setSelectedEquip(row as unknown as Equipment)}
        total={data?.meta?.total}
        page={page}
        pageSize={20}
        onPageChange={setPage}
      />

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Add Equipment"
        subtitle="Register new lab equipment" size="lg"
        footer={
          <>
            <button onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
            <button onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending} className="btn-primary">
              {createMutation.isPending ? 'Adding...' : 'Add Equipment'}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">Equipment Name *</label>
            <input className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Waters HPLC System" />
          </div>
          <div>
            <label className="label">Type *</label>
            <select className="select" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
              <option value="">Select type...</option>
              {EQUIPMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
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
            <label className="label">Manufacturer</label>
            <input className="input" value={form.manufacturer} onChange={(e) => setForm((f) => ({ ...f, manufacturer: e.target.value }))} placeholder="e.g. Waters" />
          </div>
          <div>
            <label className="label">Model</label>
            <input className="input" value={form.model} onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))} placeholder="e.g. ACQUITY UPLC" />
          </div>
          <div>
            <label className="label">Serial No.</label>
            <input className="input" value={form.serialNo} onChange={(e) => setForm((f) => ({ ...f, serialNo: e.target.value }))} placeholder="Serial number..." />
          </div>
          <div>
            <label className="label">Install Date</label>
            <input type="date" className="input" value={form.installDate} onChange={(e) => setForm((f) => ({ ...f, installDate: e.target.value }))} />
          </div>
          <div>
            <label className="label">Calibration Due *</label>
            <input type="date" className="input" value={form.calibrationDue} onChange={(e) => setForm((f) => ({ ...f, calibrationDue: e.target.value }))} />
          </div>
          <div>
            <label className="label">Maintenance Due</label>
            <input type="date" className="input" value={form.maintenanceDue} onChange={(e) => setForm((f) => ({ ...f, maintenanceDue: e.target.value }))} />
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal isOpen={!!selectedEquip} onClose={() => setSelectedEquip(null)}
        title={selectedEquip?.name || ''} subtitle={selectedEquip?.equipmentCode} size="md">
        {selectedEquip && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Type', value: selectedEquip.type },
                { label: 'Status', value: <PillBadge value={selectedEquip.status} showDot /> },
                { label: 'Lab', value: selectedEquip.lab?.name },
                { label: 'Manufacturer', value: selectedEquip.manufacturer || '—' },
                { label: 'Model', value: selectedEquip.model || '—' },
                { label: 'Serial No.', value: selectedEquip.serialNo || '—' },
              ].map((item) => (
                <div key={item.label} className="p-3 bg-bg rounded-lg">
                  <p className="text-xs text-text-muted mb-1">{item.label}</p>
                  {typeof item.value === 'string'
                    ? <p className="text-sm font-medium text-text">{item.value}</p>
                    : item.value}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-bg rounded-lg">
                <p className="text-xs text-text-muted mb-1">Calibration Due</p>
                <p className={`text-sm font-mono font-semibold ${new Date(selectedEquip.calibrationDue) < new Date() ? 'text-risk-high' : 'text-text'}`}>
                  {format(new Date(selectedEquip.calibrationDue), 'd MMM yyyy')}
                </p>
              </div>
              <div className="p-3 bg-bg rounded-lg">
                <p className="text-xs text-text-muted mb-1">Utilisation</p>
                <p className="text-sm font-mono font-semibold text-text">{selectedEquip.utilizationRate}%</p>
                <ProgressBar value={selectedEquip.utilizationRate} size="sm" />
              </div>
            </div>
            {new Date(selectedEquip.calibrationDue) < new Date() && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-risk-high/10 border border-risk-high/20">
                <AlertTriangle size={14} className="text-risk-high flex-shrink-0" />
                <p className="text-xs text-risk-high font-medium">Calibration overdue — equipment may need to be taken offline pending recalibration.</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
