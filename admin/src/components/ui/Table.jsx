import React from 'react';

export function Table({ children }) {
  return (
    <div style={{ overflowX: 'auto', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        {children}
      </table>
    </div>
  );
}

export function Thead({ children }) {
  return (
    <thead style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
      {children}
    </thead>
  );
}

export function Th({ children, style }) {
  return (
    <th style={{
      padding: '10px 14px', textAlign: 'left',
      fontSize: 11, fontWeight: 700, color: 'var(--text-2)',
      textTransform: 'uppercase', letterSpacing: '0.06em',
      whiteSpace: 'nowrap', ...style,
    }}>
      {children}
    </th>
  );
}

export function Tbody({ children }) {
  return <tbody>{children}</tbody>;
}

export function Tr({ children, onClick }) {
  return (
    <tr
      onClick={onClick}
      style={{
        borderBottom: '1px solid var(--border)',
        transition: 'background var(--transition)',
        cursor: onClick ? 'pointer' : 'default',
      }}
      onMouseEnter={e => { if (onClick) e.currentTarget.style.background = 'var(--bg-hover)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = ''; }}
    >
      {children}
    </tr>
  );
}

export function Td({ children, style }) {
  return (
    <td style={{ padding: '11px 14px', fontSize: 13, color: 'var(--text)', ...style }}>
      {children}
    </td>
  );
}
