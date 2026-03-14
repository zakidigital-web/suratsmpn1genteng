import { useState } from 'react';
import { useSurat } from '../context/SuratContext';
import { useAuth } from '../context/AuthContext';
import { SuratMasuk, KATEGORI_SURAT } from '../types';
import { Plus, Search, Edit2, Trash2, X, Upload, Eye, FileText, Image } from 'lucide-react';

export default function SuratMasukPage() {
  const { suratMasuk, addSuratMasuk, updateSuratMasuk, deleteSuratMasuk } = useSurat();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterKategori, setFilterKategori] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<SuratMasuk | null>(null);
  const [editData, setEditData] = useState<SuratMasuk | null>(null);

  const canEdit = user?.role === 'admin' || user?.role === 'operator';

  const emptyForm: SuratMasuk = {
    id: '', nomorSurat: '', tanggalSurat: new Date().toISOString().split('T')[0],
    tanggalTerima: new Date().toISOString().split('T')[0], pengirim: '', perihal: '',
    kategori: 'Dinas', status: 'belum_dibaca', catatan: '', createdAt: ''
  };

  const [form, setForm] = useState<SuratMasuk>(emptyForm);

  const filtered = suratMasuk.filter(s => {
    const matchSearch = s.perihal.toLowerCase().includes(search.toLowerCase()) ||
      s.pengirim.toLowerCase().includes(search.toLowerCase()) ||
      s.nomorSurat.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || s.status === filterStatus;
    const matchKategori = !filterKategori || s.kategori === filterKategori;
    return matchSearch && matchStatus && matchKategori;
  });

  const openAdd = () => {
    setForm(emptyForm);
    setEditData(null);
    setShowModal(true);
  };

  const openEdit = (s: SuratMasuk) => {
    setForm({ ...s });
    setEditData(s);
    setShowModal(true);
  };

  const openPreview = (s: SuratMasuk) => {
    setPreviewData(s);
    setShowPreview(true);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file maksimal 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setForm(prev => ({
        ...prev,
        lampiran: reader.result as string,
        lampiranNama: file.name,
        lampiranTipe: file.type
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editData) {
      updateSuratMasuk({ ...form });
    } else {
      addSuratMasuk({
        ...form,
        id: 'sm' + Date.now(),
        createdAt: new Date().toISOString()
      });
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Yakin ingin menghapus surat ini?')) {
      deleteSuratMasuk(id);
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      belum_dibaca: { label: 'Belum Dibaca', cls: 'badge-danger' },
      dibaca: { label: 'Dibaca', cls: 'badge-info' },
      diproses: { label: 'Diproses', cls: 'badge-warning' },
      selesai: { label: 'Selesai', cls: 'badge-success' },
    };
    return map[status] || { label: status, cls: 'badge-neutral' };
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Surat Masuk</h1>
          <p className="text-sm text-slate-500">Kelola surat masuk SMP Negeri 1 Genteng</p>
        </div>
        {canEdit && (
          <button onClick={openAdd} className="btn-primary self-start">
            <Plus size={16} /> Tambah Surat
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
            <option value="belum_dibaca">Belum Dibaca</option>
            <option value="dibaca">Dibaca</option>
            <option value="diproses">Diproses</option>
            <option value="selesai">Selesai</option>
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
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Pengirim</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden md:table-cell">Perihal</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden lg:table-cell">Kategori</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
                <th className="text-center px-4 py-3 font-semibold text-slate-600">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-400">Tidak ada surat masuk ditemukan</td></tr>
              ) : filtered.map(s => (
                <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800 text-xs">{s.nomorSurat}</div>
                    <div className="sm:hidden text-xs text-slate-400 mt-0.5">{new Date(s.tanggalTerima).toLocaleDateString('id-ID')}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 hidden sm:table-cell text-xs">{new Date(s.tanggalTerima).toLocaleDateString('id-ID')}</td>
                  <td className="px-4 py-3">
                    <span className="text-slate-700 text-xs">{s.pengirim}</span>
                    <div className="md:hidden text-xs text-slate-400 mt-0.5 truncate max-w-[150px]">{s.perihal}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 hidden md:table-cell text-xs max-w-[200px] truncate">{s.perihal}</td>
                  <td className="px-4 py-3 hidden lg:table-cell"><span className="badge-neutral">{s.kategori}</span></td>
                  <td className="px-4 py-3"><span className={statusBadge(s.status).cls}>{statusBadge(s.status).label}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openPreview(s)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600" title="Lihat">
                        <Eye size={14} />
                      </button>
                      {canEdit && (
                        <>
                          <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600" title="Edit">
                            <Edit2 size={14} />
                          </button>
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
          <p className="text-xs text-slate-500">Menampilkan {filtered.length} dari {suratMasuk.length} surat</p>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl my-8 shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h2 className="text-lg font-semibold">{editData ? 'Edit Surat Masuk' : 'Tambah Surat Masuk'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-slate-100"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nomor Surat *</label>
                  <input required value={form.nomorSurat} onChange={e => setForm(p => ({ ...p, nomorSurat: e.target.value }))} className="input-field" placeholder="420/001/2024" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Kategori</label>
                  <select value={form.kategori} onChange={e => setForm(p => ({ ...p, kategori: e.target.value }))} className="input-field">
                    {KATEGORI_SURAT.map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Surat *</label>
                  <input required type="date" value={form.tanggalSurat} onChange={e => setForm(p => ({ ...p, tanggalSurat: e.target.value }))} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Terima *</label>
                  <input required type="date" value={form.tanggalTerima} onChange={e => setForm(p => ({ ...p, tanggalTerima: e.target.value }))} className="input-field" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Pengirim *</label>
                <input required value={form.pengirim} onChange={e => setForm(p => ({ ...p, pengirim: e.target.value }))} className="input-field" placeholder="Nama instansi/pengirim" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Perihal *</label>
                <input required value={form.perihal} onChange={e => setForm(p => ({ ...p, perihal: e.target.value }))} className="input-field" placeholder="Perihal surat" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as SuratMasuk['status'] }))} className="input-field">
                  <option value="belum_dibaca">Belum Dibaca</option>
                  <option value="dibaca">Dibaca</option>
                  <option value="diproses">Diproses</option>
                  <option value="selesai">Selesai</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Upload Scan Surat (Opsional)</label>
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:border-indigo-400 transition-colors">
                  <input type="file" accept="image/*,.pdf" onChange={handleFile} className="hidden" id="file-upload-masuk" />
                  <label htmlFor="file-upload-masuk" className="cursor-pointer">
                    <Upload size={24} className="mx-auto text-slate-400 mb-2" />
                    <p className="text-sm text-slate-600">Klik untuk upload file</p>
                    <p className="text-xs text-slate-400 mt-1">Format: JPG, PNG, PDF (Maks. 5MB)</p>
                  </label>
                  {form.lampiranNama && (
                    <div className="mt-3 flex items-center justify-center gap-2 text-sm text-indigo-600">
                      {form.lampiranTipe?.startsWith('image') ? <Image size={14} /> : <FileText size={14} />}
                      <span>{form.lampiranNama}</span>
                      <button type="button" onClick={() => setForm(p => ({ ...p, lampiran: undefined, lampiranNama: undefined, lampiranTipe: undefined }))} className="text-red-500 ml-1"><X size={14} /></button>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Catatan</label>
                <textarea value={form.catatan} onChange={e => setForm(p => ({ ...p, catatan: e.target.value }))} className="input-field" rows={3} placeholder="Catatan tambahan..." />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Batal</button>
                <button type="submit" className="btn-primary">{editData ? 'Simpan Perubahan' : 'Tambah Surat'}</button>
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
              <h2 className="text-lg font-semibold">Detail Surat Masuk</h2>
              <button onClick={() => setShowPreview(false)} className="p-2 rounded-lg hover:bg-slate-100"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><p className="text-xs text-slate-500">Nomor Surat</p><p className="font-medium text-sm">{previewData.nomorSurat}</p></div>
                <div><p className="text-xs text-slate-500">Kategori</p><p className="font-medium text-sm">{previewData.kategori}</p></div>
                <div><p className="text-xs text-slate-500">Tanggal Surat</p><p className="font-medium text-sm">{new Date(previewData.tanggalSurat).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p></div>
                <div><p className="text-xs text-slate-500">Tanggal Terima</p><p className="font-medium text-sm">{new Date(previewData.tanggalTerima).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p></div>
                <div className="sm:col-span-2"><p className="text-xs text-slate-500">Pengirim</p><p className="font-medium text-sm">{previewData.pengirim}</p></div>
                <div className="sm:col-span-2"><p className="text-xs text-slate-500">Perihal</p><p className="font-medium text-sm">{previewData.perihal}</p></div>
                <div><p className="text-xs text-slate-500">Status</p><span className={statusBadge(previewData.status).cls}>{statusBadge(previewData.status).label}</span></div>
              </div>
              {previewData.catatan && (
                <div><p className="text-xs text-slate-500">Catatan</p><p className="text-sm mt-1 bg-slate-50 p-3 rounded-lg">{previewData.catatan}</p></div>
              )}
              {previewData.lampiran && (
                <div>
                  <p className="text-xs text-slate-500 mb-2">Lampiran: {previewData.lampiranNama}</p>
                  {previewData.lampiranTipe?.startsWith('image') ? (
                    <img src={previewData.lampiran} alt="Scan surat" className="max-w-full rounded-lg border" />
                  ) : (
                    <a href={previewData.lampiran} download={previewData.lampiranNama} className="btn-secondary inline-flex">
                      <FileText size={16} /> Download {previewData.lampiranNama}
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
