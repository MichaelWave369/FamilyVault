import {Navigate, Route, Routes} from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Calendar from './pages/Calendar';
import Expenses from './pages/Expenses';
import Chores from './pages/Chores';
import Shopping from './pages/Shopping';
import Family from './pages/Family';
import Medical from './pages/Medical';
import Vault from './pages/Vault';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Register from './pages/Register';

export default function App() {
  return <Routes><Route path="/login" element={<Login />} /><Route path="/register" element={<Register />} /><Route element={<ProtectedRoute />}><Route element={<Layout />}><Route path="/" element={<Navigate to="/dashboard" replace />} /><Route path="/dashboard" element={<Dashboard />} /><Route path="/calendar" element={<Calendar />} /><Route path="/chores" element={<Chores />} /><Route path="/shopping" element={<Shopping />} /><Route path="/family" element={<Family />} /><Route path="/expenses" element={<Expenses />} /><Route path="/medical" element={<Medical />} /><Route path="/vault" element={<Vault />} /><Route path="/settings" element={<Settings />} /></Route></Route><Route path="*" element={<Navigate to="/dashboard" replace />} /></Routes>;
}
