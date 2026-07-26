import {useEffect, useMemo, useState} from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import {api} from '../api/client';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import {useFamily} from '../family/FamilyContext';
import type {CalendarRecord, EventRecord} from '../types';
import {can, localInputValue} from '../utils';

const palette = ['#e08b6a', '#5f9f8a', '#6f8fb9', '#a483b7', '#d0a34a'];

export default function CalendarPage() {
  const {currentFamily} = useFamily();
  const [calendars, setCalendars] = useState<CalendarRecord[]>([]);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [open, setOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [error, setError] = useState('');
  const [calendarName, setCalendarName] = useState('Family calendar');
  const [form, setForm] = useState({calendar_id: '', title: '', start_at: localInputValue(), end_at: localInputValue(new Date(Date.now() + 60 * 60_000)), location: '', description: '', all_day: false});
  const writable = can(currentFamily?.role, 'adult');

  async function load() {
    if (!currentFamily) return;
    const rows = await api<CalendarRecord[]>(`/api/families/${currentFamily.id}/calendars`);
    setCalendars(rows);
    setForm(value => ({...value, calendar_id: value.calendar_id || String(rows[0]?.id || '')}));
    const eventRows = (await Promise.all(rows.map(calendar => api<EventRecord[]>(`/api/calendars/${calendar.id}/events`)))).flat();
    setEvents(eventRows);
  }
  useEffect(() => {load().catch(err => setError(err.message));}, [currentFamily?.id]);

  const fullCalendarEvents = useMemo(() => events.map(event => ({id: String(event.id), title: event.title, start: event.start_at, end: event.end_at, allDay: event.all_day, backgroundColor: calendars.find(cal => cal.id === event.calendar_id)?.color, borderColor: 'transparent'})), [events, calendars]);

  if (!currentFamily) return <EmptyState icon="▣" title="Choose a family" message="Create or select a family space before using the calendar." />;
  return <>
    <PageHeader eyebrow="Shared time" title="Calendar" description="Appointments, school, work and family plans in one view." actions={writable && <div className="button-row"><button className="secondary" onClick={() => setCalendarOpen(true)}>New calendar</button><button className="primary" onClick={() => setOpen(true)}>＋ Add event</button></div>} />
    {error && <div className="alert error">{error}</div>}
    {!calendars.length ? <EmptyState icon="▣" title="Create the first calendar" message={writable ? 'Use separate colors for family, school, work or appointments.' : 'An adult can create the first shared calendar.'} action={writable && <button className="primary" onClick={() => setCalendarOpen(true)}>Create calendar</button>} /> : <div className="calendar-shell"><div className="calendar-legend">{calendars.map(calendar => <span key={calendar.id}><i style={{background: calendar.color}} />{calendar.name}</span>)}</div><FullCalendar plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]} initialView="dayGridMonth" height="auto" events={fullCalendarEvents} headerToolbar={{left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek'}} nowIndicator /></div>}
    <Modal open={calendarOpen} title="New calendar" onClose={() => setCalendarOpen(false)}><form className="form-stack" onSubmit={async event => {event.preventDefault(); setError(''); try {await api(`/api/families/${currentFamily.id}/calendars`, {method: 'POST', body: JSON.stringify({name: calendarName, color: palette[calendars.length % palette.length]})}); setCalendarOpen(false); await load();} catch (err) {setError(err instanceof Error ? err.message : 'Could not create calendar');}}}><label>Name<input value={calendarName} onChange={event => setCalendarName(event.target.value)} required maxLength={255} /></label><button className="primary">Create calendar</button></form></Modal>
    <Modal open={open} title="Add family event" onClose={() => setOpen(false)}><form className="form-stack" onSubmit={async event => {event.preventDefault(); setError(''); try {await api(`/api/calendars/${form.calendar_id}/events`, {method: 'POST', body: JSON.stringify({...form, calendar_id: undefined, start_at: new Date(form.start_at).toISOString(), end_at: new Date(form.end_at).toISOString()})}); setOpen(false); setForm(value => ({...value, title: '', location: '', description: ''})); await load();} catch (err) {setError(err instanceof Error ? err.message : 'Could not create event');}}}>
      <label>Calendar<select value={form.calendar_id} onChange={event => setForm({...form, calendar_id: event.target.value})}>{calendars.map(calendar => <option value={calendar.id} key={calendar.id}>{calendar.name}</option>)}</select></label>
      <label>Title<input value={form.title} onChange={event => setForm({...form, title: event.target.value})} required maxLength={255} /></label>
      <div className="form-grid"><label>Starts<input type="datetime-local" value={form.start_at} onChange={event => setForm({...form, start_at: event.target.value})} required /></label><label>Ends<input type="datetime-local" value={form.end_at} onChange={event => setForm({...form, end_at: event.target.value})} required /></label></div>
      <label>Location<input value={form.location} onChange={event => setForm({...form, location: event.target.value})} maxLength={255} /></label>
      <label>Notes<textarea value={form.description} onChange={event => setForm({...form, description: event.target.value})} maxLength={5000} /></label>
      <label className="check-label"><input type="checkbox" checked={form.all_day} onChange={event => setForm({...form, all_day: event.target.checked})} /> All-day event</label>
      <button className="primary">Add to calendar</button>
    </form></Modal>
  </>;
}
