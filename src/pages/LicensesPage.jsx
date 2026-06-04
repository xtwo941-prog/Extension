import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';
import PageHeader from '../components/ui/PageHeader.jsx';
import { Table, Thead, Th, Tbody, Tr, Td } from '../components/ui/Table.jsx';
import Badge from '../components/ui/Badge.jsx';
import Button from '../components/ui/Button.jsx';
import Modal from '../components/ui/Modal.jsx';
import { FormField, Input, Textarea, Select } from '../components/ui/FormField.jsx';
import { showToast, ToastContainer } from '../components/ui/Toast.jsx';

const EMPTY = { license_key:'', user_name:'', email:'', status:'trial', expires_at:'', notes:'', is_active:true, max_devices:1 };

function genKey() {
  const c = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let k = 'TV';
  for (let i = 0; i < 20; i++) {
    if (i % 5 === 0) k += '-';
    k += c[Math.floor(Math.random() * c.length)];
  }
  return k;
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
}

export default function LicensesPage() {
  const [licenses, setLicenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [modal, setModal] = useState({ open:false, mode:'create', data:null });
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('licenses').select('*').order('created_at', { ascending:false });
    setLicenses(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = licenses.filter(l => {
    const q = search.toLowerCase();
    const m = !q || l.license_key?.toLowerCase().includes(q) || l.user_name?.toLowerCase().includes(q) || l.email?.toLowerCase().includes(q);
    return m && (filterStatus === 'all' || l.status === filterStatus);
  });

  function openCreate() {
    setForm({ ...EMPTY, license_key: genKey() });
    setModal({ open:true, mode:'create', data:null });
  }
  function openEdit(l) {
    setForm({ license_key:l.license_key||'', user_name:l.user_name||'', email:l.email||'', status:l.status||'trial', expires_at:l.expires_at?l.expires_at.slice(0,16):'', notes:l.notes||'', is_active:l.is_active!==false, max_devices:l.max_devices||1 });
    setModal({ open:true, mode:'edit', data:l });
  }

  async function handleSave() {
    if (!form.license_key.trim()) { showToast('License key required', 'error'); return; }
    setSaving(true);
    const p = { license_key:form.license_key.trim(), user_name:form.user_name.trim(), email:form.email.trim(), status:form.status, expires_at:form.expires_at||null, notes:form.notes.trim(), is_active:form.is_active, max_devices:parseInt(form.max_devices)||1 };
    const { error } = modal.mode === 'create'
      ? await supabase.from('licenses').insert([p])
      : await supabase.from('licenses').update(p).eq('id', modal.data.id);
    setSaving(false);
    if (error) { showToast(error.message, 'error'); return; }
    showToast(modal.mode === 'create' ? 'License created!' : 'Updated!', 'success');
    setModal({ open:false });
    load();
  }

  async function handleDelete(l) {
    if (!confirm(`Delete "${l.license_key}"?`)) return;
    const { error } = await supabase.from('licenses').delete().eq('id', l.id);
    if (error) { showToast(error.message, 'error'); return; }
    showToast('Deleted', 'success'); load();
  }

  async function toggleActive(l) {
    await supabase.from('licenses').update({ is_active: !l.is_active }).eq('id', l.id);
    load();
  }

  async function revokeSession(l) {
    await supabase.from('licenses').update({ session_id:'', device_id:'', last_seen_at:null }).eq('id', l.id);
    showToast('Session revoked', 'success'); load();
  }

  const stats = { total:licenses.length, active:licenses.filter(l=>l.is_active).length, pro:licenses.filter(l=>l.status==='pro').length, trial:licenses.filter(l=>l.status==='trial').length, lifetime:licenses.filter(l=>l.status==='lifetime').length };

  return (
    <div>
      <ToastContainer />
      <PageHeader title="Licenses" subtitle={`${stats.total} total • ${stats.active} active • ${stats.pro} pro • ${stats.trial} trial • ${stats.lifetime} lifetime`} action={<Button onClick={openCreate}>+ New License</Button>} />

      <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap' }}>
        {[['Total',stats.total,'#3b82f6'],['Active',stats.active,'#22c55e'],['Pro',stats.pro,'#22c55e'],['Trial',stats.trial,'#f59e0b'],['Lifetime',stats.lifetime,'#3b82f6']].map(([l,v,c]) => (
          <div key={l} style={{ background:'#111113', border:'1px solid rgba(255,255,255,0.07)', borderRadius:8, padding:'12px 18px', display:'flex', flexDirection:'column', alignItems:'center', flex:1, minWidth:70 }}>
            <span style={{ fontSize:22, fontWeight:800, color:c }}>{v}</span>
            <span style={{ fontSize:11, color:'#a1a1aa', marginTop:2 }}>{l}</span>
          </div>
        ))}
      </div>

      <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
        <input placeholder="Search key, name, email..." value={search} onChange={e=>setSearch(e.target.value)} style={{ flex:1, minWidth:200, padding:'8px 12px', borderRadius:8, border:'1px solid rgba(255,255,255,0.07)', background:'#18181b', color:'#fafafa', fontSize:13, outline:'none', fontFamily:'inherit' }} />
        <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={{ padding:'8px 12px', borderRadius:8, border:'1px solid rgba(255,255,255,0.07)', background:'#18181b', color:'#fafafa', fontSize:13, outline:'none', fontFamily:'inherit' }}>
          <option value="all">All Status</option>
          <option value="trial">Trial</option>
          <option value="pro">Pro</option>
          <option value="lifetime">Lifetime</option>
        </select>
        <Button variant="ghost" onClick={load} size="sm">Refresh</Button>
      </div>

      {loading ? <div style={{ textAlign:'center', padding:48, color:'#52525b' }}>Loading...</div> : (
        <Table>
          <Thead><tr><Th>License Key</Th><Th>Name / Email</Th><Th>Status</Th><Th>Active</Th><Th>Expires</Th><Th>Last Seen</Th><Th>Actions</Th></tr></Thead>
          <Tbody>
            {filtered.length === 0 && <Tr><Td style={{ textAlign:'center', color:'#52525b', padding:32 }} colSpan={7}>No licenses found</Td></Tr>}
            {filtered.map(l => (
              <Tr key={l.id}>
                <Td><code style={{ fontSize:11, background:'#18181b', padding:'3px 7px', borderRadius:4, border:'1px solid rgba(255,255,255,0.07)', color:'#3b82f6', fontFamily:'monospace', letterSpacing:'0.04em' }}>{l.license_key}</code></Td>
                <Td>
                  <div style={{ fontWeight:600 }}>{l.user_name||'—'}</div>
                  <div style={{ fontSize:11, color:'#52525b' }}>{l.email||'—'}</div>
                </Td>
                <Td><Badge variant={l.status}>{l.status}</Badge></Td>
                <Td>
                  <button onClick={() => toggleActive(l)} style={{ padding:'3px 10px', borderRadius:99, border:'none', fontSize:10, fontWeight:700, cursor:'pointer', background:l.is_active?'rgba(34,197,94,0.15)':'rgba(239,68,68,0.1)', color:l.is_active?'#22c55e':'#ef4444' }}>
                    {l.is_active ? 'Active' : 'Inactive'}
                  </button>
                </Td>
                <Td>{l.status==='lifetime' ? <Badge variant="lifetime">Lifetime</Badge> : fmtDate(l.expires_at)}</Td>
                <Td style={{ fontSize:12, color:'#a1a1aa' }}>{fmtDate(l.last_seen_at)}</Td>
                <Td>
                  <div style={{ display:'flex', gap:4 }}>
                    <Button size="sm" variant="ghost" onClick={() => openEdit(l)}>Edit</Button>
                    <Button size="sm" variant="ghost" onClick={() => revokeSession(l)}>Revoke</Button>
                    <Button size="sm" variant="danger" onClick={() => handleDelete(l)}>Del</Button>
                  </div>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}

      <Modal open={modal.open} onClose={() => setModal({open:false})} title={modal.mode==='create'?'New License':'Edit License'} width={520}>
        <FormField label="License Key">
          <div style={{ display:'flex', gap:8 }}>
            <Input value={form.license_key} onChange={e=>setForm(p=>({...p,license_key:e.target.value}))} placeholder="TV-XXXXX-XXXXX-XXXXX-XXXXX" style={{ flex:1 }} />
            <Button variant="ghost" onClick={() => setForm(p=>({...p,license_key:genKey()}))}>Gen</Button>
          </div>
        </FormField>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <FormField label="Name"><Input value={form.user_name} onChange={e=>setForm(p=>({...p,user_name:e.target.value}))} placeholder="John Doe" /></FormField>
          <FormField label="Email"><Input type="email" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} placeholder="user@email.com" /></FormField>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
          <FormField label="Status">
            <Select value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))}>
              <option value="trial">Trial</option>
              <option value="pro">Pro</option>
              <option value="lifetime">Lifetime</option>
            </Select>
          </FormField>
          <FormField label="Expires At"><Input type="datetime-local" value={form.expires_at} onChange={e=>setForm(p=>({...p,expires_at:e.target.value}))} /></FormField>
          <FormField label="Max Devices"><Input type="number" min="1" max="10" value={form.max_devices} onChange={e=>setForm(p=>({...p,max_devices:e.target.value}))} /></FormField>
        </div>
        <FormField label="Notes"><Textarea value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} rows={2} /></FormField>
        <FormField label="Active">
          <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
            <input type="checkbox" checked={form.is_active} onChange={e=>setForm(p=>({...p,is_active:e.target.checked}))} />
            <span style={{ fontSize:13, color:'#a1a1aa' }}>License is active</span>
          </label>
        </FormField>
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:8 }}>
          <Button variant="ghost" onClick={() => setModal({open:false})}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving?'Saving...':'Save License'}</Button>
        </div>
      </Modal>
    </div>
  );
}
