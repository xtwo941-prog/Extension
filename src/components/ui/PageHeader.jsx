import React from 'react';

export default function PageHeader({ title, subtitle, action }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
      <div>
        <h1 style={{ fontSize:20, fontWeight:700, letterSpacing:'-0.02em', color:'#fafafa' }}>{title}</h1>
        {subtitle && <p style={{ fontSize:13, color:'#a1a1aa', marginTop:2 }}>{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
