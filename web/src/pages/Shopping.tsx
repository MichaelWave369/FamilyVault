import {useEffect, useState} from 'react';
import {api} from '../api/client';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import {useFamily} from '../family/FamilyContext';
import type {ShoppingItem, ShoppingList} from '../types';
import {can} from '../utils';

export default function ShoppingPage() {
  const {currentFamily} = useFamily();
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [open, setOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [error, setError] = useState('');
  const [listName, setListName] = useState('Groceries');
  const [form, setForm] = useState({text: '', qty: '', unit: '', category: ''});
  const writable = can(currentFamily?.role, 'child');

  async function loadLists() {
    if (!currentFamily) return;
    const rows = await api<ShoppingList[]>(`/api/families/${currentFamily.id}/lists`);
    setLists(rows); setSelectedId(id => rows.some(row => row.id === id) ? id : rows[0]?.id ?? null);
  }
  async function loadItems(id = selectedId) { if (!id) {setItems([]); return;} setItems(await api<ShoppingItem[]>(`/api/lists/${id}/items`)); }
  useEffect(() => {loadLists().catch(err => setError(err.message));}, [currentFamily?.id]);
  useEffect(() => {loadItems().catch(err => setError(err.message));}, [selectedId]);

  if (!currentFamily) return <EmptyState icon="≡" title="Choose a family" message="Select a family space to open shared lists." />;
  const selected = lists.find(list => list.id === selectedId);
  const remaining = items.filter(item => !item.checked);
  return <>
    <PageHeader eyebrow="Household needs" title="Lists" description="Keep groceries and supplies shared, current and easy to check off." actions={writable && <div className="button-row"><button className="secondary" onClick={() => setListOpen(true)}>New list</button><button className="primary" disabled={!selected} onClick={() => setOpen(true)}>＋ Add item</button></div>} />
    {error && <div className="alert error">{error}</div>}
    {!lists.length ? <EmptyState icon="≡" title="Start the first list" message={writable ? 'Create groceries, hardware, school supplies or any shared checklist.' : 'A family member can create the first shared list.'} action={writable && <button className="primary" onClick={() => setListOpen(true)}>Create list</button>} /> : <div className="lists-layout"><aside className="list-tabs">{lists.map(list => <button key={list.id} className={selectedId === list.id ? 'active' : ''} onClick={() => setSelectedId(list.id)}><span>≡</span>{list.name}</button>)}</aside><section className="panel list-panel"><div className="panel-head"><div><span className="eyebrow">{remaining.length} remaining</span><h2>{selected?.name}</h2></div></div>{items.length ? <div className="shopping-list">{items.sort((a, b) => Number(a.checked) - Number(b.checked)).map(item => <article className={`shopping-row ${item.checked ? 'done' : ''}`} key={item.id}><button className="task-check" disabled={!writable} onClick={async () => {await api(`/api/items/${item.id}`, {method: 'PATCH', body: JSON.stringify({checked: !item.checked})}); await loadItems();}}>{item.checked ? '✓' : '○'}</button><div><strong>{item.text}</strong><p>{[item.qty, item.unit, item.category].filter(Boolean).join(' · ') || 'Shared list item'}</p></div>{writable && <button className="icon-button danger" onClick={async () => {await api(`/api/items/${item.id}`, {method: 'DELETE'}); await loadItems();}}>×</button>}</article>)}</div> : <EmptyState icon="≡" title="This list is empty" message="Add the next thing your household needs." action={writable && <button className="text-link" onClick={() => setOpen(true)}>Add an item</button>} />}</section></div>}
    <Modal open={listOpen} title="Create a shared list" onClose={() => setListOpen(false)}><form className="form-stack" onSubmit={async event => {event.preventDefault(); try {const row = await api<ShoppingList>(`/api/families/${currentFamily.id}/lists`, {method: 'POST', body: JSON.stringify({name: listName})}); setListOpen(false); await loadLists(); setSelectedId(row.id);} catch (err) {setError(err instanceof Error ? err.message : 'Could not create list');}}}><label>List name<input value={listName} onChange={event => setListName(event.target.value)} required maxLength={255} /></label><button className="primary">Create list</button></form></Modal>
    <Modal open={open} title={`Add to ${selected?.name || 'list'}`} onClose={() => setOpen(false)}><form className="form-stack" onSubmit={async event => {event.preventDefault(); if (!selectedId) return; try {await api(`/api/lists/${selectedId}/items`, {method: 'POST', body: JSON.stringify(form)}); setOpen(false); setForm({text: '', qty: '', unit: '', category: ''}); await loadItems();} catch (err) {setError(err instanceof Error ? err.message : 'Could not add item');}}}><label>Item<input autoFocus value={form.text} onChange={event => setForm({...form, text: event.target.value})} required maxLength={255} /></label><div className="form-grid three"><label>Quantity<input value={form.qty} onChange={event => setForm({...form, qty: event.target.value})} maxLength={50} /></label><label>Unit<input placeholder="bags, lb…" value={form.unit} onChange={event => setForm({...form, unit: event.target.value})} maxLength={20} /></label><label>Category<input placeholder="Produce" value={form.category} onChange={event => setForm({...form, category: event.target.value})} maxLength={100} /></label></div><button className="primary">Add item</button></form></Modal>
  </>;
}
