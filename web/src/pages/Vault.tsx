import {useEffect, useState} from 'react';
import {api} from '../api/client';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import {useFamily} from '../family/FamilyContext';
import type {Member, VaultFolder, VaultItem, VaultItemSummary} from '../types';
import {can, friendlyDate, initials} from '../utils';

export default function VaultPage() {
  const {currentFamily} = useFamily();
  const [folders, setFolders] = useState<VaultFolder[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [items, setItems] = useState<VaultItemSummary[]>([]);
  const [revealed, setRevealed] = useState<VaultItem | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [folderOpen, setFolderOpen] = useState(false);
  const [itemOpen, setItemOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [error, setError] = useState('');
  const [folderName, setFolderName] = useState('Important accounts');
  const [form, setForm] = useState({title: '', username: '', url: '', secret: '', totp_seed: '', notes: ''});
  const [share, setShare] = useState({member_id: '', permission: 'read'});
  const adult = can(currentFamily?.role, 'adult');

  async function loadFolders() {
    if (!currentFamily || !adult) return;
    const [rows, memberRows] = await Promise.all([api<VaultFolder[]>(`/api/families/${currentFamily.id}/vault/folders`), api<Member[]>(`/api/families/${currentFamily.id}/members`)]);
    setFolders(rows); setMembers(memberRows.filter(member => can(member.role, 'adult')));
    setSelectedId(id => rows.some(row => row.id === id) ? id : rows[0]?.id ?? null);
  }
  async function loadItems(id = selectedId) {if (!id) {setItems([]); return;} setItems(await api<VaultItemSummary[]>(`/api/folders/${id}/items`)); setRevealed(null);}
  useEffect(() => {loadFolders().catch(err => setError(err.message));}, [currentFamily?.id]);
  useEffect(() => {loadItems().catch(err => setError(err.message));}, [selectedId]);

  if (!currentFamily) return <EmptyState icon="◆" title="Choose a family" message="Select a family space to open the private vault." />;
  if (!adult) return <EmptyState icon="◆" title="Adult access required" message="The vault is restricted to adult family roles." />;
  const selected = folders.find(folder => folder.id === selectedId);
  return <>
    <PageHeader eyebrow="Private by default" title="Vault" description="Store sensitive household information and share each item explicitly." actions={<div className="button-row"><button className="secondary" onClick={() => setFolderOpen(true)}>New folder</button><button className="primary" disabled={!selected} onClick={() => setItemOpen(true)}>＋ New private item</button></div>} />
    <div className="alert info">Vault secrets are encrypted at rest, but this is not end-to-end encryption. Use unique production keys and HTTPS.</div>
    {error && <div className="alert error">{error}</div>}
    {!folders.length ? <EmptyState icon="◆" title="Create a private folder" message="Organize emergency accounts, insurance details, household services or other sensitive records." action={<button className="primary" onClick={() => setFolderOpen(true)}>Create folder</button>} /> : <div className="vault-layout"><aside className="vault-folders">{folders.map(folder => <button className={selectedId === folder.id ? 'active' : ''} onClick={() => setSelectedId(folder.id)} key={folder.id}><span>◆</span>{folder.name}</button>)}</aside><section className="panel vault-panel"><div className="panel-head"><div><span className="eyebrow">Encrypted folder</span><h2>{selected?.name}</h2></div></div>{items.length ? <div className="vault-list">{items.map(item => <article key={item.id} className={revealed?.id === item.id ? 'active' : ''}><button className="vault-item-main" onClick={async () => {try {setRevealed(await api<VaultItem>(`/api/vault/items/${item.id}`));} catch (err) {setError(err instanceof Error ? err.message : 'Could not open item');}}}><span className="vault-icon">◆</span><div><strong>{item.title}</strong><p>{item.username || item.url || `Updated ${friendlyDate(item.updated_at)}`}</p></div><span>Reveal</span></button>{revealed?.id === item.id && <div className="secret-panel"><div><small>Secret</small><code>{revealed.payload.secret}</code></div>{revealed.payload.totp_seed && <div><small>TOTP seed</small><code>{revealed.payload.totp_seed}</code></div>}{revealed.payload.notes && <p>{revealed.payload.notes}</p>}<div className="button-row"><button className="secondary compact" onClick={async () => navigator.clipboard.writeText(revealed.payload.secret)}>Copy secret</button><button className="secondary compact" onClick={() => {setShare(value => ({...value, member_id: String(members.find(member => member.user_id !== item.created_by)?.id || '')})); setShareOpen(true);}}>Share access</button></div></div>}</article>)}</div> : <EmptyState icon="◆" title="This folder is empty" message="Create the first private item. It will be visible only to you and family administrators until shared." />}</section></div>}
    <Modal open={folderOpen} title="Create vault folder" onClose={() => setFolderOpen(false)}><form className="form-stack" onSubmit={async event => {event.preventDefault(); try {const row = await api<VaultFolder>(`/api/families/${currentFamily.id}/vault/folders`, {method: 'POST', body: JSON.stringify({name: folderName})}); setFolderOpen(false); await loadFolders(); setSelectedId(row.id);} catch (err) {setError(err instanceof Error ? err.message : 'Could not create folder');}}}><label>Folder name<input value={folderName} onChange={event => setFolderName(event.target.value)} required maxLength={255} /></label><button className="primary">Create protected folder</button></form></Modal>
    <Modal open={itemOpen} title={`New item in ${selected?.name || 'vault'}`} onClose={() => setItemOpen(false)}><form className="form-stack" onSubmit={async event => {event.preventDefault(); if (!selectedId) return; try {await api(`/api/folders/${selectedId}/items`, {method: 'POST', body: JSON.stringify(form)}); setItemOpen(false); setForm({title: '', username: '', url: '', secret: '', totp_seed: '', notes: ''}); await loadItems();} catch (err) {setError(err instanceof Error ? err.message : 'Could not create vault item');}}}><label>Title<input value={form.title} onChange={event => setForm({...form, title: event.target.value})} required maxLength={255} /></label><div className="form-grid"><label>Username<input value={form.username} onChange={event => setForm({...form, username: event.target.value})} maxLength={255} /></label><label>Website<input type="url" value={form.url} onChange={event => setForm({...form, url: event.target.value})} maxLength={2048} /></label></div><label>Secret or password<input type="password" value={form.secret} onChange={event => setForm({...form, secret: event.target.value})} required maxLength={10000} /></label><label>TOTP seed<input value={form.totp_seed} onChange={event => setForm({...form, totp_seed: event.target.value})} maxLength={1000} /></label><label>Private notes<textarea value={form.notes} onChange={event => setForm({...form, notes: event.target.value})} maxLength={10000} /></label><button className="primary">Encrypt and save</button></form></Modal>
    <Modal open={shareOpen} title={`Share ${revealed?.title || 'vault item'}`} onClose={() => setShareOpen(false)}><form className="form-stack" onSubmit={async event => {event.preventDefault(); if (!revealed) return; try {await api(`/api/vault/items/${revealed.id}/access`, {method: 'POST', body: JSON.stringify({member_id: Number(share.member_id), permission: share.permission})}); setShareOpen(false);} catch (err) {setError(err instanceof Error ? err.message : 'Could not share item');}}}><label>Adult family member<select value={share.member_id} onChange={event => setShare({...share, member_id: event.target.value})} required><option value="">Choose member</option>{members.map(member => <option value={member.id} key={member.id}>{member.display_name} · {member.role}</option>)}</select></label><label>Permission<select value={share.permission} onChange={event => setShare({...share, permission: event.target.value})}><option value="read">Read only</option><option value="write">Read and edit</option></select></label><div className="share-preview"><span className="avatar small">{initials(members.find(member => member.id === Number(share.member_id))?.display_name)}</span><p>This grant applies only to this item, not the whole folder.</p></div><button className="primary">Grant access</button></form></Modal>
  </>;
}
