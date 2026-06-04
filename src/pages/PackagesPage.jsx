import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';
import PageHeader from '../components/ui/PageHeader.jsx';
import { Table, Thead, Th, Tbody, Tr, Td } from '../components/ui/Table.jsx';
import Badge from '../components/ui/Badge.jsx';
import Button from '../components/ui/Button.jsx';
import Modal from '../components/ui/Modal.jsx';
import { FormField, Input, Textarea, Select } from '../components/ui/FormField.jsx';
import { showToast, ToastContainer } from '../components/ui/Toast.jsx';

const EMPTY = { name:'', price:'', currency:'BRL', duration_days:'', features:'', is_active:true, is_popular:false, sort_order:0 };

export default function PackagesPage() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open:false, mode:'create', data:null });
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('packages').select('*').order('sort_order');
    setPackages(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate() { setForm({ ...EMPTY, sort_order: packages.length + 1 }); setModal({ open:true, mode:'create', data:null }); }
  function openEdit(p) {
    setForm({ name:p.name||'', price:p.price?.toString()||'', currency:p.currency||'BRL', duration_days:p.duration_days?.toString()||'', features:Array.isArray(p.features)?p.features.join('\n'):'', is_active:p.is_active!==false, is_popular:p.is_popular||false, sort_order:p.sort_order||0 });
    setModal({ open:true, mode:'edit', data:p });
  }

  async function handleSave() {
    if (!form.name.trim()) { showToast('Name required', 'error'); return; }
    setSaving(true);
    const payload = { name:form.name.trim(), price:parseFloat(form.price)||0, currency:form.currency, duration_days:form.duration_days?parseInt(form.duration_days):null, features:form.features.split('\n').map(s=>s.trim()).filter(Boolean), is_active:form.is_active, is_popular:form.is_popular, sort_order:parseInt(form.sort_order)||0 };
    const { error } = modal.mode === 'create' ? await supabase.from('packages').insert([payload]) : await supabase.from('packages').update(payload).eq('id', modal.data.id);
    setSaving(false);
    if (error) { showToast(error.message, 'error'); return; }
    showToast('Saved!', 'success'); setModal({ open:false }); load();
  }

  async function handleDelete(p) {
    if (!confirm(`Delete "${p.name}"?`)) return;
    const { error } = await supabase.from('packages').delete().eq('id', p.id);
    if (error) { showToast(error.message, 'error'); return; }
    showToast('Deleted', 'success'); load();
  }

  return (
    <div>
      <ToastContainer />
      <PageHeader title="Packages" subtitle="Pricing plans shown in the extension" action={<Button onClick={openCreate}>+ New Package</Button>} />
      {loading ? <div style={{ textAlign:'center', padding:48, color:'#52525b' }}>Loading...</div> : (
        <Table>
          <Thead><tr><Th>#</Th><Th>Name</Th><Th>Price</Th><Th>Duration</Th><Th>Status</Th><Th>Popular</Th><Th>Actions</Th></tr></Thead>
          <Tbody>
            {packages.length === 0 && <Tr><Td style={{ textAlign:'center', color:'#52525b', padding:32 }} colSpan={7}>No packages</Td></Tr>}
            {packages.map(p => (
              <Tr key={p.id}>
                <Td style={{ color:'#52525b', width:40 }}>{p.sort_order}</Td>
                <Td style={{ fontWeight:600 }}>{p.name}</Td>
                <Td>{p.price} {p.currency}</Td>
                <Td>{p.duration_days ? `${p.duration_days}d` : <Badge variant="lifetime">Lifetime</Badge>}</Td>
                <Td><Badge variant={p.is_active?'active':'inactive'}>{p.is_active?'Active':'Inactive'}</Badge></Td>
                <Td>{p.is_popular ? <Badge variant="pro">Popular</Badge> : '—'}</Td>
                <Td><div style={{ display:'flex', gap:4 }}><Button size="sm" variant="ghost" onClick={() => openEdit(p)}>Edit</Button><Button size="sm" variant="danger" onClick={() => handleDelete(p)}>Del</Button></div></Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
      <Modal open={modal.open} onClose={() => setModal({open:false})} title={modal.mode==='create'?'New Package':'Edit Package'}>
        <FormField label="Name"><Input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="Weekly, Monthly, Lifetime..." /></FormField>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
          <FormField label="Price"><Input type="number" step="0.01" value={form.price} onChange={e=>setForm(p=>({...p,price:e.target.value}))} /></FormField>
          <FormField label="Currency"><Select value={form.currency} onChange={e=>setForm(p=>({...p,currency:e.target.value}))}><option value="BRL">BRL</option><option value="USD">USD</option><option value="MZN">MZN</option></Select></FormField>
          <FormField label="Duration (days)" hint="Empty = lifetime"><Input type="number" value={form.duration_days} onChange={e=>setForm(p=>({...p,duration_days:e.target.value}))} /></FormField>
        </div>
        <FormField label="Features (one per line)"><Textarea value={form.features} onChange={e=>setForm(p=>({...p,features:e.target.value}))} rows={4} /></FormField>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
          <FormField label="Sort Order"><Input type="number" value={form.sort_order} onChange={e=>setForm(p=>({...p,sort_order:e.target.value}))} /></FormField>
          <FormField label="Active"><label style={{ display:'flex', alignItems:'center', gap:8, marginTop:8, cursor:'pointer' }}><input type="checkbox" checked={form.is_active} onChange={e=>setForm(p=>({...p,is_active:e.target.checked}))} /><span style={{ fontSize:13, color:'#a1a1aa' }}>Visible</span></label></FormField>
          <FormField label="Popular"><label style={{ display:'flex', alignItems:'center', gap:8, marginTop:8, cursor:'pointer' }}><input type="checkbox" checked={form.is_popular} onChange={e=>setForm(p=>({...p,is_popular:e.target.checked}))} /><span style={{ fontSize:13, color:'#a1a1aa' }}>Mark popular</span></label></FormField>
        </div>
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:8 }}>
          <Button variant="ghost" onClick={() => setModal({open:false})}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving?'Saving...':'Save Package'}</Button>
        </div>
      </Modal>
    </div>
  );
}
