import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';
import PageHeader from '../components/ui/PageHeader.jsx';
import { Table, Thead, Th, Tbody, Tr, Td } from '../components/ui/Table.jsx';
import Badge from '../components/ui/Badge.jsx';
import Button from '../components/ui/Button.jsx';
import Modal from '../components/ui/Modal.jsx';
import { FormField, Input, Textarea, Select } from '../components/ui/FormField.jsx';
import { showToast, ToastContainer } from '../components/ui/Toast.jsx';

const EMPTY = { title:'', message:'', link:'', is_active:true, target_status:'all' };

export default function NotificationsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open:false, mode:'create', data:null });
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('notifications').select('*').order('created_at', { ascending:false });
    setItems(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate() { setForm(EMPTY); setModal({ open:true, mode:'create', data:null }); }
  function openEdit(n) {
    setForm({ title:n.title||'', message:n.message||'', link:n.link||'', is_active:n.is_active!==false, target_status:n.target_status||'all' });
    setModal({ open:true, mode:'edit', data:n });
  }

  async function handleSave() {
    if (!form.title.trim()) { showToast('Title required', 'error'); return; }
    setSaving(true);
    const payload = { title:form.title.trim(), message:form.message.trim(), link:form.link.trim(), is_active:form.is_active, target_status:form.target_status };
    const { error } = modal.mode === 'create' ? await supabase.from('notifications').insert([payload]) : await supabase.from('notifications').update(payload).eq('id', modal.data.id);
    setSaving(false);
    if (error) { showToast(error.message, 'error'); return; }
    showToast('Saved!', 'success'); setModal({ open:false }); load();
  }

  async function handleDelete(n) {
    if (!confirm(`Delete "${n.title}"?`)) return;
    const { error } = await supabase.from('notifications').delete().eq('id', n.id);
    if (error) { showToast(error.message, 'error'); return; }
    showToast('Deleted', 'success'); load();
  }

  async function toggleActive(n) {
    await supabase.from('notifications').update({ is_active: !n.is_active }).eq('id', n.id);
    load();
  }

  return (
    <div>
      <ToastContainer />
      <PageHeader title="Notifications" subtitle="Push messages shown in the extension" action={<Button onClick={openCreate}>+ New Notification</Button>} />
      {loading ? <div style={{ textAlign:'center', padding:48, color:'#52525b' }}>Loading...</div> : (
        <Table>
          <Thead><tr><Th>Title</Th><Th>Message</Th><Th>Target</Th><Th>Status</Th><Th>Date</Th><Th>Actions</Th></tr></Thead>
          <Tbody>
            {items.length === 0 && <Tr><Td style={{ textAlign:'center', color:'#52525b', padding:32 }} colSpan={6}>No notifications</Td></Tr>}
            {items.map(n => (
              <Tr key={n.id}>
                <Td style={{ fontWeight:600, maxWidth:180 }}>{n.title}</Td>
                <Td style={{ fontSize:12, color:'#a1a1aa', maxWidth:220, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{n.message}</Td>
                <Td><Badge variant={n.target_status}>{n.target_status}</Badge></Td>
                <Td>
                  <button onClick={() => toggleActive(n)} style={{ padding:'3px 10px', borderRadius:99, border:'none', fontSize:10, fontWeight:700, cursor:'pointer', background:n.is_active?'rgba(34,197,94,0.15)':'rgba(239,68,68,0.1)', color:n.is_active?'#22c55e':'#ef4444' }}>
                    {n.is_active?'Active':'Inactive'}
                  </button>
                </Td>
                <Td style={{ fontSize:11, color:'#a1a1aa' }}>{new Date(n.created_at).toLocaleDateString()}</Td>
                <Td><div style={{ display:'flex', gap:4 }}><Button size="sm" variant="ghost" onClick={() => openEdit(n)}>Edit</Button><Button size="sm" variant="danger" onClick={() => handleDelete(n)}>Del</Button></div></Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
      <Modal open={modal.open} onClose={() => setModal({open:false})} title={modal.mode==='create'?'New Notification':'Edit Notification'}>
        <FormField label="Title"><Input value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} placeholder="Notification title..." /></FormField>
        <FormField label="Message"><Textarea value={form.message} onChange={e=>setForm(p=>({...p,message:e.target.value}))} rows={3} /></FormField>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <FormField label="Target">
            <Select value={form.target_status} onChange={e=>setForm(p=>({...p,target_status:e.target.value}))}>
              <option value="all">All Users</option>
              <option value="pro">Pro Only</option>
              <option value="trial">Trial Only</option>
              <option value="lifetime">Lifetime Only</option>
            </Select>
          </FormField>
          <FormField label="Link (optional)"><Input value={form.link} onChange={e=>setForm(p=>({...p,link:e.target.value}))} placeholder="https://..." /></FormField>
        </div>
        <FormField label="Active"><label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}><input type="checkbox" checked={form.is_active} onChange={e=>setForm(p=>({...p,is_active:e.target.checked}))} /><span style={{ fontSize:13, color:'#a1a1aa' }}>Show to users</span></label></FormField>
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:8 }}>
          <Button variant="ghost" onClick={() => setModal({open:false})}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving?'Saving...':'Save'}</Button>
        </div>
      </Modal>
    </div>
  );
}
