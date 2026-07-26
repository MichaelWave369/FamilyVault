import {FormEvent, useState} from 'react';
import {Link, Navigate, useNavigate} from 'react-router-dom';
import {useAuth} from '../auth/AuthContext';

export default function Login() {
  const {user, login} = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/dashboard" replace />;
  async function submit(event: FormEvent) {
    event.preventDefault(); setError(''); setBusy(true);
    try {await login(email, password); navigate('/dashboard', {replace: true});}
    catch (err) {setError(err instanceof Error ? err.message : 'Unable to sign in');}
    finally {setBusy(false);}
  }
  return <main className="auth-page"><section className="auth-story"><div className="auth-brand"><span className="brand-mark">FV</span><strong>FamilyVault</strong></div><div><span className="eyebrow">Home, held together.</span><h1>One calm place for the people and details that matter.</h1><p>Shared time, household tasks, family lists and protected records—without turning family life into another corporate dashboard.</p></div><div className="auth-promise"><span>♡</span><p>Invitation-only family spaces with role-based privacy.</p></div></section><section className="auth-form-wrap"><form className="auth-form" onSubmit={submit}><span className="eyebrow">Welcome back</span><h2>Sign in to your family space</h2><p>Use the account connected to your household.</p>{error && <div className="alert error">{error}</div>}<label>Email<input type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} required /></label><label>Password<input type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} required /></label><button className="primary large" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button><p className="auth-switch">New to FamilyVault? <Link to="/register">Create an account</Link></p></form></section></main>;
}
