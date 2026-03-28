import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { CheckCircle2, Circle, ChevronRight, Building2, FileCheck, Wrench, Users, Rocket } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import TagChip from '@/components/ui/TagChip';

const STEPS = [
  { id: 1, title: 'Organisation Details', icon: Building2, description: 'Basic partner information' },
  { id: 2, title: 'Capabilities & Scope', icon: Wrench, description: 'Testing capabilities and specialisations' },
  { id: 3, title: 'Certifications', icon: FileCheck, description: 'Existing certifications and accreditations' },
  { id: 4, title: 'Contacts', icon: Users, description: 'Key contacts and roles' },
  { id: 5, title: 'Review & Submit', icon: Rocket, description: 'Final review before submission' },
];

const CAPABILITIES_LIST = ['HPLC', 'GC', 'Microbiology', 'Stability Testing', 'Dissolution', 'Spectroscopy', 'Toxicology', 'Bioassay', 'Elemental Analysis', 'Particle Size', 'Karl Fischer', 'In Vitro'];
const CERT_LIST = ['ISO 9001:2015', 'ISO 17025:2017', 'WHO-GMP', 'US FDA', 'EU GMP', 'NABL', 'CDSCO', 'Schedule M'];

interface FormData {
  name: string;
  type: string;
  country: string;
  city: string;
  address: string;
  website: string;
  capabilities: string[];
  specialisations: string;
  turnaroundDays: string;
  minOrderValue: string;
  certifications: string[];
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  qaContactName: string;
  qaContactEmail: string;
  additionalNotes: string;
}

function StepIndicator({ step, current, completed }: { step: typeof STEPS[0]; current: number; completed: boolean }) {
  const Icon = step.icon;
  const isActive = step.id === current;
  const isDone = completed || step.id < current;
  return (
    <div className={`flex items-center gap-2 ${step.id === STEPS.length ? '' : 'flex-1'}`}>
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${
        isActive ? 'bg-teal text-white' : isDone ? 'bg-teal/10 text-teal' : 'bg-bg text-text-muted'
      }`}>
        {isDone ? <CheckCircle2 size={14} /> : <Icon size={14} />}
        <span className="text-xs font-medium hidden md:block">{step.title}</span>
        <span className="text-xs font-medium md:hidden">{step.id}</span>
      </div>
      {step.id < STEPS.length && <div className={`flex-1 h-0.5 mx-1 rounded-full hidden md:block ${isDone ? 'bg-teal' : 'bg-border'}`} />}
    </div>
  );
}

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState<FormData>({
    name: '', type: 'contract_lab', country: 'India', city: '', address: '', website: '',
    capabilities: [], specialisations: '', turnaroundDays: '', minOrderValue: '',
    certifications: [], contactName: '', contactEmail: '', contactPhone: '',
    qaContactName: '', qaContactEmail: '', additionalNotes: '',
  });

  const submitMutation = useMutation({
    mutationFn: () =>
      api.post('/partners', {
        name: form.name,
        type: form.type,
        country: form.country,
        city: form.city,
        address: form.address,
        website: form.website,
        capabilities: form.capabilities,
        specialisations: form.specialisations.split(',').map((s) => s.trim()).filter(Boolean),
        turnaroundDays: form.turnaroundDays ? Number(form.turnaroundDays) : undefined,
        contactName: form.contactName,
        contactEmail: form.contactEmail,
        contactPhone: form.contactPhone,
        qaContactName: form.qaContactName,
        qaContactEmail: form.qaContactEmail,
        notes: form.additionalNotes,
      }),
    onSuccess: () => setSubmitted(true),
  });

  const toggleCapability = (cap: string) =>
    setForm((f) => ({
      ...f,
      capabilities: f.capabilities.includes(cap) ? f.capabilities.filter((c) => c !== cap) : [...f.capabilities, cap],
    }));

  const toggleCert = (cert: string) =>
    setForm((f) => ({
      ...f,
      certifications: f.certifications.includes(cert) ? f.certifications.filter((c) => c !== cert) : [...f.certifications, cert],
    }));

  const canProceed = () => {
    if (currentStep === 1) return form.name.trim() && form.city.trim();
    if (currentStep === 2) return form.capabilities.length > 0;
    if (currentStep === 4) return form.contactName.trim() && form.contactEmail.trim();
    return true;
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
          <div className="w-20 h-20 rounded-full bg-teal/10 flex items-center justify-center mb-5 mx-auto">
            <CheckCircle2 size={36} className="text-teal" />
          </div>
        </motion.div>
        <h2 className="text-2xl font-bold font-syne text-text mb-2">Partner Onboarded!</h2>
        <p className="text-text-muted max-w-sm">
          <strong>{form.name}</strong> has been registered. The onboarding workflow (WF-004) has been automatically triggered.
        </p>
        <div className="mt-6 flex gap-3">
          <button onClick={() => { setSubmitted(false); setCurrentStep(1); setForm({ name: '', type: 'contract_lab', country: 'India', city: '', address: '', website: '', capabilities: [], specialisations: '', turnaroundDays: '', minOrderValue: '', certifications: [], contactName: '', contactEmail: '', contactPhone: '', qaContactName: '', qaContactEmail: '', additionalNotes: '' }); }}
            className="btn-secondary">Onboard Another</button>
          <a href="/partners" className="btn-primary">View Partners</a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-syne text-text">Partner Onboarding</h1>
        <p className="text-text-muted text-sm mt-1">Register a new lab or supply chain partner in 5 steps</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-0">
        {STEPS.map((step) => (
          <StepIndicator key={step.id} step={step} current={currentStep} completed={false} />
        ))}
      </div>

      {/* Step content */}
      <div className="card p-6">
        <div className="mb-5">
          <h2 className="text-lg font-semibold font-syne text-text">{STEPS[currentStep - 1].title}</h2>
          <p className="text-sm text-text-muted">{STEPS[currentStep - 1].description}</p>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={currentStep} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }}>

            {/* Step 1: Organisation */}
            {currentStep === 1 && (
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">Organisation Name *</label>
                  <input className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Full legal name of the partner organisation" />
                </div>
                <div>
                  <label className="label">Partner Type</label>
                  <select className="select" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
                    <option value="contract_lab">Contract Lab</option>
                    <option value="raw_material">Raw Material Supplier</option>
                    <option value="equipment_supplier">Equipment Supplier</option>
                    <option value="logistics">Logistics Partner</option>
                  </select>
                </div>
                <div>
                  <label className="label">Country</label>
                  <input className="input" value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} />
                </div>
                <div>
                  <label className="label">City *</label>
                  <input className="input" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Website</label>
                  <input className="input" value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} placeholder="https://..." />
                </div>
                <div className="col-span-2">
                  <label className="label">Address</label>
                  <textarea className="input resize-none" rows={2} value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
                </div>
              </div>
            )}

            {/* Step 2: Capabilities */}
            {currentStep === 2 && (
              <div className="space-y-5">
                <div>
                  <label className="label">Testing Capabilities * (select all that apply)</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {CAPABILITIES_LIST.map((cap) => (
                      <button key={cap} onClick={() => toggleCapability(cap)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                          form.capabilities.includes(cap)
                            ? 'bg-teal text-white border-teal'
                            : 'bg-white text-text-muted border-border hover:border-teal hover:text-teal'
                        }`}>
                        {cap}
                      </button>
                    ))}
                  </div>
                  {form.capabilities.length > 0 && (
                    <p className="text-xs text-teal mt-2">{form.capabilities.length} selected</p>
                  )}
                </div>
                <div>
                  <label className="label">Additional Specialisations (comma-separated)</label>
                  <input className="input" value={form.specialisations}
                    onChange={(e) => setForm((f) => ({ ...f, specialisations: e.target.value }))}
                    placeholder="e.g. Paediatric formulations, Biosimilars..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Average Turnaround (days)</label>
                    <input type="number" className="input" value={form.turnaroundDays}
                      onChange={(e) => setForm((f) => ({ ...f, turnaroundDays: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">Min Order Value (₹)</label>
                    <input type="number" className="input" value={form.minOrderValue}
                      onChange={(e) => setForm((f) => ({ ...f, minOrderValue: e.target.value }))} />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Certifications */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div>
                  <label className="label">Existing Certifications (select all that apply)</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {CERT_LIST.map((cert) => (
                      <button key={cert} onClick={() => toggleCert(cert)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                          form.certifications.includes(cert)
                            ? 'bg-teal text-white border-teal'
                            : 'bg-white text-text-muted border-border hover:border-teal hover:text-teal'
                        }`}>
                        {cert}
                      </button>
                    ))}
                  </div>
                </div>
                {form.certifications.length > 0 && (
                  <div>
                    <p className="text-xs text-text-muted mb-2">Selected ({form.certifications.length}):</p>
                    <div className="flex flex-wrap gap-1.5">
                      {form.certifications.map((c) => (
                        <TagChip key={c} label={c} color="teal" onRemove={() => toggleCert(c)} />
                      ))}
                    </div>
                  </div>
                )}
                <div className="p-3 bg-teal/5 rounded-lg border border-teal/20 text-xs text-text-muted">
                  Certifications will be verified during the onboarding process. You'll be prompted to upload supporting documents.
                </div>
              </div>
            )}

            {/* Step 4: Contacts */}
            {currentStep === 4 && (
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <p className="text-xs font-semibold text-text-muted mb-3 uppercase tracking-wide">Primary Contact</p>
                </div>
                <div>
                  <label className="label">Contact Name *</label>
                  <input className="input" value={form.contactName} onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Email *</label>
                  <input type="email" className="input" value={form.contactEmail} onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input className="input" value={form.contactPhone} onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))} />
                </div>
                <div className="col-span-2 pt-2 border-t border-border">
                  <p className="text-xs font-semibold text-text-muted mb-3 uppercase tracking-wide">QA Contact</p>
                </div>
                <div>
                  <label className="label">QA Manager Name</label>
                  <input className="input" value={form.qaContactName} onChange={(e) => setForm((f) => ({ ...f, qaContactName: e.target.value }))} />
                </div>
                <div>
                  <label className="label">QA Email</label>
                  <input type="email" className="input" value={form.qaContactEmail} onChange={(e) => setForm((f) => ({ ...f, qaContactEmail: e.target.value }))} />
                </div>
              </div>
            )}

            {/* Step 5: Review */}
            {currentStep === 5 && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Organisation', value: form.name },
                    { label: 'Type', value: form.type.replace('_', ' ') },
                    { label: 'Location', value: `${form.city}, ${form.country}` },
                    { label: 'Primary Contact', value: form.contactName },
                    { label: 'Capabilities', value: `${form.capabilities.length} selected` },
                    { label: 'Certifications', value: form.certifications.length > 0 ? `${form.certifications.length} selected` : 'None' },
                  ].map((item) => (
                    <div key={item.label} className="p-3 bg-bg rounded-lg">
                      <p className="text-xs text-text-muted mb-0.5">{item.label}</p>
                      <p className="text-sm font-medium text-text capitalize">{item.value || '—'}</p>
                    </div>
                  ))}
                </div>
                {form.capabilities.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-text-muted mb-2">Capabilities</p>
                    <div className="flex flex-wrap gap-1.5">
                      {form.capabilities.map((c) => <TagChip key={c} label={c} color="teal" />)}
                    </div>
                  </div>
                )}
                <div>
                  <label className="label">Additional Notes</label>
                  <textarea className="input resize-none" rows={3} value={form.additionalNotes}
                    onChange={(e) => setForm((f) => ({ ...f, additionalNotes: e.target.value }))}
                    placeholder="Any additional context for the onboarding team..." />
                </div>
                <div className="p-3 bg-teal/5 rounded-lg border border-teal/20 text-xs text-text-muted">
                  Submitting will register <strong>{form.name}</strong> as a partner and automatically trigger the Onboarding Workflow (WF-004) for QA approval.
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-5 border-t border-border">
          <button onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
            disabled={currentStep === 1} className="btn-secondary disabled:opacity-40">
            Back
          </button>
          <span className="text-xs text-text-muted">{currentStep} / {STEPS.length}</span>
          {currentStep < STEPS.length ? (
            <button onClick={() => setCurrentStep((s) => s + 1)} disabled={!canProceed()} className="btn-primary disabled:opacity-40">
              Continue <ChevronRight size={13} />
            </button>
          ) : (
            <button onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending || !canProceed()} className="btn-primary disabled:opacity-40">
              {submitMutation.isPending ? 'Submitting...' : 'Submit Onboarding'}
              {!submitMutation.isPending && <Rocket size={13} />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
