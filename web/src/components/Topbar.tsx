import {useNavigate} from 'react-router-dom';
import {useAuth} from '../auth/AuthContext';
import FamilySwitcher from './FamilySwitcher';

export default function Topbar() {
  const {user, logout} = useAuth();
  const navigate = useNavigate();
  async function signOut() {
    await logout();
    navigate('/login', {replace: true});
  }
  return (
    <header className="topbar">
      <FamilySwitcher />
      <div className="topbar-user"><span>{user?.name}</span><small>{user?.email}</small></div>
      <button className="secondary" onClick={signOut}>Sign out</button>
    </header>
  );
}
