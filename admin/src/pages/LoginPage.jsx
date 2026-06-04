import React, { useState } from 'react';
import { supabase } from '../lib/supabase.js';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError('Invalid credentials. Please try again.');
    }
    setLoading(false);
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>TV</div>
          <span style={styles.logoText}>TechVai</span>
        </div>
        <h1 style={styles.title}>Admin Panel</h1>
        <p style={styles.subtitle}>Sign in to manage your extension</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@techvai.com"
              required
              style={styles.input}
              autoComplete="email"
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              style={styles.input}
              autoComplete="current-password"
            />
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button type="submit" disabled={loading} style={styles.btn}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={styles.footer}>TechVai Extension Control Panel v6.0.13</p>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        input:focus { border-color: var(--accent) !important; box-shadow: 0 0 0 3px var(--accent-subtle) !important; outline: none; }
        button:hover:not(:disabled) { background: var(--accent-hover) !important; transform: translateY(-1px); box-shadow: 0 8px 24px var(--accent-glow) !important; }
      `}</style>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'radial-gradient(ellipse at 50% 0%, rgba(59,130,246,0.08) 0%, transparent 70%), var(--bg)',
    padding: '20px',
  },
  card: {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '40px 36px',
    width: '100%',
    maxWidth: 400,
    animation: 'fadeUp 0.4s ease-out',
    boxShadow: '0 24px 80px -16px rgba(0,0,0,0.6)',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 24,
    justifyContent: 'center',
  },
  logoIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    fontSize: 14,
    color: '#fff',
    letterSpacing: '-0.02em',
    boxShadow: '0 4px 16px rgba(59,130,246,0.3)',
  },
  logoText: {
    fontSize: 22,
    fontWeight: 800,
    letterSpacing: '-0.03em',
    color: 'var(--text)',
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    textAlign: 'center',
    marginBottom: 6,
    color: 'var(--text)',
  },
  subtitle: {
    fontSize: 13,
    color: 'var(--text-2)',
    textAlign: 'center',
    marginBottom: 28,
  },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 12, fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.06em' },
  input: {
    padding: '11px 14px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)',
    background: 'var(--bg-surface)',
    color: 'var(--text)',
    fontSize: 14,
    transition: 'var(--transition)',
  },
  error: {
    padding: '10px 14px',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--danger-bg)',
    border: '1px solid rgba(239,68,68,0.2)',
    color: 'var(--danger)',
    fontSize: 13,
  },
  btn: {
    padding: '12px',
    borderRadius: 'var(--radius-sm)',
    border: 'none',
    background: 'var(--accent)',
    color: '#fff',
    fontWeight: 700,
    fontSize: 14,
    transition: 'all var(--transition)',
    boxShadow: '0 4px 16px var(--accent-glow)',
    marginTop: 4,
  },
  footer: {
    textAlign: 'center',
    fontSize: 11,
    color: 'var(--text-3)',
    marginTop: 24,
  },
};
