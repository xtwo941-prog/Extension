import React from 'react';

const COLORS = {
  pro: { bg: 'rgba(34,197,94,0.1)', color: '#22c55e', border: 'rgba(34,197,94,0.2)' },
  lifetime: { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: 'rgba(59,130,246,0.2)' },
  trial: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: 'rgba(245,158,11,0.2)' },
  active: { bg: 'rgba(34,197,94,0.1)', color: '#22c55e', border: 'rgba(34,197,94,0.2)' },
  inactive: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'rgba(239,68,68,0.2)' },
  enabled: { bg: 'rgba(34,197,94,0.1)', color: '#22c55e', border: 'rgba(34,197,94,0.2)' },
  disabled: { bg: 'rgba(113,113,122,0.1)', color: '#71717a', border: 'rgba(113,113,122,0.2)' },
  all: { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: 'rgba(59,130,246,0.2)' },
  reseller: { bg: 'rgba(168,85,247,0.1)', color: '#a855f7', border: 'rgba(168,85,247,0.2)' },
  admin: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'rgba(239,68,68,0.2)' },
};

export default function Badge({ children, variant = 'active' }) {
  const c = COLORS[variant] || COLORS.active;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px', borderRadius: 99,
      fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
      textTransform: 'uppercase',
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
      whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  );
}
