import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';

const NAV = [
  { to: 'licenses', label: 'Licenses', icon: '🔑' },
  { to: 'packages', label: 'Packages', icon: '📦' },
  { to: 'notifications', label: 'Notifications', icon: '🔔' },
  { to: 'feature-flags', label: 'Feature Flags', icon: '🚩' },
  { to: 'versions', label: 'Ext. Versions', icon: '🔄' },
];

export default function DashboardLayout({ session }) {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate('/');
  }

  const email = session?.user?.email || '';

  return (
    <div style={styles.root}>
      <aside style={{ ...styles.sidebar, width: sidebarOpen ? 220 : 64 }}>
        <div style={styles.brand}>
          <div style={styles.brandIcon}>TV</div>
          {sidebarOpen && <span style={styles.brandText}>TechVai</span>}
        </div>

        <nav style={styles.nav}>
          {NAV.map(n => (
            <NavLink
              key={n.to}
              to={`/dashboard/${n.to}`}
              style={({ isActive }) => ({
                ...styles.navItem,
                ...(isActive ? styles.navItemActive : {}),
              })}
              title={!sidebarOpen ? n.label : ''}
            >
              <span style={styles.navIcon}>{n.icon}</span>
              {sidebarOpen && <span style={styles.navLabel}>{n.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div style={styles.sidebarBottom}>
          {sidebarOpen && (
            <div style={styles.userInfo}>
              <div style={styles.userAvatar}>{email[0]?.toUpperCase() || 'A'}</div>
              <div style={styles.userMeta}>
                <div style={styles.userName}>Admin</div>
                <div style={styles.userEmail}>{email}</div>
              </div>
            </div>
          )}
          <button onClick={handleLogout} style={styles.logoutBtn} title="Logout">
            <span>🚪</span>
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <div style={styles.mainWrap}>
        <header style={styles.header}>
          <button onClick={() => setSidebarOpen(p => !p)} style={styles.toggleBtn}>
            {sidebarOpen ? '◀' : '▶'}
          </button>
          <span style={styles.headerTitle}>TechVai Admin Panel</span>
          <span style={styles.versionBadge}>v6.0.13</span>
        </header>
        <main style={styles.main}>
          <Outlet />
        </main>
      </div>

      <style>{`
        .nav-item-active { background: var(--accent-subtle) !important; color: var(--accent) !important; border-color: rgba(59,130,246,0.2) !important; }
        a:hover { background: var(--bg-hover) !important; }
      `}</style>
    </div>
  );
}

const styles = {
  root: { display: 'flex', height: '100vh', overflow: 'hidden' },
  sidebar: {
    background: 'var(--bg-elevated)',
    borderRight: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    transition: 'width 0.2s ease',
    overflow: 'hidden',
  },
  brand: {
    padding: '20px 16px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    borderBottom: '1px solid var(--border)',
    flexShrink: 0,
  },
  brandIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    fontSize: 12,
    color: '#fff',
    flexShrink: 0,
    boxShadow: '0 2px 8px rgba(59,130,246,0.25)',
  },
  brandText: { fontWeight: 800, fontSize: 16, letterSpacing: '-0.02em', whiteSpace: 'nowrap' },
  nav: { flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '9px 10px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid transparent',
    color: 'var(--text-2)',
    fontSize: 13,
    fontWeight: 500,
    transition: 'all var(--transition)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textDecoration: 'none',
  },
  navItemActive: {
    background: 'var(--accent-subtle)',
    color: 'var(--accent)',
    border: '1px solid rgba(59,130,246,0.18)',
    fontWeight: 600,
  },
  navIcon: { fontSize: 15, flexShrink: 0, width: 20, textAlign: 'center' },
  navLabel: { overflow: 'hidden', textOverflow: 'ellipsis' },
  sidebarBottom: {
    borderTop: '1px solid var(--border)',
    padding: '12px 8px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  userInfo: { display: 'flex', alignItems: 'center', gap: 8, padding: '4px 6px' },
  userAvatar: {
    width: 30,
    height: 30,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--accent), #1d4ed8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontWeight: 700,
    color: '#fff',
    flexShrink: 0,
  },
  userMeta: { overflow: 'hidden', flex: 1 },
  userName: { fontSize: 12, fontWeight: 600, color: 'var(--text)' },
  userEmail: { fontSize: 10, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 10px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid transparent',
    background: 'transparent',
    color: 'var(--text-2)',
    fontSize: 12,
    fontWeight: 500,
    transition: 'all var(--transition)',
    width: '100%',
    cursor: 'pointer',
  },
  mainWrap: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  header: {
    padding: '0 24px',
    height: 56,
    background: 'var(--bg-elevated)',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flexShrink: 0,
  },
  toggleBtn: {
    width: 30,
    height: 30,
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-xs)',
    background: 'transparent',
    color: 'var(--text-2)',
    fontSize: 11,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all var(--transition)',
    cursor: 'pointer',
  },
  headerTitle: { fontWeight: 700, fontSize: 15, flex: 1 },
  versionBadge: {
    fontSize: 10,
    fontWeight: 700,
    padding: '3px 8px',
    borderRadius: 99,
    background: 'var(--accent-subtle)',
    border: '1px solid rgba(59,130,246,0.15)',
    color: 'var(--accent)',
    letterSpacing: '0.04em',
  },
  main: { flex: 1, overflow: 'auto', padding: '24px' },
};
