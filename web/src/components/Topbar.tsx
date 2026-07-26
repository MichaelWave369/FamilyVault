import {useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {useAuth} from '../auth/AuthContext';
import {initials} from '../utils';
import FamilySwitcher from './FamilySwitcher';

export default function Topbar() {
  const {user, logout} = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  async function signOut() {
    await logout();
    navigate('/login', {replace: true});
  }
  return (
    <header className="topbar">
      <div className="topbar-mobile-brand"><span className="brand-mark">FV</span><strong>FamilyVault</strong></div>
      <FamilySwitcher />
      <div className="topbar-spacer" />
      <Link className="quick-add" to="/dashboard#quick-add">＋ Add</Link>
      <div className="user-menu-wrap">
        <button className="user-chip" onClick={() => setOpen(value => !value)} aria-expanded={open}>
          <span className="avatar small">{initials(user?.name)}</span>
          <span className="user-chip-copy"><strong>{user?.name}</strong><small>My account</small></span>
          <span>⌄</span>
        </button>
        {open && <div className="user-menu"><Link to="/settings" onClick={() => setOpen(false)}>Account & privacy</Link><button onClick={signOut}>Sign out</button></div>}
      </div>
    </header>
  );
}
