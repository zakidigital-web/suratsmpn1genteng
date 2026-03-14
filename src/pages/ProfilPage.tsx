import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  User, Shield, Lock, Save, CheckCircle, Eye, EyeOff, AlertCircle
} from 'lucide-react';

const roleLabel = (role: string) => {
  switch (role) {
    case 'admin': return 'Administrator';
    case 'operator': return 'Operator';
    case 'kepala_sekolah': return 'Kepala Sekolah';
    default: return role;
  }
};

export default function ProfilPage() {
  const { user, updateUser, changePassword } = useAuth();
  const [activeTab, setActiveTab] = useState<'profil' | 'password'>('profil');
  const [saved, setSaved] = useState('');
  const [error, setError] = useState('');

  const [name, setName] = useState(user?.name || '');
  const [nip, setNip] = useState(user?.nip || '');

  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass, setShowPass] = useState(false);

  if (!user) return null;

  const handleSaveProfil = () => {
    if (!name.trim()) { setError('Nama wajib diisi!'); return; }
    updateUser({ ...user, name: name.trim(), nip: nip.trim() });
    setSaved('Profil berhasil diperbarui');
    setError('');
    setTimeout(() => setSaved(''), 3000);
  };

  const handleChangePassword = () => {
    setError('');
    if (!oldPass || !newPass || !confirmPass) {
      setError('Semua field wajib diisi!');
      return;
    }
    if (newPass.length < 6) {
      setError('Password baru minimal 6 karakter!');
      return;
    }
    if (newPass !== confirmPass) {
      setError('Password baru dan konfirmasi tidak cocok!');
      return;
    }
    const success = changePassword(user.id, oldPass, newPass);
    if (!success) {
      setError('Password lama salah!');
      return;
    }
    setSaved('Password berhasil diubah');
    setOldPass('');
    setNewPass('');
    setConfirmPass('');
    setTimeout(() => setSaved(''), 3000);
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
          <User size={24} className="text-indigo-600" /> Profil Saya
        </h1>
        <p className="text-sm text-slate-500">Kelola informasi akun dan keamanan</p>
      </div>

      {saved && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2 text-emerald-700 text-sm">
          <CheckCircle size={16} /> {saved}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-red-700 text-sm">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Profile Card */}
      <div className="card !p-0 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-xl font-bold">
              {user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold">{user.name}</h2>
              <p className="text-indigo-200 text-sm">{roleLabel(user.role)}</p>
              {user.nip && <p className="text-indigo-300 text-xs mt-1">NIP: {user.nip}</p>}
            </div>
          </div>
        </div>

        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('profil')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'profil' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <User size={16} /> Informasi Profil
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'password' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Lock size={16} /> Ubah Password
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'profil' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label>
                <input value={name} onChange={e => setName(e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                <input value={user.username} disabled className="input-field !bg-slate-100 !text-slate-500" />
                <p className="text-xs text-slate-400 mt-1">Username tidak dapat diubah</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">NIP</label>
                <input value={nip} onChange={e => setNip(e.target.value)} className="input-field" placeholder="Nomor Induk Pegawai" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role / Peran</label>
                <div className="flex items-center gap-2">
                  <Shield size={16} className="text-indigo-500" />
                  <span className="text-sm font-medium text-slate-700">{roleLabel(user.role)}</span>
                  <span className="text-xs text-slate-400">(Tidak dapat diubah sendiri)</span>
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button onClick={handleSaveProfil} className="btn-primary"><Save size={16} /> Simpan Profil</button>
              </div>
            </div>
          )}

          {activeTab === 'password' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password Lama</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={oldPass}
                    onChange={e => setOldPass(e.target.value)}
                    className="input-field !pr-10"
                    placeholder="Masukkan password lama"
                  />
                  <button onClick={() => setShowPass(!showPass)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password Baru</label>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={newPass}
                  onChange={e => setNewPass(e.target.value)}
                  className="input-field"
                  placeholder="Minimal 6 karakter"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Konfirmasi Password Baru</label>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={confirmPass}
                  onChange={e => setConfirmPass(e.target.value)}
                  className="input-field"
                  placeholder="Ulangi password baru"
                />
              </div>
              <div className="flex justify-end pt-2">
                <button onClick={handleChangePassword} className="btn-primary"><Lock size={16} /> Ubah Password</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
