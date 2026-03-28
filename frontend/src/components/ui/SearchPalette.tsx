import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, FlaskConical, AlertTriangle, Award, FileText, Package, FolderOpen, TestTube, X, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';

interface SearchResult {
  id: string;
  entityType?: string;
  type?: string;
  name?: string;
  title?: string;
  labCode?: string;
  capaCode?: string;
  certCode?: string;
  sopCode?: string;
  batchNo?: string;
  docCode?: string;
  requestCode?: string;
  status?: string;
  href: string;
}

const entityConfig: Record<string, { icon: typeof Search; label: string; color: string }> = {
  lab:           { icon: FlaskConical,  label: 'Lab',       color: '#C49A2C' },
  capa:          { icon: AlertTriangle, label: 'CAPA',      color: '#DC2626' },
  certification: { icon: Award,         label: 'Cert',      color: '#D97706' },
  sop:           { icon: FileText,      label: 'SOP',       color: '#2563EB' },
  batch:         { icon: Package,       label: 'Batch',     color: '#7C3AED' },
  document:      { icon: FolderOpen,    label: 'Document',  color: '#0891B2' },
  request:       { icon: TestTube,      label: 'Request',   color: '#16A34A' },
};

function getLabel(r: SearchResult): string {
  return r.name || r.title || r.labCode || r.capaCode || r.certCode || r.sopCode || r.batchNo || r.docCode || r.requestCode || r.id;
}

function getCode(r: SearchResult): string {
  return r.labCode || r.capaCode || r.certCode || r.sopCode || r.batchNo || r.docCode || r.requestCode || '';
}

export default function SearchPalette({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ results: Record<string, SearchResult[]>; total: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (query.length < 2) { setResults(null); return; }
    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/search?q=${encodeURIComponent(query)}`);
        setResults(data.data);
        setSelectedIndex(0);
      } catch {}
      finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  const allResults: SearchResult[] = results
    ? Object.values(results.results).flat()
    : [];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex((i) => Math.min(i + 1, allResults.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex((i) => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && allResults[selectedIndex]) {
      navigate(allResults[selectedIndex].href);
      onClose();
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative w-full max-w-lg bg-card rounded-2xl border border-border shadow-2xl overflow-hidden"
        initial={{ y: -16, scale: 0.97 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: -16, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search size={16} className="text-text-dim flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search labs, CAPAs, certs, SOPs, batches..."
            className="flex-1 text-sm bg-transparent outline-none text-text placeholder-text-dim"
          />
          {loading && (
            <div className="w-4 h-4 border-2 border-teal/30 border-t-teal rounded-full animate-spin" />
          )}
          <button onClick={onClose} className="text-text-dim hover:text-text transition-colors">
            <X size={14} />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[360px] overflow-y-auto">
          {query.length < 2 && (
            <div className="py-8 text-center">
              <p className="text-sm text-text-muted">Type at least 2 characters to search</p>
            </div>
          )}
          {results && allResults.length === 0 && (
            <div className="py-8 text-center">
              <p className="text-sm text-text-muted">No results for "{query}"</p>
            </div>
          )}
          {allResults.map((r, i) => {
            const entityType = r.entityType || r.type || 'lab';
            const cfg = entityConfig[entityType] || entityConfig.lab;
            const Icon = cfg.icon;
            return (
              <button key={r.id} onClick={() => { navigate(r.href); onClose(); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left ${i === selectedIndex ? 'bg-teal/10' : 'hover:bg-bg'}`}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${cfg.color}18` }}>
                  <Icon size={13} style={{ color: cfg.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text truncate">{getLabel(r)}</p>
                  {getCode(r) && <p className="text-xs font-mono text-text-dim">{getCode(r)}</p>}
                </div>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-card2 text-text-muted uppercase">{cfg.label}</span>
                <ArrowRight size={12} className="text-text-dim flex-shrink-0" />
              </button>
            );
          })}
        </div>

        <div className="px-4 py-2 border-t border-border bg-bg/50 flex items-center gap-4">
          <span className="text-[10px] text-text-dim">↑↓ navigate</span>
          <span className="text-[10px] text-text-dim">↵ select</span>
          <span className="text-[10px] text-text-dim">Esc close</span>
          {results && <span className="text-[10px] text-text-dim ml-auto">{results.total} results</span>}
        </div>
      </motion.div>
    </motion.div>
  );
}
