import React from 'react';

const variants = {
  primary: { background:'#3b82f6', color:'#fff', boxShadow:'0 2px 8px rgba(59,130,246,0.25)', border:'none' },
  secondary: { background:'#18181b', color:'#fafafa', border:'1px solid rgba(255,255,255,0.07)' },
  danger: { background:'rgba(239,68,68,0.08)', color:'#ef4444', border:'1px solid rgba(239,68,68,0.2)' },
  success: { background:'rgba(34,197,94,0.08)', color:'#22c55e', border:'1px solid rgba(34,197,94,0.2)' },
  ghost: { background:'transparent', color:'#a1a1aa', border:'1px solid rgba(255,255,255,0.07)' },
};
const sizes = {
  sm: { padding:'5px 11px', fontSize:12 },
  md: { padding:'8px 15px', fontSize:13 },
  lg: { padding:'11px 22px', fontSize:14 },
};

export default function Button({ children, onClick, variant='primary', size='md', disabled, style, type='button' }) {
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{ display:'inline-flex', alignItems:'center', gap:6, borderRadius:8, fontWeight:600, cursor:disabled?'not-allowed':'pointer', opacity:disabled?0.5:1, transition:'all 0.18s', whiteSpace:'nowrap', ...sizes[size], ...variants[variant], ...style }}>
      {children}
    </button>
  );
}
