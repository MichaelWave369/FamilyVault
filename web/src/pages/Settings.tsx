import {useEffect, useState} from 'react';
import PageHeader from '../components/PageHeader';
import {useAuth} from '../auth/AuthContext';

export default function SettingsPage() {
  const {user} = useAuth();
  const [dark, setDark] = useState(() => localStorage.getItem('familyvault_theme') === 'dark');
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    localStorage.setItem('familyvault_theme', dark ? 'dark' : 'light');
  }, [dark]);
  return <>
    <PageHeader eyebrow="Account & privacy" title="Settings" description="Control the way FamilyVault looks and understand how your session is protected." />
    <div className="settings-grid">
      <section className="panel settings-card"><span className="eyebrow">Account</span><h2>{user?.name}</h2><p>{user?.email}</p><div className="setting-row"><div><strong>Current session</strong><small>Access token in memory; rotating refresh cookie.</small></div><span className="status-pill good">Protected</span></div></section>
      <section className="panel settings-card"><span className="eyebrow">Appearance</span><h2>Comfortable in every room</h2><div className="setting-row"><div><strong>Dark mode</strong><small>Use a lower-light palette throughout FamilyVault.</small></div><button className={`toggle ${dark ? 'on' : ''}`} onClick={() => setDark(value => !value)} aria-pressed={dark}><span /></button></div></section>
      <section className="panel settings-card full"><span className="eyebrow">Security model</span><h2>What FamilyVault protects—and what it does not.</h2><div className="security-grid"><div><strong>Encrypted at rest</strong><p>Vault secrets, medical notes and medical uploads are encrypted on the server.</p></div><div><strong>Revocable sessions</strong><p>Refresh sessions rotate and are revoked during logout or replay attempts.</p></div><div><strong>Role boundaries</strong><p>Family roles determine access to household, medical and vault modules.</p></div><div><strong>Not end-to-end encrypted</strong><p>A compromised live server with the master key could decrypt protected data.</p></div></div></section>
    </div>
  </>;
}
