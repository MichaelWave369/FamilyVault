import {FormEvent, useState} from 'react';
import {Link, Navigate, useNavigate} from 'react-router-dom';
import {useAuth} from '../auth/AuthContext';

export default function Register() {
  const {user, register} = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({name: '', email: '', password: ''});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/dashboard" replace />;
  async function submit(event: FormEvent) {
    event.preventDefault(); setError(''); setBusy(true);
    try {await register(form.email, form.password, form.name); navigate('/dashboard', {replace: true});}
    catch (err) {setError(err instanceof Error ? err.message : 'Unable to create account');}
    finally {setBusy(false);}
  }
  return <main className="auth-page"><section className="auth-story register-story"><div className="auth-brand"><span className="brand-mark">FV</span><strong>FamilyVault</strong></div><div><span className="eyebrow">Begin privately</span><h1>Create the doorway to your family space.</h1><p>Your account can create a new household or join one with a private invitation token.</p></div><div className="auth-promise"><span>◉</span><p>Passwords are hashed with Argon2 and sessions are revocable.</p></div></section><section className="auth-form-wrap"><form className="auth-form" onSubmit={submit}><span className="eyebrow">Create account</span><h2>Your family starts with you</h2><p>Use a strong, unique password with at least 12 characters.</p>{error && <div className="alert error">{error}</div>}<label>Your name<input autoComplete="name" value={form.name} onChange={event => setForm({...form, name: event.target.value})} required maxLength={255} /></label><label>Email<input type="email" autoComplete="email" value={form.email} onChange={event => setForm({...form, email: event.target.value})} required /></label><label>Password<input type="password" autoComplete="new-password" minLength={12} value={form.password} onChange={event => setForm({...form, password: event.target.value})} required /></label><button className="primary large" disabled={busy}>{busy ? 'Creating…' : 'Create private account'}</button><p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p></form></section></main>;
}
