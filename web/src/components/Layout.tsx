import {NavLink, Outlet} from 'react-router-dom';
import Topbar from './Topbar';

const primary = [
  {to: '/dashboard', icon: '⌂', label: 'Home'},
  {to: '/calendar', icon: '▣', label: 'Calendar'},
  {to: '/chores', icon: '✓', label: 'Tasks'},
  {to: '/shopping', icon: '≡', label: 'Lists'},
  {to: '/family', icon: '♡', label: 'Family'},
];
const secondary = [
  {to: '/expenses', icon: '$', label: 'Expenses'},
  {to: '/medical', icon: '+', label: 'Medical'},
  {to: '/vault', icon: '◆', label: 'Vault'},
  {to: '/settings', icon: '⚙', label: 'Settings'},
];

function NavItem({to, icon, label}: {to: string; icon: string; label: string}) {
  return <NavLink to={to} className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}><span>{icon}</span><b>{label}</b></NavLink>;
}

export default function Layout() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">FV</span><div><strong>FamilyVault</strong><small>Home, held together.</small></div></div>
        <nav className="side-nav">{primary.map(item => <NavItem key={item.to} {...item} />)}<div className="nav-divider" />{secondary.map(item => <NavItem key={item.to} {...item} />)}</nav>
        <div className="privacy-note"><span>◉</span><div><strong>Private by design</strong><small>Encrypted records and revocable sessions.</small></div></div>
      </aside>
      <main className="main-panel"><Topbar /><section className="page-content"><Outlet /></section></main>
      <nav className="bottom-nav">{primary.map(item => <NavItem key={item.to} {...item} />)}</nav>
    </div>
  );
}
