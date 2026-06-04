import React, { useEffect, useState } from 'react';

let toastListeners = [];
let toastQueue = [];
let toastIdCounter = 0;

export function showToast(message, type = 'info') {
  const id = ++toastIdCounter;
  const item = { id, message, type };
  toastQueue = [...toastQueue, item];
  toastListeners.forEach(fn => fn([...toastQueue]));
  setTimeout(() => {
    toastQueue = toastQueue.filter(t => t.id !== id);
    toastListeners.forEach(fn => fn([...toastQueue]));
  }, 3500);
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    toastListeners.push(setToasts);
    return () => { toastListeners = toastListeners.filter(fn => fn !== setToasts); };
  }, []);

  const colors = { success: '#22c55e', error: '#ef4444', info: '#3b82f6', warning: '#f59e0b' };

  return (
    <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          padding: '10px 16px', borderRadius: 'var(--radius-sm)',
          background: 'var(--bg-surface)', border: `1px solid ${colors[t.type]}33`,
          borderLeft: `3px solid ${colors[t.type]}`,
          color: 'var(--text)', fontSize: 13, fontWeight: 500,
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          animation: 'toastIn 0.2s ease-out', minWidth: 240, maxWidth: 360,
          pointerEvents: 'auto',
        }}>
          {t.message}
        </div>
      ))}
      <style>{`@keyframes toastIn { from { opacity:0; transform:translateX(12px); } to { opacity:1; transform:translateX(0); } }`}</style>
    </div>
  );
}
