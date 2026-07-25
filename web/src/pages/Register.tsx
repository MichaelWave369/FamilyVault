import {FormEvent, useState} from 'react';
import {Link, Navigate, useNavigate} from 'react-router-dom';
import {ApiError} from '../api/client';
import {useAuth} from '../auth/AuthContext';

export default function Register() {
  const {user, register} = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
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
      await register(email, password, name);
      navigate('/dashboard', {replace: true});
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to create account');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <div className="brand centered-brand"><span className="brand-mark">FV</span><strong>FamilyVault</strong></div>
        <h1>Create your space</h1>
        <p>Your password must contain at least 12 characters.</p>
        {error && <div className="error-box">{error}</div>}
        <label>Name<input autoComplete="name" required value={name} onChange={e => setName(e.target.value)} /></label>
        <label>Email<input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} /></label>
        <label>Password<input type="password" minLength={12} autoComplete="new-password" required value={password} onChange={e => setPassword(e.target.value)} /></label>
        <button disabled={submitting}>{submitting ? 'Creating…' : 'Create account'}</button>
        <small>Already registered? <Link to="/login">Sign in</Link></small>
      </form>
    </div>
  );
}
