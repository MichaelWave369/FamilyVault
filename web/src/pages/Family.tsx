import {useEffect, useState} from 'react';
import {api} from '../api/client';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import {useFamily} from '../family/FamilyContext';
import type {Member, Role} from '../types';
import {can, initials} from '../utils';

export default function FamilyPage() {
  const {currentFamily, refreshFamilies} = useFamily();
  const [members, setMembers] = useState<Member[]>([]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [invite, setInvite] = useState({email: '', role: 'adult' as Role});
  const [inviteToken, setInviteToken] = useState('');
  const [joinToken, setJoinToken] = useState('');

  async function load() {
    if (!currentFamily || !can(currentFamily.role, 'adult')) {setMembers([]); return;}
    setMembers(await api<Member[]>(`/api/families/${currentFamily.id}/members`));
  }
  useEffect(() => {load().catch(err => setError(err.message));}, [currentFamily?.id]);

  if (!currentFamily) return <EmptyState icon="♡" title="No family selected" message="Create a family on Home or join one using an invitation." action={<button className="primary" onClick={() => setJoinOpen(true)}>Join with invite</button>} />;
  const admin = can(currentFamily.role, 'admin');
  return <>
    <PageHeader eyebrow="Your people" title={currentFamily.name} description="Membership, roles and invitations for this private family space." actions={<div className="button-row"><button className="secondary" onClick={() => setJoinOpen(true)}>Join another</button>{admin && <button className="primary" onClick={() => setInviteOpen(true)}>＋ Invite member</button>}</div>} />
    {error && <div className="alert error">{error}</div>}{notice && <div className="alert success">{notice}</div>}
    <section className="family-banner"><div><span className="eyebrow">Your role</span><h2>{currentFamily.role}</h2><p>{admin ? 'You can invite members and help administer this family space.' : can(currentFamily.role, 'adult') ? 'You can access adult household modules and shared records.' : 'Your access follows the role chosen by a family administrator.'}</p></div><span className="big-heart">♡</span></section>
    {can(currentFamily.role, 'adult') ? <section className="member-grid">{members.map(member => <article className="member-card" key={member.id}><span className="avatar large">{initials(member.display_name)}</span><div><strong>{member.display_name}</strong><span className={`role-badge ${member.role}`}>{member.role}</span></div><small>{member.role === 'owner' ? 'Family owner' : member.role === 'admin' ? 'Family administrator' : 'Family member'}</small></article>)}</section> : <EmptyState icon="♡" title="Member directory is limited" message="Adult roles can view the household member directory." />}
    <section className="panel values-panel"><div><span className="eyebrow">FamilyVault promise</span><h2>Coordination without surveillance.</h2><p>Roles control what a person can access. Private vault entries require explicit sharing, and sensitive records stay out of the everyday home feed.</p></div><div className="value-list"><span>◉ Invitation-only membership</span><span>◉ Role-based access</span><span>◉ Private-by-default secrets</span></div></section>
    <Modal open={inviteOpen} title="Invite a family member" onClose={() => {setInviteOpen(false); setInviteToken('');}}><form className="form-stack" onSubmit={async event => {event.preventDefault(); setError(''); try {const result = await api<{token: string; expires_at: string}>(`/api/families/${currentFamily.id}/invite`, {method: 'POST', body: JSON.stringify(invite)}); setInviteToken(result.token);} catch (err) {setError(err instanceof Error ? err.message : 'Could not create invitation');}}}><label>Email<input type="email" value={invite.email} onChange={event => setInvite({...invite, email: event.target.value})} required /></label><label>Role<select value={invite.role} onChange={event => setInvite({...invite, role: event.target.value as Role})}><option value="guest">Guest</option><option value="child">Child</option><option value="teen">Teen</option><option value="adult">Adult</option></select></label>{inviteToken ? <div className="invite-result"><strong>Invitation created</strong><p>Send this one-time token privately. It expires in seven days.</p><code>{inviteToken}</code><button type="button" className="secondary" onClick={async () => {await navigator.clipboard.writeText(inviteToken); setNotice('Invitation token copied.');}}>Copy token</button></div> : <button className="primary">Create invitation</button>}</form></Modal>
    <Modal open={joinOpen} title="Join a family" onClose={() => setJoinOpen(false)}><form className="form-stack" onSubmit={async event => {event.preventDefault(); try {await api('/api/invites/accept', {method: 'POST', body: JSON.stringify({token: joinToken})}); setJoinOpen(false); setJoinToken(''); await refreshFamilies(); setNotice('You joined the family space.');} catch (err) {setError(err instanceof Error ? err.message : 'Could not accept invitation');}}}><label>Invitation token<textarea value={joinToken} onChange={event => setJoinToken(event.target.value.trim())} required /></label><button className="primary">Join family</button></form></Modal>
  </>;
}
