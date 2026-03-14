import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, UserRole } from '../types';
import {
  Users, Plus, Edit2, Trash2, X, Save, Eye, EyeOff,
  CheckCircle, Shield, UserCheck, UserX, Search
} from 'lucide-react';

const roleOptions: { value: UserRole; label: string; color: string }[] = [
  { value: 'admin', label: 'Administrator', color: 'badge-danger' },
  { value: 'operator', label: 'Operator', color: 'badge-info' },
  { value: 'kepala_sekolah', label: 'Kepala Sekolah', color: 'badge-success' },
];

export default function ManajemenAkunPage() {
  const { users, user: currentUser, addUser, updateUser, deleteUser } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<string>('');
  const [showPass, setShowPass] = useState(false);
  const [saved, setSaved] = useState('');
  const [form, setForm] = useState<User>({
    id: '', username: '', password: '', name: '', role: 'operator', nip: '', active: true
  });
  const [confirmPassword, setConfirmPassword] = useState('');

  const openAdd = () => {
    setForm({ id: '', username: '', password: '', name: '', role: 'operator', nip: '', active: true });
    setConfirmPassword('');
    setEditMode(false);
    setShowPass(false);
    setShowModal(true);
  };

  const openEdit = (u: User) => {
    setForm({ ...u });
    setConfirmPassword(u.password);
    setEditMode(true);
    setShowPass(false);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.username.trim() || !form.name.trim()) {
      alert('Username dan nama wajib diisi!');
      return;
    }
    if (!editMode && !form.password) {
      alert('Password wajib diisi!');
      return;
    }
    if (form.password !== confirmPassword) {
      alert('Password dan konfirmasi password tidak cocok!');
      return;
    }
    // Check duplicate username
    const duplicate = users.find(u => u.username === form.username && u.id !== form.id);
    if (duplicate) {
      alert('Username sudah digunakan!');
      return;
    }

    if (editMode) {
      updateUser(form);
      setSaved('Akun berhasil diperbarui');
    } else {
      addUser({ ...form, id: 'usr' + Date.now() });
      setSaved('Akun berhasil ditambahkan');
    }
    setShowModal(false);
    setTimeout(() => setSaved(''), 3000);
  };

  const handleDelete = (u: User) => {
    if (u.id === currentUser?.id) {
      alert('Tidak bisa menghapus akun yang sedang login!');
      return;
    }
    if (confirm(`Yakin hapus akun "${u.name}" (${u.username})?`)) {
      deleteUser(u.id);
      setSaved('Akun berhasil dihapus');
      setTimeout(() => setSaved(''), 3000);
    }
  };

  const toggleActive = (u: User) => {
    if (u.id === currentUser?.id) {
      alert('Tidak bisa menonaktifkan akun sendiri!');
      return;
    }
    updateUser({ ...u, active: !u.active });
    setSaved(`Akun ${!u.active ? 'diaktifkan' : 'dinonaktifkan'}`);
    setTimeout(() => setSaved(''), 3000);
  };

  const filteredUsers = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      (u.nip || '').includes(search);
    const matchRole = !filterRole || u.role === filterRole;
    return matchSearch && matchRole;
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users size={24} className="text-indigo-600" /> Manajemen Akun
          </h1>
          <p className="text-sm text-slate-500">Kelola akun pengguna sistem surat menyurat</p>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="text-sm text-emerald-600 font-medium bg-emerald-50 px-3 py-1.5 rounded-lg flex items-center gap-1">
              <CheckCircle size={14} /> {saved}
            </span>
          )}
          <button onClick={openAdd} className="btn-primary">
            <Plus size={16} /> Tambah Akun
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card !p-4">
          <p className="text-xs text-slate-500">Total Akun</p>
          <p className="text-2xl font-bold text-slate-800">{users.length}</p>
        </div>
        <div className="card !p-4">
          <p className="text-xs text-slate-500">Admin</p>
          <p className="text-2xl font-bold text-red-600">{users.filter(u => u.role === 'admin').length}</p>
        </div>
        <div className="card !p-4">
          <p className="text-xs text-slate-500">Operator</p>
          <p className="text-2xl font-bold text-blue-600">{users.filter(u => u.role === 'operator').length}</p>
        </div>
        <div className="card !p-4">
          <p className="text-xs text-slate-500">Aktif</p>
          <p className="text-2xl font-bold text-emerald-600">{users.filter(u => u.active).length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card !p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari nama, username, NIP..."
              className="input-field !pl-9"
            />
          </div>
          <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="input-field w-full sm:w-48">
            <option value="">Semua Role</option>
            {roleOptions.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* User Table */}
      <div className="card !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 font-semibold text-slate-600">#</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Nama</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Username</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden md:table-cell">NIP</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Role</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
                <th className="text-center px-4 py-3 font-semibold text-slate-600">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-400">Tidak ada data pengguna</td></tr>
              ) : filteredUsers.map((u, idx) => (
                <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-slate-500">{idx + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${
                        u.role === 'admin' ? 'bg-red-100 text-red-600' :
                        u.role === 'operator' ? 'bg-blue-100 text-blue-600' :
                        'bg-emerald-100 text-emerald-600'
                      }`}>
                        {u.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{u.name}</p>
                        {u.id === currentUser?.id && (
                          <span className="text-[10px] text-indigo-500 font-medium">(Anda)</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">{u.username}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 hidden md:table-cell">{u.nip || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={roleOptions.find(r => r.value === u.role)?.color || 'badge-neutral'}>
                      {roleOptions.find(r => r.value === u.role)?.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(u)}
                      className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
                        u.active
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {u.active ? <UserCheck size={12} /> : <UserX size={12} />}
                      {u.active ? 'Aktif' : 'Nonaktif'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openEdit(u)} className="p-2 rounded-lg hover:bg-amber-50 text-amber-600 transition-colors" title="Edit">
                        <Edit2 size={15} />
                      </button>
                      {u.id !== currentUser?.id && (
                        <button onClick={() => handleDelete(u)} className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors" title="Hapus">
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Shield size={20} className="text-indigo-600" />
                {editMode ? 'Edit Akun' : 'Tambah Akun Baru'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-slate-100"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap *</label>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="input-field" placeholder="Nama lengkap" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Username *</label>
                  <input value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} className="input-field" placeholder="Username login" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">NIP</label>
                  <input value={form.nip || ''} onChange={e => setForm(p => ({ ...p, nip: e.target.value }))} className="input-field" placeholder="NIP (opsional)" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Password *</label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={form.password}
                      onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                      className="input-field !pr-10"
                      placeholder="Password"
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600">
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Konfirmasi Password *</label>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="input-field"
                    placeholder="Ulangi password"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role / Peran *</label>
                <div className="grid grid-cols-3 gap-2">
                  {roleOptions.map(r => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setForm(p => ({ ...p, role: r.value }))}
                      className={`px-3 py-3 rounded-xl border-2 text-center transition-all text-sm font-medium ${
                        form.role === r.value
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 hover:border-slate-300 text-slate-600'
                      }`}
                    >
                      <Shield size={18} className="mx-auto mb-1" />
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={e => setForm(p => ({ ...p, active: e.target.checked }))}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-slate-700">Akun Aktif</span>
                </label>
                <span className="text-xs text-slate-500">(Akun nonaktif tidak bisa login)</span>
              </div>
            </div>
            <div className="flex justify-end gap-2 p-5 border-t border-slate-200">
              <button onClick={() => setShowModal(false)} className="btn-secondary">Batal</button>
              <button onClick={handleSave} className="btn-primary"><Save size={16} /> {editMode ? 'Simpan Perubahan' : 'Buat Akun'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
