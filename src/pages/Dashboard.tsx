import { useSurat } from '../context/SuratContext';
import { useAuth } from '../context/AuthContext';
import { Mail, Send, FileCheck, Clock, AlertCircle, TrendingUp, Calendar, ArrowRight, GitBranch } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { suratMasuk, suratKeluar, disposisi } = useSurat();
  const { user, hasFeatureAccess } = useAuth();
  const navigate = useNavigate();

  const totalMasuk = suratMasuk.length;
  const totalKeluar = suratKeluar.length;
  const belumDibaca = suratMasuk.filter(s => s.status === 'belum_dibaca').length;
  const menungguTtd = suratKeluar.filter(s => s.status === 'menunggu_ttd').length;
  const suratDiproses = suratMasuk.filter(s => s.status === 'diproses').length;
  const suratSelesai = suratMasuk.filter(s => s.status === 'selesai').length;
  const disposisiPending = disposisi.filter(d => d.status === 'pending').length;
  const totalDisposisi = disposisi.length;

  const statusLabel = (status: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      belum_dibaca: { label: 'Belum Dibaca', cls: 'badge-danger' },
      dibaca: { label: 'Dibaca', cls: 'badge-info' },
      diproses: { label: 'Diproses', cls: 'badge-warning' },
      selesai: { label: 'Selesai', cls: 'badge-success' },
      draft: { label: 'Draft', cls: 'badge-neutral' },
      menunggu_ttd: { label: 'Menunggu TTD', cls: 'badge-warning' },
      ditandatangani: { label: 'Ditandatangani', cls: 'badge-success' },
      terkirim: { label: 'Terkirim', cls: 'badge-info' },
      pending: { label: 'Pending', cls: 'badge-warning' },
    };
    return map[status] || { label: status, cls: 'badge-neutral' };
  };

  const recentMasuk = [...suratMasuk].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
  const recentKeluar = [...suratKeluar].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
  const recentDisposisi = [...disposisi].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 3);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Selamat Pagi';
    if (h < 15) return 'Selamat Siang';
    if (h < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl p-5 sm:p-6 text-white">
        <h1 className="text-xl sm:text-2xl font-bold">{greeting()}, {user?.name?.split(',')[0]}! 👋</h1>
        <p className="text-indigo-100 text-sm mt-1">Berikut ringkasan administrasi surat hari ini di SMP Negeri 1 Genteng</p>
        <div className="flex items-center gap-2 mt-3 text-indigo-200 text-xs">
          <Calendar size={14} />
          {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="card cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/surat-masuk')}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Surat Masuk</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{totalMasuk}</p>
              <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1"><TrendingUp size={12} /> Total</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Mail size={20} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/surat-keluar')}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Surat Keluar</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{totalKeluar}</p>
              <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1"><TrendingUp size={12} /> Total</p>
            </div>
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Send size={20} className="text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="card cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/surat-masuk')}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Belum Dibaca</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{belumDibaca}</p>
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={12} /> Tindakan</p>
            </div>
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertCircle size={20} className="text-red-600" />
            </div>
          </div>
        </div>

        <div className="card cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/surat-keluar')}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Menunggu TTD</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{menungguTtd}</p>
              <p className="text-xs text-amber-500 mt-1 flex items-center gap-1"><Clock size={12} /> Perlu TTD</p>
            </div>
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Clock size={20} className="text-amber-600" />
            </div>
          </div>
        </div>

        <div className="card cursor-pointer hover:shadow-md transition-shadow col-span-2 lg:col-span-1" onClick={() => navigate('/disposisi')}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Disposisi</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{totalDisposisi}</p>
              <p className="text-xs text-purple-500 mt-1 flex items-center gap-1"><GitBranch size={12} /> {disposisiPending} pending</p>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <GitBranch size={20} className="text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="card">
        <h3 className="text-sm font-semibold text-slate-800 mb-4">Status Surat Masuk</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Belum Dibaca', count: belumDibaca, color: 'bg-red-500', total: totalMasuk },
            { label: 'Sudah Dibaca', count: suratMasuk.filter(s => s.status === 'dibaca').length, color: 'bg-blue-500', total: totalMasuk },
            { label: 'Diproses', count: suratDiproses, color: 'bg-amber-500', total: totalMasuk },
            { label: 'Selesai', count: suratSelesai, color: 'bg-emerald-500', total: totalMasuk },
          ].map((item, i) => (
            <div key={i} className="text-center">
              <div className="relative w-16 h-16 mx-auto mb-2">
                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none" stroke="currentColor"
                    className={item.color.replace('bg-', 'text-')}
                    strokeWidth="3"
                    strokeDasharray={`${item.total > 0 ? (item.count / item.total) * 100 : 0}, 100`}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">{item.count}</span>
              </div>
              <p className="text-xs text-slate-600">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Letters & Disposisi */}
      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Recent Surat Masuk */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-800">Surat Masuk Terbaru</h3>
            <button onClick={() => navigate('/surat-masuk')} className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
              Semua <ArrowRight size={12} />
            </button>
          </div>
          <div className="space-y-3">
            {recentMasuk.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">Belum ada surat masuk</p>
            ) : recentMasuk.map(s => (
              <div key={s.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Mail size={14} className="text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{s.perihal}</p>
                  <p className="text-xs text-slate-500 truncate">{s.pengirim}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-400">{new Date(s.tanggalTerima).toLocaleDateString('id-ID')}</span>
                    <span className={statusLabel(s.status).cls}>{statusLabel(s.status).label}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Surat Keluar */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-800">Surat Keluar Terbaru</h3>
            <button onClick={() => navigate('/surat-keluar')} className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
              Semua <ArrowRight size={12} />
            </button>
          </div>
          <div className="space-y-3">
            {recentKeluar.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">Belum ada surat keluar</p>
            ) : recentKeluar.map(s => (
              <div key={s.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Send size={14} className="text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{s.perihal}</p>
                  <p className="text-xs text-slate-500 truncate">Kepada: {s.tujuan}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-400">{new Date(s.tanggalSurat).toLocaleDateString('id-ID')}</span>
                    <span className={statusLabel(s.status).cls}>{statusLabel(s.status).label}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Disposisi */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-800">Disposisi Terbaru</h3>
            <button onClick={() => navigate('/disposisi')} className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
              Semua <ArrowRight size={12} />
            </button>
          </div>
          <div className="space-y-3">
            {recentDisposisi.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">Belum ada disposisi</p>
            ) : recentDisposisi.map(d => (
              <div key={d.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <GitBranch size={14} className="text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{d.perihal}</p>
                  <p className="text-xs text-slate-500 truncate">Ke: {d.tujuanDisposisi.join(', ')}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`${d.sifat === 'segera' ? 'badge-danger' : d.sifat === 'penting' ? 'badge-warning' : 'badge-info'}`}>{d.sifat}</span>
                    <span className={statusLabel(d.status).cls}>{statusLabel(d.status).label}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      {(hasFeatureAccess('buat_surat') || hasFeatureAccess('disposisi')) && (
        <div className="card">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Aksi Cepat</h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <button onClick={() => navigate('/surat-masuk')} className="p-4 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors text-center group">
              <Mail size={24} className="text-blue-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-xs font-medium text-blue-700">Surat Masuk</p>
            </button>
            <button onClick={() => navigate('/buat-surat')} className="p-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 transition-colors text-center group">
              <FileCheck size={24} className="text-emerald-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-xs font-medium text-emerald-700">Buat Surat</p>
            </button>
            <button onClick={() => navigate('/disposisi')} className="p-4 rounded-xl bg-purple-50 hover:bg-purple-100 transition-colors text-center group">
              <GitBranch size={24} className="text-purple-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-xs font-medium text-purple-700">Disposisi</p>
            </button>
            <button onClick={() => navigate('/laporan')} className="p-4 rounded-xl bg-orange-50 hover:bg-orange-100 transition-colors text-center group">
              <TrendingUp size={24} className="text-orange-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-xs font-medium text-orange-700">Laporan</p>
            </button>
            <button onClick={() => navigate('/surat-keluar')} className="p-4 rounded-xl bg-amber-50 hover:bg-amber-100 transition-colors text-center group">
              <Send size={24} className="text-amber-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-xs font-medium text-amber-700">Surat Keluar</p>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
