import { useState } from 'react';
import { useSurat } from '../context/SuratContext';
import { useAuth } from '../context/AuthContext';
import { Disposisi, TUJUAN_DISPOSISI } from '../types';
import {
  Plus, Search, Edit2, Trash2, X, Eye, FileText,
  CheckCircle, Clock, AlertTriangle, ArrowRight, Printer, GitBranch
} from 'lucide-react';

export default function DisposisiPage() {
  const { disposisi, suratMasuk, addDisposisi, updateDisposisi, deleteDisposisi } = useSurat();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSifat, setFilterSifat] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<Disposisi | null>(null);
  const [editData, setEditData] = useState<Disposisi | null>(null);
  const [showSelectSurat, setShowSelectSurat] = useState(false);

  const canEdit = user?.role === 'admin' || user?.role === 'operator';

  const emptyForm: Disposisi = {
    id: '', suratMasukId: '', nomorSurat: '', perihal: '', pengirim: '',
    tujuanDisposisi: [], isiDisposisi: '', sifat: 'biasa',
    batasWaktu: '', catatan: '', status: 'pending',
    createdAt: '', createdBy: user?.username || ''
  };

  const [form, setForm] = useState<Disposisi>(emptyForm);

  const filtered = disposisi.filter(d => {
    const matchSearch = d.perihal.toLowerCase().includes(search.toLowerCase()) ||
      d.nomorSurat.toLowerCase().includes(search.toLowerCase()) ||
      d.pengirim.toLowerCase().includes(search.toLowerCase()) ||
      d.tujuanDisposisi.join(', ').toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || d.status === filterStatus;
    const matchSifat = !filterSifat || d.sifat === filterSifat;
    return matchSearch && matchStatus && matchSifat;
  });

  const openAdd = () => {
    setForm(emptyForm);
    setEditData(null);
    setShowSelectSurat(true);
  };

  const selectSuratForDisposisi = (sm: typeof suratMasuk[0]) => {
    setForm({
      ...emptyForm,
      suratMasukId: sm.id,
      nomorSurat: sm.nomorSurat,
      perihal: sm.perihal,
      pengirim: sm.pengirim,
    });
    setShowSelectSurat(false);
    setShowModal(true);
  };

  const openEdit = (d: Disposisi) => {
    setForm({ ...d });
    setEditData(d);
    setShowModal(true);
  };

  const toggleTujuan = (t: string) => {
    setForm(prev => ({
      ...prev,
      tujuanDisposisi: prev.tujuanDisposisi.includes(t)
        ? prev.tujuanDisposisi.filter(x => x !== t)
        : [...prev.tujuanDisposisi, t]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.tujuanDisposisi.length === 0) {
      alert('Pilih minimal satu tujuan disposisi');
      return;
    }
    if (editData) {
      updateDisposisi({ ...form });
    } else {
      addDisposisi({
        ...form,
        id: 'dsp' + Date.now(),
        createdAt: new Date().toISOString(),
        createdBy: user?.username || ''
      });
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Yakin ingin menghapus disposisi ini?')) deleteDisposisi(id);
  };

  const handleStatusChange = (d: Disposisi, status: Disposisi['status']) => {
    updateDisposisi({ ...d, status });
  };

  const printDisposisi = (d: Disposisi) => {
    const sm = suratMasuk.find(s => s.id === d.suratMasukId);
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>Lembar Disposisi</title>
      <style>
        body{font-family:Arial,sans-serif;padding:30px;font-size:11pt;color:#333}
        h2{text-align:center;margin:0 0 5px;font-size:14pt}
        h3{text-align:center;margin:0 0 3px;font-size:11pt;font-weight:normal}
        .header{text-align:center;border-bottom:3px double #333;padding-bottom:10px;margin-bottom:20px}
        table{width:100%;border-collapse:collapse;margin:10px 0}
        td,th{border:1px solid #555;padding:8px 10px;text-align:left;vertical-align:top}
        th{background:#f0f0f0;font-weight:600;width:150px}
        .badge{display:inline-block;padding:2px 10px;border-radius:4px;font-size:9pt;font-weight:600}
        .badge-segera{background:#fee2e2;color:#991b1b}
        .badge-penting{background:#fef3c7;color:#92400e}
        .badge-biasa{background:#e0f2fe;color:#075985}
        .badge-rahasia{background:#f3e8ff;color:#6b21a8}
        .tujuan-list{margin:0;padding-left:20px}
        .tujuan-list li{margin:4px 0}
        .footer{margin-top:30px;display:flex;justify-content:flex-end}
        .ttd{text-align:center;width:250px}
      </style>
    </head><body>
      <div class="header">
        <h2>SMP NEGERI 1 GENTENG</h2>
        <h3>LEMBAR DISPOSISI</h3>
      </div>
      <table>
        <tr><th>Nomor Surat</th><td>${d.nomorSurat}</td></tr>
        <tr><th>Tanggal Surat</th><td>${sm ? new Date(sm.tanggalSurat).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</td></tr>
        <tr><th>Pengirim</th><td>${d.pengirim}</td></tr>
        <tr><th>Perihal</th><td>${d.perihal}</td></tr>
        <tr><th>Sifat</th><td><span class="badge badge-${d.sifat}">${d.sifat.toUpperCase()}</span></td></tr>
        <tr><th>Batas Waktu</th><td>${d.batasWaktu ? new Date(d.batasWaktu).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</td></tr>
        <tr><th>Disposisi Kepada</th><td><ol class="tujuan-list">${d.tujuanDisposisi.map(t => `<li>${t}</li>`).join('')}</ol></td></tr>
        <tr><th>Isi Disposisi</th><td>${d.isiDisposisi}</td></tr>
        <tr><th>Catatan</th><td>${d.catatan || '-'}</td></tr>
        <tr><th>Status</th><td>${d.status.replace('_', ' ').toUpperCase()}</td></tr>
      </table>
      <div class="footer">
        <div class="ttd">
          <p>Genteng, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          <p><strong>Kepala Sekolah,</strong></p>
          <br/><br/><br/>
          <p style="text-decoration:underline;font-weight:bold">Drs. Ahmad Supriyadi, M.Pd</p>
          <p>NIP. 196805101993031005</p>
        </div>
      </div>
    </body></html>`);
    w.document.close();
    w.print();
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; cls: string; icon: typeof Clock }> = {
      pending: { label: 'Pending', cls: 'badge-warning', icon: Clock },
      diproses: { label: 'Diproses', cls: 'badge-info', icon: ArrowRight },
      selesai: { label: 'Selesai', cls: 'badge-success', icon: CheckCircle },
    };
    return map[status] || { label: status, cls: 'badge-neutral', icon: Clock };
  };

  const sifatBadge = (sifat: string) => {
    const map: Record<string, string> = {
      biasa: 'badge-info',
      penting: 'badge-warning',
      segera: 'badge-danger',
      rahasia: 'bg-purple-100 text-purple-700 px-2.5 py-0.5 rounded-full text-xs font-medium',
    };
    return map[sifat] || 'badge-neutral';
  };

  const pendingCount = disposisi.filter(d => d.status === 'pending').length;
  const diprosesCount = disposisi.filter(d => d.status === 'diproses').length;
  const selesaiCount = disposisi.filter(d => d.status === 'selesai').length;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <GitBranch size={24} className="text-indigo-600" /> Disposisi Surat
          </h1>
          <p className="text-sm text-slate-500">Kelola disposisi surat masuk SMP Negeri 1 Genteng</p>
        </div>
        {canEdit && (
          <button onClick={openAdd} className="btn-primary self-start">
            <Plus size={16} /> Buat Disposisi
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card !p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Clock size={20} className="text-amber-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Pending</p>
            <p className="text-xl font-bold text-slate-800">{pendingCount}</p>
          </div>
        </div>
        <div className="card !p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <ArrowRight size={20} className="text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Diproses</p>
            <p className="text-xl font-bold text-slate-800">{diprosesCount}</p>
          </div>
        </div>
        <div className="card !p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <CheckCircle size={20} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Selesai</p>
            <p className="text-xl font-bold text-slate-800">{selesaiCount}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Cari disposisi..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-9" />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input-field">
            <option value="">Semua Status</option>
            <option value="pending">Pending</option>
            <option value="diproses">Diproses</option>
            <option value="selesai">Selesai</option>
          </select>
          <select value={filterSifat} onChange={e => setFilterSifat(e.target.value)} className="input-field">
            <option value="">Semua Sifat</option>
            <option value="biasa">Biasa</option>
            <option value="penting">Penting</option>
            <option value="segera">Segera</option>
            <option value="rahasia">Rahasia</option>
          </select>
        </div>
      </div>

      {/* Disposisi Cards */}
      <div className="grid gap-4">
        {filtered.length === 0 ? (
          <div className="card text-center py-12">
            <GitBranch size={40} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400">Belum ada disposisi</p>
          </div>
        ) : filtered.map(d => (
          <div key={d.id} className="card hover:shadow-md transition-shadow">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className={sifatBadge(d.sifat)}>{d.sifat.toUpperCase()}</span>
                  <span className={statusBadge(d.status).cls}>{statusBadge(d.status).label}</span>
                  {d.batasWaktu && new Date(d.batasWaktu) < new Date() && d.status !== 'selesai' && (
                    <span className="badge-danger flex items-center gap-1"><AlertTriangle size={10} /> Overdue</span>
                  )}
                </div>
                <h3 className="font-semibold text-slate-800 text-sm">{d.perihal}</h3>
                <p className="text-xs text-slate-500 mt-0.5">No. {d.nomorSurat} — dari {d.pengirim}</p>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="text-xs text-slate-500">Disposisi ke:</span>
                  {d.tujuanDisposisi.map((t, i) => (
                    <span key={i} className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-xs font-medium">{t}</span>
                  ))}
                </div>

                <p className="text-sm text-slate-600 mt-2 bg-slate-50 p-2 rounded-lg">{d.isiDisposisi}</p>

                {d.batasWaktu && (
                  <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                    <Clock size={11} /> Batas waktu: {new Date(d.batasWaktu).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                )}
              </div>

              {canEdit && (
                <div className="flex sm:flex-col gap-1.5 flex-shrink-0">
                  <button onClick={() => { setPreviewData(d); setShowPreview(true); }} className="p-2 rounded-lg hover:bg-blue-50 text-blue-600" title="Detail">
                    <Eye size={15} />
                  </button>
                  <button onClick={() => printDisposisi(d)} className="p-2 rounded-lg hover:bg-purple-50 text-purple-600" title="Cetak">
                    <Printer size={15} />
                  </button>
                  <button onClick={() => openEdit(d)} className="p-2 rounded-lg hover:bg-amber-50 text-amber-600" title="Edit">
                    <Edit2 size={15} />
                  </button>
                  {d.status === 'pending' && (
                    <button onClick={() => handleStatusChange(d, 'diproses')} className="p-2 rounded-lg hover:bg-blue-50 text-blue-600" title="Proses">
                      <ArrowRight size={15} />
                    </button>
                  )}
                  {d.status === 'diproses' && (
                    <button onClick={() => handleStatusChange(d, 'selesai')} className="p-2 rounded-lg hover:bg-emerald-50 text-emerald-600" title="Selesai">
                      <CheckCircle size={15} />
                    </button>
                  )}
                  <button onClick={() => handleDelete(d.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-600" title="Hapus">
                    <Trash2 size={15} />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Select Surat Modal */}
      {showSelectSurat && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl my-8 shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-semibold">Pilih Surat Masuk</h2>
                <p className="text-xs text-slate-500">Pilih surat masuk untuk dibuat disposisi</p>
              </div>
              <button onClick={() => setShowSelectSurat(false)} className="p-2 rounded-lg hover:bg-slate-100"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-2 max-h-[60vh] overflow-y-auto">
              {suratMasuk.length === 0 ? (
                <p className="text-center text-slate-400 py-8">Belum ada surat masuk</p>
              ) : suratMasuk.map(sm => (
                <button
                  key={sm.id}
                  onClick={() => selectSuratForDisposisi(sm)}
                  className="w-full text-left p-4 border border-slate-200 rounded-xl hover:bg-indigo-50 hover:border-indigo-300 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText size={14} className="text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800">{sm.perihal}</p>
                      <p className="text-xs text-slate-500">{sm.nomorSurat} — {sm.pengirim}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{new Date(sm.tanggalTerima).toLocaleDateString('id-ID')}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Disposisi Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl my-8 shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-semibold">{editData ? 'Edit Disposisi' : 'Buat Disposisi Baru'}</h2>
                <p className="text-xs text-slate-500">Surat: {form.nomorSurat} — {form.perihal}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-slate-100"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs text-slate-500">Surat dari</p>
                <p className="text-sm font-medium text-slate-800">{form.pengirim}</p>
                <p className="text-xs text-slate-500 mt-1">Perihal: {form.perihal}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tujuan Disposisi *</label>
                <div className="grid grid-cols-2 gap-2">
                  {TUJUAN_DISPOSISI.map(t => (
                    <label key={t} className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors text-sm ${form.tujuanDisposisi.includes(t)
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                      : 'border-slate-200 hover:bg-slate-50'}`}>
                      <input
                        type="checkbox"
                        checked={form.tujuanDisposisi.includes(t)}
                        onChange={() => toggleTujuan(t)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      {t}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Isi Disposisi *</label>
                <textarea
                  required
                  value={form.isiDisposisi}
                  onChange={e => setForm(p => ({ ...p, isiDisposisi: e.target.value }))}
                  className="input-field min-h-[100px]"
                  placeholder="Instruksi/arahan terkait surat..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Sifat Disposisi</label>
                  <select value={form.sifat} onChange={e => setForm(p => ({ ...p, sifat: e.target.value as Disposisi['sifat'] }))} className="input-field">
                    <option value="biasa">Biasa</option>
                    <option value="penting">Penting</option>
                    <option value="segera">Segera</option>
                    <option value="rahasia">Rahasia</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Batas Waktu</label>
                  <input type="date" value={form.batasWaktu} onChange={e => setForm(p => ({ ...p, batasWaktu: e.target.value }))} className="input-field" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as Disposisi['status'] }))} className="input-field">
                  <option value="pending">Pending</option>
                  <option value="diproses">Diproses</option>
                  <option value="selesai">Selesai</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Catatan</label>
                <textarea value={form.catatan} onChange={e => setForm(p => ({ ...p, catatan: e.target.value }))} className="input-field" rows={2} placeholder="Catatan tambahan..." />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Batal</button>
                <button type="submit" className="btn-primary">{editData ? 'Simpan Perubahan' : 'Buat Disposisi'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && previewData && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl my-8 shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h2 className="text-lg font-semibold">Detail Disposisi</h2>
              <button onClick={() => setShowPreview(false)} className="p-2 rounded-lg hover:bg-slate-100"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><p className="text-xs text-slate-500">Nomor Surat</p><p className="font-medium text-sm">{previewData.nomorSurat}</p></div>
                <div><p className="text-xs text-slate-500">Pengirim</p><p className="font-medium text-sm">{previewData.pengirim}</p></div>
                <div className="sm:col-span-2"><p className="text-xs text-slate-500">Perihal</p><p className="font-medium text-sm">{previewData.perihal}</p></div>
                <div>
                  <p className="text-xs text-slate-500">Sifat</p>
                  <span className={sifatBadge(previewData.sifat)}>{previewData.sifat.toUpperCase()}</span>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Status</p>
                  <span className={statusBadge(previewData.status).cls}>{statusBadge(previewData.status).label}</span>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Batas Waktu</p>
                  <p className="font-medium text-sm">{previewData.batasWaktu ? new Date(previewData.batasWaktu).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Dibuat oleh</p>
                  <p className="font-medium text-sm">{previewData.createdBy}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-500 mb-2">Disposisi Kepada</p>
                <div className="flex flex-wrap gap-1.5">
                  {previewData.tujuanDisposisi.map((t, i) => (
                    <span key={i} className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg text-xs font-medium">{t}</span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-500 mb-1">Isi Disposisi</p>
                <div className="text-sm bg-slate-50 p-4 rounded-lg">{previewData.isiDisposisi}</div>
              </div>

              {previewData.catatan && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Catatan</p>
                  <div className="text-sm bg-slate-50 p-3 rounded-lg">{previewData.catatan}</div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => printDisposisi(previewData)} className="btn-primary"><Printer size={16} /> Cetak Disposisi</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
