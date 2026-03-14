import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole, RolePermissions, FeatureKey, DEFAULT_USERS, DEFAULT_PERMISSIONS } from '../types';

interface AuthContextType {
  user: User | null;
  users: User[];
  permissions: RolePermissions;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
  addUser: (u: User) => void;
  updateUser: (u: User) => void;
  deleteUser: (id: string) => void;
  updatePermissions: (p: RolePermissions) => void;
  hasFeatureAccess: (feature: FeatureKey) => boolean;
  getRoleFeatures: (role: UserRole) => FeatureKey[];
  changePassword: (userId: string, oldPass: string, newPass: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(() => {
    const stored = localStorage.getItem('surat_users');
    if (stored) {
      const parsed = JSON.parse(stored);
      // migrate old users without 'active' field
      return parsed.map((u: User) => ({ ...u, active: u.active !== undefined ? u.active : true }));
    }
    return DEFAULT_USERS;
  });

  const [permissions, setPermissions] = useState<RolePermissions>(() => {
    const stored = localStorage.getItem('surat_permissions');
    return stored ? JSON.parse(stored) : DEFAULT_PERMISSIONS;
  });

  useEffect(() => {
    const stored = localStorage.getItem('surat_current_user');
    if (stored) {
      const parsed = JSON.parse(stored);
      // Validate user still exists and is active
      const latestUsers: User[] = JSON.parse(localStorage.getItem('surat_users') || '[]');
      const stillValid = latestUsers.find(u => u.id === parsed.id && u.active);
      if (stillValid) {
        setUser(stillValid);
      } else {
        localStorage.removeItem('surat_current_user');
      }
    }
  }, []);

  useEffect(() => { localStorage.setItem('surat_users', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('surat_permissions', JSON.stringify(permissions)); }, [permissions]);

  const login = (username: string, password: string): boolean => {
    const found = users.find(u => u.username === username && u.password === password && u.active);
    if (found) {
      setUser(found);
      localStorage.setItem('surat_current_user', JSON.stringify(found));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('surat_current_user');
  };

  const addUser = (u: User) => {
    setUsers(prev => [...prev, u]);
  };

  const updateUser = (u: User) => {
    setUsers(prev => prev.map(x => x.id === u.id ? u : x));
    // If updating current user, refresh session
    if (user && user.id === u.id) {
      setUser(u);
      localStorage.setItem('surat_current_user', JSON.stringify(u));
    }
  };

  const deleteUser = (id: string) => {
    setUsers(prev => prev.filter(x => x.id !== id));
  };

  const updatePermissions = (p: RolePermissions) => {
    setPermissions(p);
  };

  const hasFeatureAccess = (feature: FeatureKey): boolean => {
    if (!user) return false;
    return permissions[user.role]?.includes(feature) ?? false;
  };

  const getRoleFeatures = (role: UserRole): FeatureKey[] => {
    return permissions[role] || [];
  };

  const changePassword = (userId: string, oldPass: string, newPass: string): boolean => {
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
