import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { RolePermissions, FeatureKey, ALL_FEATURES, UserRole } from '../types';
import {
  KeyRound, Save, CheckCircle, Shield, LayoutDashboard, Mail, Send,
  GitBranch, FilePlus, FileBarChart, Settings, RotateCcw
} from 'lucide-react';

const featureIcons: Record<FeatureKey, React.ComponentType<{size?: number; className?: string}>> = {
  dashboard: LayoutDashboard,
  surat_masuk: Mail,
  surat_keluar: Send,
  disposisi: GitBranch,
  buat_surat: FilePlus,
  laporan: FileBarChart,
  pengaturan: Settings,
};

const roles: { key: UserRole; label: string; color: string; bgColor: string }[] = [
  { key: 'admin', label: 'Administrator', color: 'text-red-700', bgColor: 'bg-red-50 border-red-200' },
  { key: 'operator', label: 'Operator', color: 'text-blue-700', bgColor: 'bg-blue-50 border-blue-200' },
  { key: 'kepala_sekolah', label: 'Kepala Sekolah', color: 'text-emerald-700', bgColor: 'bg-emerald-50 border-emerald-200' },
];

const DEFAULT_PERMS: RolePermissions = {
  admin: ['dashboard', 'surat_masuk', 'surat_keluar', 'disposisi', 'buat_surat', 'laporan', 'pengaturan'],
  operator: ['dashboard', 'surat_masuk', 'surat_keluar', 'disposisi', 'buat_surat', 'laporan'],
  kepala_sekolah: ['dashboard', 'surat_masuk', 'surat_keluar', 'disposisi', 'laporan'],
};

export default function HakAksesPage() {
  const { permissions, updatePermissions } = useAuth();
  const [form, setForm] = useState<RolePermissions>({ ...permissions });
  const [saved, setSaved] = useState(false);

  const toggleFeature = (role: UserRole, feature: FeatureKey) => {
    // Admin must always have pengaturan
    if (role === 'admin' && feature === 'pengaturan') return;
    // Everyone must have dashboard
    if (feature === 'dashboard') return;

    setForm(prev => {
      const current = [...prev[role]];
      const idx = current.indexOf(feature);
      if (idx >= 0) {
        current.splice(idx, 1);
      } else {
        current.push(feature);
      }
      return { ...prev, [role]: current };
    });
  };

  const handleSave = () => {
    updatePermissions(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    if (confirm('Reset semua hak akses ke pengaturan default?')) {
      setForm({ ...DEFAULT_PERMS });
    }
  };

  const selectAll = (role: UserRole) => {
    setForm(prev => ({
      ...prev,
      [role]: ALL_FEATURES.map(f => f.key)
    }));
  };

  const deselectAll = (role: UserRole) => {
    // Keep dashboard & pengaturan for admin
    const mandatory: FeatureKey[] = ['dashboard'];
    if (role === 'admin') mandatory.push('pengaturan');
    setForm(prev => ({
      ...prev,
      [role]: mandatory
    }));
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <KeyRound size={24} className="text-indigo-600" /> Hak Akses & Izin Fitur
          </h1>
          <p className="text-sm text-slate-500">Atur fitur yang dapat diakses oleh setiap peran pengguna</p>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="text-sm text-emerald-600 font-medium bg-emerald-50 px-3 py-1.5 rounded-lg flex items-center gap-1">
              <CheckCircle size={14} /> Tersimpan!
            </span>
          )}
          <button onClick={handleReset} className="btn-secondary"><RotateCcw size={16} /> Reset Default</button>
          <button onClick={handleSave} className="btn-primary"><Save size={16} /> Simpan</button>
        </div>
      </div>

      {/* Info */}
      <div className="card !p-4 bg-amber-50 border-amber-200">
        <div className="flex items-start gap-3">
          <Shield size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-semibold mb-1">Informasi Hak Akses</p>
            <ul className="text-xs space-y-0.5 text-amber-700">
              <li>• <strong>Dashboard</strong> selalu aktif untuk semua role (tidak bisa dinonaktifkan)</li>
              <li>• <strong>Pengaturan</strong> selalu aktif untuk Admin (tidak bisa dinonaktifkan)</li>
              <li>• Perubahan hak akses berlaku saat pengguna login kembali</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Permission Matrix - Card Style */}
      <div className="grid lg:grid-cols-3 gap-4">
        {roles.map(role => (
          <div key={role.key} className={`card !p-0 overflow-hidden border-2 ${form[role.key].length === ALL_FEATURES.length ? role.bgColor : 'border-slate-200'}`}>
            <div className={`p-4 border-b ${role.bgColor}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield size={20} className={role.color} />
                  <div>
                    <h3 className={`font-bold text-sm ${role.color}`}>{role.label}</h3>
                    <p className="text-[10px] text-slate-500">{form[role.key].length} / {ALL_FEATURES.length} fitur</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => selectAll(role.key)} className="text-[10px] px-2 py-1 rounded bg-white/70 hover:bg-white text-slate-600 font-medium">
                    Semua
                  </button>
                  <button onClick={() => deselectAll(role.key)} className="text-[10px] px-2 py-1 rounded bg-white/70 hover:bg-white text-slate-600 font-medium">
                    Minimal
                  </button>
                </div>
              </div>
              {/* Progress bar */}
              <div className="mt-2 bg-white/50 rounded-full h-1.5">
                <div
                  className="h-1.5 rounded-full bg-indigo-500 transition-all"
                  style={{ width: `${(form[role.key].length / ALL_FEATURES.length) * 100}%` }}
                />
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {ALL_FEATURES.map(feature => {
                const Icon = featureIcons[feature.key];
                const isEnabled = form[role.key].includes(feature.key);
                const isLocked = feature.key === 'dashboard' ||
                  (role.key === 'admin' && feature.key === 'pengaturan');

                return (
                  <label
                    key={feature.key}
                    className={`flex items-center gap-3 px-4 py-3 transition-colors cursor-pointer ${
                      isLocked ? 'opacity-60 cursor-not-allowed' : 'hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={() => toggleFeature(role.key, feature.key)}
                      disabled={isLocked}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                    />
                    <Icon size={16} className={isEnabled ? 'text-indigo-500' : 'text-slate-300'} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${isEnabled ? 'text-slate-800' : 'text-slate-400'}`}>
                        {feature.label}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">{feature.description}</p>
                    </div>
                    {isLocked && (
                      <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Wajib</span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Matrix Table View */}
      <div className="card !p-0 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <h3 className="text-sm font-semibold text-slate-700">Matriks Hak Akses</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Fitur</th>
                {roles.map(r => (
                  <th key={r.key} className="text-center px-4 py-3 font-semibold">
                    <span className={r.color}>{r.label}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ALL_FEATURES.map(feature => {
                const Icon = featureIcons[feature.key];
                return (
                  <tr key={feature.key} className="border-b border-slate-100">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Icon size={16} className="text-slate-400" />
                        <span className="font-medium">{feature.label}</span>
                      </div>
                    </td>
                    {roles.map(role => {
                      const isEnabled = form[role.key].includes(feature.key);
                      return (
                        <td key={role.key} className="text-center px-4 py-3">
                          {isEnabled ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 text-emerald-600">
                              <CheckCircle size={16} />
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-slate-300">
                              ✕
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
