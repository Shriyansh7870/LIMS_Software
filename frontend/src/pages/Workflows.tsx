import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { GitBranch, CheckCircle2, XCircle, Clock, PlayCircle, ChevronRight, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import PageHeader from '@/components/ui/PageHeader';
import PillBadge from '@/components/ui/PillBadge';
import Modal from '@/components/ui/Modal';
import { format } from 'date-fns';

interface WorkflowTemplate {
  id: string;
  code: string;
  name: string;
  type: string;
  description: string;
  stepCount: number;
  autoTrigger: boolean;
}

interface WorkflowStep {
  id: string;
  stepNumber: number;
  name: string;
  role: string;
  status: string;
  assignee?: { name: string };
  completedAt?: string;
  notes?: string;
}

interface WorkflowRun {
  id: string;
  runCode: string;
  template: { name: string; code: string; type: string };
  status: string;
  currentStep: number;
  totalSteps: number;
  triggeredBy: { name: string };
  startedAt: string;
  completedAt?: string;
  steps: WorkflowStep[];
  entityType?: string;
  entityId?: string;
}

const STEP_ICONS: Record<string, React.ReactNode> = {
  completed: <CheckCircle2 size={14} className="text-risk-low" />,
  approved: <CheckCircle2 size={14} className="text-risk-low" />,
  rejected: <XCircle size={14} className="text-risk-high" />,
  pending: <Clock size={14} className="text-risk-medium" />,
  in_progress: <PlayCircle size={14} className="text-teal" />,
};

function StepStatus({ step }: { step: WorkflowStep }) {
  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg ${step.status === 'in_progress' ? 'bg-teal/5 border border-teal/20' : 'bg-bg'}`}>
      <div className="flex-shrink-0 flex flex-col items-center gap-1 pt-0.5">
        <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center bg-white"
          style={{
            borderColor: step.status === 'completed' || step.status === 'approved' ? '#16A34A'
              : step.status === 'rejected' ? '#DC2626'
              : step.status === 'in_progress' ? '#C49A2C' : '#CBD5E1',
          }}>
          {STEP_ICONS[step.status] || STEP_ICONS.pending}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-text">{step.name}</p>
          <span className="text-xs text-text-muted">·</span>
          <span className="text-xs text-text-muted flex items-center gap-1"><User size={10} /> {step.role}</span>
        </div>
        {step.assignee && <p className="text-xs text-text-dim mt-0.5">Assignee: {step.assignee.name}</p>}
        {step.completedAt && <p className="text-xs text-text-dim">{format(new Date(step.completedAt), 'd MMM yyyy HH:mm')}</p>}
        {step.notes && <p className="text-xs text-text mt-1 italic">"{step.notes}"</p>}
      </div>
    </div>
  );
}

export default function Workflows() {
  const [activeTab, setActiveTab] = useState<'runs' | 'templates'>('runs');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedRun, setSelectedRun] = useState<WorkflowRun | null>(null);
  const [actionModal, setActionModal] = useState<{ run: WorkflowRun; step: WorkflowStep; action: 'approve' | 'reject' } | null>(null);
  const [notes, setNotes] = useState('');
  const queryClient = useQueryClient();

  const { data: runsData, isLoading: runsLoading } = useQuery({
    queryKey: ['workflow-runs', { status: statusFilter, page }],
    queryFn: () =>
      api.get('/workflows/workflow-runs', { params: { status: statusFilter, page, limit: 20 } })
        .then((r) => r.data),
  });

  const { data: templates } = useQuery({
    queryKey: ['workflow-templates'],
    queryFn: () => api.get('/workflows').then((r) => r.data.data),
    staleTime: 600000,
  });

  const actionMutation = useMutation({
    mutationFn: ({ runId, stepId, action, stepNotes }: { runId: string; stepId: string; action: string; stepNotes: string }) =>
      api.put(`/workflows/workflow-runs/${runId}/steps/${stepId}`, { action, notes: stepNotes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-runs'] });
      if (selectedRun) {
        // Refresh selected run
        api.get('/workflows/workflow-runs', { params: { page: 1, limit: 100 } }).then((r) => {
          const updated = r.data.data?.find((run: WorkflowRun) => run.id === selectedRun.id);
          if (updated) setSelectedRun(updated);
        });
      }
      setActionModal(null);
      setNotes('');
    },
  });

  const getStatusColor = (status: string) => {
    if (status === 'completed') return 'text-risk-low';
    if (status === 'rejected') return 'text-risk-high';
    if (status === 'in_progress') return 'text-teal';
    return 'text-text-muted';
  };

  const currentStep = selectedRun?.steps?.find((s) => s.status === 'in_progress' || s.status === 'pending');

  return (
    <div className="space-y-5">
      <PageHeader
        title="Workflow Engine"
        subtitle="Approval workflows and quality processes"
      />

      {/* Tabs */}
      <div className="flex gap-1 bg-bg rounded-xl p-1 w-fit">
        {(['runs', 'templates'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab ? 'bg-white text-text shadow-sm' : 'text-text-muted hover:text-text'
            }`}>
            {tab === 'runs' ? 'Active Runs' : 'Templates'}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'runs' && (
          <motion.div key="runs" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="space-y-4">
            <div className="flex items-center gap-3">
              <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="select w-40">
                <option value="">All Status</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            {runsLoading ? (
              <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-20 bg-white rounded-xl animate-pulse" />)}</div>
            ) : (
              <div className="space-y-3">
                {(runsData?.data || []).map((run: WorkflowRun) => {
                  const progress = (run.currentStep / run.totalSteps) * 100;
                  return (
                    <div key={run.id} onClick={() => setSelectedRun(run)}
                      className="card card-hover p-4 cursor-pointer">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-teal/10 flex items-center justify-center">
                          <GitBranch size={15} className="text-teal" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-text text-sm">{run.template?.name}</p>
                            <PillBadge value={run.status} showDot />
                          </div>
                          <p className="text-xs font-mono text-text-dim mt-0.5">{run.runCode}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <div className="flex-1 bg-border rounded-full h-1.5">
                              <div className="bg-teal h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
                            </div>
                            <span className="text-[10px] text-text-muted whitespace-nowrap">
                              Step {run.currentStep}/{run.totalSteps}
                            </span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs text-text-muted">{format(new Date(run.startedAt), 'd MMM yyyy')}</p>
                          <p className="text-xs text-text-dim mt-0.5">{run.triggeredBy?.name}</p>
                          <ChevronRight size={14} className="text-text-dim mt-2 ml-auto" />
                        </div>
                      </div>
                    </div>
                  );
                })}
                {runsData?.data?.length === 0 && (
                  <div className="text-center py-12 text-text-muted">
                    <GitBranch size={32} className="mx-auto mb-3 text-border" />
                    <p>No workflow runs found</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'templates' && (
          <motion.div key="templates" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(templates || []).map((tpl: WorkflowTemplate) => (
              <div key={tpl.id} className="card p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-semibold text-text text-sm">{tpl.name}</p>
                    <p className="font-mono text-xs text-text-dim mt-0.5">{tpl.code}</p>
                  </div>
                  {tpl.autoTrigger && (
                    <span className="text-[10px] font-medium bg-teal/10 text-teal px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">Auto</span>
                  )}
                </div>
                <p className="text-xs text-text-muted leading-relaxed">{tpl.description}</p>
                <div className="flex items-center gap-2">
                  <PillBadge value={tpl.type} />
                  <span className="ml-auto text-xs text-text-muted">{tpl.stepCount} steps</span>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Run Detail Modal */}
      <Modal isOpen={!!selectedRun} onClose={() => setSelectedRun(null)}
        title={selectedRun?.template?.name || ''} subtitle={selectedRun?.runCode} size="lg">
        {selectedRun && (
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <PillBadge value={selectedRun.status} showDot />
              <span className="text-xs text-text-muted">
                Started {format(new Date(selectedRun.startedAt), 'd MMM yyyy')} by {selectedRun.triggeredBy?.name}
              </span>
            </div>

            {/* Progress bar */}
            <div>
              <div className="flex justify-between text-xs text-text-muted mb-1">
                <span>Step {selectedRun.currentStep} of {selectedRun.totalSteps}</span>
                <span>{Math.round((selectedRun.currentStep / selectedRun.totalSteps) * 100)}%</span>
              </div>
              <div className="bg-border rounded-full h-2">
                <div className="bg-teal h-2 rounded-full transition-all"
                  style={{ width: `${(selectedRun.currentStep / selectedRun.totalSteps) * 100}%` }} />
              </div>
            </div>

            {/* Steps */}
            <div className="space-y-2">
              {(selectedRun.steps || []).map((step) => (
                <StepStatus key={step.id} step={step} />
              ))}
            </div>

            {/* Action buttons for current step */}
            {currentStep && selectedRun.status === 'in_progress' && (
              <div className="flex gap-2 pt-2 border-t border-border">
                <p className="text-xs text-text-muted self-center flex-1">Awaiting: <strong>{currentStep.name}</strong></p>
                <button
                  onClick={() => setActionModal({ run: selectedRun, step: currentStep, action: 'reject' })}
                  className="btn-ghost text-risk-high hover:bg-risk-high/10 text-sm">
                  <XCircle size={13} /> Reject
                </button>
                <button
                  onClick={() => setActionModal({ run: selectedRun, step: currentStep, action: 'approve' })}
                  className="btn-primary text-sm">
                  <CheckCircle2 size={13} /> Approve
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Action Confirmation Modal */}
      <Modal isOpen={!!actionModal} onClose={() => setActionModal(null)}
        title={actionModal?.action === 'approve' ? 'Approve Step' : 'Reject Step'}
        subtitle={actionModal?.step?.name} size="sm"
        footer={
          <>
            <button onClick={() => setActionModal(null)} className="btn-secondary">Cancel</button>
            <button
              onClick={() => actionModal && actionMutation.mutate({
                runId: actionModal.run.id,
                stepId: actionModal.step.id,
                action: actionModal.action,
                stepNotes: notes,
              })}
              disabled={actionMutation.isPending}
              className={actionModal?.action === 'approve' ? 'btn-primary' : 'btn-primary bg-risk-high border-risk-high hover:bg-risk-high/80'}
            >
              {actionMutation.isPending ? 'Processing...' : actionModal?.action === 'approve' ? 'Confirm Approve' : 'Confirm Reject'}
            </button>
          </>
        }
      >
        <div>
          <label className="label">Notes (optional)</label>
          <textarea className="input resize-none" rows={3} value={notes}
            onChange={(e) => setNotes(e.target.value)} placeholder="Add notes for this action..." />
        </div>
      </Modal>
    </div>
  );
}
