import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const GOLD   = '#C49A2C';
const GOLD_L = '#DDB84A';
const DARK   = '#0D0F14';
const CARD   = '#14161C';
const INPUT  = '#1E2028';

export default function LoginPage() {
  const [email,    setEmail]    = useState('admin@kairoz.com');
  const [password, setPassword] = useState('Admin@123');
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const { login } = useAuth();
  const navigate   = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Invalid credentials. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const pills = ['Lab Registry', 'CAPA Management', 'Certifications', 'Audit Tracking', 'AI Lab Finder'];

  const quickCreds = [
    { role: 'Admin',       email: 'admin@kairoz.com',       pass: 'Admin@123'  },
    { role: 'QA Director', email: 'qa.director@kairoz.com', pass: 'QA@123456'  },
    { role: 'Lab Head',    email: 'lab.head@kairoz.com',    pass: 'Lab@12345'  },
    { role: 'QC Analyst',  email: 'analyst@kairoz.com',     pass: 'QC@123456'  },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Carlito', 'Calibri', sans-serif" }}>

      {/* ─── LEFT — atmospheric panel ───────────────────────────────── */}
      <div
        className="hidden lg:flex"
        style={{
          flex: '0 0 58%',
          position: 'relative',
          overflow: 'hidden',
          background: '#060C0C',
        }}
      >
        {/* deep radial glows */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `
            radial-gradient(ellipse 70% 60% at 30% 40%, rgba(196,154,44,0.14) 0%, transparent 60%),
            radial-gradient(ellipse 50% 70% at 80% 80%, rgba(7,22,22,0.9)    0%, transparent 60%),
            radial-gradient(ellipse 40% 40% at 10% 90%, rgba(196,154,44,0.06) 0%, transparent 50%)
          `,
        }} />

        {/* subtle grid */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `
            linear-gradient(rgba(196,154,44,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(196,154,44,0.05) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse 90% 90% at 40% 50%, black 0%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 90% 90% at 40% 50%, black 0%, transparent 100%)',
        }} />

        {/* bokeh circles */}
        {[
          { w: 320, top: '-10%',  left: '-8%',  op: 0.07 },
          { w: 200, top: '60%',   left: '50%',  op: 0.05 },
          { w: 160, top: '20%',   left: '70%',  op: 0.04 },
          { w: 400, top: '40%',   left: '-15%', op: 0.04 },
        ].map((c, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: c.w, height: c.w,
            borderRadius: '50%',
            border: `1px solid rgba(196,154,44,${c.op * 3})`,
            background: `radial-gradient(circle, rgba(196,154,44,${c.op}) 0%, transparent 70%)`,
            top: c.top, left: c.left,
            filter: 'blur(1px)',
          }} />
        ))}

        {/* content */}
        <div style={{
          position: 'relative', zIndex: 10,
          padding: '4rem 3.5rem',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          height: '100%',
        }}>
          {/* product label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: GOLD, boxShadow: `0 0 8px ${GOLD}` }} />
            <span style={{ color: GOLD, fontSize: 11, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase' }}>
              Pharma Quality Intelligence Platform
            </span>
          </div>

          {/* headline */}
          <h1 style={{
            fontSize: 'clamp(2.4rem, 4vw, 3.6rem)',
            fontWeight: 800,
            lineHeight: 1.12,
            color: '#fff',
            marginBottom: 20,
            fontFamily: "'Syne', sans-serif",
          }}>
            Unified Quality.<br />
            <span style={{ color: GOLD }}>Intelligent Control.</span>
          </h1>

          <p style={{ color: 'rgba(255,255,255,0.52)', fontSize: '1rem', lineHeight: 1.75, maxWidth: 420, marginBottom: 36 }}>
            Track, manage and optimise pharmaceutical lab operations with real-time CAPA tracking, certification monitoring, and AI-powered partner intelligence.
          </p>

          {/* pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 64 }}>
            {pills.map((p) => (
              <span key={p} style={{
                padding: '6px 15px',
                borderRadius: 100,
                border: `1px solid rgba(196,154,44,0.45)`,
                color: GOLD_L,
                fontSize: 13,
                background: 'rgba(196,154,44,0.07)',
                backdropFilter: 'blur(4px)',
                fontWeight: 500,
              }}>
                {p}
              </span>
            ))}
          </div>

          {/* stat row */}
          <div style={{ display: 'flex', gap: 32, paddingTop: 32, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            {[
              { v: '12+',  l: 'Partner Labs'  },
              { v: '148',  l: 'CAPAs Tracked' },
              { v: '34',   l: 'Active Certs'  },
              { v: '890+', l: 'Batch Records' },
            ].map((s) => (
              <div key={s.l}>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.6rem', fontWeight: 800, color: GOLD }}>{s.v}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── RIGHT — login panel ─────────────────────────────────────── */}
      <div style={{
        flex: 1,
        background: DARK,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2.5rem 2rem',
        gap: 20,
        minHeight: '100vh',
      }}>
        <motion.div
          style={{ width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          {/* ── Logo card ── */}
          <div style={{
            width: 96, height: 96,
            background: '#fff',
            borderRadius: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)`,
            overflow: 'hidden',
          }}>
            {/* Logo mark — stylised Q in brand gold */}
            <div style={{
              width: 72, height: 72,
              background: `linear-gradient(135deg, ${GOLD}, #A67D16)`,
              borderRadius: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column',
              gap: 2,
            }}>
              <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 900, fontSize: 32, color: '#fff', lineHeight: 1 }}>Q</span>
              <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.8)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700 }}>Kairoz</span>
            </div>
          </div>

          {/* ── Product name ── */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.85rem', lineHeight: 1.1 }}>
              <span style={{ color: '#fff' }}>Quantum </span>
              <span style={{ color: GOLD }}>Kairoz</span>
            </div>
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', marginTop: 6 }}>
              Forge Quantum Solution
            </div>
          </div>

          {/* ── Login card ── */}
          <div style={{
            width: '100%',
            background: CARD,
            borderRadius: 16,
            border: '1px solid rgba(255,255,255,0.07)',
            overflow: 'hidden',
          }}>
            {/* card header */}
            <div style={{
              padding: '20px 24px 18px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
            }}>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 17 }}>Sign In</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: 7, height: 7, borderRadius: '50%', background: '#22C55E',
                  boxShadow: '0 0 6px #22C55E',
                  animation: 'pulse-green 2s infinite',
                }} />
                <span style={{ color: '#22C55E', fontSize: 12, fontWeight: 500 }}>System Online</span>
              </div>
            </div>

            <div style={{ padding: '24px' }}>
              {/* error */}
              {error && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 14px', borderRadius: 10, marginBottom: 16,
                  background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.2)',
                  color: '#FCA5A5', fontSize: 13,
                }}>
                  <AlertCircle size={14} />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* email */}
                <div>
                  <label style={{ display: 'block', color: 'rgba(255,255,255,0.55)', fontSize: 12, fontWeight: 600, marginBottom: 7 }}>
                    Email address
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={14} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        paddingLeft: 38, paddingRight: 14,
                        paddingTop: 11, paddingBottom: 11,
                        background: INPUT,
                        border: '1px solid rgba(255,255,255,0.09)',
                        borderRadius: 10,
                        color: '#fff',
                        fontSize: 14,
                        outline: 'none',
                        transition: 'border-color 0.2s',
                        fontFamily: 'inherit',
                      }}
                      onFocus={(e) => (e.target.style.borderColor = GOLD)}
                      onBlur={(e)  => (e.target.style.borderColor = 'rgba(255,255,255,0.09)')}
                    />
                  </div>
                </div>

                {/* password */}
                <div>
                  <label style={{ display: 'block', color: 'rgba(255,255,255,0.55)', fontSize: 12, fontWeight: 600, marginBottom: 7 }}>
                    Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={14} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        paddingLeft: 38, paddingRight: 42,
                        paddingTop: 11, paddingBottom: 11,
                        background: INPUT,
                        border: '1px solid rgba(255,255,255,0.09)',
                        borderRadius: 10,
                        color: '#fff',
                        fontSize: 14,
                        outline: 'none',
                        transition: 'border-color 0.2s',
                        fontFamily: 'inherit',
                      }}
                      onFocus={(e) => (e.target.style.borderColor = GOLD)}
                      onBlur={(e)  => (e.target.style.borderColor = 'rgba(255,255,255,0.09)')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      style={{
                        position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'rgba(255,255,255,0.3)', padding: 0,
                        display: 'flex', alignItems: 'center',
                      }}
                    >
                      {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {/* submit */}
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '13px',
                    background: loading ? '#A67D16' : GOLD,
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 15,
                    border: 'none',
                    borderRadius: 10,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    fontFamily: "'Syne', sans-serif",
                    letterSpacing: '0.02em',
                    boxShadow: `0 4px 20px rgba(196,154,44,0.35)`,
                  }}
                  onMouseEnter={(e) => { if (!loading) (e.currentTarget.style.background = '#DDB84A'); }}
                  onMouseLeave={(e) => { if (!loading) (e.currentTarget.style.background = GOLD); }}
                >
                  {loading ? (
                    <div style={{
                      width: 18, height: 18,
                      border: '2.5px solid rgba(255,255,255,0.3)',
                      borderTopColor: '#fff',
                      borderRadius: '50%',
                      animation: 'spin 0.7s linear infinite',
                    }} />
                  ) : null}
                  {loading ? 'Signing in…' : 'Sign In'}
                </button>
              </form>

              {/* demo credentials */}
              <div style={{ marginTop: 20, paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, textAlign: 'center', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Quick access
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {quickCreds.map((c) => (
                    <button
                      key={c.role}
                      type="button"
                      onClick={() => { setEmail(c.email); setPassword(c.pass); }}
                      style={{
                        padding: '7px 10px',
                        background: 'rgba(196,154,44,0.06)',
                        border: '1px solid rgba(196,154,44,0.15)',
                        borderRadius: 8,
                        color: 'rgba(255,255,255,0.45)',
                        fontSize: 11,
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.15s',
                        fontFamily: 'inherit',
                        fontWeight: 500,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(196,154,44,0.14)';
                        e.currentTarget.style.color = GOLD_L;
                        e.currentTarget.style.borderColor = 'rgba(196,154,44,0.35)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(196,154,44,0.06)';
                        e.currentTarget.style.color = 'rgba(255,255,255,0.45)';
                        e.currentTarget.style.borderColor = 'rgba(196,154,44,0.15)';
                      }}
                    >
                      {c.role}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* footer */}
          <p style={{ color: 'rgba(255,255,255,0.18)', fontSize: 11, textAlign: 'center' }}>
            Powered by Quantum Kairoz &nbsp;·&nbsp; v1.0
          </p>
        </motion.div>
      </div>

      {/* ── keyframes ── */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse-green {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
