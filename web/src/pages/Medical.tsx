import {useEffect, useState} from 'react';
import {api, apiDownload} from '../api/client';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import {useFamily} from '../family/FamilyContext';
import type {MedicalFile, MedicalProfile, Member} from '../types';
import {can, fileSize, initials} from '../utils';

export default function MedicalPage() {
  const {currentFamily} = useFamily();
  const [profiles, setProfiles] = useState<MedicalProfile[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selected, setSelected] = useState<MedicalProfile | null>(null);
  const [files, setFiles] = useState<MedicalFile[]>([]);
  const [profileOpen, setProfileOpen] = useState(false);
  const [fileOpen, setFileOpen] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({member_id: '', dob: '', blood_type: '', notes: ''});
  const [upload, setUpload] = useState<{file: File | null; note: string}>({file: null, note: ''});
  const adult = can(currentFamily?.role, 'adult');
  const readable = can(currentFamily?.role, 'teen');

  async function loadProfiles() {
    if (!currentFamily || !readable) return;
    const [profileRows, memberRows] = await Promise.all([
      api<MedicalProfile[]>(`/api/families/${currentFamily.id}/profiles`),
      adult ? api<Member[]>(`/api/families/${currentFamily.id}/members`) : Promise.resolve([]),
    ]);
    setProfiles(profileRows); setMembers(memberRows);
    setSelectedId(id => profileRows.some(row => row.id === id) ? id : profileRows[0]?.id ?? null);
    setForm(value => ({...value, member_id: value.member_id || String(memberRows.find(member => !profileRows.some(profile => profile.member_id === member.id))?.id || '')}));
  }
  async function loadProfile(id = selectedId) {
    if (!id) {setSelected(null); setFiles([]); return;}
    const [profile, fileRows] = await Promise.all([api<MedicalProfile>(`/api/profiles/${id}`), api<MedicalFile[]>(`/api/profiles/${id}/files`)]);
    setSelected(profile); setFiles(fileRows);
  }
  useEffect(() => {loadProfiles().catch(err => setError(err.message));}, [currentFamily?.id]);
  useEffect(() => {loadProfile().catch(err => setError(err.message));}, [selectedId]);

  if (!currentFamily) return <EmptyState icon="+" title="Choose a family" message="Select a family space to access medical records." />;
  if (!readable) return <EmptyState icon="+" title="Medical records are protected" message="Teen and adult roles may access the medical module. Children and guests cannot open it." />;
  const memberName = (memberId?: number) => members.find(member => member.id === memberId)?.display_name || `Member ${memberId || ''}`;
  return <>
    <PageHeader eyebrow="Protected records" title="Medical" description="Encrypted notes and documents for family care coordination—not medical advice." actions={adult && <button className="primary" onClick={() => setProfileOpen(true)}>＋ New profile</button>} />
    <div className="alert info">Medical files are encrypted before storage. Use HTTPS and complete a dedicated security review before storing irreplaceable or regulated records.</div>
    {error && <div className="alert error">{error}</div>}
    {!profiles.length ? <EmptyState icon="+" title="No medical profiles yet" message={adult ? 'Create a profile for a family member, then add encrypted notes or documents.' : 'An adult can create the first medical profile.'} action={adult && <button className="primary" onClick={() => setProfileOpen(true)}>Create profile</button>} /> : <div className="records-layout"><aside className="record-tabs">{profiles.map(profile => <button className={selectedId === profile.id ? 'active' : ''} key={profile.id} onClick={() => setSelectedId(profile.id)}><span className="avatar small">{initials(memberName(profile.member_id))}</span><div><strong>{memberName(profile.member_id)}</strong><small>{profile.blood_type || 'Blood type not set'}</small></div></button>)}</aside><section className="records-main"><article className="medical-hero"><div><span className="eyebrow">Medical profile</span><h2>{memberName(selected?.member_id)}</h2><div className="medical-facts"><span><small>Date of birth</small><strong>{selected?.dob || 'Not recorded'}</strong></span><span><small>Blood type</small><strong>{selected?.blood_type || 'Not recorded'}</strong></span></div></div><span className="medical-symbol">+</span></article><article className="panel"><div className="panel-head"><div><span className="eyebrow">Private notes</span><h2>Care information</h2></div></div><p className="record-notes">{selected?.notes || 'No private notes have been added.'}</p></article><article className="panel"><div className="panel-head"><div><span className="eyebrow">Encrypted files</span><h2>Documents</h2></div>{adult && selected && <button className="secondary compact" onClick={() => setFileOpen(true)}>Upload</button>}</div>{files.length ? <div className="file-list">{files.map(file => <button key={file.id} onClick={() => apiDownload(`/api/files/${file.id}/download`, file.filename)}><span className="file-icon">▤</span><div><strong>{file.filename}</strong><p>{fileSize(file.size)}{file.note ? ` · ${file.note}` : ''}</p></div><span>Download</span></button>)}</div> : <EmptyState icon="▤" title="No documents" message="Upload PDFs, images or supported text records." />}</article></section></div>}
    <Modal open={profileOpen} title="Create medical profile" onClose={() => setProfileOpen(false)}><form className="form-stack" onSubmit={async event => {event.preventDefault(); try {await api(`/api/families/${currentFamily.id}/profiles`, {method: 'POST', body: JSON.stringify({member_id: Number(form.member_id), dob: form.dob || null, blood_type: form.blood_type || null, notes: form.notes})}); setProfileOpen(false); setForm({member_id: '', dob: '', blood_type: '', notes: ''}); await loadProfiles();} catch (err) {setError(err instanceof Error ? err.message : 'Could not create profile');}}}><label>Family member<select value={form.member_id} onChange={event => setForm({...form, member_id: event.target.value})} required><option value="">Choose member</option>{members.filter(member => !profiles.some(profile => profile.member_id === member.id)).map(member => <option value={member.id} key={member.id}>{member.display_name}</option>)}</select></label><div className="form-grid"><label>Date of birth<input type="date" value={form.dob} onChange={event => setForm({...form, dob: event.target.value})} /></label><label>Blood type<input placeholder="O+" value={form.blood_type} onChange={event => setForm({...form, blood_type: event.target.value})} maxLength={10} /></label></div><label>Private notes<textarea value={form.notes} onChange={event => setForm({...form, notes: event.target.value})} maxLength={10000} /></label><button className="primary">Create protected profile</button></form></Modal>
    <Modal open={fileOpen} title="Upload encrypted medical file" onClose={() => setFileOpen(false)}><form className="form-stack" onSubmit={async event => {event.preventDefault(); if (!selectedId || !upload.file) return; try {const body = new FormData(); body.append('file', upload.file); await api(`/api/profiles/${selectedId}/files?note=${encodeURIComponent(upload.note)}`, {method: 'POST', body}); setFileOpen(false); setUpload({file: null, note: ''}); await loadProfile();} catch (err) {setError(err instanceof Error ? err.message : 'Could not upload file');}}}><label>File<input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.txt,.csv,.json" onChange={event => setUpload({...upload, file: event.target.files?.[0] || null})} required /></label><label>Note<input value={upload.note} onChange={event => setUpload({...upload, note: event.target.value})} maxLength={10000} /></label><button className="primary">Encrypt and upload</button></form></Modal>
  </>;
}
