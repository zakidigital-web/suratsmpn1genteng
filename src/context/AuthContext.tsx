import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole, RolePermissions, FeatureKey, DEFAULT_USERS, DEFAULT_PERMISSIONS } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  users: User[];
  permissions: RolePermissions;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  addUser: (u: User) => void;
  updateUser: (u: User) => void;
  deleteUser: (id: string) => void;
  updatePermissions: (p: RolePermissions) => void;
  hasFeatureAccess: (feature: FeatureKey) => boolean;
  getRoleFeatures: (role: UserRole) => FeatureKey[];
  changePassword: (userId: string, oldPass: string, newPass: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);
const SESSION_KEY = 'surat_current_user_id';

const normalizeRole = (role: string): UserRole => {
  if (role === 'admin' || role === 'operator' || role === 'kepala_sekolah') return role;
  return 'operator';
};

const normalizeUser = (row: any): User => ({
  id: String(row.id),
  username: String(row.username),
  password: String(row.password),
  name: String(row.name),
  role: normalizeRole(String(row.role)),
  nip: row.nip ? String(row.nip) : '',
  active: row.active !== false,
});

const toUserRow = (u: User) => ({
  id: u.id,
  username: u.username,
  password: u.password,
  name: u.name,
  role: u.role,
  nip: u.nip || null,
  active: u.active,
});

const buildPermissionRows = (p: RolePermissions) => ([
  { role: 'admin', features: p.admin },
  { role: 'operator', features: p.operator },
  { role: 'kepala_sekolah', features: p.kepala_sekolah },
]);

const mapPermissionRows = (rows: any[]): RolePermissions => {
  const next: RolePermissions = { ...DEFAULT_PERMISSIONS };
  for (const row of rows) {
    const role = normalizeRole(String(row.role));
    const features = Array.isArray(row.features) ? row.features.filter((f: unknown) => typeof f === 'string') as FeatureKey[] : [];
    next[role] = features;
  }
  return next;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(DEFAULT_USERS);
  const [permissions, setPermissions] = useState<RolePermissions>(DEFAULT_PERMISSIONS);

  useEffect(() => {
    const load = async () => {
      if (!isSupabaseConfigured || !supabase) {
        const sessionId = sessionStorage.getItem(SESSION_KEY);
        if (sessionId) {
          const found = DEFAULT_USERS.find(x => x.id === sessionId && x.active);
          if (found) setUser(found);
        }
        return;
      }

      const usersRes = await supabase.from('users').select('*').order('name', { ascending: true });
      let nextUsers = usersRes.data?.map(normalizeUser) ?? [];
      if (!usersRes.error && nextUsers.length === 0) {
        await supabase.from('users').upsert(DEFAULT_USERS.map(toUserRow));
        const seededUsers = await supabase.from('users').select('*').order('name', { ascending: true });
        nextUsers = seededUsers.data?.map(normalizeUser) ?? DEFAULT_USERS;
      }
      if (usersRes.error) {
        nextUsers = DEFAULT_USERS;
      }
      setUsers(nextUsers);

      const permsRes = await supabase.from('permissions').select('role,features');
      let nextPermissions = permsRes.data ? mapPermissionRows(permsRes.data) : DEFAULT_PERMISSIONS;
      if (!permsRes.error && (!permsRes.data || permsRes.data.length === 0)) {
        await supabase.from('permissions').upsert(buildPermissionRows(DEFAULT_PERMISSIONS), { onConflict: 'role' });
        nextPermissions = DEFAULT_PERMISSIONS;
      }
      if (permsRes.error) {
        nextPermissions = DEFAULT_PERMISSIONS;
      }
      setPermissions(nextPermissions);

      const sessionId = sessionStorage.getItem(SESSION_KEY);
      if (sessionId) {
        const found = nextUsers.find(x => x.id === sessionId && x.active);
        if (found) {
          setUser(found);
        } else {
          sessionStorage.removeItem(SESSION_KEY);
        }
    }
    };

    void load();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    if (isSupabaseConfigured && supabase) {
      const res = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .eq('active', true)
        .limit(1);

      const found = res.data?.[0] ? normalizeUser(res.data[0]) : null;
      if (found) {
        setUser(found);
        sessionStorage.setItem(SESSION_KEY, found.id);
        setUsers(prev => {
          const exists = prev.some(x => x.id === found.id);
          if (exists) return prev.map(x => x.id === found.id ? found : x);
          return [found, ...prev];
        });
        return true;
      }
      return false;
    }

    const found = users.find(u => u.username === username && u.password === password && u.active);
    if (found) {
      setUser(found);
      sessionStorage.setItem(SESSION_KEY, found.id);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem(SESSION_KEY);
  };

  const addUser = (u: User) => {
    setUsers(prev => [...prev, u]);
    if (isSupabaseConfigured && supabase) {
      void supabase.from('users').upsert(toUserRow(u), { onConflict: 'id' });
    }
  };

  const updateUser = (u: User) => {
    setUsers(prev => prev.map(x => x.id === u.id ? u : x));
    if (user && user.id === u.id) {
      setUser(u);
      sessionStorage.setItem(SESSION_KEY, u.id);
    }
    if (isSupabaseConfigured && supabase) {
      void supabase.from('users').upsert(toUserRow(u), { onConflict: 'id' });
    }
  };

  const deleteUser = (id: string) => {
    setUsers(prev => prev.filter(x => x.id !== id));
    if (user?.id === id) {
      setUser(null);
      sessionStorage.removeItem(SESSION_KEY);
    }
    if (isSupabaseConfigured && supabase) {
      void supabase.from('users').delete().eq('id', id);
    }
  };

  const updatePermissions = (p: RolePermissions) => {
    setPermissions(p);
    if (isSupabaseConfigured && supabase) {
      void supabase.from('permissions').upsert(buildPermissionRows(p), { onConflict: 'role' });
    }
  };

  const hasFeatureAccess = (feature: FeatureKey): boolean => {
    if (!user) return false;
    return permissions[user.role]?.includes(feature) ?? false;
  };

  const getRoleFeatures = (role: UserRole): FeatureKey[] => {
    return permissions[role] || [];
  };

  const changePassword = async (userId: string, oldPass: string, newPass: string): Promise<boolean> => {
    if (isSupabaseConfigured && supabase) {
      const foundRes = await supabase.from('users').select('*').eq('id', userId).limit(1);
      const target = foundRes.data?.[0] ? normalizeUser(foundRes.data[0]) : null;
      if (!target || target.password !== oldPass) return false;
      const updated: User = { ...target, password: newPass };
      await supabase.from('users').update({ password: newPass }).eq('id', userId);
      setUsers(prev => prev.map(x => x.id === userId ? updated : x));
      if (user?.id === userId) setUser(updated);
      return true;
    }

    const target = users.find(u => u.id === userId);
    if (!target || target.password !== oldPass) return false;
    const updated = { ...target, password: newPass };
    updateUser(updated);
    return true;
  };

  return (
    <AuthContext.Provider value={{
      user, users, permissions, login, logout, isAuthenticated: !!user,
      addUser, updateUser, deleteUser, updatePermissions,
      hasFeatureAccess, getRoleFeatures, changePassword
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
