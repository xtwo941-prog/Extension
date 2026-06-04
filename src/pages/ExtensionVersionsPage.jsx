import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';
import PageHeader from '../components/ui/PageHeader.jsx';
import { Table, Thead, Th, Tbody, Tr, Td } from '../components/ui/Table.jsx';
import Button from '../components/ui/Button.jsx';
import Modal from '../components/ui/Modal.jsx';
import { FormField, Input, Textarea } from '../components/ui/FormField.jsx';
import { showToast, ToastContainer } from '../components/ui/Toast.jsx';

const EMPTY = { version:'', changelog:'', file_path:'', download_url:'', is_alert_active:false };

export default function ExtensionVersionsPage() {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open:false, mode:'create', data:null });
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('extension_versions').select('*').order('created_at', { ascending:false });
    setVersions(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate() { setForm(EMPTY); setModal({ open:true, mode:'create', data:null }); }
  function openEdit(v) {
    setForm({ version:v.version||'', changelog:v.changelog||'', file_path:v.file_path||'', download_url:v.download_url||'', is_alert_active:v.is_alert_active||false });
    setModal({ open:true, mode:'edit', data:v });
  }

  async function handleSave() {
    if (!form.version.trim()) { showToast('Version required', 'error'); return; }
    setSaving(true);
    const payload = { version:form.version.trim(), changelog:form.changelog.trim(), file_path:form.file_path.trim(), download_url:form.download_url.trim(), is_alert_active:form.is_alert_active };
    const { error } = modal.mode === 'create' ? await supabase.from('extension_versions').insert([payload]) : await supabase.from('extension_versions').update(payload).eq('id', modal.data.id);
    setSaving(false);
    if (error) { showToast(error.message, 'error'); return; }
    showToast('Saved!', 'success'); setModal({ open:false }); load();
  }

  async function handleDelete(v) {
    if (!confirm(`Delete version "${v.version}"?`)) return;
    const { error } = await supabase.from('extension_versions').delete().eq('id', v.id);
    if (error) { showToast(error.message, 'error'); return; }
    showToast('Deleted', 'success'); load();
  }

  async function toggleAlert(v) {
    const { error } = await supabase.from('extension_versions').update({ is_alert_active: !v.is_alert_active }).eq('id', v.id);
    if (error) { showToast(error.message, 'error'); return; }
    load();
  }

  return (
    <div>
      <ToastContainer />
      <PageHeader title="Extension Versions" subtitle="Control update alerts shown in the extension" action={<Button onClick={openCreate}>+ New Version</Button>} />
      <div style={{ padding:'10px 14px', borderRadius:8, background:'rgba(59,130,246,0.06)', border:'1px solid rgba(59,130,246,0.15)', marginBottom:16, fontSize:12, color:'#a1a1aa' }}>
        <strong style={{ color:'#3b82f6' }}>Note:</strong> When Alert is Active, a banner is shown inside the extension prompting users to update.
      </div>
      {loading ? <div style={{ textAlign:'center', padding:48, color:'#52525b' }}>Loading...</div> : (
        <Table>
          <Thead><tr><Th>Version</Th><Th>Changelog</Th><Th>Download URL</Th><Th>Alert</Th><Th>Created</Th><Th>Actions</Th></tr></Thead>
          <Tbody>
            {versions.length === 0 && <Tr><Td style={{ textAlign:'center', color:'#52525b', padding:32 }} colSpan={6}>No versions</Td></Tr>}
            {versions.map(v => (
              <Tr key={v.id}>
                <Td><span style={{ fontWeight:700, fontFamily:'monospace', fontSize:13, color:'#3b82f6' }}>v{v.version}</span></Td>
                <Td style={{ fontSize:12, color:'#a1a1aa', maxWidth:260, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{v.changelog||'—'}</Td>
                <Td style={{ fontSize:11, color:'#52525b', maxWidth:160, overflow:'hidden', textOverflow:'ellipsis' }}>{v.download_url||v.file_path||'—'}</Td>
                <Td>
                  <button onClick={() => toggleAlert(v)} style={{ padding:'3px 10px', borderRadius:99, border:'none', fontSize:10, fontWeight:700, cursor:'pointer', background:v.is_alert_active?'rgba(245,158,11,0.15)':'rgba(113,113,122,0.1)', color:v.is_alert_active?'#f59e0b':'#71717a' }}>
                    {v.is_alert_active?'Active':'Off'}
                  </button>
                </Td>
                <Td style={{ fontSize:11, color:'#a1a1aa' }}>{new Date(v.created_at).toLocaleDateString()}</Td>
                <Td><div style={{ display:'flex', gap:4 }}><Button size="sm" variant="ghost" onClick={() => openEdit(v)}>Edit</Button><Button size="sm" variant="danger" onClick={() => handleDelete(v)}>Del</Button></div></Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
      <Modal open={modal.open} onClose={() => setModal({open:false})} title={modal.mode==='create'?'New Version':'Edit Version'}>
        <FormField label="Version Number"><Input value={form.version} onChange={e=>setForm(p=>({...p,version:e.target.value}))} placeholder="6.0.14" /></FormField>
        <FormField label="Changelog"><Textarea value={form.changelog} onChange={e=>setForm(p=>({...p,changelog:e.target.value}))} rows={4} /></FormField>
        <FormField label="Download URL"><Input value={form.download_url} onChange={e=>setForm(p=>({...p,download_url:e.target.value}))} placeholder="https://..." /></FormField>
        <FormField label="File Path (Supabase Storage)"><Input value={form.file_path} onChange={e=>setForm(p=>({...p,file_path:e.target.value}))} placeholder="extension-releases/v6.0.14.zip" /></FormField>
        <FormField label="Show Alert in Extension">
          <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
            <input type="checkbox" checked={form.is_alert_active} onChange={e=>setForm(p=>({...p,is_alert_active:e.target.checked}))} />
            <span style={{ fontSize:13, color:'#a1a1aa' }}>Show update banner to users</span>
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
