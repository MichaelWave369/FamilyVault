import {useEffect, useMemo, useState} from 'react';
import {api} from '../api/client';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import {useFamily} from '../family/FamilyContext';
import type {Expense, ExpenseAccount, ExpenseSummary} from '../types';
import {can, friendlyDate, localInputValue, money} from '../utils';

export default function ExpensesPage() {
  const {currentFamily} = useFamily();
  const [accounts, setAccounts] = useState<ExpenseAccount[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [error, setError] = useState('');
  const [accountName, setAccountName] = useState('Household');
  const [form, setForm] = useState({amount: '', category: 'general', merchant: '', notes: '', spent_at: localInputValue()});

  async function loadAccounts() {
    if (!currentFamily) return;
    const rows = await api<ExpenseAccount[]>(`/api/families/${currentFamily.id}/accounts`);
    setAccounts(rows); setSelectedId(id => rows.some(row => row.id === id) ? id : rows[0]?.id ?? null);
  }
  async function loadAccount(id = selectedId) {
    if (!id) {setExpenses([]); setSummary(null); return;}
    const [rows, total] = await Promise.all([api<Expense[]>(`/api/accounts/${id}/expenses`), api<ExpenseSummary>(`/api/accounts/${id}/summary`)]);
    setExpenses(rows.sort((a, b) => +new Date(b.spent_at) - +new Date(a.spent_at))); setSummary(total);
  }
  useEffect(() => {if (can(currentFamily?.role, 'adult')) loadAccounts().catch(err => setError(err.message));}, [currentFamily?.id]);
  useEffect(() => {loadAccount().catch(err => setError(err.message));}, [selectedId]);

  if (!currentFamily) return <EmptyState icon="$" title="Choose a family" message="Select a family space to view household expenses." />;
  if (!can(currentFamily.role, 'adult')) return <EmptyState icon="$" title="Adult access required" message="Household expenses are available only to adult family roles." />;
  const selected = accounts.find(account => account.id === selectedId);
  const byCategory = useMemo(() => expenses.reduce<Record<string, number>>((acc, item) => ({...acc, [item.category]: (acc[item.category] || 0) + item.amount_cents}), {}), [expenses]);
  return <>
    <PageHeader eyebrow="Household money" title="Expenses" description="A simple shared record—not a bank connection or financial advisor." actions={<div className="button-row"><button className="secondary" onClick={() => setAccountOpen(true)}>New account</button><button className="primary" disabled={!selected} onClick={() => setExpenseOpen(true)}>＋ Add expense</button></div>} />
    {error && <div className="alert error">{error}</div>}
    {!accounts.length ? <EmptyState icon="$" title="Create an expense account" message="Start with Household, Vacation, Renovation or another shared purpose." action={<button className="primary" onClick={() => setAccountOpen(true)}>Create account</button>} /> : <>
      <div className="account-tabs">{accounts.map(account => <button className={selectedId === account.id ? 'active' : ''} key={account.id} onClick={() => setSelectedId(account.id)}>{account.name}</button>)}</div>
      <section className="finance-hero"><div><span className="eyebrow">This month</span><strong>{summary ? money(summary.total_cents, selected?.currency) : '—'}</strong><p>{selected?.name} spending recorded in FamilyVault.</p></div><div className="category-bars">{Object.entries(byCategory).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([category, cents]) => <div key={category}><span>{category}</span><b>{money(cents, selected?.currency)}</b></div>)}</div></section>
      <section className="panel"><div className="panel-head"><div><span className="eyebrow">Recent</span><h2>Expense history</h2></div></div>{expenses.length ? <div className="expense-list">{expenses.map(item => <article key={item.id}><span className="expense-avatar">$</span><div><strong>{item.merchant || item.category}</strong><p>{friendlyDate(item.spent_at, {year: 'numeric'})} · {item.category}{item.notes ? ` · ${item.notes}` : ''}</p></div><b>{money(item.amount_cents, item.currency)}</b></article>)}</div> : <EmptyState icon="$" title="No expenses recorded" message="Add the first shared purchase when you are ready." />}</section>
    </>}
    <Modal open={accountOpen} title="New expense account" onClose={() => setAccountOpen(false)}><form className="form-stack" onSubmit={async event => {event.preventDefault(); try {const row = await api<ExpenseAccount>(`/api/families/${currentFamily.id}/accounts`, {method: 'POST', body: JSON.stringify({name: accountName, currency: 'USD'})}); setAccountOpen(false); await loadAccounts(); setSelectedId(row.id);} catch (err) {setError(err instanceof Error ? err.message : 'Could not create account');}}}><label>Account name<input value={accountName} onChange={event => setAccountName(event.target.value)} required maxLength={255} /></label><label>Currency<input value="USD" disabled /></label><button className="primary">Create account</button></form></Modal>
    <Modal open={expenseOpen} title={`Add to ${selected?.name || 'account'}`} onClose={() => setExpenseOpen(false)}><form className="form-stack" onSubmit={async event => {event.preventDefault(); if (!selectedId) return; try {const amount = Math.round(Number(form.amount) * 100); await api(`/api/accounts/${selectedId}/expenses`, {method: 'POST', body: JSON.stringify({amount_cents: amount, currency: selected?.currency || 'USD', category: form.category, merchant: form.merchant, notes: form.notes, spent_at: new Date(form.spent_at).toISOString()})}); setExpenseOpen(false); setForm({amount: '', category: 'general', merchant: '', notes: '', spent_at: localInputValue()}); await loadAccount();} catch (err) {setError(err instanceof Error ? err.message : 'Could not add expense');}}}><div className="form-grid"><label>Amount<input type="number" min="0.01" max="9999999" step="0.01" value={form.amount} onChange={event => setForm({...form, amount: event.target.value})} required /></label><label>Category<input value={form.category} onChange={event => setForm({...form, category: event.target.value})} maxLength={100} required /></label></div><label>Merchant or payee<input value={form.merchant} onChange={event => setForm({...form, merchant: event.target.value})} maxLength={255} /></label><label>Date<input type="datetime-local" value={form.spent_at} onChange={event => setForm({...form, spent_at: event.target.value})} required /></label><label>Notes<textarea value={form.notes} onChange={event => setForm({...form, notes: event.target.value})} maxLength={5000} /></label><button className="primary">Record expense</button></form></Modal>
  </>;
}
