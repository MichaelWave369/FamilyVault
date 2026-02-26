import { Link, Outlet } from 'react-router-dom';import Topbar from './Topbar';
export default function Layout(){const items=['Dashboard','Calendar','Expenses','Chores','Shopping','Medical','Vault','Settings'];return <div className='app'><aside>{items.map(i=><Link key={i} to={`/${i.toLowerCase()}`}>{i}</Link>)}</aside><main><Topbar/><Outlet/></main></div>}
