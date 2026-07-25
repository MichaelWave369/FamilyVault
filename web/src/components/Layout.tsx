import {NavLink, Outlet} from 'react-router-dom';
import Topbar from './Topbar';

const items = ['Dashboard', 'Calendar', 'Expenses', 'Chores', 'Shopping', 'Medical', 'Vault', 'Settings'];

export default function Layout() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">FV</span>
          <div><strong>FamilyVault</strong><small>Private family space</small></div>
        </div>
        <nav>
          {items.map(item => (
            <NavLink key={item} to={`/${item.toLowerCase()}`} className={({isActive}) => isActive ? 'active' : ''}>
              {item}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="main-panel">
        <Topbar />
        <section className="page-content"><Outlet /></section>
      </main>
    </div>
  );
}
