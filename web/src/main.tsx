import React from 'react';
import ReactDOM from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';
import App from './App';
import {AuthProvider} from './auth/AuthContext';
import {FamilyProvider} from './family/FamilyContext';
import './styles.css';

const theme = localStorage.getItem('familyvault_theme');
if (theme) document.documentElement.dataset.theme = theme;

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><BrowserRouter><AuthProvider><FamilyProvider><App /></FamilyProvider></AuthProvider></BrowserRouter></React.StrictMode>);

if ('serviceWorker' in navigator && import.meta.env.PROD) window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => undefined));
