import React from 'react';

export function FormField({ label, children, hint }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={styles.label}>{label}</label>}
      {children}
      {hint && <p style={styles.hint}>{hint}</p>}
    </div>
  );
}

export function Input({ style, ...props }) {
  return (
    <input
      style={{ ...styles.input, ...style }}
      {...props}
    />
  );
}

export function Textarea({ style, ...props }) {
  return (
    <textarea
      style={{ ...styles.input, minHeight: 80, resize: 'vertical', ...style }}
      {...props}
    />
  );
}

export function Select({ children, style, ...props }) {
  return (
    <select style={{ ...styles.input, ...style }} {...props}>
      {children}
    </select>
  );
}

const styles = {
  label: {
    display: 'block', marginBottom: 6,
    fontSize: 12, fontWeight: 600,
    color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.06em',
  },
  input: {
    width: '100%', padding: '9px 12px',
    borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
    background: 'var(--bg-surface)', color: 'var(--text)',
    fontSize: 13, outline: 'none', transition: 'border-color var(--transition)',
    fontFamily: 'inherit',
  },
  hint: { fontSize: 11, color: 'var(--text-3)', marginTop: 4 },
};
