import React, { useEffect } from 'react';

export default function Modal({ open, onClose, title, children, width = 480 }) {
  useEffect(() => {
    if (!open) return;
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div style={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ ...styles.modal, maxWidth: width }}>
        <div style={styles.header}>
          <span style={styles.title}>{title}</span>
          <button onClick={onClose} style={styles.close}>✕</button>
        </div>
        <div style={styles.body}>{children}</div>
      </div>
      <style>{`@keyframes modalIn { from { opacity:0; transform:scale(0.95) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 1000,
    background: 'rgba(0,0,0,0.7)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', padding: 20,
    backdropFilter: 'blur(4px)',
  },
  modal: {
    background: 'var(--bg-elevated)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)', width: '100%',
    animation: 'modalIn 0.2s ease-out',
    boxShadow: '0 24px 80px -16px rgba(0,0,0,0.6)',
  },
  header: {
    padding: '16px 20px', borderBottom: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  title: { fontWeight: 700, fontSize: 15 },
  close: {
    width: 28, height: 28, border: '1px solid var(--border)',
    borderRadius: 6, background: 'transparent', color: 'var(--text-2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, cursor: 'pointer', transition: 'all var(--transition)',
  },
  body: { padding: '20px' },
};
