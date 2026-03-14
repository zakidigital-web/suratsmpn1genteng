import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSurat } from '../context/SuratContext';
import { useAuth } from '../context/AuthContext';
import { SuratKeluar, SuratTemplate, KATEGORI_SURAT, SIFAT_SURAT } from '../types';
import RichTextEditor from '../components/RichTextEditor';
import KopSurat from '../components/KopSurat';
import {
  Save, Printer, Eye, Upload, X, FileText, ArrowLeft, Send,
  FileStack, Check, Plus, Trash2, Edit2
} from 'lucide-react';

export default function BuatSuratPage() {
  const { addSuratKeluar, updateSuratKeluar, settings, templates, addTemplate, updateTemplate, deleteTemplate } = useSurat();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<SuratTemplate | null>(null);

  const existingSurat = (location.state as { printSurat?: SuratKeluar })?.printSurat;

  const [form, setForm] = useState<SuratKeluar>({
    id: '', nomorSurat: '', tanggalSurat: new Date().toISOString().split('T')[0],
    tujuan: '', perihal: '', kategori: 'Dinas', status: 'draft',
    isiSurat: '', sifat: 'Biasa', tembusan: '', catatan: '',
    createdAt: '', createdBy: user?.username || ''
  });

  const [ttdImage, setTtdImage] = useState<string | undefined>(settings.tandaTangan);
  const [stempelImage, setStempelImage] = useState<string | undefined>(settings.stempel);

  const [templateForm, setTemplateForm] = useState<SuratTemplate>({
    id: '', nama: '', kategori: 'Dinas', perihal: '', isiSurat: '',
    tujuan: '', sifat: 'Biasa', tembusan: ''
  });

  useEffect(() => {
    if (existingSurat) {
      setForm(existingSurat);
      if (existingSurat.tandaTangan) setTtdImage(existingSurat.tandaTangan);
      if (existingSurat.stempel) setStempelImage(existingSurat.stempel);
    }
  }, [existingSurat]);

  useEffect(() => {
    setTtdImage(settings.tandaTangan);
    setStempelImage(settings.stempel);
  }, [settings]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'ttd' | 'stempel') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (type === 'ttd') setTtdImage(reader.result as string);
      else setStempelImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.size > 5 * 1024 * 1024) { alert('Maks 5MB'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      setForm(p => ({ ...p, lampiran: reader.result as string, lampiranNama: file.name, lampiranTipe: file.type }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (status: SuratKeluar['status'] = 'draft') => {
    const data: SuratKeluar = {
      ...form, status,
      tandaTangan: ttdImage, stempel: stempelImage,
      createdBy: user?.username || ''
    };
    if (existingSurat) {
      updateSuratKeluar(data);
    } else {
      data.id = 'sk' + Date.now();
      data.createdAt = new Date().toISOString();
      addSuratKeluar(data);
      setForm(p => ({ ...p, id: data.id, createdAt: data.createdAt }));
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handlePrint = () => {
    setShowPreview(true);
    setTimeout(() => { window.print(); }, 500);
  };

  const applyTemplate = (t: SuratTemplate) => {
    setForm(p => ({
      ...p,
      kategori: t.kategori,
      perihal: t.perihal,
      isiSurat: t.isiSurat,
      tujuan: t.tujuan || p.tujuan,
      sifat: t.sifat,
      tembusan: t.tembusan,
    }));
    setShowTemplates(false);
  };

  const openEditTemplate = (t: SuratTemplate) => {
    setTemplateForm({ ...t });
    setEditingTemplate(t);
    setShowTemplateEditor(true);
  };

  const openNewTemplate = () => {
    setTemplateForm({
      id: '', nama: '', kategori: form.kategori, perihal: form.perihal,
      isiSurat: form.isiSurat, tujuan: form.tujuan, sifat: form.sifat, tembusan: form.tembusan,
    });
    setEditingTemplate(null);
    setShowTemplateEditor(true);
  };

  const saveTemplate = () => {
    if (!templateForm.nama.trim()) { alert('Nama template harus diisi'); return; }
    if (editingTemplate) {
      updateTemplate(templateForm);
    } else {
      addTemplate({ ...templateForm, id: 'tpl' + Date.now() });
    }
    setShowTemplateEditor(false);
  };

  const formatTanggal = (d: string) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-slate-200 text-slate-600">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800">{existingSurat ? 'Edit Surat Keluar' : 'Buat Surat Baru'}</h1>
            <p className="text-sm text-slate-500">Tulis surat resmi SMP Negeri 1 Genteng</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {saved && <span className="text-sm text-emerald-600 font-medium bg-emerald-50 px-3 py-1 rounded-lg">✓ Tersimpan</span>}
          <button onClick={() => setShowTemplates(true)} className="btn-secondary">
            <FileStack size={16} /> Template
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Form */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card space-y-4">
            <h3 className="text-sm font-semibold text-slate-800 border-b border-slate-200 pb-2">Informasi Surat</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nomor Surat *</label>
                <input required value={form.nomorSurat} onChange={e => setForm(p => ({ ...p, nomorSurat: e.target.value }))} className="input-field" placeholder="421/001/35.09.01/2024" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Surat *</label>
                <input required type="date" value={form.tanggalSurat} onChange={e => setForm(p => ({ ...p, tanggalSurat: e.target.value }))} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Kategori</label>
                <select value={form.kategori} onChange={e => setForm(p => ({ ...p, kategori: e.target.value }))} className="input-field">
                  {KATEGORI_SURAT.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Sifat Surat</label>
                <select value={form.sifat} onChange={e => setForm(p => ({ ...p, sifat: e.target.value }))} className="input-field">
                  {SIFAT_SURAT.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tujuan *</label>
              <input required value={form.tujuan} onChange={e => setForm(p => ({ ...p, tujuan: e.target.value }))} className="input-field" placeholder="Nama penerima surat" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Perihal *</label>
              <input required value={form.perihal} onChange={e => setForm(p => ({ ...p, perihal: e.target.value }))} className="input-field" placeholder="Perihal surat" />
            </div>
          </div>

          <div className="card space-y-4">
            <h3 className="text-sm font-semibold text-slate-800 border-b border-slate-200 pb-2">Isi Surat</h3>
            <RichTextEditor
              value={form.isiSurat}
              onChange={(html) => setForm(p => ({ ...p, isiSurat: html }))}
              placeholder="Tulis isi surat di sini... Gunakan toolbar untuk menambahkan tabel, gambar, formatting, dll."
              minHeight="300px"
            />
          </div>

          <div className="card space-y-4">
            <h3 className="text-sm font-semibold text-slate-800 border-b border-slate-200 pb-2">Informasi Tambahan</h3>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tembusan</label>
              <textarea value={form.tembusan} onChange={e => setForm(p => ({ ...p, tembusan: e.target.value }))} className="input-field" rows={3} placeholder={"1. Kepala Dinas Pendidikan\n2. Arsip"} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Catatan Internal</label>
              <textarea value={form.catatan} onChange={e => setForm(p => ({ ...p, catatan: e.target.value }))} className="input-field" rows={2} placeholder="Catatan internal..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Upload Lampiran (Opsional)</label>
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:border-indigo-400 transition-colors">
                <input type="file" accept="image/*,.pdf" onChange={handleFileUpload} className="hidden" id="file-upload-surat" />
                <label htmlFor="file-upload-surat" className="cursor-pointer">
                  <Upload size={20} className="mx-auto text-slate-400 mb-1" />
                  <p className="text-sm text-slate-500">Upload lampiran</p>
                </label>
                {form.lampiranNama && (
                  <div className="mt-2 flex items-center justify-center gap-2 text-sm text-indigo-600">
                    <FileText size={14} /> {form.lampiranNama}
                    <button type="button" onClick={() => setForm(p => ({ ...p, lampiran: undefined, lampiranNama: undefined, lampiranTipe: undefined }))} className="text-red-500"><X size={14} /></button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card space-y-3">
            <h3 className="text-sm font-semibold text-slate-800">Aksi</h3>
            <button onClick={() => handleSave('draft')} className="btn-secondary w-full justify-center"><Save size={16} /> Simpan Draft</button>
            <button onClick={() => handleSave('menunggu_ttd')} className="btn-warning w-full justify-center"><Send size={16} /> Ajukan TTD</button>
            <button onClick={() => setShowPreview(true)} className="btn-primary w-full justify-center"><Eye size={16} /> Preview Surat</button>
            <button onClick={handlePrint} className="btn-success w-full justify-center"><Printer size={16} /> Cetak Surat</button>
            <hr className="border-slate-200" />
            <button onClick={openNewTemplate} className="btn-secondary w-full justify-center text-xs"><Plus size={14} /> Simpan Sebagai Template</button>
          </div>

          <div className="card space-y-3">
            <h3 className="text-sm font-semibold text-slate-800">Tanda Tangan</h3>
            <p className="text-xs text-slate-500">Upload gambar tanda tangan (opsional)</p>
            {ttdImage ? (
              <div className="relative border rounded-lg p-2 bg-slate-50">
                <img src={ttdImage} alt="TTD" className="max-h-24 mx-auto" />
                <button onClick={() => setTtdImage(undefined)} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full"><X size={12} /></button>
              </div>
            ) : (
              <div>
                <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'ttd')} className="hidden" id="ttd-upload" />
                <label htmlFor="ttd-upload" className="btn-secondary w-full justify-center cursor-pointer"><Upload size={16} /> Upload TTD</label>
              </div>
            )}
          </div>

          <div className="card space-y-3">
            <h3 className="text-sm font-semibold text-slate-800">Stempel</h3>
            {stempelImage ? (
              <div className="relative border rounded-lg p-2 bg-slate-50">
                <img src={stempelImage} alt="Stempel" className="max-h-24 mx-auto" />
                <button onClick={() => setStempelImage(undefined)} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full"><X size={12} /></button>
              </div>
            ) : (
              <div>
                <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'stempel')} className="hidden" id="stempel-upload" />
                <label htmlFor="stempel-upload" className="btn-secondary w-full justify-center cursor-pointer"><Upload size={16} /> Upload Stempel</label>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Template Selector Modal */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-3xl my-8 shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2"><FileStack size={20} /> Pilih Template Surat</h2>
                <p className="text-xs text-slate-500">Gunakan template untuk mempercepat pembuatan surat</p>
              </div>
              <button onClick={() => setShowTemplates(false)} className="p-2 rounded-lg hover:bg-slate-100"><X size={18} /></button>
            </div>
            <div className="p-5 grid gap-3 max-h-[70vh] overflow-y-auto">
              {templates.length === 0 ? (
                <p className="text-center text-slate-400 py-8">Belum ada template</p>
              ) : templates.map(t => (
                <div key={t.id} className="border border-slate-200 rounded-xl p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-sm text-slate-800">{t.nama}</h3>
                        <span className="badge-neutral">{t.kategori}</span>
                        <span className="badge-info">{t.sifat}</span>
                      </div>
                      <p className="text-xs text-slate-500">Perihal: {t.perihal}</p>
                      {t.tujuan && <p className="text-xs text-slate-400">Tujuan: {t.tujuan}</p>}
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button onClick={() => applyTemplate(t)} className="btn-primary text-xs !py-1.5 !px-3">
                        <Check size={14} /> Gunakan
                      </button>
                      <button onClick={() => openEditTemplate(t)} className="p-2 rounded-lg hover:bg-amber-50 text-amber-600">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => { if (confirm('Hapus template ini?')) deleteTemplate(t.id); }} className="p-2 rounded-lg hover:bg-red-50 text-red-600">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Template Editor Modal */}
      {showTemplateEditor && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl my-8 shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h2 className="text-lg font-semibold">{editingTemplate ? 'Edit Template' : 'Simpan Sebagai Template'}</h2>
              <button onClick={() => setShowTemplateEditor(false)} className="p-2 rounded-lg hover:bg-slate-100"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Template *</label>
                <input value={templateForm.nama} onChange={e => setTemplateForm(p => ({ ...p, nama: e.target.value }))} className="input-field" placeholder="Contoh: Surat Undangan Rapat" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Kategori</label>
                  <select value={templateForm.kategori} onChange={e => setTemplateForm(p => ({ ...p, kategori: e.target.value }))} className="input-field">
                    {KATEGORI_SURAT.map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Sifat</label>
                  <select value={templateForm.sifat} onChange={e => setTemplateForm(p => ({ ...p, sifat: e.target.value }))} className="input-field">
                    {SIFAT_SURAT.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Perihal</label>
                <input value={templateForm.perihal} onChange={e => setTemplateForm(p => ({ ...p, perihal: e.target.value }))} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tujuan Default</label>
                <input value={templateForm.tujuan} onChange={e => setTemplateForm(p => ({ ...p, tujuan: e.target.value }))} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Isi Surat Template</label>
                <RichTextEditor
                  value={templateForm.isiSurat}
                  onChange={(html) => setTemplateForm(p => ({ ...p, isiSurat: html }))}
                  minHeight="200px"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tembusan</label>
                <textarea value={templateForm.tembusan} onChange={e => setTemplateForm(p => ({ ...p, tembusan: e.target.value }))} className="input-field" rows={2} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowTemplateEditor(false)} className="btn-secondary">Batal</button>
                <button onClick={saveTemplate} className="btn-primary">{editingTemplate ? 'Simpan Perubahan' : 'Simpan Template'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print Preview Modal - Uses KopSurat Component */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-[210mm] my-4 shadow-2xl rounded-lg overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b bg-slate-50 print:hidden">
              <h2 className="font-semibold">Preview Surat</h2>
              <div className="flex gap-2">
                <button onClick={() => { window.print(); }} className="btn-success"><Printer size={16} /> Cetak</button>
                <button onClick={() => setShowPreview(false)} className="btn-secondary"><X size={16} /> Tutup</button>
              </div>
            </div>

            <div id="print-area" ref={printRef} className="p-8 sm:p-12 bg-white" style={{ fontFamily: 'Times New Roman, serif', fontSize: '12pt', lineHeight: '1.6' }}>
              {/* KOP SURAT - Dynamic */}
              <KopSurat settings={settings} />

              {/* Nomor, Lampiran, Perihal */}
              <div className="mb-4" style={{ fontSize: '12pt' }}>
                <table className="w-auto">
                  <tbody>
                    <tr><td className="pr-2 align-top">Nomor</td><td className="pr-2 align-top">:</td><td>{form.nomorSurat}</td></tr>
                    <tr><td className="pr-2 align-top">Sifat</td><td className="pr-2 align-top">:</td><td>{form.sifat}</td></tr>
                    <tr><td className="pr-2 align-top">Lampiran</td><td className="pr-2 align-top">:</td><td>{form.lampiranNama || '-'}</td></tr>
                    <tr><td className="pr-2 align-top">Hal</td><td className="pr-2 align-top">:</td><td className="font-semibold underline">{form.perihal}</td></tr>
                  </tbody>
                </table>
              </div>

              {/* Tujuan */}
              <div className="mb-6" style={{ fontSize: '12pt' }}>
                <p>Kepada Yth.</p>
                <p className="font-semibold">{form.tujuan}</p>
                <p>di Tempat</p>
              </div>

              {/* Isi Surat */}
              <div className="mb-8 surat-content text-justify" style={{ fontSize: '12pt' }}
                dangerouslySetInnerHTML={{ __html: form.isiSurat }}
              />

              {/* TTD Area */}
              <div className="flex justify-end mt-8">
                <div className="text-center" style={{ width: '250px' }}>
                  <p>Genteng, {formatTanggal(form.tanggalSurat)}</p>
                  <p className="font-semibold">Kepala Sekolah,</p>
                  <div className="relative h-24 my-2">
                    {stempelImage && (
                      <img src={stempelImage} alt="Stempel" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-24 opacity-70" />
                    )}
                    {ttdImage && (
                      <img src={ttdImage} alt="TTD" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-20" />
                    )}
                  </div>
                  <p className="font-semibold underline">{settings.kepalaSekolah}</p>
                  <p style={{ fontSize: '10pt' }}>NIP. {settings.nipKepala}</p>
                </div>
              </div>

              {/* Tembusan */}
              {form.tembusan && (
                <div className="mt-6 border-t pt-3" style={{ fontSize: '11pt' }}>
                  <p className="font-semibold">Tembusan:</p>
                  <div className="whitespace-pre-wrap">{form.tembusan}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
