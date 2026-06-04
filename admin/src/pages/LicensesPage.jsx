import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';
import PageHeader from '../components/ui/PageHeader.jsx';
import { Table, Thead, Th, Tbody, Tr, Td } from '../components/ui/Table.jsx';
import Badge from '../components/ui/Badge.jsx';
import Button from '../components/ui/Button.jsx';
import Modal from '../components/ui/Modal.jsx';
import { FormField, Input, Textarea, Select } from '../components/ui/FormField.jsx';
import { showToast, ToastContainer } from '../components/ui/Toast.jsx';

const EMPTY_FORM = {
  license_key: '', user_name: '', email: '', status: 'trial',
  expires_at: '', notes: '', is_active: true, max_devices: 1,
};

function genKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let k = 'TV-';
  for (let i = 0; i < 20; i++) {
    if (i > 0 && i % 5 === 0) k += '-';
    k += chars[Math.floor(Math.random() * chars.length)];
  }
  return k;
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function isExpired(expires_at) {
  if (!expires_at) return false;
  return new Date(expires_at) < new Date();
}

export default function LicensesPage() {
  const [licenses, setLicenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [modal, setModal] = useState({ open: false, mode: 'create', data: null });
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('licenses')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setLicenses(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = licenses.filter(l => {
    const q = search.toLowerCase();
    const matchSearch = !q || l.license_key?.toLowerCase().includes(q) || l.user_name?.toLowerCase().includes(q) || l.email?.toLowerCase().includes(q);
    const matchStatus = filterStatus === 'all' || l.status === filterStatus;
    return matchSearch && matchStatus;
  });

  function openCreate() {
    setForm({ ...EMPTY_FORM, license_key: genKey() });
    setModal({ open: true, mode: 'create', data: null });
  }

  function openEdit(lic) {
    setForm({
      license_key: lic.license_key || '',
      user_name: lic.user_name || '',
      email: lic.email || '',
      status: lic.status || 'trial',
      expires_at: lic.expires_at ? lic.expires_at.slice(0, 16) : '',
      notes: lic.notes || '',
      is_active: lic.is_active !== false,
      max_devices: lic.max_devices || 1,
    });
    setModal({ open: true, mode: 'edit', data: lic });
  }

  async function handleSave() {
    if (!form.license_key.trim()) { showToast('License key is required', 'error'); return; }
    setSaving(true);
    const payload = {
      license_key: form.license_key.trim(),
      user_name: form.user_name.trim(),
      email: form.email.trim(),
      status: form.status,
      expires_at: form.expires_at || null,
      notes: form.notes.trim(),
      is_active: form.is_active,
      max_devices: parseInt(form.max_devices) || 1,
    };

    let error;
    if (modal.mode === 'create') {
      ({ error } = await supabase.from('licenses').insert([payload]));
    } else {
      ({ error } = await supabase.from('licenses').update(payload).eq('id', modal.data.id));
    }

    setSaving(false);
    if (error) { showToast(error.message, 'error'); return; }
    showToast(modal.mode === 'create' ? 'License created!' : 'License updated!', 'success');
    setModal({ open: false });
    load();
  }

  async function handleDelete(lic) {
    if (!confirm(`Delete license "${lic.license_key}"? This cannot be undone.`)) return;
    setDeleting(lic.id);
    const { error } = await supabase.from('licenses').delete().eq('id', lic.id);
    setDeleting(null);
    if (error) { showToast(error.message, 'error'); return; }
    showToast('License deleted', 'success');
    load();
  }

  async function handleToggleActive(lic) {
    const { error } = await supabase.from('licenses').update({ is_active: !lic.is_active }).eq('id', lic.id);
    if (error) { showToast(error.message, 'error'); return; }
    load();
  }

  async function handleRevoke(lic) {
    const { error } = await supabase.from('licenses').update({ session_id: '', device_id: '', last_seen_at: null }).eq('id', lic.id);
    if (error) { showToast(error.message, 'error'); return; }
    showToast('Session revoked', 'success');
    load();
  }

  const stats = {
    total: licenses.length,
    active: licenses.filter(l => l.is_active).length,
    pro: licenses.filter(l => l.status === 'pro').length,
    trial: licenses.filter(l => l.status === 'trial').length,
    lifetime: licenses.filter(l => l.status === 'lifetime').length,
  };

  return (
    <div>
      <ToastContainer />
      <PageHeader
        title="Licenses"
        subtitle={`${stats.total} total — ${stats.active} active — ${stats.pro} pro — ${stats.trial} trial — ${stats.lifetime} lifetime`}
        action={<Button onClick={openCreate}>+ New License</Button>}
      />

      <div style={styles.statsRow}>
        {[
          { label: 'Total', value: stats.total, color: '#3b82f6' },
          { label: 'Active', value: stats.active, color: '#22c55e' },
          { label: 'Pro', value: stats.pro, color: '#22c55e' },
          { label: 'Trial', value: stats.trial, color: '#f59e0b' },
          { label: 'Lifetime', value: stats.lifetime, color: '#3b82f6' },
        ].map(s => (
          <div key={s.label} style={styles.statCard}>
            <span style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</span>
            <span style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 2 }}>{s.label}</span>
          </div>
        ))}
      </div>

      <div style={styles.toolbar}>
        <input
          placeholder="Search key, name, email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={styles.searchInput}
        />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={styles.select}>
          <option value="all">All Status</option>
          <option value="trial">Trial</option>
          <option value="pro">Pro</option>
          <option value="lifetime">Lifetime</option>
        </select>
        <Button variant="ghost" onClick={load} size="sm">Refresh</Button>
      </div>

      {loading ? (
        <div style={styles.loading}>Loading...</div>
      ) : (
        <Table>
          <Thead>
            <tr>
              <Th>License Key</Th>
              <Th>Name / Email</Th>
              <Th>Status</Th>
              <Th>Active</Th>
              <Th>Expires</Th>
              <Th>Last Seen</Th>
              <Th>Device</Th>
              <Th>Actions</Th>
            </tr>
          </Thead>
          <Tbody>
            {filtered.length === 0 && (
              <Tr><Td style={{ textAlign: 'center', color: 'var(--text-3)', padding: '32px' }} colSpan={8}>No licenses found</Td></Tr>
            )}
            {filtered.map(lic => (
              <Tr key={lic.id}>
                <Td>
                  <code style={styles.keyCode}>{lic.license_key}</code>
                </Td>
                <Td>
                  <div style={{ fontWeight: 600 }}>{lic.user_name || '—'}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{lic.email || '—'}</div>
                </Td>
                <Td><Badge variant={lic.status}>{lic.status}</Badge></Td>
                <Td>
                  <button
                    onClick={() => handleToggleActive(lic)}
                    style={{
                      ...styles.toggleBtn,
                      background: lic.is_active ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.1)',
                      color: lic.is_active ? '#22c55e' : '#ef4444',
                    }}
                  >
                    {lic.is_active ? 'Active' : 'Inactive'}
                  </button>
                </Td>
                <Td style={{ color: isExpired(lic.expires_at) ? 'var(--danger)' : '' }}>
                  {lic.status === 'lifetime' ? <Badge variant="lifetime">Lifetime</Badge> : fmtDate(lic.expires_at)}
                </Td>
                <Td style={{ fontSize: 12, color: 'var(--text-2)' }}>{fmtDate(lic.last_seen_at)}</Td>
                <Td style={{ fontSize: 11, color: 'var(--text-3)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {lic.device_id ? lic.device_id.slice(0, 12) + '...' : '—'}
                </Td>
                <Td>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <Button size="sm" variant="ghost" onClick={() => openEdit(lic)}>Edit</Button>
                    <Button size="sm" variant="ghost" onClick={() => handleRevoke(lic)} title="Clear device session">Revoke</Button>
                    <Button size="sm" variant="danger" onClick={() => handleDelete(lic)} disabled={deleting === lic.id}>Del</Button>
                  </div>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}

      <Modal open={modal.open} onClose={() => setModal({ open: false })} title={modal.mode === 'create' ? 'New License' : 'Edit License'} width={520}>
        <FormField label="License Key">
          <div style={{ display: 'flex', gap: 8 }}>
            <Input value={form.license_key} onChange={e => setForm(p => ({ ...p, license_key: e.target.value }))} placeholder="TV-XXXXX-XXXXX-XXXXX-XXXXX" style={{ flex: 1 }} />
            <Button variant="ghost" onClick={() => setForm(p => ({ ...p, license_key: genKey() }))}>Gen</Button>
          </div>
        </FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormField label="User Name">
            <Input value={form.user_name} onChange={e => setForm(p => ({ ...p, user_name: e.target.value }))} placeholder="John Doe" />
          </FormField>
          <FormField label="Email">
            <Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="user@email.com" />
          </FormField>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <FormField label="Status">
            <Select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
              <option value="trial">Trial</option>
              <option value="pro">Pro</option>
              <option value="lifetime">Lifetime</option>
            </Select>
          </FormField>
          <FormField label="Expires At">
            <Input type="datetime-local" value={form.expires_at} onChange={e => setForm(p => ({ ...p, expires_at: e.target.value }))} />
          </FormField>
          <FormField label="Max Devices">
            <Input type="number" min="1" max="10" value={form.max_devices} onChange={e => setForm(p => ({ ...p, max_devices: e.target.value }))} />
          </FormField>
        </div>
        <FormField label="Notes">
          <Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Internal notes..." rows={2} />
        </FormField>
        <FormField label="Active">
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} />
            <span style={{ fontSize: 13, color: 'var(--text-2)' }}>License is active</span>
          </label>
        </FormField>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
          <Button variant="ghost" onClick={() => setModal({ open: false })}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save License'}</Button>
        </div>
      </Modal>
    </div>
  );
}

const styles = {
  statsRow: { display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' },
  statCard: {
    background: 'var(--bg-elevated)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)', padding: '12px 16px',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    minWidth: 80, flex: 1,
  },
  toolbar: { display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  searchInput: {
    flex: 1, minWidth: 200, padding: '8px 12px',
    borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
    background: 'var(--bg-surface)', color: 'var(--text)',
    fontSize: 13, outline: 'none', fontFamily: 'inherit',
  },
  select: {
    padding: '8px 12px', borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)', background: 'var(--bg-surface)',
    color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: 'inherit',
  },
  loading: { textAlign: 'center', padding: 48, color: 'var(--text-3)' },
  keyCode: {
    fontSize: 11, background: 'var(--bg-surface)', padding: '3px 7px',
    borderRadius: 4, border: '1px solid var(--border)',
    fontFamily: 'monospace', color: 'var(--accent)',
    letterSpacing: '0.04em',
  },
  toggleBtn: {
    padding: '3px 10px', borderRadius: 99, border: 'none',
    fontSize: 10, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.05em',
  },
};
