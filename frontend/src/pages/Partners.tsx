import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Download, Star, TrendingUp } from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, Tooltip,
} from 'recharts';
import api from '@/lib/api';
import PageHeader from '@/components/ui/PageHeader';
import DataTable, { Column } from '@/components/ui/DataTable';
import PillBadge from '@/components/ui/PillBadge';
import RiskRing from '@/components/ui/RiskRing';
import ChartCard from '@/components/ui/ChartCard';
import SideDrawer from '@/components/ui/SideDrawer';
import TagChip from '@/components/ui/TagChip';
import Modal from '@/components/ui/Modal';
import ProgressBar from '@/components/ui/ProgressBar';

interface Partner {
  id: string;
  partnerCode: string;
  name: string;
  type: string;
  country: string;
  city: string;
  status: string;
  overallScore: number;
  qualityScore: number;
  deliveryScore: number;
  costScore: number;
  complianceScore: number;
  capabilities: string[];
  lab?: { name: string };
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-text-muted">{label}</span>
        <span className="font-mono font-semibold text-text">{value.toFixed(1)}</span>
      </div>
      <ProgressBar value={value} size="sm" />
    </div>
  );
}

export default function Partners() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: '', type: 'contract_lab', country: 'India', city: '', contactName: '', contactEmail: '',
  });
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['partners', { search, type: typeFilter, status: statusFilter, page }],
    queryFn: () =>
      api.get('/partners', { params: { search, type: typeFilter, status: statusFilter, page, limit: 20 } })
        .then((r) => r.data),
  });

  const { data: scorecard } = useQuery({
    queryKey: ['partner-scorecard', selectedPartner?.id],
    queryFn: () => api.get(`/partners/${selectedPartner!.id}/scorecard`).then((r) => r.data.data),
    enabled: !!selectedPartner,
  });

  const createMutation = useMutation({
    mutationFn: (payload: typeof form) => api.post('/partners', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners'] });
      setShowCreate(false);
      setForm({ name: '', type: 'contract_lab', country: 'India', city: '', contactName: '', contactEmail: '' });
    },
  });

  const columns: Column<Record<string, unknown>>[] = [
    { key: 'partnerCode', label: 'Code', width: 'w-28',
      render: (row) => <span className="font-mono text-xs text-text-muted">{String(row.partnerCode)}</span> },
    { key: 'name', label: 'Partner',
      render: (row) => (
        <div>
          <p className="font-medium text-text text-sm">{String(row.name)}</p>
          <p className="text-xs text-text-dim">{String(row.city)}, {String(row.country)}</p>
        </div>
      )},
    { key: 'type', label: 'Type', render: (row) => <PillBadge value={String(row.type)} /> },
    { key: 'overallScore', label: 'Score', align: 'center',
      render: (row) => (
        <span className={`font-mono text-sm font-semibold ${Number(row.overallScore) >= 80 ? 'text-risk-low' : Number(row.overallScore) >= 60 ? 'text-risk-medium' : 'text-risk-high'}`}>
          {Number(row.overallScore).toFixed(1)}
        </span>
      )},
    { key: 'qualityScore', label: 'Quality', align: 'center',
      render: (row) => <RiskRing score={100 - Number(row.qualityScore)} size={36} strokeWidth={3} /> },
    { key: 'capabilities', label: 'Capabilities',
      render: (row) => {
        const caps = row.capabilities as string[] || [];
        return (
          <div className="flex flex-wrap gap-1 max-w-xs">
            {caps.slice(0, 3).map((c) => <TagChip key={c} label={c} color="teal" />)}
            {caps.length > 3 && <span className="text-[10px] text-text-dim">+{caps.length - 3}</span>}
          </div>
        );
      }},
    { key: 'status', label: 'Status', render: (row) => <PillBadge value={String(row.status)} showDot /> },
  ];

  const handleExport = () => {
    const rows = data?.data as Partner[] || [];
    const csv = ['Code,Name,Type,City,Country,Status,Overall Score,Quality,Delivery,Cost,Compliance'].concat(
      rows.map((p) => `${p.partnerCode},"${p.name}",${p.type},${p.city},${p.country},${p.status},${p.overallScore},${p.qualityScore},${p.deliveryScore},${p.costScore},${p.complianceScore}`)
    ).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'partners.csv'; a.click();
  };

  const radarData = selectedPartner ? [
    { axis: 'Quality', value: selectedPartner.qualityScore },
    { axis: 'Delivery', value: selectedPartner.deliveryScore },
    { axis: 'Cost', value: selectedPartner.costScore },
    { axis: 'Compliance', value: selectedPartner.complianceScore },
  ] : [];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Partner Management"
        subtitle={`${data?.meta?.total || 0} partners in network`}
        actions={
          <>
            <button onClick={handleExport} className="btn-secondary"><Download size={13} /> Export</button>
            <button onClick={() => setShowCreate(true)} className="btn-primary"><Plus size={13} /> Add Partner</button>
          </>
        }
      />

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
          <input placeholder="Search partners..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="input pl-8" />
        </div>
        <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }} className="select w-40">
          <option value="">All Types</option>
          <option value="contract_lab">Contract Lab</option>
          <option value="raw_material">Raw Material</option>
          <option value="equipment_supplier">Equipment Supplier</option>
          <option value="logistics">Logistics</option>
        </select>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="select w-36">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="under_review">Under Review</option>
          <option value="blacklisted">Blacklisted</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={(data?.data || []) as Record<string, unknown>[]}
        loading={isLoading}
        onRowClick={(row) => setSelectedPartner(row as unknown as Partner)}
        total={data?.meta?.total}
        page={page}
        pageSize={20}
        onPageChange={setPage}
      />

      {/* Partner Detail Drawer */}
      <SideDrawer
        isOpen={!!selectedPartner}
        onClose={() => setSelectedPartner(null)}
        title={selectedPartner?.name || ''}
        subtitle={`${selectedPartner?.partnerCode} · ${selectedPartner?.city}, ${selectedPartner?.country}`}
        width={520}
      >
        {selectedPartner && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <PillBadge value={selectedPartner.status} showDot />
              <PillBadge value={selectedPartner.type} />
              <span className={`ml-auto text-2xl font-bold font-syne ${selectedPartner.overallScore >= 80 ? 'text-risk-low' : selectedPartner.overallScore >= 60 ? 'text-risk-medium' : 'text-risk-high'}`}>
                {selectedPartner.overallScore.toFixed(1)}
              </span>
            </div>

            {/* Score breakdown */}
            <div className="space-y-3">
              <ScoreBar label="Quality" value={selectedPartner.qualityScore} />
              <ScoreBar label="Delivery" value={selectedPartner.deliveryScore} />
              <ScoreBar label="Cost" value={selectedPartner.costScore} />
              <ScoreBar label="Compliance" value={selectedPartner.complianceScore} />
            </div>

            {/* Radar chart */}
            <div style={{ height: 200 }}>
              <ResponsiveContainer>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#C6D8D8" />
                  <PolarAngleAxis dataKey="axis" tick={{ fontSize: 11, fill: '#6899A0' }} />
                  <Radar dataKey="value" stroke="#C49A2C" fill="#C49A2C" fillOpacity={0.15} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Capabilities */}
            {selectedPartner.capabilities && selectedPartner.capabilities.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-text-muted mb-2">Capabilities</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedPartner.capabilities.map((c) => <TagChip key={c} label={c} color="teal" />)}
                </div>
              </div>
            )}

            {/* 12-month trend */}
            {scorecard && scorecard.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-text-muted mb-2">12-Month Score Trend</p>
                <div style={{ height: 120 }}>
                  <ResponsiveContainer>
                    <LineChart data={scorecard}>
                      <XAxis dataKey="month" tick={{ fontSize: 9 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} width={25} />
                      <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                      <Line type="monotone" dataKey="overallScore" stroke="#C49A2C" strokeWidth={2} dot={false} name="Score" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {selectedPartner.lab && (
              <div className="p-3 bg-bg rounded-lg">
                <p className="text-xs text-text-muted mb-1">Associated Lab</p>
                <p className="text-sm font-medium text-text">{selectedPartner.lab.name}</p>
              </div>
            )}
          </div>
        )}
      </SideDrawer>

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Add Partner"
        subtitle="Register a new supply chain partner" size="md"
        footer={
          <>
            <button onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
            <button onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending} className="btn-primary">
              {createMutation.isPending ? 'Adding...' : 'Add Partner'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Partner Name *</label>
            <input className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Partner organisation name..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Type *</label>
              <select className="select" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
                <option value="contract_lab">Contract Lab</option>
                <option value="raw_material">Raw Material</option>
                <option value="equipment_supplier">Equipment Supplier</option>
                <option value="logistics">Logistics</option>
              </select>
            </div>
            <div>
              <label className="label">Country</label>
              <input className="input" value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} />
            </div>
            <div>
              <label className="label">City</label>
              <input className="input" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
            </div>
            <div>
              <label className="label">Contact Name</label>
              <input className="input" value={form.contactName} onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label">Contact Email</label>
            <input type="email" className="input" value={form.contactEmail} onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
