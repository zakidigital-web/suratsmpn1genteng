import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSurat } from '../context/SuratContext';
import { School, Eye, EyeOff, LogIn, Shield, Users, UserCheck, FlaskConical, Lock } from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { demoMode } = useSurat();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    await new Promise(r => setTimeout(r, 800));

    if (login(username, password)) {
      navigate('/dashboard');
    } else {
      setError('Username atau password salah!');
    }
    setLoading(false);
  };

  const quickLogin = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-400/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-lg rounded-2xl mb-4 shadow-2xl border border-white/10">
            <School size={40} className="text-indigo-300" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">SMP Negeri 1 Genteng</h1>
          <p className="text-indigo-300 text-sm">Sistem Administrasi Surat Menyurat</p>
          <p className="text-indigo-400/70 text-xs mt-1">Kabupaten Banyuwangi - Jawa Timur</p>
        </div>

        {/* Demo Mode Badge */}
        {demoMode && (
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-medium rounded-full animate-pulse">
              <FlaskConical size={13} />
              Mode Demo Aktif
            </span>
          </div>
        )}
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 border text-xs font-medium rounded-full ${isSupabaseConfigured ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300' : 'bg-slate-500/20 border-slate-400/30 text-slate-200'}`}>
            {isSupabaseConfigured ? 'Supabase Terkonfigurasi' : 'Supabase Belum Dikonfigurasi'}
          </span>
        </div>

        {/* Login Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
          <div className="p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-white mb-1">Masuk ke Sistem</h2>
            <p className="text-indigo-300/80 text-sm mb-6">Masukkan kredensial Anda untuk melanjutkan</p>

            {error && (
              <div className="bg-red-500/20 border border-red-500/30 text-red-200 px-4 py-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-indigo-200 mb-1.5">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-xl text-white placeholder-indigo-300/50 focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none transition-all"
                  placeholder="Masukkan username"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-indigo-200 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-xl text-white placeholder-indigo-300/50 focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none transition-all pr-12"
                    placeholder="Masukkan password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-300/50 hover:text-indigo-200"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn size={18} />
                    Masuk
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Quick Login - Only shown in Demo Mode */}
          {demoMode && (
            <div className="border-t border-white/10 bg-white/5 p-4 sm:p-6">
              <div className="flex items-center justify-center gap-2 mb-3">
                <FlaskConical size={13} className="text-amber-400" />
                <p className="text-xs text-amber-300/80 font-medium">Demo Login Cepat</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => quickLogin('admin', 'admin123')}
                  className="flex flex-col items-center gap-1 p-2.5 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all group"
                >
                  <Shield size={16} className="text-red-400 group-hover:scale-110 transition-transform" />
                  <span className="text-xs text-indigo-200">Admin</span>
                </button>
                <button
                  onClick={() => quickLogin('operator', 'operator123')}
                  className="flex flex-col items-center gap-1 p-2.5 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all group"
                >
                  <Users size={16} className="text-blue-400 group-hover:scale-110 transition-transform" />
                  <span className="text-xs text-indigo-200">Operator</span>
                </button>
                <button
                  onClick={() => quickLogin('kepsek', 'kepsek123')}
                  className="flex flex-col items-center gap-1 p-2.5 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all group"
                >
                  <UserCheck size={16} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                  <span className="text-xs text-indigo-200">Kepsek</span>
                </button>
              </div>
              <p className="text-[10px] text-indigo-400/50 text-center mt-2">
                Klik salah satu untuk mengisi username & password otomatis
              </p>
            </div>
          )}

          {/* Production mode info */}
          {!demoMode && (
            <div className="border-t border-white/10 bg-white/5 p-4 sm:p-5">
              <div className="flex items-center justify-center gap-2 text-indigo-300/50">
                <Lock size={14} />
                <p className="text-xs">Hubungi administrator untuk mendapatkan akses</p>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-indigo-400/50 text-xs mt-6">
          © 2024 SMP Negeri 1 Genteng. All rights reserved.
        </p>
      </div>
    </div>
  );
}
