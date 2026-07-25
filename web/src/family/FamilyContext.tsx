import {createContext, useContext, useEffect, useMemo, useState} from 'react';
import {api} from '../api/client';
import {useAuth} from '../auth/AuthContext';

export type Family = {id: number; name: string; role: string};
type FamilyContextValue = {
  families: Family[];
  currentFamily: Family | null;
  loading: boolean;
  selectFamily: (id: number) => void;
  createFamily: (name: string) => Promise<void>;
  refreshFamilies: () => Promise<void>;
};

const FamilyContext = createContext<FamilyContextValue | null>(null);

export function useFamily(): FamilyContextValue {
  const value = useContext(FamilyContext);
  if (!value) throw new Error('useFamily must be used inside FamilyProvider');
  return value;
}

export function FamilyProvider({children}: {children: React.ReactNode}) {
  const {user} = useAuth();
  const [families, setFamilies] = useState<Family[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(() => {
    const stored = localStorage.getItem('familyvault_family_id');
    return stored ? Number(stored) : null;
  });
  const [loading, setLoading] = useState(false);

  async function refreshFamilies() {
    if (!user) {
      setFamilies([]);
      return;
    }
    setLoading(true);
    try {
      const rows = await api<Family[]>('/api/families');
      setFamilies(rows);
      if (!rows.some(row => row.id === selectedId)) {
        setSelectedId(rows[0]?.id ?? null);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshFamilies().catch(() => setFamilies([]));
  }, [user?.id]);

  useEffect(() => {
    if (selectedId) localStorage.setItem('familyvault_family_id', String(selectedId));
    else localStorage.removeItem('familyvault_family_id');
  }, [selectedId]);

  const currentFamily = families.find(family => family.id === selectedId) ?? null;
  const value = useMemo<FamilyContextValue>(() => ({
    families,
    currentFamily,
    loading,
    selectFamily: setSelectedId,
    createFamily: async name => {
      const family = await api<Family>('/api/families', {
        method: 'POST',
        body: JSON.stringify({name}),
      });
      await refreshFamilies();
      setSelectedId(family.id);
    },
    refreshFamilies,
  }), [families, currentFamily, loading]);

  return <FamilyContext.Provider value={value}>{children}</FamilyContext.Provider>;
}
