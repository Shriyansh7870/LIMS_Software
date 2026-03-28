import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import './LandingPage.css';

const DEMO_ACCOUNTS = [
  { role: 'Admin',       icon: 'shield',  email: 'admin@kairoz.com',       password: 'Admin@123' },
  { role: 'QA Director', icon: 'target',  email: 'qa.director@kairoz.com', password: 'QA@123456' },
  { role: 'Lab Head',    icon: 'flask',   email: 'lab.head@kairoz.com',    password: 'Lab@12345' },
  { role: 'QC Analyst',  icon: 'beaker', email: 'analyst@kairoz.com',     password: 'QC@123456' },
  { role: 'Partner',     icon: 'users',   email: 'partner@kairoz.com',     password: 'Part@1234' },
];

const FEATURES = [
  { icon: 'building',     name: 'Lab Registry',         tag: 'registry',       desc: 'Centralized repository of all internal and partner labs with detailed profile drawers, capability mapping, and status tracking.' },
  { icon: 'microscope',   name: 'Equipment Management', tag: 'equipment',      desc: 'Track utilization, calibration schedules, and performance metrics across all laboratory instruments with visual matrix views.' },
  { icon: 'certificate',  name: 'Certifications',       tag: 'certifications', desc: 'Monitor certification health scores, expiry timelines, and compliance status for NABL, GMP, ISO, and FDA standards.' },
  { icon: 'alert',        name: 'CAPA Management',      tag: 'capa',           desc: 'Full corrective and preventive action lifecycle with severity classification, root cause analysis, and workflow triggers.' },
  { icon: 'clipboard',    name: 'Audit Management',     tag: 'audits',         desc: 'Schedule, track, and analyze audits with score trends, calendar heatmaps, and multi-standard support.' },
  { icon: 'handshake',    name: 'Partner Management',   tag: 'partners',       desc: 'End-to-end partner lifecycle management with onboarding wizard, performance scoring, and collaboration tools.' },
  { icon: 'compass',      name: 'AI Lab Finder',        tag: 'finder',         desc: 'Intelligent lab matching engine that scores and ranks partner labs based on capability, compliance, and performance.' },
  { icon: 'file-text',    name: 'SOP Management',       tag: 'sop',            desc: 'Version-controlled standard operating procedures with due-for-review alerts, approval chains, and role-based access.' },
  { icon: 'layers',       name: 'Batch Records (BMR)',  tag: 'bmr',            desc: 'Digital batch manufacturing records with yield trend analytics, monthly output tracking, and full audit trail.' },
  { icon: 'folder',       name: 'Document Management',  tag: 'dms',            desc: 'Centralized DMS with versioning, download controls, metadata tagging, and role-based document access.' },
  { icon: 'send',         name: 'Test Requests',        tag: 'requests',       desc: 'Volume trend analytics, auto-pricing engine, and smart approval triggers for requests exceeding thresholds.' },
  { icon: 'git-branch',   name: 'Approval Workflows',   tag: 'workflows',      desc: 'Configurable workflow templates with multi-step approvals, role-based notifications, and auto-trigger integrations.' },
  { icon: 'plug',         name: 'Integration Hub',      tag: 'integrations',   desc: 'Pre-built connectors for ERP, LIMS, and QMS systems with integration templates and real-time sync monitoring.' },
  { icon: 'bar-chart',    name: 'Analytics Dashboard',  tag: 'analytics',      desc: 'Real-time KPI summaries, trend charts, partner mapping, and risk heatmaps — all cached for instant response.' },
  { icon: 'bell',         name: 'Notifications',        tag: 'notifications',  desc: 'Real-time alerts across all modules with filtering by type, priority, and read status.' },
  { icon: 'rocket',       name: 'Partner Onboarding',   tag: 'onboarding',     desc: 'Guided 5-step wizard for partner registration with document collection, approval routing, and status tracking.' },
];

const TICKER_ITEMS = [
  'NABL Compliant',
  'FDA 21 CFR Part 11',
  'Real-time CAPA Tracking',
  'Multi-lab Partner Management',
  'ERP / LIMS / QMS Integrations',
  'AI-powered Lab Scoring',
  'Role-based Access Control',
];

const STATS = [
  { value: '16+', label: 'Integrated Modules' },
  { value: '5',   label: 'Access Levels' },
  { value: '20+', label: 'Workflow Templates' },
  { value: '100%', label: 'GMP / NABL / FDA Ready' },
];

const STEPS = [
  { num: '01', title: 'Onboard & Configure', desc: 'Register labs, onboard partners through the guided wizard, and configure role-based access for your team.' },
  { num: '02', title: 'Monitor & Track', desc: 'Track equipment, certifications, SOPs, and batch records in real time with automated expiry and review alerts.' },
  { num: '03', title: 'Detect & Respond', desc: 'CAPA auto-triggers when deviations are detected. Approval workflows route to the right people instantly.' },
  { num: '04', title: 'Audit & Improve', desc: 'Generate audit-ready reports, analyze trends, and continuously improve quality scores across all labs.' },
];

const ROLES = [
  { icon: 'shield', name: 'Admin', desc: 'Full platform access, user management, and system configuration' },
  { icon: 'target', name: 'QA Director', desc: 'Quality oversight, compliance monitoring, and approval authority' },
  { icon: 'flask', name: 'Lab Head', desc: 'Lab operations, equipment management, and team coordination' },
  { icon: 'beaker', name: 'QC Analyst', desc: 'Testing, data entry, CAPA initiation, and result reporting' },
  { icon: 'users', name: 'Partner', desc: 'External lab access, document submission, and collaboration' },
];

const COMPLIANCE = [
  { name: 'GMP', desc: 'Good Manufacturing Practice' },
  { name: 'NABL', desc: 'National Accreditation Board' },
  { name: 'FDA', desc: 'Food & Drug Administration' },
  { name: 'ISO 17025', desc: 'Testing & Calibration Labs' },
  { name: '21 CFR Part 11', desc: 'Electronic Records' },
  { name: 'ICH Q10', desc: 'Pharmaceutical Quality System' },
];

/* Simple SVG icon component */
function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const icons: Record<string, React.ReactNode> = {
    'shield': <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>,
    'target': <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>,
    'flask': <><path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2"/><path d="M8.5 2h7"/></>,
    'beaker': <><path d="M4.5 3h15"/><path d="M6 3v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V3"/><path d="M6 14h12"/></>,
    'users': <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
    'building': <><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/></>,
    'microscope': <><path d="M6 18h8"/><path d="M3 22h18"/><path d="M14 22a7 7 0 1 0 0-14h-1"/><path d="M9 14h2"/><path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z"/><path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3"/></>,
    'certificate': <><rect width="18" height="14" x="3" y="4" rx="2"/><path d="M7 8h10M7 12h6"/></>,
    'alert': <><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/></>,
    'clipboard': <><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4M12 16h4M8 11h.01M8 16h.01"/></>,
    'handshake': <><path d="m11 17 2 2a1 1 0 1 0 3-3"/><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88"/><path d="m11 17-2-2a1 1 0 1 0-3 3"/><path d="m10 14-2.5-2.5a1 1 0 1 0-3 3l3.88 3.88"/><path d="M4 6h4"/><path d="M16 6h4"/><path d="M6 2v4M18 2v4"/></>,
    'compass': <><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></>,
    'file-text': <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M16 13H8M16 17H8M10 9H8"/></>,
    'layers': <><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/></>,
    'folder': <><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></>,
    'send': <><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></>,
    'git-branch': <><line x1="6" x2="6" y1="3" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></>,
    'plug': <><path d="M12 22v-5"/><path d="M9 8V1h6v7"/><path d="M7 8h10"/><path d="M7 8a5 5 0 0 0 5 5 5 5 0 0 0 5-5"/></>,
    'bar-chart': <><line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/></>,
    'bell': <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></>,
    'rocket': <><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09Z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2Z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></>,
    'check': <><polyline points="20 6 9 17 4 12"/></>,
    'arrow-right': <><line x1="5" x2="19" y1="12" y2="12"/><polyline points="12 5 19 12 12 19"/></>,
    'lock': <><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>,
    'log-in': <><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" x2="3" y1="12" y2="12"/></>,
    'chevron-right': <><polyline points="9 18 15 12 9 6"/></>,
    'award': <><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {icons[name] || icons['check']}
    </svg>
  );
}

export default function LandingPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [modalOpen, setModalOpen]     = useState(false);
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [remember, setRemember]       = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const emailRef                      = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeModal(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    const els = document.querySelectorAll('.lp-fade');
    const obs = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('lp-visible'); }),
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    );
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const openModal = useCallback(() => {
    setModalOpen(true);
    setError('');
    document.body.style.overflow = 'hidden';
    setTimeout(() => emailRef.current?.focus(), 300);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    document.body.style.overflow = '';
    setError('');
    setEmail('');
    setPassword('');
  }, []);

  const fillAccount = (acc: typeof DEMO_ACCOUNTS[0]) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setError('');
    emailRef.current?.focus();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Please enter your email and password.'); return; }
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      closeModal();
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Invalid credentials. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const tickerContent = [...TICKER_ITEMS, ...TICKER_ITEMS];

  return (
    <div className="lp">
      {/* ── NAV ─────────────────────────────────────────────────── */}
      <nav className="lp-nav">
        <a href="#hero" className="lp-nav-logo">
          <div className="lp-logo-mark">Q</div>
          <div className="lp-logo-info">
            <span className="lp-logo-text">Quantum Kairoz</span>
            <span className="lp-logo-sub">by Forge Quantum Solutions</span>
          </div>
        </a>

        <ul className="lp-nav-links">
          <li><a href="#features">Features</a></li>
          <li><a href="#how-it-works">How it works</a></li>
          <li><a href="#compliance">Compliance</a></li>
          <li><a href="#roles">Roles</a></li>
        </ul>

        <div className="lp-nav-cta">
          <button className="lp-btn lp-btn-ghost" onClick={openModal}>Sign in</button>
          <button className="lp-btn lp-btn-primary" onClick={openModal}>
            Get started
            <Icon name="arrow-right" size={16} />
          </button>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────── */}
      <section className="lp-hero" id="hero">
        <div className="lp-hero-grid" />
        <div className="lp-hero-glow" />

        <div className="lp-hero-content">
          <div className="lp-hero-badge">
            <span className="lp-badge-dot" />
            Pharma-grade Quality Intelligence Platform
          </div>

          <h1 className="lp-hero-title">
            One Platform for<br />
            <span className="lp-accent">Quality, Labs &amp; Partners</span>
          </h1>

          <p className="lp-hero-desc">
            Quantum Kairoz unifies lab registry, equipment tracking, CAPA management,
            compliance audits, and partner onboarding into a single intelligent
            platform — purpose-built for pharmaceutical operations.
          </p>

          <div className="lp-hero-actions">
            <button className="lp-btn lp-btn-primary lp-btn-lg" onClick={openModal}>
              <Icon name="log-in" size={18} />
              Sign in to platform
            </button>
            <a href="#features" className="lp-btn lp-btn-outline lp-btn-lg">
              Explore features
              <Icon name="chevron-right" size={16} />
            </a>
          </div>

          <div className="lp-hero-stats">
            {STATS.map(({ value, label }) => (
              <div className="lp-stat" key={label}>
                <span className="lp-stat-value">{value}</span>
                <span className="lp-stat-label">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TICKER ──────────────────────────────────────────────── */}
      <div className="lp-ticker-wrap">
        <div className="lp-ticker">
          {tickerContent.map((item, i) => (
            <span className="lp-ticker-item" key={i}>
              <Icon name="check" size={14} />
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ── FEATURES ────────────────────────────────────────────── */}
      <section className="lp-section lp-section-light" id="features">
        <div className="lp-container">
          <div className="lp-section-header lp-fade">
            <span className="lp-label">Platform Modules</span>
            <h2 className="lp-title">Everything your pharma ops team needs</h2>
            <p className="lp-desc">
              16 integrated modules covering every aspect of laboratory quality management,
              partner relations, and regulatory compliance.
            </p>
          </div>
          <div className="lp-features-grid">
            {FEATURES.map((f, i) => (
              <div className={`lp-feature-card lp-fade`} key={f.tag} style={{ transitionDelay: `${(i % 4) * 80}ms` }}>
                <div className="lp-feature-icon-wrap">
                  <Icon name={f.icon} size={22} />
                </div>
                <div className="lp-feature-body">
                  <h3>{f.name}</h3>
                  <p>{f.desc}</p>
                  <span className="lp-feature-tag">{f.tag}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────── */}
      <section className="lp-section lp-section-alt" id="how-it-works">
        <div className="lp-container">
          <div className="lp-section-header lp-section-header-center lp-fade">
            <span className="lp-label">How it works</span>
            <h2 className="lp-title">Intelligent operations in 4 steps</h2>
            <p className="lp-desc">
              From onboarding to audit-ready compliance — Quantum Kairoz guides your team at every step.
            </p>
          </div>
          <div className="lp-steps-grid">
            {STEPS.map((step, i) => (
              <div className="lp-step-card lp-fade" key={step.num} style={{ transitionDelay: `${i * 100}ms` }}>
                <div className="lp-step-num">{step.num}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ROLES ───────────────────────────────────────────────── */}
      <section className="lp-section lp-section-light" id="roles">
        <div className="lp-container">
          <div className="lp-section-header lp-section-header-center lp-fade">
            <span className="lp-label">User Roles</span>
            <h2 className="lp-title">Built for every stakeholder</h2>
            <p className="lp-desc">
              Five purpose-built roles ensure the right information reaches the right people.
            </p>
          </div>
          <div className="lp-roles-grid">
            {ROLES.map((role, i) => (
              <div className="lp-role-card lp-fade" key={role.name} style={{ transitionDelay: `${i * 80}ms` }}>
                <div className="lp-role-icon">
                  <Icon name={role.icon} size={24} />
                </div>
                <h4>{role.name}</h4>
                <p>{role.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMPLIANCE ──────────────────────────────────────────── */}
      <section className="lp-section lp-section-alt" id="compliance">
        <div className="lp-container">
          <div className="lp-section-header lp-section-header-center lp-fade">
            <span className="lp-label">Regulatory Standards</span>
            <h2 className="lp-title">Compliance-first by design</h2>
            <p className="lp-desc">
              Quantum Kairoz is architected to meet the most stringent pharmaceutical
              regulatory requirements out of the box.
            </p>
          </div>
          <div className="lp-badges-grid">
            {COMPLIANCE.map((c, i) => (
              <div className="lp-badge-card lp-fade" key={c.name} style={{ transitionDelay: `${i * 80}ms` }}>
                <div className="lp-badge-icon"><Icon name="award" size={28} /></div>
                <div className="lp-badge-name">{c.name}</div>
                <div className="lp-badge-desc">{c.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────── */}
      <section className="lp-cta">
        <div className="lp-container lp-cta-inner">
          <h2 className="lp-fade">Ready to transform your lab operations?</h2>
          <p className="lp-fade" style={{ transitionDelay: '100ms' }}>
            Join pharmaceutical teams using Quantum Kairoz to stay audit-ready,
            reduce CAPA response time, and improve partner quality scores.
          </p>
          <button className="lp-cta-btn lp-fade" style={{ transitionDelay: '200ms' }} onClick={openModal}>
            Sign in to platform
            <Icon name="arrow-right" size={18} />
          </button>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────── */}
      <footer className="lp-footer">
        <div className="lp-container">
          <div className="lp-footer-top">
            <div className="lp-footer-brand">
              <div className="lp-nav-logo" style={{ marginBottom: 12 }}>
                <div className="lp-logo-mark">Q</div>
                <div className="lp-logo-info">
                  <span className="lp-logo-text">Quantum Kairoz</span>
                  <span className="lp-logo-sub">by Forge Quantum Solutions</span>
                </div>
              </div>
              <p>Pharmaceutical Quality, Lab & Partner Intelligence — purpose-built for modern pharma operations.</p>
            </div>
            <div className="lp-footer-col">
              <h5>Platform</h5>
              <ul>
                <li><a href="#features">Features</a></li>
                <li><a href="#how-it-works">How it works</a></li>
                <li><a href="#compliance">Compliance</a></li>
                <li><a href="#roles">Roles</a></li>
              </ul>
            </div>
            <div className="lp-footer-col">
              <h5>Modules</h5>
              <ul>
                <li><a href="#features">Lab Registry</a></li>
                <li><a href="#features">CAPA Management</a></li>
                <li><a href="#features">Audit Tracker</a></li>
                <li><a href="#features">Partner Onboarding</a></li>
                <li><a href="#features">Approval Workflows</a></li>
              </ul>
            </div>
            <div className="lp-footer-col">
              <h5>Company</h5>
              <ul>
                <li><a href="#">Forge Quantum Solutions</a></li>
                <li><a href="#">API Documentation</a></li>
                <li><a href="#">Support</a></li>
                <li><a href="#">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="lp-footer-bottom">
            <p>&copy; 2026 Forge Quantum Solutions. All rights reserved.</p>
            <p>Built with <span className="lp-heart">&#9829;</span> for pharma excellence</p>
          </div>
        </div>
      </footer>

      {/* ── LOGIN MODAL ─────────────────────────────────────────── */}
      <div
        className={`lp-overlay${modalOpen ? ' active' : ''}`}
        onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        role="dialog"
        aria-modal="true"
        aria-label="Sign in"
      >
        <div className="lp-modal">
          <div className="lp-modal-header">
            <div className="lp-modal-logo-row">
              <div className="lp-logo-mark" style={{ width: 32, height: 32, fontSize: 15 }}>Q</div>
              <div className="lp-logo-info">
                <span className="lp-logo-text" style={{ fontSize: 14 }}>Quantum Kairoz</span>
                <span className="lp-logo-sub">Forge Quantum Solutions</span>
              </div>
            </div>
            <h2>Welcome back</h2>
            <p>Sign in to your account to continue</p>
            <button className="lp-modal-close" onClick={closeModal} aria-label="Close">&times;</button>
          </div>

          <div className="lp-modal-body">
            <div className="lp-demo-section">
              <div className="lp-demo-title">Demo accounts &mdash; click to fill</div>
              <div className="lp-demo-list">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button className="lp-demo-row" key={acc.email} onClick={() => fillAccount(acc)} type="button">
                    <span className="lp-demo-icon"><Icon name={acc.icon} size={14} /></span>
                    <span className="lp-demo-role">{acc.role}</span>
                    <span className="lp-demo-email">{acc.email}</span>
                    <span className="lp-demo-use">Use</span>
                  </button>
                ))}
              </div>
            </div>

            {error && <div className="lp-error"><Icon name="alert" size={14} /> {error}</div>}

            <form onSubmit={handleLogin} noValidate>
              <div className="lp-field">
                <label htmlFor="lp-email">Email address</label>
                <input
                  ref={emailRef}
                  type="email"
                  id="lp-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </div>

              <div className="lp-field">
                <label htmlFor="lp-password">Password</label>
                <input
                  type="password"
                  id="lp-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />
              </div>

              <div className="lp-form-extras">
                <label className="lp-check-label">
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                  <span>Remember me</span>
                </label>
                <a href="#" className="lp-forgot">Forgot password?</a>
              </div>

              <button type="submit" className="lp-submit-btn" disabled={loading}>
                {loading ? <><span className="lp-spinner" />Signing in...</> : <>Sign in <Icon name="arrow-right" size={16} /></>}
              </button>
            </form>

            <div className="lp-divider"><span>or continue with</span></div>

            <button
              className="lp-sso-btn"
              type="button"
              onClick={() => alert('SSO login would redirect to your identity provider.\n\nFor demo: use the credential shortcuts above.')}
            >
              <Icon name="lock" size={16} />
              Single Sign-On (SSO)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
