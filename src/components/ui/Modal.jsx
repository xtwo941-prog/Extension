import React, { useEffect } from 'react';

export default function Modal({ open, onClose, title, children, width = 480 }) {
  useEffect(() => {
    if (!open) return;
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', padding:20, backdropFilter:'blur(4px)' }}>
      <div style={{ background:'#111113', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, width:'100%', maxWidth:width, animation:'modalIn 0.2s ease-out', boxShadow:'0 24px 80px -16px rgba(0,0,0,0.6)' }}>
        <div style={{ padding:'16px 20px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontWeight:700, fontSize:15, color:'#fafafa' }}>{title}</span>
          <button onClick={onClose} style={{ width:28, height:28, border:'1px solid rgba(255,255,255,0.07)', borderRadius:6, background:'transparent', color:'#a1a1aa', fontSize:12, cursor:'pointer' }}>✕</button>
        </div>
        <div style={{ padding:'20px' }}>{children}</div>
      </div>
      <style>{`@keyframes modalIn { from { opacity:0; transform:scale(0.95) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
    </div>
  );
}
