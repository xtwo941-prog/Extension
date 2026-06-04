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
    if (error) setError('Invalid credentials. Please try again.');
    setLoading(false);
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.logo}>
          <div style={s.logoIcon}>TV</div>
          <span style={s.logoText}>TechVai</span>
        </div>
        <h1 style={s.title}>Admin Panel</h1>
        <p style={s.subtitle}>Sign in to manage your extension</p>

        <form onSubmit={handleSubmit} style={s.form}>
          <div style={s.field}>
            <label style={s.label}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="admin@techvai.com" required style={s.input} autoComplete="email" />
          </div>
          <div style={s.field}>
            <label style={s.label}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password" required style={s.input} autoComplete="current-password" />
          </div>
          {error && <div style={s.error}>{error}</div>}
          <button type="submit" disabled={loading} style={{ ...s.btn, opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p style={s.footer}>TechVai Extension Control Panel v6.0.13</p>
      </div>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        input:focus { border-color: #3b82f6 !important; box-shadow: 0 0 0 3px rgba(59,130,246,0.12) !important; outline: none; }
        button[type=submit]:hover:not(:disabled) { background: #2563eb !important; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(59,130,246,0.3) !important; }
      `}</style>
    </div>
  );
}

const s = {
  page: { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'radial-gradient(ellipse at 50% 0%, rgba(59,130,246,0.08) 0%, transparent 70%), #0a0a0b', padding:'20px' },
  card: { background:'#111113', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:'40px 36px', width:'100%', maxWidth:400, animation:'fadeUp 0.4s ease-out', boxShadow:'0 24px 80px -16px rgba(0,0,0,0.6)' },
  logo: { display:'flex', alignItems:'center', gap:10, marginBottom:24, justifyContent:'center' },
  logoIcon: { width:40, height:40, borderRadius:10, background:'linear-gradient(135deg, #3b82f6, #1d4ed8)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:14, color:'#fff', letterSpacing:'-0.02em', boxShadow:'0 4px 16px rgba(59,130,246,0.3)' },
  logoText: { fontSize:22, fontWeight:800, letterSpacing:'-0.03em', color:'#fafafa' },
  title: { fontSize:22, fontWeight:700, textAlign:'center', marginBottom:6, color:'#fafafa' },
  subtitle: { fontSize:13, color:'#a1a1aa', textAlign:'center', marginBottom:28 },
  form: { display:'flex', flexDirection:'column', gap:16 },
  field: { display:'flex', flexDirection:'column', gap:6 },
  label: { fontSize:12, fontWeight:600, color:'#a1a1aa', textTransform:'uppercase', letterSpacing:'0.06em' },
  input: { padding:'11px 14px', borderRadius:8, border:'1px solid rgba(255,255,255,0.07)', background:'#18181b', color:'#fafafa', fontSize:14, transition:'all 0.18s', width:'100%' },
  error: { padding:'10px 14px', borderRadius:8, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', color:'#ef4444', fontSize:13 },
  btn: { padding:'12px', borderRadius:8, border:'none', background:'#3b82f6', color:'#fff', fontWeight:700, fontSize:14, transition:'all 0.18s', boxShadow:'0 4px 16px rgba(59,130,246,0.25)', marginTop:4, cursor:'pointer' },
  footer: { textAlign:'center', fontSize:11, color:'#52525b', marginTop:24 },
};
