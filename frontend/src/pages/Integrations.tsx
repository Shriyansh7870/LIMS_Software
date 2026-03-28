import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Plug, RefreshCw, Settings, CheckCircle2, XCircle, Clock, Zap } from 'lucide-react';
import api from '@/lib/api';
import PageHeader from '@/components/ui/PageHeader';
import PillBadge from '@/components/ui/PillBadge';
import Modal from '@/components/ui/Modal';
import { format } from 'date-fns';

interface Integration {
  id: string;
  name: string;
  type: string;
  provider: string;
  status: string;
  endpoint: string;
  lastSync?: string;
  syncFrequency: string;
  recordsSynced: number;
  errorCount: number;
  config: Record<string, string>;
}

const INTEGRATION_ICONS: Record<string, string> = {
  erp: '🏢',
  lims: '🧪',
  qms: '✅',
  crm: '👥',
  scm: '📦',
  analytics: '📊',
  notification: '🔔',
  storage: '☁️',
};

function StatusIcon({ status }: { status: string }) {
  if (status === 'active') return <CheckCircle2 size={14} className="text-risk-low" />;
  if (status === 'error') return <XCircle size={14} className="text-risk-high" />;
  if (status === 'inactive') return <Clock size={14} className="text-text-dim" />;
  return <RefreshCw size={14} className="text-risk-medium" />;
}

export default function Integrations() {
  const [showCreate, setShowCreate] = useState(false);
  const [selectedInt, setSelectedInt] = useState<Integration | null>(null);
  const [form, setForm] = useState({
    name: '', type: '', provider: '', endpoint: '', syncFrequency: 'hourly', apiKey: '',
  });
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['integrations'],
    queryFn: () => api.get('/integrations').then((r) => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (payload: typeof form) => api.post('/integrations', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      setShowCreate(false);
      setForm({ name: '', type: '', provider: '', endpoint: '', syncFrequency: 'hourly', apiKey: '' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.put(`/integrations/${id}`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['integrations'] }),
  });

  const integrations = data || [];
  const activeCount = integrations.filter((i: Integration) => i.status === 'active').length;
  const errorCount = integrations.filter((i: Integration) => i.status === 'error').length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Integrations"
        subtitle={`${integrations.length} integrations · ${activeCount} active · ${errorCount} errors`}
        actions={
          <button onClick={() => setShowCreate(true)} className="btn-primary"><Plus size={13} /> New Integration</button>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: integrations.length, color: 'text-text' },
          { label: 'Active', value: activeCount, color: 'text-risk-low' },
          { label: 'Errors', value: errorCount, color: 'text-risk-high' },
          { label: 'Records Synced', value: integrations.reduce((s: number, i: Integration) => s + (i.recordsSynced || 0), 0).toLocaleString(), color: 'text-teal' },
        ].map((card) => (
          <div key={card.label} className="card p-4 text-center">
            <p className={`text-2xl font-bold font-syne ${card.color}`}>{card.value}</p>
            <p className="text-xs text-text-muted mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Integration cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-40 bg-white rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {integrations.map((int: Integration) => (
            <div key={int.id} onClick={() => setSelectedInt(int)}
              className="card card-hover p-4 cursor-pointer space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{INTEGRATION_ICONS[int.type] || '🔌'}</span>
                  <div>
                    <p className="font-semibold text-text text-sm leading-tight">{int.name}</p>
                    <p className="text-xs text-text-dim">{int.provider}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <StatusIcon status={int.status} />
                  <PillBadge value={int.status} showDot />
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs text-text-muted">
                <span className="flex items-center gap-1"><RefreshCw size={10} /> {int.syncFrequency}</span>
                {int.recordsSynced > 0 && <span>{int.recordsSynced.toLocaleString()} records</span>}
                {int.errorCount > 0 && (
                  <span className="text-risk-high font-medium">{int.errorCount} errors</span>
                )}
              </div>

              {int.lastSync && (
                <p className="text-[10px] text-text-dim">
                  Last sync: {format(new Date(int.lastSync), 'd MMM yyyy HH:mm')}
                </p>
              )}

              {int.status === 'error' && (
                <div className="flex items-center gap-1.5 p-2 bg-risk-high/5 rounded-lg border border-risk-high/20">
                  <XCircle size={10} className="text-risk-high flex-shrink-0" />
                  <p className="text-[10px] text-risk-high">Integration error — click to review</p>
                </div>
              )}
            </div>
          ))}

          {/* Add new card */}
          <button onClick={() => setShowCreate(true)}
            className="card border-2 border-dashed border-border hover:border-teal hover:bg-teal/5 p-4 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer text-text-muted hover:text-teal h-40">
            <div className="w-10 h-10 rounded-xl bg-bg flex items-center justify-center">
              <Plus size={18} />
            </div>
            <p className="text-sm font-medium">Add Integration</p>
          </button>
        </div>
      )}

      {/* Detail Modal */}
      <Modal isOpen={!!selectedInt} onClose={() => setSelectedInt(null)}
        title={selectedInt?.name || ''} subtitle={`${selectedInt?.type?.toUpperCase()} · ${selectedInt?.provider}`} size="md"
        footer={
          <div className="flex justify-between w-full">
            <div className="flex gap-2">
              <button
                onClick={() => selectedInt && updateMutation.mutate({ id: selectedInt.id, status: selectedInt.status === 'active' ? 'inactive' : 'active' })}
                disabled={updateMutation.isPending}
                className="btn-secondary text-sm">
                {selectedInt?.status === 'active' ? 'Disable' : 'Enable'}
              </button>
            </div>
            <button onClick={() => setSelectedInt(null)} className="btn-secondary">Close</button>
          </div>
        }
      >
        {selectedInt && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <StatusIcon status={selectedInt.status} />
              <PillBadge value={selectedInt.status} showDot />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Type', value: selectedInt.type?.toUpperCase() },
                { label: 'Sync Frequency', value: selectedInt.syncFrequency },
                { label: 'Records Synced', value: selectedInt.recordsSynced?.toLocaleString() || '0' },
                { label: 'Error Count', value: String(selectedInt.errorCount || 0) },
              ].map((item) => (
                <div key={item.label} className="p-3 bg-bg rounded-lg">
                  <p className="text-xs text-text-muted mb-0.5">{item.label}</p>
                  <p className="text-sm font-medium text-text">{item.value}</p>
                </div>
              ))}
            </div>
            <div className="p-3 bg-bg rounded-lg">
              <p className="text-xs text-text-muted mb-0.5">Endpoint</p>
              <p className="text-xs font-mono text-text break-all">{selectedInt.endpoint || '—'}</p>
            </div>
            {selectedInt.lastSync && (
              <div className="p-3 bg-bg rounded-lg">
                <p className="text-xs text-text-muted mb-0.5">Last Sync</p>
                <p className="text-sm font-mono">{format(new Date(selectedInt.lastSync), 'd MMM yyyy HH:mm')}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Integration"
        subtitle="Connect an external system" size="md"
        footer={
          <>
            <button onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
            <button onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending} className="btn-primary">
              {createMutation.isPending ? 'Connecting...' : 'Connect'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Integration Name *</label>
            <input className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. SAP ERP Connector" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Type</label>
              <select className="select" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
                <option value="">Select...</option>
                {Object.keys(INTEGRATION_ICONS).map((t) => <option key={t} value={t}>{t.toUpperCase()}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Provider</label>
              <input className="input" value={form.provider} onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value }))} placeholder="e.g. SAP, Oracle" />
            </div>
          </div>
          <div>
            <label className="label">Endpoint URL *</label>
            <input className="input" value={form.endpoint} onChange={(e) => setForm((f) => ({ ...f, endpoint: e.target.value }))} placeholder="https://..." />
          </div>
          <div>
            <label className="label">API Key</label>
            <input type="password" className="input" value={form.apiKey} onChange={(e) => setForm((f) => ({ ...f, apiKey: e.target.value }))} placeholder="Securely stored..." />
          </div>
          <div>
            <label className="label">Sync Frequency</label>
            <select className="select" value={form.syncFrequency} onChange={(e) => setForm((f) => ({ ...f, syncFrequency: e.target.value }))}>
              {['realtime', 'hourly', 'daily', 'weekly', 'manual'].map((f) => (
                <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}
