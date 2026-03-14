import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FeatureKey } from '../types';
import {
  LayoutDashboard, Mail, Send, FilePlus, FileBarChart, Settings, LogOut,
  Menu, X, School, ChevronDown, User, GitBranch, Users, KeyRound
} from 'lucide-react';

const navItems: { path: string; label: string; icon: React.ComponentType<{size?: number}>; feature: FeatureKey }[] = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, feature: 'dashboard' },
  { path: '/surat-masuk', label: 'Surat Masuk', icon: Mail, feature: 'surat_masuk' },
  { path: '/surat-keluar', label: 'Surat Keluar', icon: Send, feature: 'surat_keluar' },
  { path: '/disposisi', label: 'Disposisi', icon: GitBranch, feature: 'disposisi' },
  { path: '/buat-surat', label: 'Buat Surat', icon: FilePlus, feature: 'buat_surat' },
  { path: '/laporan', label: 'Laporan', icon: FileBarChart, feature: 'laporan' },
  { path: '/manajemen-akun', label: 'Manajemen Akun', icon: Users, feature: 'pengaturan' },
  { path: '/hak-akses', label: 'Hak Akses', icon: KeyRound, feature: 'pengaturan' },
  { path: '/pengaturan', label: 'Pengaturan', icon: Settings, feature: 'pengaturan' },
];

const roleLabel = (role: string) => {
  switch (role) {
    case 'admin': return 'Administrator';
    case 'operator': return 'Operator';
    case 'kepala_sekolah': return 'Kepala Sekolah';
    default: return role;
  }
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout, hasFeatureAccess } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredNav = navItems.filter(item => hasFeatureAccess(item.feature));

  return (
    <div className="min-h-screen flex bg-slate-50">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-indigo-900 via-indigo-800 to-indigo-900 text-white transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 flex flex-col`}>
        <div className="p-4 border-b border-indigo-700/50">
          <button className="lg:hidden absolute top-4 right-4 text-white/70 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/15 rounded-lg flex items-center justify-center">
              <School size={22} className="text-indigo-200" />
            </div>
            <div>
              <h1 className="font-bold text-sm leading-tight">SMP Negeri 1</h1>
              <p className="text-indigo-300 text-xs">Genteng</p>
            </div>
          </div>
          <p className="text-[10px] text-indigo-400 mt-2 uppercase tracking-wider">Sistem Surat Menyurat</p>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {filteredNav.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-white/15 text-white shadow-lg shadow-indigo-900/30'
                    : 'text-indigo-200 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-indigo-700/50">
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-indigo-200 hover:bg-red-500/20 hover:text-red-200 transition-all w-full">
            <LogOut size={18} />
            Keluar
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 lg:px-6 h-16">
            <div className="flex items-center gap-3">
              <button className="lg:hidden p-2 rounded-lg hover:bg-slate-100" onClick={() => setSidebarOpen(true)}>
                <Menu size={20} />
              </button>
              <div className="hidden sm:block">
                <h2 className="text-lg font-semibold text-slate-800">Sistem Administrasi Surat</h2>
                <p className="text-xs text-slate-500">SMP Negeri 1 Genteng - Banyuwangi</p>
              </div>
              <div className="sm:hidden">
                <h2 className="text-sm font-semibold text-slate-800">SMPN 1 Genteng</h2>
              </div>
            </div>

            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                  <User size={16} className="text-indigo-600" />
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-slate-700">{user?.name}</p>
                  <p className="text-xs text-slate-500">{user && roleLabel(user.role)}</p>
                </div>
                <ChevronDown size={14} className="text-slate-400 hidden sm:block" />
              </button>

              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="font-medium text-sm">{user?.name}</p>
                      <p className="text-xs text-slate-500">{user && roleLabel(user.role)}</p>
                      {user?.nip && <p className="text-xs text-slate-400 mt-1">NIP: {user.nip}</p>}
                    </div>
                    <button onClick={() => { setProfileOpen(false); navigate('/profil'); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                      <User size={14} />
                      Profil Saya
                    </button>
                    <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                      <LogOut size={14} />
                      Keluar
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
