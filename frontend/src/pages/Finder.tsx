import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, MapPin, Star, Filter, ChevronRight } from 'lucide-react';
import api from '@/lib/api';
import PageHeader from '@/components/ui/PageHeader';
import PillBadge from '@/components/ui/PillBadge';
import RiskRing from '@/components/ui/RiskRing';
import TagChip from '@/components/ui/TagChip';
import SideDrawer from '@/components/ui/SideDrawer';
import ProgressBar from '@/components/ui/ProgressBar';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';

interface LabResult {
  id: string;
  labCode: string;
  name: string;
  city: string;
  country: string;
  type: string;
  status: string;
  matchScore: number;
  auditScore: number;
  certCount: number;
  capabilities: string[];
  specialisations: string[];
  activeCerts: string[];
  contactEmail: string;
  contactPhone: string;
  turnaroundDays: number;
}

const CAPABILITIES = ['HPLC', 'GC', 'Microbiology', 'Stability Testing', 'Dissolution', 'Spectroscopy', 'Toxicology', 'Bioassay'];

export default function Finder() {
  const [query, setQuery] = useState('');
  const [capabilityFilter, setCapabilityFilter] = useState<string[]>([]);
  const [certFilter, setCertFilter] = useState('');
  const [minScore, setMinScore] = useState('');
  const [selectedLab, setSelectedLab] = useState<LabResult | null>(null);
  const [searched, setSearched] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['lab-finder', { query, capabilities: capabilityFilter, cert: certFilter, minScore }],
    queryFn: () =>
      api.get('/partners/finder', {
        params: {
          query,
          capabilities: capabilityFilter.join(','),
          cert: certFilter,
          minScore,
        },
      }).then((r) => r.data.data),
    enabled: false,
  });

  const handleSearch = () => {
    setSearched(true);
    refetch();
  };

  const toggleCapability = (cap: string) => {
    setCapabilityFilter((prev) =>
      prev.includes(cap) ? prev.filter((c) => c !== cap) : [...prev, cap]
    );
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Lab Finder"
        subtitle="Match labs by capability, certification, and quality score"
      />

      {/* Search Panel */}
      <div className="card p-5 space-y-4">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
          <input
            className="input pl-9 text-base"
            placeholder="Search by name, city, specialisation..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>

        <div>
          <p className="text-xs font-semibold text-text-muted mb-2">Capabilities Required</p>
          <div className="flex flex-wrap gap-2">
            {CAPABILITIES.map((cap) => (
              <button
                key={cap}
                onClick={() => toggleCapability(cap)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                  capabilityFilter.includes(cap)
                    ? 'bg-teal text-white border-teal'
                    : 'bg-white text-text-muted border-border hover:border-teal hover:text-teal'
                }`}
              >
                {cap}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-xs text-text-muted whitespace-nowrap">Certification:</label>
            <select className="select w-36" value={certFilter} onChange={(e) => setCertFilter(e.target.value)}>
              <option value="">Any</option>
              {['ISO 9001', 'ISO 17025', 'GMP', 'NABL', 'WHO-GMP', 'US FDA'].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-text-muted whitespace-nowrap">Min Audit Score:</label>
            <select className="select w-24" value={minScore} onChange={(e) => setMinScore(e.target.value)}>
              <option value="">Any</option>
              <option value="60">60+</option>
              <option value="70">70+</option>
              <option value="80">80+</option>
              <option value="90">90+</option>
            </select>
          </div>
          <button onClick={handleSearch} className="btn-primary ml-auto">
            <Search size={13} /> Find Labs
          </button>
        </div>
      </div>

      {/* Results */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 rounded-xl bg-white animate-pulse" />)}
        </div>
      )}

      {searched && !isLoading && data && data.length === 0 && (
        <div className="card p-12 text-center">
          <Search size={32} className="text-text-dim mx-auto mb-3" />
          <p className="text-text font-medium">No labs matched your criteria</p>
          <p className="text-text-muted text-sm mt-1">Try relaxing the filters or search by a different term.</p>
        </div>
      )}

      {data && data.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-text-muted">{data.length} labs matched</p>
          {data.map((lab: LabResult, idx: number) => (
            <div
              key={lab.id}
              onClick={() => setSelectedLab(lab)}
              className="card card-hover p-4 cursor-pointer"
            >
              <div className="flex items-start gap-4">
                {/* Rank badge */}
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-teal/10 flex items-center justify-center">
                  <span className="text-xs font-bold text-teal">#{idx + 1}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-text text-sm">{lab.name}</p>
                    <PillBadge value={lab.status} showDot />
                    <PillBadge value={lab.type} />
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <MapPin size={11} className="text-text-dim" />
                    <p className="text-xs text-text-dim">{lab.city}, {lab.country}</p>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {(lab.capabilities || []).slice(0, 4).map((c) => (
                      <TagChip key={c} label={c} color={capabilityFilter.includes(c) ? 'teal' : 'gray'} />
                    ))}
                    {lab.capabilities?.length > 4 && (
                      <span className="text-[10px] text-text-dim self-center">+{lab.capabilities.length - 4}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-center">
                    <p className="text-[10px] text-text-muted mb-1">Audit</p>
                    <RiskRing score={100 - lab.auditScore} size={40} strokeWidth={3} />
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-text-muted mb-1">Match</p>
                    <p className={`text-lg font-bold font-syne ${lab.matchScore >= 80 ? 'text-risk-low' : lab.matchScore >= 60 ? 'text-risk-medium' : 'text-risk-high'}`}>
                      {lab.matchScore}
                    </p>
                  </div>
                  <ChevronRight size={14} className="text-text-dim" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Drawer */}
      <SideDrawer
        isOpen={!!selectedLab}
        onClose={() => setSelectedLab(null)}
        title={selectedLab?.name || ''}
        subtitle={`${selectedLab?.labCode} · ${selectedLab?.city}, ${selectedLab?.country}`}
        width={500}
      >
        {selectedLab && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 flex-wrap">
              <PillBadge value={selectedLab.status} showDot />
              <PillBadge value={selectedLab.type} />
              <span className="ml-auto text-xs text-text-muted">{selectedLab.certCount} active certs</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Match Score', value: selectedLab.matchScore, color: selectedLab.matchScore >= 80 ? 'text-risk-low' : 'text-risk-medium' },
                { label: 'Audit Score', value: selectedLab.auditScore, color: selectedLab.auditScore >= 80 ? 'text-risk-low' : 'text-risk-medium' },
                { label: 'Turnaround', value: `${selectedLab.turnaroundDays}d`, color: 'text-text' },
              ].map((m) => (
                <div key={m.label} className="p-3 bg-bg rounded-lg text-center">
                  <p className="text-xs text-text-muted mb-1">{m.label}</p>
                  <p className={`text-xl font-bold font-syne ${m.color}`}>{m.value}</p>
                </div>
              ))}
            </div>

            {selectedLab.capabilities?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-text-muted mb-2">Capabilities</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedLab.capabilities.map((c) => (
                    <TagChip key={c} label={c} color={capabilityFilter.includes(c) ? 'teal' : 'gray'} />
                  ))}
                </div>
              </div>
            )}

            {selectedLab.activeCerts?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-text-muted mb-2">Active Certifications</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedLab.activeCerts.map((c) => (
                    <TagChip key={c} label={c} color="blue" />
                  ))}
                </div>
              </div>
            )}

            {selectedLab.specialisations?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-text-muted mb-2">Specialisations</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedLab.specialisations.map((s) => (
                    <TagChip key={s} label={s} color="purple" />
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2 pt-2 border-t border-border">
              {selectedLab.contactEmail && (
                <p className="text-sm text-text"><span className="text-text-muted text-xs">Email: </span>{selectedLab.contactEmail}</p>
              )}
              {selectedLab.contactPhone && (
                <p className="text-sm text-text"><span className="text-text-muted text-xs">Phone: </span>{selectedLab.contactPhone}</p>
              )}
            </div>

            <button className="btn-primary w-full">Request Partnership</button>
          </div>
        )}
      </SideDrawer>
    </div>
  );
}
