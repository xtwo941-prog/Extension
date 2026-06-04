import React from 'react';

export default function Button({ children, onClick, variant = 'primary', size = 'md', disabled, style, type = 'button' }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    border: 'none', borderRadius: 'var(--radius-sm)', fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
    transition: 'all var(--transition)', whiteSpace: 'nowrap', fontSize: 13,
  };
  const sizes = {
    sm: { padding: '5px 12px', fontSize: 12 },
    md: { padding: '8px 16px' },
    lg: { padding: '11px 22px', fontSize: 14 },
  };
  const variants = {
    primary: { background: 'var(--accent)', color: '#fff', boxShadow: '0 2px 8px var(--accent-glow)' },
    secondary: { background: 'var(--bg-surface)', color: 'var(--text)', border: '1px solid var(--border)' },
    danger: { background: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.2)' },
    success: { background: 'var(--success-bg)', color: 'var(--success)', border: '1px solid rgba(34,197,94,0.2)' },
    ghost: { background: 'transparent', color: 'var(--text-2)', border: '1px solid var(--border)' },
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{ ...base, ...sizes[size], ...variants[variant], ...style }}
    >
      {children}
    </button>
  );
}
