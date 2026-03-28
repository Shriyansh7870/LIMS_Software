import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, FileText, AlertTriangle, Clock, CheckCircle2, RefreshCw } from 'lucide-react';
import api from '@/lib/api';
import PageHeader from '@/components/ui/PageHeader';
import DataTable, { Column } from '@/components/ui/DataTable';
import PillBadge from '@/components/ui/PillBadge';
import Modal from '@/components/ui/Modal';
import SideDrawer from '@/components/ui/SideDrawer';
import TagChip from '@/components/ui/TagChip';
import { format, differenceInDays } from 'date-fns';

interface SopVersion {
  version: string;
  effectiveDate: string;
  author: string;
  changeNote: string;
}

interface Sop {
  id: string;
  sopCode: string;
  title: string;
  category: string;
  department: string;
  status: string;
  version: string;
  effectiveDate: string;
  reviewDate: string;
  owner: string;
  lab?: { name: string };
  tags: string[];
  versions?: SopVersion[];
  daysUntilReview?: number;
}

const SOP_CATEGORIES = ['Analytical', 'Manufacturing', 'Quality Control', 'Equipment', 'Safety', 'Regulatory', 'Administrative'];

export default function Sop() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [selectedSop, setSelectedSop] = useState<Sop | null>(null);
  const [versionForm, setVersionForm] = useState({ version: '', effectiveDate: '', changeNote: '' });
  const [form, setForm] = useState({
    title: '', category: '', department: '', labId: '',
    version: '1.0', effectiveDate: '', reviewDate: '', owner: '', tags: '',
  });
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['sops', { search, category: categoryFilter, status: statusFilter, page }],
    queryFn: () =>
      api.get('/sops', { params: { search, category: categoryFilter, status: statusFilter, page, limit: 20 } })
        .then((r) => r.data),
  });

  const { data: dueForReview } = useQuery({
    queryKey: ['sops-due-review'],
    queryFn: () => api.get('/sops/due-for-review').then((r) => r.data.data),
    staleTime: 300000,
  });

  const { data: labs } = useQuery({
    queryKey: ['labs-list'],
    queryFn: () => api.get('/labs', { params: { limit: 100 } }).then((r) => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (payload: typeof form) =>
      api.post('/sops', { ...payload, tags: payload.tags.split(',').map((t) => t.trim()).filter(Boolean) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sops'] });
      setShowCreate(false);
    },
  });

  const addVersionMutation = useMutation({
    mutationFn: (payload: typeof versionForm) =>
      api.post(`/sops/${selectedSop!.id}/versions`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sops'] });
      setShowVersionModal(false);
      setVersionForm({ version: '', effectiveDate: '', changeNote: '' });
    },
  });

  const columns: Column<Record<string, unknown>>[] = [
    { key: 'sopCode', label: 'SOP ID', width: 'w-28',
      render: (row) => <span className="font-mono text-xs text-text-muted">{String(row.sopCode)}</span> },
    { key: 'title', label: 'Title',
      render: (row) => (
        <div>
          <p className="font-medium text-text text-sm">{String(row.title)}</p>
          <p className="text-xs text-text-dim">{String(row.category)} · {String(row.department || '—')}</p>
        </div>
      )},
    { key: 'version', label: 'Ver', width: 'w-16', align: 'center',
      render: (row) => <span className="font-mono text-xs bg-teal/10 text-teal px-2 py-0.5 rounded">v{String(row.version)}</span> },
    { key: 'status', label: 'Status', render: (row) => <PillBadge value={String(row.status)} showDot /> },
    { key: 'reviewDate', label: 'Review Due',
      render: (row) => {
        const days = differenceInDays(new Date(String(row.reviewDate)), new Date());
        return (
          <div>
            <p className="text-xs font-mono">{format(new Date(String(row.reviewDate)), 'd MMM yyyy')}</p>
            {days <= 90 && (
              <p className={`text-[10px] font-semibold ${days < 0 ? 'text-risk-high' : days <= 30 ? 'text-risk-high' : 'text-risk-medium'}`}>
                {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d`}
              </p>
            )}
          </div>
        );
      }},
    { key: 'owner', label: 'Owner',
      render: (row) => <span className="text-sm text-text">{String(row.owner || '—')}</span> },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="SOP Management"
        subtitle={`${data?.meta?.total || 0} standard operating procedures`}
        actions={
          <button onClick={() => setShowCreate(true)} className="btn-primary"><Plus size={13} /> New SOP</button>
        }
      />

      {/* Due for review alert */}
      {dueForReview && dueForReview.length > 0 && (
        <div className="card p-4 border-l-4 border-risk-medium">
          <div className="flex items-start gap-3">
            <RefreshCw size={15} className="text-risk-medium mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-text">{dueForReview.length} SOPs due for review within 90 days</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {dueForReview.slice(0, 8).map((s: Sop) => (
                  <button key={s.id} onClick={() => setSelectedSop(s)}
                    className="text-xs bg-risk-medium/10 text-risk-medium px-2 py-0.5 rounded-full hover:bg-risk-medium/20 transition-colors">
                    {s.sopCode}
                  </button>
                ))}
                {dueForReview.length > 8 && (
                  <span className="text-xs text-text-dim self-center">+{dueForReview.length - 8} more</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
          <input placeholder="Search SOPs..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="input pl-8" />
        </div>
        <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }} className="select w-40">
          <option value="">All Categories</option>
          {SOP_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="select w-36">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="under_review">Under Review</option>
          <option value="obsolete">Obsolete</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={(data?.data || []) as Record<string, unknown>[]}
        loading={isLoading}
        onRowClick={(row) => setSelectedSop(row as unknown as Sop)}
        total={data?.meta?.total}
        page={page}
        pageSize={20}
        onPageChange={setPage}
      />

      {/* Detail Drawer */}
      <SideDrawer isOpen={!!selectedSop} onClose={() => setSelectedSop(null)}
        title={selectedSop?.sopCode || ''} subtitle={selectedSop?.title} width={480}>
        {selectedSop && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 flex-wrap">
              <PillBadge value={selectedSop.status} showDot />
              <span className="font-mono text-xs bg-teal/10 text-teal px-2 py-0.5 rounded">v{selectedSop.version}</span>
              {selectedSop.category && <TagChip label={selectedSop.category} color="blue" />}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Effective Date', value: format(new Date(selectedSop.effectiveDate), 'd MMM yyyy') },
                { label: 'Review Due', value: format(new Date(selectedSop.reviewDate), 'd MMM yyyy') },
                { label: 'Owner', value: selectedSop.owner || '—' },
                { label: 'Department', value: selectedSop.department || '—' },
              ].map((item) => (
                <div key={item.label} className="p-3 bg-bg rounded-lg">
                  <p className="text-xs text-text-muted mb-0.5">{item.label}</p>
                  <p className="text-sm font-medium text-text">{item.value}</p>
                </div>
              ))}
            </div>

            {selectedSop.tags && selectedSop.tags.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-text-muted mb-2">Tags</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedSop.tags.map((t) => <TagChip key={t} label={t} color="gray" />)}
                </div>
              </div>
            )}

            {/* Version history */}
            {selectedSop.versions && selectedSop.versions.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-text-muted mb-2">Version History</p>
                <div className="space-y-2">
                  {selectedSop.versions.map((v) => (
                    <div key={v.version} className="p-2.5 bg-bg rounded-lg flex items-start gap-3">
                      <span className="font-mono text-xs bg-white border border-border text-text-muted px-1.5 py-0.5 rounded flex-shrink-0">v{v.version}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-text-muted">{format(new Date(v.effectiveDate), 'd MMM yyyy')} · {v.author}</p>
                        <p className="text-xs text-text mt-0.5">{v.changeNote}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button onClick={() => setShowVersionModal(true)} className="btn-secondary w-full text-sm">
              <Plus size={12} /> Add New Version
            </button>
          </div>
        )}
      </SideDrawer>

      {/* Add Version Modal */}
      <Modal isOpen={showVersionModal} onClose={() => setShowVersionModal(false)} title="Add Version"
        subtitle={`New revision for ${selectedSop?.sopCode}`} size="sm"
        footer={
          <>
            <button onClick={() => setShowVersionModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={() => addVersionMutation.mutate(versionForm)} disabled={addVersionMutation.isPending} className="btn-primary">
              {addVersionMutation.isPending ? 'Saving...' : 'Save Version'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Version Number *</label>
            <input className="input" value={versionForm.version} onChange={(e) => setVersionForm((f) => ({ ...f, version: e.target.value }))} placeholder="e.g. 2.0" />
          </div>
          <div>
            <label className="label">Effective Date *</label>
            <input type="date" className="input" value={versionForm.effectiveDate} onChange={(e) => setVersionForm((f) => ({ ...f, effectiveDate: e.target.value }))} />
          </div>
          <div>
            <label className="label">Change Note *</label>
            <textarea className="input resize-none" rows={3} value={versionForm.changeNote}
              onChange={(e) => setVersionForm((f) => ({ ...f, changeNote: e.target.value }))} placeholder="Describe what changed..." />
          </div>
        </div>
      </Modal>

      {/* Create SOP Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New SOP"
        subtitle="Create a new standard operating procedure" size="lg"
        footer={
          <>
            <button onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
            <button onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending} className="btn-primary">
              {createMutation.isPending ? 'Creating...' : 'Create SOP'}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">Title *</label>
            <input className="input" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="SOP title..." />
          </div>
          <div>
            <label className="label">Category *</label>
            <select className="select" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
              <option value="">Select...</option>
              {SOP_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Department</label>
            <input className="input" value={form.department} onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))} />
          </div>
          <div>
            <label className="label">Lab</label>
            <select className="select" value={form.labId} onChange={(e) => setForm((f) => ({ ...f, labId: e.target.value }))}>
              <option value="">Select lab...</option>
              {(labs || []).map((l: { id: string; name: string }) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Owner</label>
            <input className="input" value={form.owner} onChange={(e) => setForm((f) => ({ ...f, owner: e.target.value }))} />
          </div>
          <div>
            <label className="label">Effective Date *</label>
            <input type="date" className="input" value={form.effectiveDate} onChange={(e) => setForm((f) => ({ ...f, effectiveDate: e.target.value }))} />
          </div>
          <div>
            <label className="label">Review Date *</label>
            <input type="date" className="input" value={form.reviewDate} onChange={(e) => setForm((f) => ({ ...f, reviewDate: e.target.value }))} />
          </div>
          <div className="col-span-2">
            <label className="label">Tags (comma-separated)</label>
            <input className="input" value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} placeholder="e.g. HPLC, validation, QC" />
          </div>
        </div>
      </Modal>
    </div>
  );
}
