import {FormEvent, useState} from 'react';
import {Link, Navigate, useLocation, useNavigate} from 'react-router-dom';
import {ApiError} from '../api/client';
import {useAuth} from '../auth/AuthContext';

export default function Login() {
  const {user, login} = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await login(email, password);
      const destination = (location.state as {from?: string} | null)?.from || '/dashboard';
      navigate(destination, {replace: true});
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to sign in');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <div className="brand centered-brand"><span className="brand-mark">FV</span><strong>FamilyVault</strong></div>
        <h1>Welcome home</h1>
        <p>Sign in to your private family space.</p>
        {error && <div className="error-box">{error}</div>}
        <label>Email<input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} /></label>
        <label>Password<input type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} /></label>
        <button disabled={submitting}>{submitting ? 'Signing in…' : 'Sign in'}</button>
        <small>New here? <Link to="/register">Create an account</Link></small>
      </form>
    </div>
  );
}
