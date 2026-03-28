import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Download, FileText, File, FileImage, Archive, Trash2, Eye } from 'lucide-react';
import api from '@/lib/api';
import PageHeader from '@/components/ui/PageHeader';
import DataTable, { Column } from '@/components/ui/DataTable';
import PillBadge from '@/components/ui/PillBadge';
import Modal from '@/components/ui/Modal';
import TagChip from '@/components/ui/TagChip';
import { format } from 'date-fns';

interface Document {
  id: string;
  docCode: string;
  title: string;
  type: string;
  category: string;
  status: string;
  fileSize: number;
  fileType: string;
  version: string;
  uploadedAt: string;
  uploader: { name: string };
  lab?: { name: string };
  tags: string[];
  expiryDate?: string;
}

function fileSizeLabel(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function FileIcon({ type }: { type: string }) {
  const lower = (type || '').toLowerCase();
  if (lower.includes('pdf')) return <FileText size={16} className="text-red-500" />;
  if (lower.includes('image') || lower.includes('png') || lower.includes('jpg')) return <FileImage size={16} className="text-blue-500" />;
  if (lower.includes('zip') || lower.includes('rar')) return <Archive size={16} className="text-yellow-600" />;
  return <File size={16} className="text-text-dim" />;
}

const DOC_TYPES = ['SOP', 'Protocol', 'Report', 'Certificate', 'Form', 'Policy', 'Manual', 'Specification'];

export default function Dms() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [form, setForm] = useState({
    title: '', type: '', category: '', labId: '', version: '1.0',
    fileUrl: '', fileType: 'pdf', fileSize: '0', tags: '', expiryDate: '',
  });
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['documents', { search, type: typeFilter, status: statusFilter, page }],
    queryFn: () =>
      api.get('/documents', { params: { search, type: typeFilter, status: statusFilter, page, limit: 20 } })
        .then((r) => r.data),
  });

  const { data: labs } = useQuery({
    queryKey: ['labs-list'],
    queryFn: () => api.get('/labs', { params: { limit: 100 } }).then((r) => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (payload: typeof form) =>
      api.post('/documents', { ...payload, tags: payload.tags.split(',').map((t) => t.trim()).filter(Boolean) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setShowCreate(false);
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/documents/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setSelectedDoc(null);
    },
  });

  const handleDownload = async (doc: Document) => {
    try {
      const res = await api.get(`/documents/${doc.id}/download`);
      if (res.data.url) window.open(res.data.url, '_blank');
    } catch {
      // stub — show toast in production
    }
  };

  const columns: Column<Record<string, unknown>>[] = [
    { key: 'docCode', label: 'Doc ID', width: 'w-28',
      render: (row) => <span className="font-mono text-xs text-text-muted">{String(row.docCode)}</span> },
    { key: 'title', label: 'Document',
      render: (row) => (
        <div className="flex items-start gap-2">
          <FileIcon type={String(row.fileType)} />
          <div>
            <p className="font-medium text-text text-sm leading-tight">{String(row.title)}</p>
            <p className="text-xs text-text-dim">{String(row.type)} · v{String(row.version)}</p>
          </div>
        </div>
      )},
    { key: 'lab', label: 'Lab',
      render: (row) => {
        const lab = row.lab as { name: string } | null;
        return <span className="text-sm text-text">{lab?.name || '—'}</span>;
      }},
    { key: 'status', label: 'Status', render: (row) => <PillBadge value={String(row.status)} showDot /> },
    { key: 'fileSize', label: 'Size', align: 'right',
      render: (row) => <span className="text-xs font-mono text-text-muted">{fileSizeLabel(Number(row.fileSize))}</span> },
    { key: 'uploadedAt', label: 'Uploaded',
      render: (row) => (
        <div>
          <p className="text-xs font-mono">{format(new Date(String(row.uploadedAt)), 'd MMM yyyy')}</p>
          <p className="text-[10px] text-text-dim">
            {(row.uploader as { name: string } | null)?.name || '—'}
          </p>
        </div>
      )},
    { key: 'actions', label: '',
      render: (row) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => handleDownload(row as unknown as Document)}
            className="p-1.5 hover:bg-bg rounded-lg transition-colors text-text-dim hover:text-teal">
            <Download size={12} />
          </button>
        </div>
      )},
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Document Management"
        subtitle={`${data?.meta?.total || 0} documents`}
        actions={
          <button onClick={() => setShowCreate(true)} className="btn-primary"><Plus size={13} /> Upload Document</button>
        }
      />

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
          <input placeholder="Search documents..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="input pl-8" />
        </div>
        <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }} className="select w-36">
          <option value="">All Types</option>
          {DOC_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="select w-36">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="under_review">Under Review</option>
          <option value="archived">Archived</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={(data?.data || []) as Record<string, unknown>[]}
        loading={isLoading}
        onRowClick={(row) => setSelectedDoc(row as unknown as Document)}
        total={data?.meta?.total}
        page={page}
        pageSize={20}
        onPageChange={setPage}
      />

      {/* Detail Modal */}
      <Modal isOpen={!!selectedDoc} onClose={() => setSelectedDoc(null)}
        title={selectedDoc?.title || ''} subtitle={selectedDoc?.docCode} size="md"
        footer={
          <div className="flex justify-between w-full">
            <button
              onClick={() => selectedDoc && archiveMutation.mutate(selectedDoc.id)}
              disabled={archiveMutation.isPending}
              className="btn-ghost text-risk-high hover:bg-risk-high/10"
            >
              <Archive size={13} /> Archive
            </button>
            <div className="flex gap-2">
              <button onClick={() => setSelectedDoc(null)} className="btn-secondary">Close</button>
              {selectedDoc && (
                <button onClick={() => handleDownload(selectedDoc)} className="btn-primary">
                  <Download size={13} /> Download
                </button>
              )}
            </div>
          </div>
        }
      >
        {selectedDoc && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <FileIcon type={selectedDoc.fileType} />
              <div>
                <PillBadge value={selectedDoc.status} showDot />
              </div>
              <span className="font-mono text-xs bg-teal/10 text-teal px-2 py-0.5 rounded ml-auto">v{selectedDoc.version}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Type', value: selectedDoc.type },
                { label: 'Category', value: selectedDoc.category || '—' },
                { label: 'File Type', value: (selectedDoc.fileType || '—').toUpperCase() },
                { label: 'File Size', value: fileSizeLabel(selectedDoc.fileSize) },
                { label: 'Uploaded', value: format(new Date(selectedDoc.uploadedAt), 'd MMM yyyy') },
                { label: 'By', value: selectedDoc.uploader?.name || '—' },
              ].map((item) => (
                <div key={item.label} className="p-3 bg-bg rounded-lg">
                  <p className="text-xs text-text-muted mb-0.5">{item.label}</p>
                  <p className="text-sm font-medium text-text">{item.value}</p>
                </div>
              ))}
            </div>
            {selectedDoc.expiryDate && (
              <div className="p-3 bg-bg rounded-lg">
                <p className="text-xs text-text-muted mb-0.5">Expires</p>
                <p className="text-sm font-mono">{format(new Date(selectedDoc.expiryDate), 'd MMM yyyy')}</p>
              </div>
            )}
            {selectedDoc.tags && selectedDoc.tags.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-text-muted mb-2">Tags</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedDoc.tags.map((t) => <TagChip key={t} label={t} color="gray" />)}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Upload Document"
        subtitle="Register a new document" size="lg"
        footer={
          <>
            <button onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
            <button onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending} className="btn-primary">
              {createMutation.isPending ? 'Uploading...' : 'Upload'}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">Document Title *</label>
            <input className="input" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          </div>
          <div>
            <label className="label">Type *</label>
            <select className="select" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
              <option value="">Select...</option>
              {DOC_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Category</label>
            <input className="input" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} />
          </div>
          <div>
            <label className="label">Lab</label>
            <select className="select" value={form.labId} onChange={(e) => setForm((f) => ({ ...f, labId: e.target.value }))}>
              <option value="">Select lab...</option>
              {(labs || []).map((l: { id: string; name: string }) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Version</label>
            <input className="input" value={form.version} onChange={(e) => setForm((f) => ({ ...f, version: e.target.value }))} placeholder="1.0" />
          </div>
          <div>
            <label className="label">File URL</label>
            <input className="input" value={form.fileUrl} onChange={(e) => setForm((f) => ({ ...f, fileUrl: e.target.value }))} placeholder="s3://..." />
          </div>
          <div>
            <label className="label">File Type</label>
            <select className="select" value={form.fileType} onChange={(e) => setForm((f) => ({ ...f, fileType: e.target.value }))}>
              {['pdf', 'docx', 'xlsx', 'png', 'jpg', 'zip'].map((t) => <option key={t} value={t}>{t.toUpperCase()}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Expiry Date</label>
            <input type="date" className="input" value={form.expiryDate} onChange={(e) => setForm((f) => ({ ...f, expiryDate: e.target.value }))} />
          </div>
          <div className="col-span-2">
            <label className="label">Tags (comma-separated)</label>
            <input className="input" value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} placeholder="e.g. GMP, validation, QC" />
          </div>
        </div>
      </Modal>
    </div>
  );
}
