import React from 'react';

export default function PageHeader({ title, subtitle, action }) {
  return (
    <div style={styles.header}>
      <div>
        <h1 style={styles.title}>{title}</h1>
        {subtitle && <p style={styles.subtitle}>{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

const styles = {
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 24, flexWrap: 'wrap', gap: 12,
  },
  title: { fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' },
  subtitle: { fontSize: 13, color: 'var(--text-2)', marginTop: 2 },
};
