import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';
import PageHeader from '../components/ui/PageHeader.jsx';
import { Table, Thead, Th, Tbody, Tr, Td } from '../components/ui/Table.jsx';
import Badge from '../components/ui/Badge.jsx';
import Button from '../components/ui/Button.jsx';
import Modal from '../components/ui/Modal.jsx';
import { FormField, Input } from '../components/ui/FormField.jsx';
import { showToast, ToastContainer } from '../components/ui/Toast.jsx';

const STATUSES = ['trial', 'pro', 'lifetime'];
const EMPTY = { flag_key:'', description:'', is_enabled:true, allowed_statuses:['pro','lifetime'] };

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open:false, mode:'create', data:null });
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('feature_flags').select('*').order('flag_key');
    setFlags(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate() { setForm(EMPTY); setModal({ open:true, mode:'create', data:null }); }
  function openEdit(f) {
    setForm({ flag_key:f.flag_key||'', description:f.description||'', is_enabled:f.is_enabled!==false, allowed_statuses:Array.isArray(f.allowed_statuses)?f.allowed_statuses:['pro','lifetime'] });
    setModal({ open:true, mode:'edit', data:f });
  }

  async function toggleEnabled(f) {
    const { error } = await supabase.from('feature_flags').update({ is_enabled: !f.is_enabled }).eq('id', f.id);
    if (error) { showToast(error.message, 'error'); return; }
    load();
  }

  async function handleSave() {
    if (!form.flag_key.trim()) { showToast('Flag key required', 'error'); return; }
    setSaving(true);
    const payload = { flag_key:form.flag_key.trim().toLowerCase().replace(/\s+/g,'_'), description:form.description.trim(), is_enabled:form.is_enabled, allowed_statuses:form.allowed_statuses };
    const { error } = modal.mode === 'create' ? await supabase.from('feature_flags').insert([payload]) : await supabase.from('feature_flags').update(payload).eq('id', modal.data.id);
    setSaving(false);
    if (error) { showToast(error.message, 'error'); return; }
    showToast('Saved!', 'success'); setModal({ open:false }); load();
  }

  async function handleDelete(f) {
    if (!confirm(`Delete "${f.flag_key}"?`)) return;
    const { error } = await supabase.from('feature_flags').delete().eq('id', f.id);
    if (error) { showToast(error.message, 'error'); return; }
    showToast('Deleted', 'success'); load();
  }

  function toggleStatus(s) {
    setForm(p => ({ ...p, allowed_statuses: p.allowed_statuses.includes(s) ? p.allowed_statuses.filter(x=>x!==s) : [...p.allowed_statuses, s] }));
  }

  return (
    <div>
      <ToastContainer />
      <PageHeader title="Feature Flags" subtitle="Control which features are available per license tier" action={<Button onClick={openCreate}>+ New Flag</Button>} />
      {loading ? <div style={{ textAlign:'center', padding:48, color:'#52525b' }}>Loading...</div> : (
        <Table>
          <Thead><tr><Th>Flag Key</Th><Th>Description</Th><Th>Enabled</Th><Th>Allowed Tiers</Th><Th>Updated</Th><Th>Actions</Th></tr></Thead>
          <Tbody>
            {flags.length === 0 && <Tr><Td style={{ textAlign:'center', color:'#52525b', padding:32 }} colSpan={6}>No flags</Td></Tr>}
            {flags.map(f => (
              <Tr key={f.id}>
                <Td><code style={{ fontSize:12, background:'#18181b', padding:'2px 6px', borderRadius:4, border:'1px solid rgba(255,255,255,0.07)', color:'#3b82f6' }}>{f.flag_key}</code></Td>
                <Td style={{ color:'#a1a1aa', fontSize:12 }}>{f.description||'—'}</Td>
                <Td>
                  <button onClick={() => toggleEnabled(f)} style={{ width:44, height:24, borderRadius:99, border:'none', cursor:'pointer', background:f.is_enabled?'#22c55e':'#27272a', position:'relative', transition:'background 0.2s' }}>
                    <span style={{ position:'absolute', top:3, width:18, height:18, borderRadius:'50%', background:'#fff', transition:'left 0.2s', left:f.is_enabled?23:3 }} />
                  </button>
                </Td>
                <Td><div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>{Array.isArray(f.allowed_statuses)&&f.allowed_statuses.map(s=><Badge key={s} variant={s}>{s}</Badge>)}</div></Td>
                <Td style={{ fontSize:11, color:'#52525b' }}>{new Date(f.updated_at).toLocaleDateString()}</Td>
                <Td><div style={{ display:'flex', gap:4 }}><Button size="sm" variant="ghost" onClick={() => openEdit(f)}>Edit</Button><Button size="sm" variant="danger" onClick={() => handleDelete(f)}>Del</Button></div></Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
      <Modal open={modal.open} onClose={() => setModal({open:false})} title={modal.mode==='create'?'New Feature Flag':'Edit Feature Flag'}>
        <FormField label="Flag Key" hint="lowercase_with_underscores">
          <Input value={form.flag_key} onChange={e=>setForm(p=>({...p,flag_key:e.target.value}))} placeholder="download_files, shield_mode..." disabled={modal.mode==='edit'} />
        </FormField>
        <FormField label="Description">
          <Input value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} placeholder="Short description..." />
        </FormField>
        <FormField label="Allowed Tiers" hint="Select which tiers can access this feature">
          <div style={{ display:'flex', gap:10, marginTop:4 }}>
            {STATUSES.map(s => (
              <label key={s} style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer' }}>
                <input type="checkbox" checked={form.allowed_statuses.includes(s)} onChange={() => toggleStatus(s)} />
                <Badge variant={s}>{s}</Badge>
              </label>
            ))}
          </div>
        </FormField>
        <FormField label="Enabled">
          <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
            <input type="checkbox" checked={form.is_enabled} onChange={e=>setForm(p=>({...p,is_enabled:e.target.checked}))} />
            <span style={{ fontSize:13, color:'#a1a1aa' }}>Feature is enabled globally</span>
          </label>
        </FormField>
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:8 }}>
          <Button variant="ghost" onClick={() => setModal({open:false})}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving?'Saving...':'Save'}</Button>
        </div>
      </Modal>
    </div>
  );
}
