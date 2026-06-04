import React from 'react';

const inputStyle = { width:'100%', padding:'9px 12px', borderRadius:8, border:'1px solid rgba(255,255,255,0.07)', background:'#18181b', color:'#fafafa', fontSize:13, outline:'none', transition:'border-color 0.18s', fontFamily:'inherit' };

export function FormField({ label, children, hint }) {
  return (
    <div style={{ marginBottom:14 }}>
      {label && <label style={{ display:'block', marginBottom:6, fontSize:12, fontWeight:600, color:'#a1a1aa', textTransform:'uppercase', letterSpacing:'0.06em' }}>{label}</label>}
      {children}
      {hint && <p style={{ fontSize:11, color:'#52525b', marginTop:4 }}>{hint}</p>}
    </div>
  );
}
export function Input({ style, ...props }) {
  return <input style={{ ...inputStyle, ...style }} {...props} />;
}
export function Textarea({ style, ...props }) {
  return <textarea style={{ ...inputStyle, minHeight:80, resize:'vertical', ...style }} {...props} />;
}
export function Select({ children, style, ...props }) {
  return <select style={{ ...inputStyle, ...style }} {...props}>{children}</select>;
}
