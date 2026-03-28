import React, { useState, useRef, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Upload, Download, FileSpreadsheet, CheckCircle2, XCircle,
  AlertTriangle, Clock, ChevronRight, Database, Activity,
  FlaskConical, Cpu, Award, TestTube, ClipboardCheck, Package, Users,
  RefreshCw, Eye, X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import PageHeader from '@/components/ui/PageHeader';
import Modal from '@/components/ui/Modal';
import { format } from 'date-fns';

// ── Design tokens ─────────────────────────────────────────────────
const GOLD = '#C49A2C';
const GOLD_L = '#DDB84A';
const GOLD_FAINT = 'rgba(196,154,44,0.10)';
const GOLD_BORDER = 'rgba(196,154,44,0.30)';

// ── Template definitions ──────────────────────────────────────────
const CONFIG_TEMPLATES = [
  {
    id: 'labs',
    label: 'Labs / Departments',
    icon: FlaskConical,
    description: 'Import lab or department master records',
    fields: ['labCode', 'name', 'type', 'city', 'state', 'country', 'capacity', 'capabilities (semicolon-separated)'],
    sample: [
      ['LAB-101', 'New QC Lab', 'internal', 'Mumbai', 'Maharashtra', 'India', '3000', 'HPLC;GC'],
      ['LAB-102', 'R&D Block B', 'internal', 'Pune', 'Maharashtra', 'India', '2000', 'Dissolution'],
    ],
  },
  {
    id: 'equipment',
    label: 'Equipment',
    icon: Cpu,
    description: 'Import equipment inventory for one or more labs',
    fields: ['equipmentCode', 'name', 'type', 'labCode', 'manufacturer', 'model', 'serialNo', 'installDate (YYYY-MM-DD)', 'calibrationDue (YYYY-MM-DD)'],
    sample: [
      ['EQP-201', 'HPLC System A', 'HPLC', 'LAB-001', 'Waters', 'Alliance e2695', 'SN-12345', '2023-01-15', '2026-01-15'],
      ['EQP-202', 'GC System B', 'GC', 'LAB-001', 'Agilent', '7890B', 'SN-67890', '2022-06-01', '2025-06-01'],
    ],
  },
  {
    id: 'certifications',
    label: 'Certifications',
    icon: Award,
    description: 'Import certification records for labs or partners',
    fields: ['certCode', 'name', 'labCode', 'issuer', 'validFrom (YYYY-MM-DD)', 'validTo (YYYY-MM-DD)', 'scope'],
    sample: [
      ['CERT-301', 'ISO 9001:2015', 'LAB-001', 'Bureau Veritas', '2024-01-01', '2027-01-01', 'QMS'],
      ['CERT-302', 'NABL Accreditation', 'LAB-002', 'NABL', '2023-06-15', '2026-06-15', 'Chemical Testing'],
    ],
  },
  {
    id: 'partners',
    label: 'Partners',
    icon: Users,
    description: 'Import external partner / contract lab records',
    fields: ['partnerCode', 'name', 'type', 'contactPerson', 'email', 'phone', 'city', 'state', 'country', 'specialization'],
    sample: [
      ['PART-401', 'BioTech CRO', 'contract_lab', 'Rajesh Kumar', 'raj@biotech.com', '9876543210', 'Delhi', 'Delhi', 'India', 'Bioassay'],
    ],
  },
];

const OPERATIONAL_TEMPLATES = [
  {
    id: 'test_requests',
    label: 'Test Requests',
    icon: TestTube,
    description: 'Import test requests submitted by labs',
    fields: ['sampleId', 'labCode', 'testType', 'priority (urgent/routine/stability)', 'requestDate (YYYY-MM-DD)', 'requestedBy', 'notes'],
    sample: [
      ['SAMP-1001', 'LAB-001', 'HPLC Analysis', 'routine', '2026-03-15', 'Analyst A', 'FFS batch QC'],
      ['SAMP-1002', 'LAB-002', 'Microbial Count', 'urgent', '2026-03-16', 'Analyst B', ''],
    ],
  },
  {
    id: 'capa',
    label: 'CAPA / Deviations',
    icon: AlertTriangle,
    description: 'Import CAPA entries and deviation reports',
    fields: ['capaCode', 'title', 'labCode', 'severity (critical/major/minor/observation)', 'rootCause', 'assignee', 'dueDate (YYYY-MM-DD)'],
    sample: [
      ['CAPA-5001', 'pH meter calibration drift', 'LAB-001', 'major', 'Sensor aging', 'Sneha Patel', '2026-04-30'],
      ['CAPA-5002', 'Out-of-spec dissolution', 'LAB-003', 'critical', 'Instrument malfunction', 'Rohit Verma', '2026-04-15'],
    ],
  },
  {
    id: 'audits',
    label: 'Audit Records',
    icon: ClipboardCheck,
    description: 'Import completed or scheduled audit records',
    fields: ['auditCode', 'labCode', 'type (internal/external/regulatory)', 'auditorName', 'auditDate (YYYY-MM-DD)', 'score (0-100)', 'status (completed/scheduled/in_progress)'],
    sample: [
      ['AUD-6001', 'LAB-001', 'internal', 'Arjun Sharma', '2026-03-10', '88', 'completed'],
      ['AUD-6002', 'LAB-003', 'regulatory', 'WHO Inspector', '2026-04-20', '', 'scheduled'],
    ],
  },
  {
    id: 'batches',
    label: 'Batch Records',
    icon: Package,
    description: 'Import batch manufacturing / testing records',
    fields: ['batchNo', 'product', 'labCode', 'batchDate (YYYY-MM-DD)', 'quantity', 'unit', 'yield (%)', 'status (released/quarantine/rejected)'],
    sample: [
      ['B-2026-001', 'Amoxicillin 500mg', 'LAB-001', '2026-03-01', '100000', 'tablets', '97.2', 'released'],
      ['B-2026-002', 'Paracetamol Syrup', 'LAB-002', '2026-03-05', '5000', 'bottles', '98.8', 'released'],
    ],
  },
];

// ── CSV generation helper ─────────────────────────────────────────
function generateCSV(fields: string[], rows: string[][]): string {
  const header = fields.join(',');
  const body = rows.map(r => r.map(v => v.includes(',') ? `"${v}"` : v).join(','));
  return [header, ...body].join('\n');
}

function downloadCSV(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Sub-components ────────────────────────────────────────────────
interface ImportResult {
  id: string;
  type: string;
  templateId: string;
  filename: string;
  totalRows: number;
  successRows: number;
  errorRows: number;
  status: 'success' | 'partial' | 'failed';
  errors: { row: number; message: string }[];
  importedAt: string;
}

interface DropZoneProps {
  onFile: (file: File) => void;
  disabled?: boolean;
}

function DropZone({ onFile, disabled }: DropZoneProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  }, [onFile]);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200"
      style={{
        borderColor: dragging ? GOLD : GOLD_BORDER,
        background: dragging ? GOLD_FAINT : 'transparent',
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        className="hidden"
        disabled={disabled}
        onChange={(e) => { if (e.target.files?.[0]) onFile(e.target.files[0]); }}
      />
      <div className="flex flex-col items-center gap-3">
        <div className="w-14 h-14 rounded-full flex items-center justify-center"
          style={{ background: GOLD_FAINT, border: `1px solid ${GOLD_BORDER}` }}>
          <Upload size={24} style={{ color: GOLD }} />
        </div>
        <div>
          <p className="font-semibold text-text text-sm">
            Drop your CSV or Excel file here
          </p>
          <p className="text-text-muted text-xs mt-1">
            .csv, .xlsx, .xls &nbsp;·&nbsp; Max 10 MB &nbsp;·&nbsp; Up to 5,000 rows per import
          </p>
        </div>
        <span className="px-4 py-1.5 rounded-lg text-xs font-semibold border transition-colors"
          style={{ color: GOLD, borderColor: GOLD_BORDER, background: GOLD_FAINT }}>
          Browse File
        </span>
      </div>
    </div>
  );
}

interface TemplateCardProps {
  template: typeof CONFIG_TEMPLATES[0];
  selected: boolean;
  onSelect: () => void;
  onDownload: () => void;
}

function TemplateCard({ template, selected, onSelect, onDownload }: TemplateCardProps) {
  const Icon = template.icon;
  return (
    <div
      onClick={onSelect}
      className="rounded-xl border p-4 cursor-pointer transition-all duration-150 hover:-translate-y-0.5"
      style={{
        borderColor: selected ? GOLD : 'var(--border, #E2E8F0)',
        background: selected ? GOLD_FAINT : 'white',
        boxShadow: selected ? `0 0 0 2px ${GOLD}33` : undefined,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: selected ? GOLD_FAINT : '#F8FAFC', border: `1px solid ${selected ? GOLD_BORDER : '#E2E8F0'}` }}>
            <Icon size={16} style={{ color: selected ? GOLD : '#64748B' }} />
          </div>
          <div>
            <p className="text-sm font-semibold text-text">{template.label}</p>
            <p className="text-xs text-text-muted mt-0.5">{template.description}</p>
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDownload(); }}
          className="flex-shrink-0 p-1.5 rounded-lg transition-colors hover:bg-slate-100"
          title="Download template CSV"
        >
          <Download size={14} style={{ color: GOLD }} />
        </button>
      </div>
      {selected && (
        <div className="mt-3 pt-3 border-t" style={{ borderColor: GOLD_BORDER }}>
          <p className="text-xs text-text-muted font-medium mb-1">Required columns:</p>
          <div className="flex flex-wrap gap-1">
            {template.fields.map((f) => (
              <span key={f} className="text-xs px-2 py-0.5 rounded-md bg-white border"
                style={{ color: '#475569', borderColor: '#CBD5E1' }}>
                {f}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ResultBadge({ status }: { status: ImportResult['status'] }) {
  const map = {
    success: { label: 'Success', color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0', icon: CheckCircle2 },
    partial: { label: 'Partial', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', icon: AlertTriangle },
    failed:  { label: 'Failed',  color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', icon: XCircle },
  };
  const s = map[status];
  const Icon = s.icon;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border"
      style={{ color: s.color, background: s.bg, borderColor: s.border }}>
      <Icon size={11} />
      {s.label}
    </span>
  );
}

// ── Mock import history (would normally come from API) ────────────
const MOCK_HISTORY: ImportResult[] = [
  { id: '1', type: 'config', templateId: 'labs', filename: 'labs_march_2026.csv', totalRows: 12, successRows: 12, errorRows: 0, status: 'success', errors: [], importedAt: '2026-03-20T09:15:00Z' },
  { id: '2', type: 'operational', templateId: 'test_requests', filename: 'test_requests_wk12.csv', totalRows: 45, successRows: 43, errorRows: 2, status: 'partial', errors: [{ row: 18, message: 'Invalid labCode: LAB-999' }, { row: 34, message: 'Missing required field: requestDate' }], importedAt: '2026-03-22T14:30:00Z' },
  { id: '3', type: 'config', templateId: 'equipment', filename: 'new_equipment_q1.xlsx', totalRows: 8, successRows: 8, errorRows: 0, status: 'success', errors: [], importedAt: '2026-03-18T11:00:00Z' },
  { id: '4', type: 'operational', templateId: 'capa', filename: 'capa_deviations.csv', totalRows: 20, successRows: 17, errorRows: 3, status: 'partial', errors: [{ row: 5, message: 'Severity must be critical/major/minor/observation' }, { row: 11, message: 'dueDate format invalid' }, { row: 19, message: 'Lab not found: LAB-099' }], importedAt: '2026-03-23T08:45:00Z' },
];

// ── Main page ─────────────────────────────────────────────────────
type Tab = 'config' | 'operational';

export default function BulkImport() {
  const [activeTab, setActiveTab] = useState<Tab>('config');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [detailResult, setDetailResult] = useState<ImportResult | null>(null);
  const [history, setHistory] = useState<ImportResult[]>(MOCK_HISTORY);

  const templates = activeTab === 'config' ? CONFIG_TEMPLATES : OPERATIONAL_TEMPLATES;
  const currentTemplate = templates.find((t) => t.id === selectedTemplate);

  // Reset selection when tab changes
  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setSelectedTemplate('');
    setPendingFile(null);
    setImportResult(null);
  };

  const handleDownloadTemplate = (template: typeof CONFIG_TEMPLATES[0]) => {
    const csv = generateCSV(template.fields, template.sample);
    downloadCSV(`template_${template.id}.csv`, csv);
  };

  const importMutation = useMutation({
    mutationFn: async ({ file, templateId }: { file: File; templateId: string }) => {
      // Build FormData (mock API accepts any POST body)
      const formData = new FormData();
      formData.append('file', file);
      formData.append('templateId', templateId);
      formData.append('type', activeTab);

      // Simulate parse delay
      await new Promise((r) => setTimeout(r, 1200));

      // Simulate row count from file size heuristic
      const approxRows = Math.max(1, Math.floor(file.size / 80));
      const errorCount = Math.random() > 0.65 ? Math.floor(Math.random() * Math.min(3, approxRows)) : 0;
      const successCount = approxRows - errorCount;
      const status: ImportResult['status'] = errorCount === 0 ? 'success' : errorCount < approxRows ? 'partial' : 'failed';

      const mockErrors = Array.from({ length: errorCount }, (_, i) => ({
        row: 2 + Math.floor(Math.random() * approxRows),
        message: ['Invalid value in required field', 'Reference code not found', 'Date format must be YYYY-MM-DD', 'Duplicate record detected'][Math.floor(Math.random() * 4)],
      }));

      return {
        id: String(Date.now()),
        type: activeTab,
        templateId,
        filename: file.name,
        totalRows: approxRows,
        successRows: successCount,
        errorRows: errorCount,
        status,
        errors: mockErrors,
        importedAt: new Date().toISOString(),
      } as ImportResult;
    },
    onSuccess: (result) => {
      setImportResult(result);
      setHistory((prev) => [result, ...prev]);
      setPendingFile(null);
    },
  });

  const handleImport = () => {
    if (!pendingFile || !selectedTemplate) return;
    setImportResult(null);
    importMutation.mutate({ file: pendingFile, templateId: selectedTemplate });
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Bulk Import"
        subtitle="Import configuration data and operational records via CSV or Excel templates"
      />

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 rounded-xl w-fit"
        style={{ background: '#F1F5F9', border: '1px solid #E2E8F0' }}>
        {([
          { id: 'config' as Tab, label: 'Configuration Import', icon: Database },
          { id: 'operational' as Tab, label: 'Operational Import', icon: Activity },
        ] as const).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => handleTabChange(id)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150"
            style={activeTab === id
              ? { background: GOLD, color: 'white', boxShadow: `0 2px 8px ${GOLD}44` }
              : { background: 'transparent', color: '#64748B' }
            }
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab description */}
      <div className="rounded-xl border p-4 flex items-start gap-3"
        style={{ background: GOLD_FAINT, borderColor: GOLD_BORDER }}>
        {activeTab === 'config'
          ? <Database size={18} style={{ color: GOLD, flexShrink: 0, marginTop: 1 }} />
          : <Activity size={18} style={{ color: GOLD, flexShrink: 0, marginTop: 1 }} />
        }
        <div>
          <p className="text-sm font-semibold text-text">
            {activeTab === 'config' ? 'Configuration Import' : 'Operational Import'}
          </p>
          <p className="text-xs text-text-muted mt-0.5">
            {activeTab === 'config'
              ? 'Use this when setting up labs, departments, equipment, certifications, or partners for the first time. These are master records that define the structure of your quality ecosystem.'
              : 'Use this for regular data shared by labs and departments — test requests, CAPA deviations, audit records, and batch manufacturing data that flows into the platform on an ongoing basis.'
            }
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Left: Template selection + upload */}
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-text mb-1 flex items-center gap-2">
              <FileSpreadsheet size={15} style={{ color: GOLD }} />
              Step 1 — Select Import Template
            </h3>
            <p className="text-xs text-text-muted mb-4">
              Choose what you are importing, then download the CSV template to fill in your data.
            </p>
            <div className="space-y-2">
              {templates.map((t) => (
                <TemplateCard
                  key={t.id}
                  template={t}
                  selected={selectedTemplate === t.id}
                  onSelect={() => { setSelectedTemplate(t.id); setPendingFile(null); setImportResult(null); }}
                  onDownload={() => handleDownloadTemplate(t)}
                />
              ))}
            </div>
          </div>

          <div className={`card p-5 transition-opacity ${selectedTemplate ? '' : 'opacity-50 pointer-events-none'}`}>
            <h3 className="text-sm font-semibold text-text mb-1 flex items-center gap-2">
              <Upload size={15} style={{ color: GOLD }} />
              Step 2 — Upload Your File
            </h3>
            <p className="text-xs text-text-muted mb-4">
              Upload a filled-in CSV or Excel file matching the{' '}
              {currentTemplate ? <strong>{currentTemplate.label}</strong> : 'selected'} template.
            </p>

            {pendingFile ? (
              <div className="rounded-xl border p-4 flex items-center gap-3"
                style={{ borderColor: GOLD_BORDER, background: GOLD_FAINT }}>
                <FileSpreadsheet size={20} style={{ color: GOLD }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text truncate">{pendingFile.name}</p>
                  <p className="text-xs text-text-muted">{(pendingFile.size / 1024).toFixed(1)} KB</p>
                </div>
                <button onClick={() => setPendingFile(null)}
                  className="p-1.5 rounded-lg hover:bg-white transition-colors">
                  <X size={14} className="text-text-muted" />
                </button>
              </div>
            ) : (
              <DropZone onFile={setPendingFile} disabled={!selectedTemplate} />
            )}

            {pendingFile && (
              <button
                onClick={handleImport}
                disabled={importMutation.isPending}
                className="mt-4 w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-150 flex items-center justify-center gap-2 active:scale-[0.98]"
                style={{ background: `linear-gradient(135deg, ${GOLD_L}, ${GOLD})`, opacity: importMutation.isPending ? 0.7 : 1 }}
              >
                {importMutation.isPending
                  ? <><RefreshCw size={14} className="animate-spin" /> Processing…</>
                  : <><Upload size={14} /> Import {currentTemplate?.label}</>
                }
              </button>
            )}
          </div>
        </div>

        {/* Right: Result + History */}
        <div className="space-y-4">
          {/* Import result */}
          <AnimatePresence mode="wait">
            {(importResult || importMutation.isPending) && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="card p-5"
              >
                <h3 className="text-sm font-semibold text-text mb-3 flex items-center gap-2">
                  <Activity size={15} style={{ color: GOLD }} />
                  Import Result
                </h3>

                {importMutation.isPending ? (
                  <div className="flex flex-col items-center gap-3 py-6">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{ background: GOLD_FAINT, border: `2px solid ${GOLD_BORDER}` }}>
                      <RefreshCw size={20} style={{ color: GOLD }} className="animate-spin" />
                    </div>
                    <p className="text-sm text-text-muted">Validating and importing records…</p>
                  </div>
                ) : importResult && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-text truncate max-w-[200px]">{importResult.filename}</p>
                        <p className="text-xs text-text-muted mt-0.5">
                          {format(new Date(importResult.importedAt), 'dd MMM yyyy, hh:mm a')}
                        </p>
                      </div>
                      <ResultBadge status={importResult.status} />
                    </div>

                    {/* Row counts */}
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'Total Rows', value: importResult.totalRows, color: '#334155' },
                        { label: 'Imported', value: importResult.successRows, color: '#16A34A' },
                        { label: 'Errors', value: importResult.errorRows, color: importResult.errorRows > 0 ? '#DC2626' : '#94A3B8' },
                      ].map((s) => (
                        <div key={s.label} className="rounded-lg border p-3 text-center"
                          style={{ borderColor: '#E2E8F0', background: '#FAFAFA' }}>
                          <p className="text-xl font-bold font-syne" style={{ color: s.color }}>{s.value}</p>
                          <p className="text-xs text-text-muted mt-0.5">{s.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Progress bar */}
                    <div>
                      <div className="flex justify-between text-xs text-text-muted mb-1">
                        <span>Success rate</span>
                        <span>{importResult.totalRows > 0 ? Math.round((importResult.successRows / importResult.totalRows) * 100) : 0}%</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: '#FEE2E2' }}>
                        <div className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${importResult.totalRows > 0 ? (importResult.successRows / importResult.totalRows) * 100 : 0}%`,
                            background: importResult.status === 'success' ? '#16A34A' : GOLD,
                          }} />
                      </div>
                    </div>

                    {/* Errors */}
                    {importResult.errors.length > 0 && (
                      <div className="rounded-lg border p-3 space-y-2"
                        style={{ borderColor: '#FECACA', background: '#FEF2F2' }}>
                        <p className="text-xs font-semibold text-red-700 flex items-center gap-1">
                          <XCircle size={12} /> {importResult.errors.length} row error{importResult.errors.length > 1 ? 's' : ''} found
                        </p>
                        {importResult.errors.slice(0, 5).map((e, i) => (
                          <p key={i} className="text-xs text-red-600">
                            <span className="font-semibold">Row {e.row}:</span> {e.message}
                          </p>
                        ))}
                        {importResult.errors.length > 5 && (
                          <p className="text-xs text-red-500">…and {importResult.errors.length - 5} more errors</p>
                        )}
                      </div>
                    )}

                    {importResult.status === 'success' && (
                      <div className="rounded-lg border p-3 flex items-center gap-2"
                        style={{ borderColor: '#BBF7D0', background: '#F0FDF4' }}>
                        <CheckCircle2 size={16} className="text-green-600 flex-shrink-0" />
                        <p className="text-xs text-green-700 font-medium">
                          All {importResult.successRows} records imported successfully. Data is now available in the platform.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Import history */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-text flex items-center gap-2">
                <Clock size={15} style={{ color: GOLD }} />
                Recent Imports
              </h3>
              <span className="text-xs text-text-muted">{history.length} records</span>
            </div>

            {history.length === 0 ? (
              <div className="py-8 text-center">
                <Upload size={32} className="mx-auto text-text-dim mb-2" />
                <p className="text-sm text-text-muted">No imports yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {history.slice(0, 8).map((item) => {
                  const allTemplates = [...CONFIG_TEMPLATES, ...OPERATIONAL_TEMPLATES];
                  const tmpl = allTemplates.find((t) => t.id === item.templateId);
                  const Icon = tmpl?.icon ?? FileSpreadsheet;
                  return (
                    <div key={item.id}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-slate-50 transition-colors"
                      style={{ borderColor: '#E2E8F0' }}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: GOLD_FAINT, border: `1px solid ${GOLD_BORDER}` }}>
                        <Icon size={14} style={{ color: GOLD }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-text truncate">{item.filename}</p>
                        <p className="text-xs text-text-muted">
                          {tmpl?.label ?? item.templateId} · {item.totalRows} rows ·{' '}
                          {format(new Date(item.importedAt), 'dd MMM yyyy')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <ResultBadge status={item.status} />
                        <button
                          onClick={() => setDetailResult(item)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                          <Eye size={13} className="text-text-muted" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail modal */}
      <Modal
        isOpen={!!detailResult}
        onClose={() => setDetailResult(null)}
        title="Import Details"
        size="md"
      >
        {detailResult && (
          <div className="space-y-4 py-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-text">{detailResult.filename}</p>
                <p className="text-xs text-text-muted mt-0.5">
                  {format(new Date(detailResult.importedAt), 'dd MMM yyyy, hh:mm a')} ·{' '}
                  {detailResult.type === 'config' ? 'Configuration' : 'Operational'} import
                </p>
              </div>
              <ResultBadge status={detailResult.status} />
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Total', value: detailResult.totalRows, color: '#334155' },
                { label: 'Imported', value: detailResult.successRows, color: '#16A34A' },
                { label: 'Errors', value: detailResult.errorRows, color: detailResult.errorRows > 0 ? '#DC2626' : '#94A3B8' },
              ].map((s) => (
                <div key={s.label} className="rounded-lg border p-3 text-center" style={{ borderColor: '#E2E8F0' }}>
                  <p className="text-xl font-bold font-syne" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-xs text-text-muted">{s.label}</p>
                </div>
              ))}
            </div>

            {detailResult.errors.length > 0 ? (
              <div>
                <p className="text-xs font-semibold text-text mb-2">Error Details</p>
                <div className="rounded-lg border overflow-hidden" style={{ borderColor: '#FECACA' }}>
                  {detailResult.errors.map((e, i) => (
                    <div key={i} className={`flex gap-3 px-3 py-2 text-xs ${i % 2 === 0 ? 'bg-red-50' : 'bg-white'}`}>
                      <span className="font-semibold text-red-700 flex-shrink-0">Row {e.row}</span>
                      <span className="text-red-600">{e.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-lg border p-3 flex items-center gap-2"
                style={{ borderColor: '#BBF7D0', background: '#F0FDF4' }}>
                <CheckCircle2 size={16} className="text-green-600" />
                <p className="text-xs text-green-700">All records imported without errors.</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
