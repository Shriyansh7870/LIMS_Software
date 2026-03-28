import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Download, Star, MapPin, Building2 } from 'lucide-react';
import api from '@/lib/api';
import PageHeader from '@/components/ui/PageHeader';
import DataTable, { Column } from '@/components/ui/DataTable';
import PillBadge from '@/components/ui/PillBadge';
import RiskRing from '@/components/ui/RiskRing';
import SideDrawer from '@/components/ui/SideDrawer';
import Modal from '@/components/ui/Modal';
import TagChip from '@/components/ui/TagChip';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';

interface Lab {
  id: string;
  labCode: string;
  name: string;
  type: string;
  city: string;
  state: string;
  capacity: number;
  rating: number;
  riskScore: number;
  auditScore: number;
  status: string;
  equipment: Array<{ id: string; type: string }>;
  certifications: Array<{ status: string }>;
  _count: { capass: number; audits: number };
}

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={11} className={i < Math.round(value) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'} />
      ))}
      <span className="ml-1 text-xs text-text-muted font-mono">{value.toFixed(1)}</span>
    </div>
  );
}

export default function Registry() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedLab, setSelectedLab] = useState<Lab | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: '', type: 'internal', city: '', state: '', country: 'India',
    capacity: '', contactName: '', contactEmail: '', contactPhone: '', address: '',
  });
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (payload: typeof form) => api.post('/labs', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labs'] });
      setShowCreate(false);
      setForm({ name: '', type: 'internal', city: '', state: '', country: 'India', capacity: '', contactName: '', contactEmail: '', contactPhone: '', address: '' });
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['labs', { search, type: typeFilter, status: statusFilter, page }],
    queryFn: () =>
      api.get('/labs', { params: { search, type: typeFilter, status: statusFilter, page, limit: 20 } })
        .then((r) => r.data),
  });

  const { data: labHistory } = useQuery({
    queryKey: ['lab-history', selectedLab?.id],
    queryFn: () => api.get(`/labs/${selectedLab!.id}/history`).then((r) => r.data.data),
    enabled: !!selectedLab,
  });

  const columns: Column<Record<string, unknown>>[] = [
    { key: 'labCode', label: 'Lab ID', sortable: true, width: 'w-28',
      render: (row) => <span className="font-mono text-xs text-text-muted">{String(row.labCode)}</span> },
    { key: 'name', label: 'Name', sortable: true,
      render: (row) => (
        <div>
          <p className="font-medium text-text text-sm">{String(row.name)}</p>
          <p className="text-xs text-text-dim flex items-center gap-1">
            <MapPin size={10} />{String(row.city)}, {String(row.state)}
          </p>
        </div>
      )},
    { key: 'type', label: 'Type', render: (row) => <PillBadge value={String(row.type)} /> },
    { key: 'capacity', label: 'Capacity', sortable: true, align: 'right',
      render: (row) => <span className="font-mono text-xs">{Number(row.capacity).toLocaleString()} L</span> },
    { key: 'rating', label: 'Rating', render: (row) => <StarRating value={Number(row.rating)} /> },
    { key: 'riskScore', label: 'Risk', align: 'center',
      render: (row) => <RiskRing score={Number(row.riskScore)} size={38} strokeWidth={3} /> },
    { key: 'auditScore', label: 'Audit', align: 'center',
      render: (row) => (
        <span className={`font-mono text-sm font-semibold ${Number(row.auditScore) >= 90 ? 'text-risk-low' : Number(row.auditScore) >= 75 ? 'text-risk-medium' : 'text-risk-high'}`}>
          {Number(row.auditScore).toFixed(1)}
        </span>
      )},
    { key: 'status', label: 'Status', render: (row) => <PillBadge value={String(row.status)} showDot /> },
  ];

  const handleExport = async () => {
    const rows = data?.data as Lab[] || [];
    const csv = [
      ['Lab Code', 'Name', 'Type', 'City', 'State', 'Capacity', 'Rating', 'Risk Score', 'Audit Score', 'Status'],
      ...rows.map((l) => [l.labCode, l.name, l.type, l.city, l.state, l.capacity, l.rating, l.riskScore, l.auditScore, l.status]),
    ].map((r) => r.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'lab-registry.csv'; a.click();
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Lab Registry"
        subtitle={`${data?.meta?.total || 0} labs across internal and partner network`}
        actions={
          <>
            <button onClick={handleExport} className="btn-secondary"><Download size={13} /> Export CSV</button>
            <button onClick={() => setShowCreate(true)} className="btn-primary"><Plus size={13} /> Add Lab</button>
          </>
        }
      />

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
          <input type="text" placeholder="Search labs..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="input pl-8" />
        </div>
        <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }} className="select w-36">
          <option value="">All Types</option>
          <option value="internal">Internal</option>
          <option value="partner">Partner</option>
          <option value="contract">Contract</option>
        </select>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="select w-36">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={(data?.data || []) as Record<string, unknown>[]}
        loading={isLoading}
        onRowClick={(row) => setSelectedLab(row as unknown as Lab)}
        total={data?.meta?.total}
        page={page}
        pageSize={20}
        onPageChange={setPage}
      />

      {/* Create Lab Modal */}
      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="Add New Lab"
        subtitle="Register a lab in the network"
        size="lg"
        footer={
          <>
            <button onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
            <button
              onClick={() => createMutation.mutate(form)}
              disabled={createMutation.isPending || !form.name || !form.city}
              className="btn-primary disabled:opacity-50"
            >
              {createMutation.isPending ? 'Adding...' : 'Add Lab'}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">Lab Name *</label>
            <input className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Mumbai QC Central" />
          </div>
          <div>
            <label className="label">Type *</label>
            <select className="select" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
              <option value="internal">Internal</option>
              <option value="external">External</option>
              <option value="contract">Contract</option>
              <option value="partner">Partner</option>
            </select>
          </div>
          <div>
            <label className="label">Capacity (L)</label>
            <input type="number" className="input" value={form.capacity} onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))} placeholder="e.g. 5000" />
          </div>
          <div>
            <label className="label">City *</label>
            <input className="input" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} placeholder="e.g. Mumbai" />
          </div>
          <div>
            <label className="label">State</label>
            <input className="input" value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))} placeholder="e.g. Maharashtra" />
          </div>
          <div>
            <label className="label">Country</label>
            <input className="input" value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} />
          </div>
          <div>
            <label className="label">Contact Name</label>
            <input className="input" value={form.contactName} onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))} />
          </div>
          <div>
            <label className="label">Contact Email</label>
            <input type="email" className="input" value={form.contactEmail} onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))} />
          </div>
          <div>
            <label className="label">Contact Phone</label>
            <input className="input" value={form.contactPhone} onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))} />
          </div>
          <div className="col-span-2">
            <label className="label">Address</label>
            <textarea className="input resize-none" rows={2} value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} placeholder="Full address..." />
          </div>
        </div>
      </Modal>

      {/* Detail drawer */}
      <SideDrawer
        isOpen={!!selectedLab}
        onClose={() => setSelectedLab(null)}
        title={selectedLab?.name || ''}
        subtitle={`${selectedLab?.labCode} · ${selectedLab?.city}, ${selectedLab?.state}`}
        width={480}
      >
        {selectedLab && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Type',       value: selectedLab.type },
                { label: 'Status',     value: selectedLab.status },
                { label: 'Capacity',   value: `${selectedLab.capacity?.toLocaleString()} L` },
                { label: 'Rating',     value: `${selectedLab.rating?.toFixed(1)} / 5.0` },
                { label: 'Risk Score', value: `${selectedLab.riskScore?.toFixed(1)}` },
                { label: 'Audit Score',value: `${selectedLab.auditScore?.toFixed(1)}` },
              ].map((stat) => (
                <div key={stat.label} className="p-3 bg-bg rounded-lg">
                  <p className="text-xs text-text-muted">{stat.label}</p>
                  <p className="font-semibold text-text text-sm mt-0.5">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Equipment */}
            {selectedLab.equipment && (
              <div>
                <p className="text-xs font-semibold text-text-muted mb-2">Equipment ({selectedLab.equipment.length})</p>
                <div className="flex flex-wrap gap-1.5">
                  {[...new Set(selectedLab.equipment.map((e) => e.type))].map((t) => (
                    <TagChip key={t} label={t} color="teal" />
                  ))}
                </div>
              </div>
            )}

            {/* Certifications */}
            {selectedLab.certifications && (
              <div>
                <p className="text-xs font-semibold text-text-muted mb-2">Certifications ({selectedLab.certifications.length})</p>
                <div className="flex gap-2">
                  {[
                    { label: 'Valid', count: selectedLab.certifications.filter((c) => c.status === 'valid').length, color: 'green' as const },
                    { label: 'Renewal Due', count: selectedLab.certifications.filter((c) => c.status === 'renewal_due').length, color: 'orange' as const },
                    { label: 'Expired', count: selectedLab.certifications.filter((c) => c.status === 'expired').length, color: 'red' as const },
                  ].map((s) => (
                    <div key={s.label} className="flex-1 p-2 bg-bg rounded-lg text-center">
                      <p className="font-bold text-lg text-text">{s.count}</p>
                      <p className="text-[10px] text-text-muted">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 12-month audit score sparkline */}
            {labHistory && labHistory.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-text-muted mb-2">12-Month Audit Score Trend</p>
                <div style={{ height: 100 }}>
                  <ResponsiveContainer>
                    <LineChart data={labHistory}>
                      <XAxis dataKey="month" tick={{ fontSize: 9 }} />
                      <YAxis domain={[60, 100]} tick={{ fontSize: 9 }} width={25} />
                      <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                      <Line type="monotone" dataKey="auditScore" stroke="#C49A2C" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}
      </SideDrawer>
    </div>
  );
}
