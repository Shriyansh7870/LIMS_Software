import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, FlaskConical, Cpu, Award, Users, Search,
  AlertTriangle, ClipboardCheck, FileText, Package, FolderOpen,
  TestTube, GitBranch, Plug, UserPlus, Bell, LogOut, Menu,
  ChevronRight, Upload,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import NotificationPanel from '@/components/ui/NotificationPanel';
import SearchPalette from '@/components/ui/SearchPalette';

// ── Design tokens ────────────────────────────────────────────────
const SB_BG      = '#0D1117';
const SB_BG2     = '#161B22';
const GOLD       = '#C49A2C';
const GOLD_L     = '#DDB84A';
const GOLD_FAINT = 'rgba(196,154,44,0.12)';

const navGroups = [
  {
    label: 'Core Intelligence',
    items: [
      { path: '/dashboard',     icon: LayoutDashboard, label: 'Dashboard'       },
      { path: '/registry',      icon: FlaskConical,    label: 'Lab Registry'    },
      { path: '/equipment',     icon: Cpu,             label: 'Equipment'       },
      { path: '/certifications',icon: Award,           label: 'Certifications'  },
      { path: '/partners',      icon: Users,           label: 'Partners'        },
      { path: '/finder',        icon: Search,          label: 'Lab Finder'      },
    ],
  },
  {
    label: 'Quality Management',
    items: [
      { path: '/capa',   icon: AlertTriangle,  label: 'CAPA / Deviations' },
      { path: '/audits', icon: ClipboardCheck, label: 'Audit Tracker'     },
      { path: '/sop',    icon: FileText,       label: 'SOP Management'    },
      { path: '/bmr',    icon: Package,        label: 'Batch Records'     },
    ],
  },
  {
    label: 'Lab Operations',
    items: [
      { path: '/dms',       icon: FolderOpen, label: 'Documents'     },
      { path: '/requests',  icon: TestTube,   label: 'Test Requests' },
      { path: '/workflows', icon: GitBranch,  label: 'Workflows'     },
    ],
  },
  {
    label: 'System',
    items: [
      { path: '/integrations', icon: Plug,      label: 'Integrations'    },
      { path: '/onboarding',   icon: UserPlus,  label: 'Onboard Partner' },
      { path: '/bulk-import',  icon: Upload,    label: 'Bulk Import'     },
    ],
  },
];

// ── Topbar alert chips (static demo data) ────────────────────────
const ALERTS = [
  { label: '4 Expiry Alerts', color: '#DC2626', bg: '#FEF2F2', dot: '#DC2626' },
  { label: '2 Open CAPAs',    color: '#D97706', bg: '#FFFBEB', dot: '#D97706' },
  { label: 'GMP Compliant',   color: '#16A34A', bg: '#F0FDF4', dot: '#16A34A' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { unreadCount }  = useNotifications();
  const location         = useLocation();
  const [notifOpen,   setNotifOpen]   = useState(false);
  const [searchOpen,  setSearchOpen]  = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 1024);
  const [isMobile,    setIsMobile]    = useState(() => window.innerWidth < 1024);

  // Track viewport size for responsive sidebar
  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true); }
      if (e.key === 'Escape') { setNotifOpen(false); setSearchOpen(false); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const currentPage = navGroups
    .flatMap((g) => g.items)
    .find((i) => location.pathname === i.path)?.label || 'Dashboard';

  const initials = (user?.name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#F4F6F9' }}>

      {/* ─── SIDEBAR OVERLAY (mobile) ──────────────────────────── */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ─── SIDEBAR ─────────────────────────────────────────────── */}
      <aside
        className={`flex flex-col flex-shrink-0 transition-all duration-300 ${
          isMobile
            ? 'fixed top-0 left-0 bottom-0 z-40'
            : 'z-20'
        }`}
        style={{
          width: 252,
          minWidth: 252,
          background: SB_BG,
          borderRight: `1px solid rgba(255,255,255,0.05)`,
          overflow: 'hidden',
          transform: sidebarOpen ? 'translateX(0)' : `translateX(-252px)`,
          ...(isMobile ? {} : {
            marginLeft: sidebarOpen ? 0 : -252,
          }),
        }}
      >
        {/* ── Brand ── */}
        <div style={{
          padding: '18px 16px 14px',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            {/* Logo square */}
            <div style={{
              width: 36, height: 36, borderRadius: 9, flexShrink: 0,
              background: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 2px 10px rgba(0,0,0,0.4)`,
              overflow: 'hidden',
            }}>
              <div style={{
                width: 30, height: 30, borderRadius: 6,
                background: `linear-gradient(135deg, ${GOLD}, #A67D16)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 900, fontSize: 15, color: '#fff' }}>Q</span>
              </div>
            </div>
            <div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 14, lineHeight: 1.15, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Quantum <span style={{ color: GOLD_L }}>Kairoz</span>
              </div>
              <div style={{ fontSize: 8.5, color: 'rgba(255,255,255,0.22)', letterSpacing: '1.2px', textTransform: 'uppercase', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Forge Quantum Solution
              </div>
            </div>
          </div>
        </div>

        {/* ── Nav ── */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
          {navGroups.map((group) => (
            <div key={group.label} style={{ padding: '10px 8px 4px' }}>
              <div style={{
                fontSize: 8.5, fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '2.4px', color: 'rgba(255,255,255,0.18)',
                padding: '0 10px', marginBottom: 4,
              }}>
                {group.label}
              </div>

              {group.items.map((item) => (
                <NavLink key={item.path} to={item.path} onClick={() => { if (isMobile) setSidebarOpen(false); }}>
                  {({ isActive }) => (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 9,
                      padding: '8px 10px',
                      borderRadius: 8,
                      marginBottom: 1,
                      cursor: 'pointer',
                      position: 'relative',
                      background: isActive ? GOLD_FAINT : 'transparent',
                      color: isActive ? GOLD_L : 'rgba(255,255,255,0.42)',
                      borderLeft: isActive ? `3px solid ${GOLD}` : '3px solid transparent',
                      transition: 'all 0.15s',
                      fontSize: 12.5,
                      fontWeight: isActive ? 600 : 400,
                    }}
                    onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.78)'; }}}
                    onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.42)'; }}}
                    >
                      <item.icon size={13} style={{ flexShrink: 0 }} />
                      <span style={{ flex: 1, whiteSpace: 'nowrap' }}>{item.label}</span>
                      {item.path === '/capa' && unreadCount > 0 && (
                        <span style={{
                          fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 10,
                          background: '#D97706', color: '#fff',
                        }}>
                          {unreadCount}
                        </span>
                      )}
                      {isActive && <ChevronRight size={11} style={{ opacity: 0.5 }} />}
                    </div>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* ── User footer ── */}
        <div style={{ flexShrink: 0, padding: 12, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 9,
            padding: '9px 10px', borderRadius: 10, marginBottom: 8,
            background: SB_BG2,
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
              background: `linear-gradient(135deg, ${GOLD}, #A67D16)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color: '#fff',
            }}>
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: 'rgba(255,255,255,0.75)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.name || 'User'}
              </div>
              <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.28)', textTransform: 'capitalize', marginTop: 1 }}>
                {(user?.role || '').replace('_', ' ')}
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign out"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.28)', padding: 4, display: 'flex', alignItems: 'center' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.65)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.28)')}
            >
              <LogOut size={13} />
            </button>
          </div>
        </div>
      </aside>

      {/* ─── MAIN AREA ───────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* ── Topbar ── */}
        <header style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '0 20px', height: 54,
          background: '#fff',
          borderBottom: '1px solid #E2E8F0',
          flexShrink: 0,
          boxShadow: '0 1px 3px rgba(15,23,42,0.06)',
        }}>
          {/* hamburger */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: '4px', display: 'flex', alignItems: 'center', borderRadius: 6 }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#F4F6F9')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
          >
            <Menu size={18} />
          </button>

          {/* page title */}
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16, color: '#0F172A', flex: 1, margin: 0 }}>
            {currentPage}
          </h1>

          {/* alert chips */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {ALERTS.map((a) => (
              <div key={a.label} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '4px 10px', borderRadius: 100,
                background: a.bg,
                border: `1px solid ${a.color}30`,
                fontSize: 11, fontWeight: 600, color: a.color,
                whiteSpace: 'nowrap',
              }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: a.dot, flexShrink: 0 }} />
                {a.label}
              </div>
            ))}
          </div>

          {/* search */}
          <button
            onClick={() => setSearchOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '6px 12px', borderRadius: 8,
              background: '#F4F6F9', border: '1px solid #E2E8F0',
              color: '#94A3B8', fontSize: 13, cursor: 'pointer',
              transition: 'border-color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = GOLD)}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#E2E8F0')}
          >
            <Search size={13} />
            <span>Search</span>
            <kbd style={{ fontSize: 10, fontFamily: 'DM Mono, monospace', background: '#E2E8F0', padding: '1px 5px', borderRadius: 4, color: '#64748B' }}>⌘K</kbd>
          </button>

          {/* notification bell */}
          <button
            data-testid="notification-bell"
            onClick={() => setNotifOpen(!notifOpen)}
            style={{
              position: 'relative', width: 36, height: 36,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer',
              color: '#64748B',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#F4F6F9')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: 6, right: 6,
                width: 16, height: 16, borderRadius: '50%',
                background: '#DC2626', color: '#fff',
                fontSize: 9, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* avatar */}
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: `linear-gradient(135deg, ${GOLD}, #A67D16)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color: '#fff', cursor: 'pointer',
            flexShrink: 0,
          }} title={user?.name}>
            {initials}
          </div>
        </header>

        {/* ── Page content ── */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* ─── Overlays ───────────────────────────────────────────── */}
      <AnimatePresence>
        {notifOpen  && <NotificationPanel onClose={() => setNotifOpen(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {searchOpen && <SearchPalette onClose={() => setSearchOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}
