import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSurat } from '../context/SuratContext';
import { useAuth } from '../context/AuthContext';
import { SuratKeluar, KATEGORI_SURAT } from '../types';
import { Plus, Search, Edit2, Trash2, X, Eye, FileText, CheckCircle, Printer } from 'lucide-react';

export default function SuratKeluarPage() {
  const { suratKeluar, updateSuratKeluar, deleteSuratKeluar } = useSurat();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterKategori, setFilterKategori] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<SuratKeluar | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState<SuratKeluar | null>(null);

  const canEdit = user?.role === 'admin' || user?.role === 'operator';
  const canSign = user?.role === 'kepala_sekolah' || user?.role === 'admin';

  const filtered = suratKeluar.filter(s => {
    const matchSearch = s.perihal.toLowerCase().includes(search.toLowerCase()) ||
      s.tujuan.toLowerCase().includes(search.toLowerCase()) ||
      s.nomorSurat.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || s.status === filterStatus;
    const matchKategori = !filterKategori || s.kategori === filterKategori;
    return matchSearch && matchStatus && matchKategori;
  });

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      draft: { label: 'Draft', cls: 'badge-neutral' },
      menunggu_ttd: { label: 'Menunggu TTD', cls: 'badge-warning' },
      ditandatangani: { label: 'Ditandatangani', cls: 'badge-success' },
      terkirim: { label: 'Terkirim', cls: 'badge-info' },
    };
    return map[status] || { label: status, cls: 'badge-neutral' };
  };

  const handleDelete = (id: string) => {
    if (confirm('Yakin ingin menghapus surat ini?')) deleteSuratKeluar(id);
  };

  const handleSign = (s: SuratKeluar) => {
    updateSuratKeluar({ ...s, status: 'ditandatangani' });
  };

  const handleSendUpdate = (s: SuratKeluar) => {
    updateSuratKeluar({ ...s, status: 'terkirim' });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editForm) {
      updateSuratKeluar(editForm);
      setShowEdit(false);
    }
  };

  const handlePrint = (s: SuratKeluar) => {
    navigate('/buat-surat', { state: { printSurat: s } });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Surat Keluar</h1>
          <p className="text-sm text-slate-500">Kelola surat keluar SMP Negeri 1 Genteng</p>
        </div>
        {canEdit && (
          <button onClick={() => navigate('/buat-surat')} className="btn-primary self-start">
            <Plus size={16} /> Buat Surat Baru
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Cari surat..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-9" />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input-field">
            <option value="">Semua Status</option>
            <option value="draft">Draft</option>
            <option value="menunggu_ttd">Menunggu TTD</option>
            <option value="ditandatangani">Ditandatangani</option>
            <option value="terkirim">Terkirim</option>
          </select>
          <select value={filterKategori} onChange={e => setFilterKategori(e.target.value)} className="input-field">
            <option value="">Semua Kategori</option>
            {KATEGORI_SURAT.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden !p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 font-semibold text-slate-600">No. Surat</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden sm:table-cell">Tanggal</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Tujuan</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden md:table-cell">Perihal</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden lg:table-cell">Sifat</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
                <th className="text-center px-4 py-3 font-semibold text-slate-600">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-400">Tidak ada surat keluar ditemukan</td></tr>
              ) : filtered.map(s => (
                <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800 text-xs">{s.nomorSurat}</div>
                    <div className="sm:hidden text-xs text-slate-400 mt-0.5">{new Date(s.tanggalSurat).toLocaleDateString('id-ID')}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 hidden sm:table-cell text-xs">{new Date(s.tanggalSurat).toLocaleDateString('id-ID')}</td>
                  <td className="px-4 py-3">
                    <span className="text-slate-700 text-xs">{s.tujuan}</span>
                    <div className="md:hidden text-xs text-slate-400 mt-0.5 truncate max-w-[150px]">{s.perihal}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 hidden md:table-cell text-xs max-w-[200px] truncate">{s.perihal}</td>
                  <td className="px-4 py-3 hidden lg:table-cell"><span className="badge-neutral">{s.sifat}</span></td>
                  <td className="px-4 py-3"><span className={statusBadge(s.status).cls}>{statusBadge(s.status).label}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => { setPreviewData(s); setShowPreview(true); }} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600" title="Lihat">
                        <Eye size={14} />
                      </button>
                      <button onClick={() => handlePrint(s)} className="p-1.5 rounded-lg hover:bg-purple-50 text-purple-600" title="Cetak">
                        <Printer size={14} />
                      </button>
                      {canSign && s.status === 'menunggu_ttd' && (
                        <button onClick={() => handleSign(s)} className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600" title="Tandatangani">
                          <CheckCircle size={14} />
                        </button>
                      )}
                      {canEdit && (
                        <>
                          <button onClick={() => { setEditForm({ ...s }); setShowEdit(true); }} className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600" title="Edit">
                            <Edit2 size={14} />
                          </button>
                          {canEdit && s.status === 'ditandatangani' && (
                            <button onClick={() => handleSendUpdate(s)} className="p-1.5 rounded-lg hover:bg-green-50 text-green-600" title="Tandai Terkirim">
                              <CheckCircle size={14} />
                            </button>
                          )}
                          <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-600" title="Hapus">
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-slate-200 bg-slate-50">
          <p className="text-xs text-slate-500">Menampilkan {filtered.length} dari {suratKeluar.length} surat</p>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && previewData && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl my-8 shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h2 className="text-lg font-semibold">Detail Surat Keluar</h2>
              <button onClick={() => setShowPreview(false)} className="p-2 rounded-lg hover:bg-slate-100"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><p className="text-xs text-slate-500">Nomor Surat</p><p className="font-medium text-sm">{previewData.nomorSurat}</p></div>
                <div><p className="text-xs text-slate-500">Tanggal</p><p className="font-medium text-sm">{new Date(previewData.tanggalSurat).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p></div>
                <div><p className="text-xs text-slate-500">Tujuan</p><p className="font-medium text-sm">{previewData.tujuan}</p></div>
                <div><p className="text-xs text-slate-500">Kategori</p><p className="font-medium text-sm">{previewData.kategori}</p></div>
                <div className="sm:col-span-2"><p className="text-xs text-slate-500">Perihal</p><p className="font-medium text-sm">{previewData.perihal}</p></div>
                <div><p className="text-xs text-slate-500">Sifat</p><span className="badge-neutral">{previewData.sifat}</span></div>
                <div><p className="text-xs text-slate-500">Status</p><span className={statusBadge(previewData.status).cls}>{statusBadge(previewData.status).label}</span></div>
              </div>
              {previewData.isiSurat && (
                <div><p className="text-xs text-slate-500 mb-1">Isi Surat</p><div className="text-sm bg-slate-50 p-4 rounded-lg surat-content" dangerouslySetInnerHTML={{ __html: previewData.isiSurat }} /></div>
              )}
              {previewData.tembusan && (
                <div><p className="text-xs text-slate-500 mb-1">Tembusan</p><p className="text-sm bg-slate-50 p-3 rounded-lg whitespace-pre-wrap">{previewData.tembusan}</p></div>
              )}
              {previewData.lampiran && (
                <div>
                  <p className="text-xs text-slate-500 mb-2">File Lampiran: {previewData.lampiranNama}</p>
                  {previewData.lampiranTipe?.startsWith('image') ? (
                    <img src={previewData.lampiran} alt="Lampiran" className="max-w-full rounded-lg border" />
                  ) : (
                    <a href={previewData.lampiran} download={previewData.lampiranNama} className="btn-secondary inline-flex">
                      <FileText size={16} /> Download
                    </a>
                  )}
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => handlePrint(previewData)} className="btn-primary"><Printer size={16} /> Cetak Surat</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEdit && editForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl my-8 shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h2 className="text-lg font-semibold">Edit Surat Keluar</h2>
              <button onClick={() => setShowEdit(false)} className="p-2 rounded-lg hover:bg-slate-100"><X size={18} /></button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nomor Surat</label>
                  <input required value={editForm.nomorSurat} onChange={e => setEditForm(p => p ? { ...p, nomorSurat: e.target.value } : p)} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal</label>
                  <input required type="date" value={editForm.tanggalSurat} onChange={e => setEditForm(p => p ? { ...p, tanggalSurat: e.target.value } : p)} className="input-field" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tujuan</label>
                <input required value={editForm.tujuan} onChange={e => setEditForm(p => p ? { ...p, tujuan: e.target.value } : p)} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Perihal</label>
                <input required value={editForm.perihal} onChange={e => setEditForm(p => p ? { ...p, perihal: e.target.value } : p)} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select value={editForm.status} onChange={e => setEditForm(p => p ? { ...p, status: e.target.value as SuratKeluar['status'] } : p)} className="input-field">
                  <option value="draft">Draft</option>
                  <option value="menunggu_ttd">Menunggu TTD</option>
                  <option value="ditandatangani">Ditandatangani</option>
                  <option value="terkirim">Terkirim</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowEdit(false)} className="btn-secondary">Batal</button>
                <button type="submit" className="btn-primary">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
