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
  const [open, setOpen] = useState(true);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate('/');
  }

  const email = session?.user?.email || '';

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'#0a0a0b' }}>
      <aside style={{ width: open ? 220 : 64, background:'#111113', borderRight:'1px solid rgba(255,255,255,0.07)', display:'flex', flexDirection:'column', flexShrink:0, transition:'width 0.2s ease', overflow:'hidden' }}>
        <div style={{ padding:'18px 14px 14px', display:'flex', alignItems:'center', gap:10, borderBottom:'1px solid rgba(255,255,255,0.07)', flexShrink:0 }}>
          <div style={{ width:34, height:34, borderRadius:8, background:'linear-gradient(135deg,#3b82f6,#1d4ed8)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:12, color:'#fff', flexShrink:0 }}>TV</div>
          {open && <span style={{ fontWeight:800, fontSize:16, letterSpacing:'-0.02em', whiteSpace:'nowrap', color:'#fafafa' }}>TechVai</span>}
        </div>

        <nav style={{ flex:1, padding:'10px 8px', display:'flex', flexDirection:'column', gap:2, overflowY:'auto' }}>
          {NAV.map(n => (
            <NavLink key={n.to} to={`/dashboard/${n.to}`}
              style={({ isActive }) => ({
                display:'flex', alignItems:'center', gap:10, padding:'9px 10px',
                borderRadius:8, border:'1px solid transparent',
                color: isActive ? '#3b82f6' : '#a1a1aa',
                background: isActive ? 'rgba(59,130,246,0.08)' : 'transparent',
                borderColor: isActive ? 'rgba(59,130,246,0.18)' : 'transparent',
                fontSize:13, fontWeight: isActive ? 600 : 500,
                transition:'all 0.18s', whiteSpace:'nowrap', overflow:'hidden', textDecoration:'none',
              })}
            >
              <span style={{ fontSize:15, flexShrink:0, width:20, textAlign:'center' }}>{n.icon}</span>
              {open && <span style={{ overflow:'hidden', textOverflow:'ellipsis' }}>{n.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div style={{ borderTop:'1px solid rgba(255,255,255,0.07)', padding:'10px 8px', display:'flex', flexDirection:'column', gap:8 }}>
          {open && (
            <div style={{ display:'flex', alignItems:'center', gap:8, padding:'4px 6px' }}>
              <div style={{ width:28, height:28, borderRadius:'50%', background:'linear-gradient(135deg,#3b82f6,#1d4ed8)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#fff', flexShrink:0 }}>
                {email[0]?.toUpperCase() || 'A'}
              </div>
              <div style={{ overflow:'hidden', flex:1 }}>
                <div style={{ fontSize:11, fontWeight:600, color:'#fafafa' }}>Admin</div>
                <div style={{ fontSize:10, color:'#52525b', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{email}</div>
              </div>
            </div>
          )}
          <button onClick={handleLogout} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', borderRadius:8, border:'1px solid transparent', background:'transparent', color:'#a1a1aa', fontSize:12, fontWeight:500, transition:'all 0.18s', width:'100%', cursor:'pointer' }}>
            <span>🚪</span>{open && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <header style={{ padding:'0 24px', height:54, background:'#111113', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', gap:12, flexShrink:0 }}>
          <button onClick={() => setOpen(p => !p)} style={{ width:28, height:28, border:'1px solid rgba(255,255,255,0.07)', borderRadius:6, background:'transparent', color:'#a1a1aa', fontSize:10, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
            {open ? '◀' : '▶'}
          </button>
          <span style={{ fontWeight:700, fontSize:14, flex:1, color:'#fafafa' }}>TechVai Admin Panel</span>
          <span style={{ fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:99, background:'rgba(59,130,246,0.08)', border:'1px solid rgba(59,130,246,0.15)', color:'#3b82f6', letterSpacing:'0.04em' }}>v6.0.13</span>
        </header>
        <main style={{ flex:1, overflow:'auto', padding:'24px' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
