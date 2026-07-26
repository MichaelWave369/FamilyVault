import {useEffect, useState} from 'react';
import {api} from '../api/client';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import {useFamily} from '../family/FamilyContext';
import type {Assignment, Chore, Member} from '../types';
import {can, friendlyDateTime, localInputValue} from '../utils';

export default function ChoresPage() {
  const {currentFamily} = useFamily();
  const [chores, setChores] = useState<Chore[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [open, setOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedChore, setSelectedChore] = useState<Chore | null>(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState({title: '', description: '', points: 5, schedule_rule: ''});
  const [assignment, setAssignment] = useState({assignee_member_id: '', due_at: localInputValue(new Date(Date.now() + 24 * 60 * 60_000))});
  const writable = can(currentFamily?.role, 'adult');

  async function load() {
    if (!currentFamily) return;
    const [choreRows, assignmentRows, memberRows] = await Promise.all([
      can(currentFamily.role, 'child') ? api<Chore[]>(`/api/families/${currentFamily.id}/chores`) : Promise.resolve([]),
      can(currentFamily.role, 'child') ? api<Assignment[]>(`/api/families/${currentFamily.id}/assignments`) : Promise.resolve([]),
      writable ? api<Member[]>(`/api/families/${currentFamily.id}/members`) : Promise.resolve([]),
    ]);
    setChores(choreRows); setAssignments(assignmentRows); setMembers(memberRows);
  }
  useEffect(() => {load().catch(err => setError(err.message));}, [currentFamily?.id]);

  function beginAssign(chore: Chore) {
    setSelectedChore(chore);
    setAssignment(value => ({...value, assignee_member_id: String(members[0]?.id || '')}));
    setAssignOpen(true);
  }

  if (!currentFamily) return <EmptyState icon="✓" title="Choose a family" message="Select a family space to see shared tasks." />;
  if (!can(currentFamily.role, 'child')) return <EmptyState icon="✓" title="Tasks are private to members" message="Guest access does not include household assignments." />;

  const openAssignments = assignments.filter(item => item.status !== 'completed');
  const completed = assignments.filter(item => item.status === 'completed');
  return <>
    <PageHeader eyebrow="Shared effort" title="Tasks & chores" description="Make responsibilities visible, fair and easy to finish." actions={writable && <button className="primary" onClick={() => setOpen(true)}>＋ New task</button>} />
    {error && <div className="alert error">{error}</div>}
    <section className="task-summary"><div><strong>{openAssignments.length}</strong><span>open</span></div><div><strong>{completed.length}</strong><span>finished</span></div><div><strong>{chores.reduce((total, item) => total + item.points, 0)}</strong><span>available points</span></div></section>
    <div className="two-column-layout">
      <section className="panel"><div className="panel-head"><div><span className="eyebrow">Today & next</span><h2>Assignments</h2></div></div>{openAssignments.length ? <div className="task-list">{openAssignments.map(item => <article className="task-card" key={item.id}><button className="task-check" onClick={async () => {await api(`/api/assignments/${item.id}/complete`, {method: 'POST'}); await load();}}>○</button><div><strong>{item.chore_title}</strong><p>{item.assignee_name}{item.due_at ? ` · due ${friendlyDateTime(item.due_at)}` : ''}</p></div></article>)}</div> : <EmptyState icon="✓" title="Everything is handled" message="New assignments will appear here." />}</section>
      <section className="panel"><div className="panel-head"><div><span className="eyebrow">Task library</span><h2>Household chores</h2></div></div>{chores.length ? <div className="clean-list">{chores.map(chore => <div className="clean-row split" key={chore.id}><div><strong>{chore.title}</strong><p>{chore.description || 'No notes'} · {chore.points} points</p></div>{writable && <button className="secondary compact" onClick={() => beginAssign(chore)}>Assign</button>}</div>)}</div> : <EmptyState icon="✓" title="No chores yet" message={writable ? 'Create reusable tasks such as dishes, pet care or medication pickup.' : 'An adult can add shared tasks.'} />}</section>
    </div>
    <Modal open={open} title="Create a household task" onClose={() => setOpen(false)}><form className="form-stack" onSubmit={async event => {event.preventDefault(); try {await api(`/api/families/${currentFamily.id}/chores`, {method: 'POST', body: JSON.stringify(form)}); setOpen(false); setForm({title: '', description: '', points: 5, schedule_rule: ''}); await load();} catch (err) {setError(err instanceof Error ? err.message : 'Could not create task');}}}><label>Task name<input value={form.title} onChange={event => setForm({...form, title: event.target.value})} required maxLength={255} /></label><label>Helpful notes<textarea value={form.description} onChange={event => setForm({...form, description: event.target.value})} maxLength={5000} /></label><div className="form-grid"><label>Points<input type="number" min="0" max="10000" value={form.points} onChange={event => setForm({...form, points: Number(event.target.value)})} /></label><label>Repeat rule<input placeholder="Optional, e.g. weekly" value={form.schedule_rule} onChange={event => setForm({...form, schedule_rule: event.target.value})} maxLength={255} /></label></div><button className="primary">Create task</button></form></Modal>
    <Modal open={assignOpen} title={`Assign ${selectedChore?.title || 'task'}`} onClose={() => setAssignOpen(false)}><form className="form-stack" onSubmit={async event => {event.preventDefault(); if (!selectedChore) return; try {await api(`/api/chores/${selectedChore.id}/assign`, {method: 'POST', body: JSON.stringify({assignee_member_id: Number(assignment.assignee_member_id), due_at: assignment.due_at ? new Date(assignment.due_at).toISOString() : null})}); setAssignOpen(false); await load();} catch (err) {setError(err instanceof Error ? err.message : 'Could not assign task');}}}><label>Family member<select value={assignment.assignee_member_id} onChange={event => setAssignment({...assignment, assignee_member_id: event.target.value})} required>{members.map(member => <option value={member.id} key={member.id}>{member.display_name} · {member.role}</option>)}</select></label><label>Due date<input type="datetime-local" value={assignment.due_at} onChange={event => setAssignment({...assignment, due_at: event.target.value})} /></label><button className="primary">Assign task</button></form></Modal>
  </>;
}
