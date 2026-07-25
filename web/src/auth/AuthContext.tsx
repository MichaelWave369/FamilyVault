import {createContext, useContext, useEffect, useMemo, useState} from 'react';
import {api, clearAccessToken, logoutRequest, refreshAccessToken, requestAccessToken} from '../api/client';

type User = {id: number; email: string; name: string};
type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}

export function AuthProvider({children}: {children: React.ReactNode}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadUser() {
    const current = await api<User>('/api/auth/me');
    setUser(current);
  }

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const token = await refreshAccessToken();
        if (token && active) {
          const current = await api<User>('/api/auth/me');
          if (active) setUser(current);
        }
      } catch {
        clearAccessToken();
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    login: async (email, password) => {
      await requestAccessToken('/api/auth/login', {email, password});
      await loadUser();
    },
    register: async (email, password, name) => {
      await requestAccessToken('/api/auth/register', {email, password, name});
      await loadUser();
    },
    logout: async () => {
      await logoutRequest();
      setUser(null);
    },
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
