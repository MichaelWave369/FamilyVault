import {useEffect, useMemo, useState} from 'react';
import {Link} from 'react-router-dom';
import {api} from '../api/client';
import EmptyState from '../components/EmptyState';
import PageHeader from '../components/PageHeader';
import {useAuth} from '../auth/AuthContext';
import {useFamily} from '../family/FamilyContext';
import type {Assignment, CalendarRecord, EventRecord, ExpenseAccount, ExpenseSummary, Member, ShoppingItem, ShoppingList} from '../types';
import {can, friendlyDateTime, initials, money} from '../utils';

type Snapshot = {members: Member[]; events: EventRecord[]; assignments: Assignment[]; list: ShoppingList | null; items: ShoppingItem[]; expense: ExpenseSummary | null; account: ExpenseAccount | null};
const blank: Snapshot = {members: [], events: [], assignments: [], list: null, items: [], expense: null, account: null};

export default function Dashboard() {
  const {user} = useAuth();
  const {currentFamily, createFamily} = useFamily();
  const [snapshot, setSnapshot] = useState<Snapshot>(blank);
  const [loading, setLoading] = useState(false);
  const [familyName, setFamilyName] = useState('Our Family');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentFamily) { setSnapshot(blank); return; }
    let active = true;
    (async () => {
      setLoading(true); setError('');
      try {
        const familyId = currentFamily.id;
        const calendars = await api<CalendarRecord[]>(`/api/families/${familyId}/calendars`).catch(() => []);
        const eventRows = (await Promise.all(calendars.map(calendar => api<EventRecord[]>(`/api/calendars/${calendar.id}/events`).catch(() => [])))).flat();
        const upcoming = eventRows.filter(event => new Date(event.end_at) >= new Date()).sort((a, b) => +new Date(a.start_at) - +new Date(b.start_at)).slice(0, 5);
        const [members, assignments, lists, accounts] = await Promise.all([
          can(currentFamily.role, 'adult') ? api<Member[]>(`/api/families/${familyId}/members`).catch(() => []) : Promise.resolve([]),
          can(currentFamily.role, 'child') ? api<Assignment[]>(`/api/families/${familyId}/assignments`).catch(() => []) : Promise.resolve([]),
          api<ShoppingList[]>(`/api/families/${familyId}/lists`).catch(() => []),
          can(currentFamily.role, 'adult') ? api<ExpenseAccount[]>(`/api/families/${familyId}/accounts`).catch(() => []) : Promise.resolve([]),
        ]);
        const list = lists[0] ?? null;
        const items = list ? await api<ShoppingItem[]>(`/api/lists/${list.id}/items`).catch(() => []) : [];
        const account = accounts[0] ?? null;
        const expense = account ? await api<ExpenseSummary>(`/api/accounts/${account.id}/summary`).catch(() => null) : null;
        if (active) setSnapshot({members, events: upcoming, assignments: assignments.filter(row => row.status !== 'completed').slice(0, 5), list, items: items.filter(item => !item.checked).slice(0, 5), expense, account});
      } catch (err) { if (active) setError(err instanceof Error ? err.message : 'Unable to load your family home.'); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [currentFamily?.id]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  }, []);

  if (!currentFamily) {
    return <div className="setup-page"><div className="setup-hero"><span className="hero-orbit">♡</span><span className="eyebrow">Welcome home</span><h1>Create your private family space.</h1><p>Bring calendars, chores, lists, important documents and shared household knowledge into one calm place.</p><form onSubmit={async event => {event.preventDefault(); setError(''); try {await createFamily(familyName);} catch (err) {setError(err instanceof Error ? err.message : 'Could not create family');}}}><input value={familyName} onChange={event => setFamilyName(event.target.value)} minLength={1} maxLength={255} required /><button className="primary">Create family space</button></form>{error && <p className="form-error">{error}</p>}<small>Only people you invite can join.</small></div></div>;
  }

  return <>
    <PageHeader eyebrow={currentFamily.name} title={`${greeting}, ${user?.name?.split(' ')[0] || 'there'}.`} description="Here is what your household needs today." actions={<Link className="secondary button-link" to="/family">Manage family</Link>} />
    {error && <div className="alert error">{error}</div>}
    <section className="hero-card"><div><span className="eyebrow">Family pulse</span><h2>{loading ? 'Gathering today…' : `${snapshot.events.length + snapshot.assignments.length + snapshot.items.length} things are in motion.`}</h2><p>Events, responsibilities and household needs—without the noise.</p></div><div className="family-avatars">{snapshot.members.slice(0, 5).map(member => <span className="avatar" title={member.display_name} key={member.id}>{initials(member.display_name)}</span>)}{!snapshot.members.length && <span className="avatar">{initials(user?.name)}</span>}</div></section>
    <section className="metric-grid">
      <Link to="/calendar" className="metric-card"><span className="metric-icon peach">▣</span><div><small>Upcoming</small><strong>{snapshot.events.length}</strong><p>calendar events</p></div></Link>
      <Link to="/chores" className="metric-card"><span className="metric-icon green">✓</span><div><small>Open</small><strong>{snapshot.assignments.length}</strong><p>family tasks</p></div></Link>
      <Link to="/shopping" className="metric-card"><span className="metric-icon blue">≡</span><div><small>Needed</small><strong>{snapshot.items.length}</strong><p>shopping items</p></div></Link>
      <Link to="/expenses" className="metric-card"><span className="metric-icon gold">$</span><div><small>This month</small><strong>{snapshot.expense ? money(snapshot.expense.total_cents, snapshot.account?.currency) : '—'}</strong><p>{snapshot.account?.name || 'expense account'}</p></div></Link>
    </section>
    <section className="dashboard-grid">
      <article className="panel"><div className="panel-head"><div><span className="eyebrow">Coming up</span><h2>Family calendar</h2></div><Link to="/calendar">View all</Link></div>{snapshot.events.length ? <div className="timeline-list">{snapshot.events.map(event => <div className="timeline-item" key={event.id}><span className="timeline-dot" /><div><strong>{event.title}</strong><p>{friendlyDateTime(event.start_at)}{event.location ? ` · ${event.location}` : ''}</p></div></div>)}</div> : <EmptyState icon="▣" title="A quiet calendar" message="Add the first appointment, school event or family plan." action={<Link className="text-link" to="/calendar">Add an event</Link>} />}</article>
      <article className="panel"><div className="panel-head"><div><span className="eyebrow">Shared effort</span><h2>Tasks</h2></div><Link to="/chores">View all</Link></div>{snapshot.assignments.length ? <div className="clean-list">{snapshot.assignments.map(item => <div className="clean-row" key={item.id}><span className="check-ring">○</span><div><strong>{item.chore_title}</strong><p>{item.assignee_name}{item.due_at ? ` · ${friendlyDateTime(item.due_at)}` : ''}</p></div></div>)}</div> : <EmptyState icon="✓" title="Nothing waiting" message="Create recurring chores or one-time family tasks." />}</article>
      <article className="panel"><div className="panel-head"><div><span className="eyebrow">Next store run</span><h2>{snapshot.list?.name || 'Shopping list'}</h2></div><Link to="/shopping">Open list</Link></div>{snapshot.items.length ? <div className="tag-list">{snapshot.items.map(item => <span className="tag" key={item.id}>{item.text}{item.qty ? ` · ${item.qty}` : ''}</span>)}</div> : <EmptyState icon="≡" title="The list is clear" message="Add groceries, supplies or anything the household needs." />}</article>
      <article className="panel quick-panel" id="quick-add"><div className="panel-head"><div><span className="eyebrow">Quick add</span><h2>What needs remembering?</h2></div></div><div className="quick-grid"><Link to="/calendar">▣<span>Event</span></Link><Link to="/chores">✓<span>Task</span></Link><Link to="/shopping">≡<span>List item</span></Link><Link to="/expenses">$<span>Expense</span></Link><Link to="/medical">+<span>Medical</span></Link><Link to="/vault">◆<span>Private item</span></Link></div></article>
    </section>
  </>;
}
