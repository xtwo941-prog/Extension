import React from 'react';

export function Table({ children }) {
  return (
    <div style={{ overflowX:'auto', borderRadius:12, border:'1px solid rgba(255,255,255,0.07)' }}>
      <table style={{ width:'100%', borderCollapse:'collapse' }}>{children}</table>
    </div>
  );
}
export function Thead({ children }) {
  return <thead style={{ background:'#18181b', borderBottom:'1px solid rgba(255,255,255,0.07)' }}>{children}</thead>;
}
export function Th({ children, style }) {
  return <th style={{ padding:'10px 14px', textAlign:'left', fontSize:11, fontWeight:700, color:'#a1a1aa', textTransform:'uppercase', letterSpacing:'0.06em', whiteSpace:'nowrap', ...style }}>{children}</th>;
}
export function Tbody({ children }) { return <tbody>{children}</tbody>; }
export function Tr({ children, onClick }) {
  return (
    <tr onClick={onClick} style={{ borderBottom:'1px solid rgba(255,255,255,0.07)', transition:'background 0.18s', cursor:onClick?'pointer':'default' }}
      onMouseEnter={e => { if(onClick) e.currentTarget.style.background='#27272a'; }}
      onMouseLeave={e => { e.currentTarget.style.background=''; }}>
      {children}
    </tr>
  );
}
export function Td({ children, style, colSpan }) {
  return <td colSpan={colSpan} style={{ padding:'11px 14px', fontSize:13, color:'#fafafa', ...style }}>{children}</td>;
}
