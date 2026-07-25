import React from 'react';
import ReactDOM from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';
import App from './App';
import {AuthProvider} from './auth/AuthContext';
import {FamilyProvider} from './family/FamilyContext';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <FamilyProvider>
          <App />
        </FamilyProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
