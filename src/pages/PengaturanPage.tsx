import { useState, useRef, useEffect, useCallback } from 'react';
import { useSurat, BackupData, BackupHistoryItem, ClearOptions, DatabaseStats } from '../context/SuratContext';
import { SchoolSettings, KopLine, DEFAULT_KOP_SETTINGS } from '../types';
import KopSurat from '../components/KopSurat';
import {
  Save, Upload, X, School, Image, Stamp, Info, CheckCircle,
  ImageIcon, Plus, Trash2, ArrowUp, ArrowDown, RotateCcw, Eye,
  FlaskConical, ShieldCheck, AlertTriangle, Monitor, Database, Trash,
  Download, UploadCloud, HardDrive, Clock, FileJson, Shield,
  RefreshCw, Archive, CheckSquare, Square, BarChart3, History
} from 'lucide-react';

export default function PengaturanPage() {
  const {
    settings, updateSettings, demoMode, setDemoMode,
    createBackup, restoreBackup, clearDatabase,
    getBackupHistory, addBackupHistory, getDatabaseStats
  } = useSurat();
  const [form, setForm] = useState<SchoolSettings>({ ...settings });
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'sekolah' | 'kop' | 'logo' | 'ttd' | 'demo' | 'database'>('sekolah');
  const [showKopPreview, setShowKopPreview] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  // Database tab state
  const [dbStats, setDbStats] = useState<DatabaseStats | null>(null);
  const [backupHistory, setBackupHistory] = useState<BackupHistoryItem[]>([]);
  const [restoreMessage, setRestoreMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearOptions, setClearOptions] = useState<ClearOptions>({
    suratMasuk: false, suratKeluar: false, disposisi: false,
    templates: false, settings: false, users: false,
    permissions: false, backupHistory: false,
  });
  const [confirmClearText, setConfirmClearText] = useState('');
  const [clearSuccess, setClearSuccess] = useState(false);
  const restoreInputRef = useRef<HTMLInputElement>(null);

  const refreshDbStats = useCallback(() => {
    setDbStats(getDatabaseStats());
    setBackupHistory(getBackupHistory());
  }, [getDatabaseStats, getBackupHistory]);

  useEffect(() => {
    if (activeTab === 'database') {
      refreshDbStats();
    }
  }, [activeTab, refreshDbStats]);

  const handleSave = () => {
    updateSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: keyof SchoolSettings) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert('Maksimal 2MB'); return; }
    const reader = new FileReader();
    reader.onload = () => setForm(p => ({ ...p, [field]: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const kop = form.kopSettings;

  const updateKop = (updates: Partial<typeof kop>) => {
    setForm(p => ({ ...p, kopSettings: { ...p.kopSettings, ...updates } }));
  };

  const updateKopLine = (idx: number, updates: Partial<KopLine>) => {
    const newLines = [...kop.lines];
    newLines[idx] = { ...newLines[idx], ...updates };
    updateKop({ lines: newLines });
  };

  const addKopLine = () => {
    updateKop({
      lines: [...kop.lines, { text: 'Teks Baru', fontSize: 10, bold: false, italic: false, uppercase: false }]
    });
  };

  const removeKopLine = (idx: number) => {
    updateKop({ lines: kop.lines.filter((_, i) => i !== idx) });
  };

  const moveKopLine = (idx: number, dir: -1 | 1) => {
    const newLines = [...kop.lines];
    const target = idx + dir;
    if (target < 0 || target >= newLines.length) return;
    [newLines[idx], newLines[target]] = [newLines[target], newLines[idx]];
    updateKop({ lines: newLines });
  };

  const resetKop = () => {
    if (confirm('Reset pengaturan KOP ke default?')) {
      updateKop({ ...DEFAULT_KOP_SETTINGS });
    }
  };

  // ===== DATABASE FUNCTIONS =====

  const handleBackup = () => {
    setIsBackingUp(true);
    setTimeout(() => {
      try {
        const backup = createBackup();
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const dateStr = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
        const filename = `backup-surat-${settings.namaSekolah.replace(/\s+/g, '-').toLowerCase()}-${dateStr}.json`;
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        const sizeStr = (blob.size / 1024).toFixed(1) + ' KB';
        const historyItem: BackupHistoryItem = {
          id: Date.now().toString(),
          date: new Date().toISOString(),
          type: 'backup',
          filename,
          size: sizeStr,
          stats: {
            suratMasuk: backup.stats.totalSuratMasuk,
            suratKeluar: backup.stats.totalSuratKeluar,
            disposisi: backup.stats.totalDisposisi,
            templates: backup.stats.totalTemplates,
          }
        };
        addBackupHistory(historyItem);
        refreshDbStats();
        setRestoreMessage({ type: 'success', text: `Backup berhasil diunduh! (${sizeStr})` });
      } catch {
        setRestoreMessage({ type: 'error', text: 'Gagal membuat backup. Silakan coba lagi.' });
      }
      setIsBackingUp(false);
      setTimeout(() => setRestoreMessage(null), 5000);
    }, 800);
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      setRestoreMessage({ type: 'error', text: 'File harus berformat .json' });
      setTimeout(() => setRestoreMessage(null), 5000);
      return;
    }

    setIsRestoring(true);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const backup: BackupData = JSON.parse(reader.result as string);
        const result = restoreBackup(backup);

        if (result.success) {
          const historyItem: BackupHistoryItem = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            type: 'restore',
            filename: file.name,
            size: (file.size / 1024).toFixed(1) + ' KB',
            stats: {
              suratMasuk: backup.stats?.totalSuratMasuk || 0,
              suratKeluar: backup.stats?.totalSuratKeluar || 0,
              disposisi: backup.stats?.totalDisposisi || 0,
              templates: backup.stats?.totalTemplates || 0,
            }
          };
          addBackupHistory(historyItem);
          refreshDbStats();
          setForm({ ...settings });
        }

        setRestoreMessage({ type: result.success ? 'success' : 'error', text: result.message });
      } catch {
        setRestoreMessage({ type: 'error', text: 'File backup rusak atau format tidak valid.' });
      }
      setIsRestoring(false);
      setTimeout(() => setRestoreMessage(null), 8000);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleClearDatabase = () => {
    const anySelected = Object.values(clearOptions).some(v => v);
    if (!anySelected) return;

    clearDatabase(clearOptions);

    setClearSuccess(true);
    setShowClearModal(false);
    setConfirmClearText('');
    setClearOptions({
      suratMasuk: false, suratKeluar: false, disposisi: false,
      templates: false, settings: false, users: false,
      permissions: false, backupHistory: false,
    });

    setTimeout(() => {
      refreshDbStats();
      setClearSuccess(false);
    }, 3000);
  };

  const handleClearAll = () => {
    if (confirmReset) {
      const keys = [
        'surat_masuk', 'surat_keluar', 'disposisi', 'surat_templates',
        'surat_settings', 'surat_users', 'surat_permissions', 'surat_current_user',
        'surat_backup_history'
      ];
      keys.forEach(k => localStorage.removeItem(k));
      localStorage.setItem('surat_demo_mode', JSON.stringify(demoMode));
      setConfirmReset(false);
      window.location.reload();
    } else {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 5000);
    }
  };

  const selectedClearCount = Object.values(clearOptions).filter(Boolean).length;
  const totalClearOptions = Object.keys(clearOptions).length;

  const toggleAllClear = () => {
    const allSelected = selectedClearCount === totalClearOptions;
    const newVal = !allSelected;
    setClearOptions({
      suratMasuk: newVal, suratKeluar: newVal, disposisi: newVal,
      templates: newVal, settings: newVal, users: newVal,
      permissions: newVal, backupHistory: newVal,
    });
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const tabs = [
    { key: 'sekolah' as const, label: 'Data Sekolah', icon: School },
    { key: 'kop' as const, label: 'KOP Surat', icon: Info },
    { key: 'logo' as const, label: 'Logo', icon: ImageIcon },
    { key: 'ttd' as const, label: 'TTD & Stempel', icon: Image },
    { key: 'database' as const, label: 'Database', icon: Database },
    { key: 'demo' as const, label: 'Mode Aplikasi', icon: FlaskConical },
  ];

  const clearTableNames: Record<keyof ClearOptions, { label: string; icon: typeof Database; color: string }> = {
    suratMasuk: { label: 'Surat Masuk', icon: Archive, color: 'blue' },
    suratKeluar: { label: 'Surat Keluar', icon: Archive, color: 'indigo' },
    disposisi: { label: 'Disposisi', icon: Archive, color: 'purple' },
    templates: { label: 'Template Surat', icon: FileJson, color: 'teal' },
    settings: { label: 'Pengaturan Sekolah', icon: School, color: 'amber' },
    users: { label: 'Data Pengguna', icon: Shield, color: 'red' },
    permissions: { label: 'Hak Akses', icon: Shield, color: 'orange' },
    backupHistory: { label: 'Riwayat Backup', icon: History, color: 'slate' },
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Pengaturan Sistem</h1>
          <p className="text-sm text-slate-500">Konfigurasi sekolah, KOP surat, logo, tanda tangan, database & mode aplikasi</p>
        </div>
        <div className="flex items-center gap-3 self-start">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
            demoMode
              ? 'bg-amber-100 text-amber-700 border border-amber-200'
              : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
          }`}>
            {demoMode ? <FlaskConical size={13} /> : <ShieldCheck size={13} />}
            {demoMode ? 'Mode Demo' : 'Mode Produksi'}
          </span>
          {saved && (
            <span className="text-sm text-emerald-600 font-medium bg-emerald-50 px-3 py-1.5 rounded-lg flex items-center gap-1">
              <CheckCircle size={14} /> Tersimpan
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-200 p-1 rounded-xl overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.key ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Data Sekolah */}
      {activeTab === 'sekolah' && (
        <div className="card space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
            <Info size={16} className="text-indigo-500" />
            <h3 className="text-sm font-semibold text-slate-800">Informasi Sekolah</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Nama Sekolah</label>
              <input value={form.namaSekolah} onChange={e => setForm(p => ({ ...p, namaSekolah: e.target.value }))} className="input-field" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Alamat</label>
              <input value={form.alamat} onChange={e => setForm(p => ({ ...p, alamat: e.target.value }))} className="input-field" />
            </div>
            {[
              { label: 'Telepon', key: 'telepon' as const },
              { label: 'Email', key: 'email' as const },
              { label: 'Website', key: 'website' as const },
              { label: 'NPSN', key: 'npsn' as const },
              { label: 'Kode Pos', key: 'kodePos' as const },
              { label: 'Kabupaten', key: 'kabupaten' as const },
              { label: 'Provinsi', key: 'provinsi' as const },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-sm font-medium text-slate-700 mb-1">{f.label}</label>
                <input value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} className="input-field" />
              </div>
            ))}
          </div>
          <div className="border-t border-slate-200 pt-4">
            <h4 className="text-sm font-semibold text-slate-700 mb-3">Data Kepala Sekolah</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Kepala Sekolah</label>
                <input value={form.kepalaSekolah} onChange={e => setForm(p => ({ ...p, kepalaSekolah: e.target.value }))} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">NIP</label>
                <input value={form.nipKepala} onChange={e => setForm(p => ({ ...p, nipKepala: e.target.value }))} className="input-field" />
              </div>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button onClick={handleSave} className="btn-primary"><Save size={16} /> Simpan</button>
          </div>
        </div>
      )}

      {/* KOP Surat Settings */}
      {activeTab === 'kop' && (
        <div className="space-y-4">
          <div className="card space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <Info size={16} className="text-indigo-500" /> Baris Teks KOP Surat
              </h3>
              <div className="flex gap-2">
                <button onClick={resetKop} className="btn-secondary !py-1.5 !px-3 text-xs"><RotateCcw size={14} /> Reset</button>
                <button onClick={addKopLine} className="btn-primary !py-1.5 !px-3 text-xs"><Plus size={14} /> Tambah Baris</button>
              </div>
            </div>
            <p className="text-xs text-slate-500">Atur teks, ukuran font, dan gaya untuk setiap baris KOP surat. Urutan dari atas ke bawah.</p>

            <div className="space-y-3">
              {kop.lines.map((line, idx) => (
                <div key={idx} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-semibold text-slate-400 bg-slate-200 px-2 py-0.5 rounded">Baris {idx + 1}</span>
                    <div className="flex-1" />
                    <button onClick={() => moveKopLine(idx, -1)} disabled={idx === 0} className="p-1.5 rounded hover:bg-slate-200 disabled:opacity-30"><ArrowUp size={14} /></button>
                    <button onClick={() => moveKopLine(idx, 1)} disabled={idx === kop.lines.length - 1} className="p-1.5 rounded hover:bg-slate-200 disabled:opacity-30"><ArrowDown size={14} /></button>
                    <button onClick={() => removeKopLine(idx)} className="p-1.5 rounded hover:bg-red-100 text-red-500"><Trash2 size={14} /></button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-6">
                      <label className="block text-xs font-medium text-slate-600 mb-1">Teks</label>
                      <input value={line.text} onChange={e => updateKopLine(idx, { text: e.target.value })} className="input-field text-sm" placeholder="Teks KOP" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-slate-600 mb-1">Ukuran (pt)</label>
                      <input type="number" min={6} max={36} value={line.fontSize} onChange={e => updateKopLine(idx, { fontSize: parseInt(e.target.value) || 10 })} className="input-field text-sm" />
                    </div>
                    <div className="sm:col-span-4 flex items-end gap-2 pb-0.5">
                      <label className={`flex items-center gap-1.5 cursor-pointer px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                        line.bold ? 'bg-indigo-100 border-indigo-300 text-indigo-700' : 'border-slate-200 text-slate-500 hover:bg-slate-100'
                      }`}>
                        <input type="checkbox" checked={line.bold} onChange={e => updateKopLine(idx, { bold: e.target.checked })} className="hidden" />
                        <strong>B</strong> Bold
                      </label>
                      <label className={`flex items-center gap-1.5 cursor-pointer px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                        line.italic ? 'bg-indigo-100 border-indigo-300 text-indigo-700' : 'border-slate-200 text-slate-500 hover:bg-slate-100'
                      }`}>
                        <input type="checkbox" checked={line.italic} onChange={e => updateKopLine(idx, { italic: e.target.checked })} className="hidden" />
                        <em>I</em> Italic
                      </label>
                      <label className={`flex items-center gap-1.5 cursor-pointer px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                        line.uppercase ? 'bg-indigo-100 border-indigo-300 text-indigo-700' : 'border-slate-200 text-slate-500 hover:bg-slate-100'
                      }`}>
                        <input type="checkbox" checked={line.uppercase} onChange={e => updateKopLine(idx, { uppercase: e.target.checked })} className="hidden" />
                        AB UPPER
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card space-y-4">
            <h3 className="text-sm font-semibold text-slate-800 border-b border-slate-200 pb-3">Pengaturan Tambahan KOP</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Garis Border KOP</label>
                <select value={kop.borderStyle} onChange={e => updateKop({ borderStyle: e.target.value as typeof kop.borderStyle })} className="input-field text-sm">
                  <option value="double">Garis Ganda (Double)</option>
                  <option value="single">Garis Tunggal</option>
                  <option value="thick">Garis Tebal</option>
                  <option value="none">Tanpa Garis</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Ukuran Font Alamat (pt)</label>
                <input type="number" min={6} max={14} value={kop.addressFontSize} onChange={e => updateKop({ addressFontSize: parseInt(e.target.value) || 9 })} className="input-field text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Ukuran Font Kontak (pt)</label>
                <input type="number" min={6} max={14} value={kop.contactFontSize} onChange={e => updateKop({ contactFontSize: parseInt(e.target.value) || 9 })} className="input-field text-sm" />
              </div>
              <div className="flex flex-col gap-2 pt-5">
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input type="checkbox" checked={kop.showAddress} onChange={e => updateKop({ showAddress: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-indigo-600" />
                  Tampilkan Alamat
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input type="checkbox" checked={kop.showContact} onChange={e => updateKop({ showContact: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-indigo-600" />
                  Tampilkan Kontak
                </label>
              </div>
            </div>
          </div>

          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800">Preview KOP Surat</h3>
              <button onClick={() => setShowKopPreview(!showKopPreview)} className="btn-secondary !py-1.5 !px-3 text-xs">
                <Eye size={14} /> {showKopPreview ? 'Sembunyikan' : 'Tampilkan'} Preview
              </button>
            </div>
            {showKopPreview && (
              <div className="border rounded-xl p-8 bg-white" style={{ fontFamily: 'Times New Roman, serif' }}>
                <KopSurat settings={form} />
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button onClick={handleSave} className="btn-primary"><Save size={16} /> Simpan Pengaturan</button>
          </div>
        </div>
      )}

      {/* Logo Settings */}
      {activeTab === 'logo' && (
        <div className="space-y-4">
          <div className="card space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
              <ImageIcon size={16} className="text-indigo-500" />
              <h3 className="text-sm font-semibold text-slate-800">Logo KOP Surat</h3>
            </div>
            <p className="text-xs text-slate-500">Upload logo dan atur ukuran serta posisi logo di KOP surat.</p>

            <div className="grid sm:grid-cols-2 gap-6">
              {/* Logo Kiri */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-700">Logo Kiri (Instansi/Pemda)</h4>
                {form.logoKiri ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <div className="border rounded-xl p-4 bg-slate-50 flex-1 flex items-center justify-center">
                        <img src={form.logoKiri} alt="Logo Kiri" style={{ width: `${kop.logoKiriSize}px`, height: `${kop.logoKiriSize}px` }} className="object-contain" />
                      </div>
                      <button onClick={() => setForm(p => ({ ...p, logoKiri: undefined }))} className="btn-danger flex-shrink-0 !p-2"><X size={16} /></button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div><label className="block text-xs font-medium text-slate-600 mb-1">Ukuran (px)</label><input type="number" min={30} max={150} value={kop.logoKiriSize} onChange={e => updateKop({ logoKiriSize: parseInt(e.target.value) || 70 })} className="input-field text-sm" /></div>
                      <div><label className="block text-xs font-medium text-slate-600 mb-1">Offset X</label><input type="number" min={-50} max={50} value={kop.logoKiriOffsetX} onChange={e => updateKop({ logoKiriOffsetX: parseInt(e.target.value) || 0 })} className="input-field text-sm" /></div>
                      <div><label className="block text-xs font-medium text-slate-600 mb-1">Offset Y</label><input type="number" min={-30} max={30} value={kop.logoKiriOffsetY} onChange={e => updateKop({ logoKiriOffsetY: parseInt(e.target.value) || 0 })} className="input-field text-sm" /></div>
                    </div>
                    <div><label className="block text-xs font-medium text-slate-600 mb-1">Geser Ukuran: {kop.logoKiriSize}px</label><input type="range" min={30} max={150} value={kop.logoKiriSize} onChange={e => updateKop({ logoKiriSize: parseInt(e.target.value) })} className="w-full accent-indigo-600" /></div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-indigo-400 transition-colors">
                    <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'logoKiri')} className="hidden" id="logo-kiri" />
                    <label htmlFor="logo-kiri" className="cursor-pointer"><Upload size={28} className="mx-auto text-slate-400 mb-2" /><p className="text-sm font-medium text-slate-600">Upload Logo Kiri</p><p className="text-xs text-slate-400 mt-1">PNG, JPG (Maks. 2MB)</p></label>
                  </div>
                )}
              </div>

              {/* Logo Kanan */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-700">Logo Kanan (Sekolah/Tut Wuri)</h4>
                {form.logoKanan ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <div className="border rounded-xl p-4 bg-slate-50 flex-1 flex items-center justify-center">
                        <img src={form.logoKanan} alt="Logo Kanan" style={{ width: `${kop.logoKananSize}px`, height: `${kop.logoKananSize}px` }} className="object-contain" />
                      </div>
                      <button onClick={() => setForm(p => ({ ...p, logoKanan: undefined }))} className="btn-danger flex-shrink-0 !p-2"><X size={16} /></button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div><label className="block text-xs font-medium text-slate-600 mb-1">Ukuran (px)</label><input type="number" min={30} max={150} value={kop.logoKananSize} onChange={e => updateKop({ logoKananSize: parseInt(e.target.value) || 70 })} className="input-field text-sm" /></div>
                      <div><label className="block text-xs font-medium text-slate-600 mb-1">Offset X</label><input type="number" min={-50} max={50} value={kop.logoKananOffsetX} onChange={e => updateKop({ logoKananOffsetX: parseInt(e.target.value) || 0 })} className="input-field text-sm" /></div>
                      <div><label className="block text-xs font-medium text-slate-600 mb-1">Offset Y</label><input type="number" min={-30} max={30} value={kop.logoKananOffsetY} onChange={e => updateKop({ logoKananOffsetY: parseInt(e.target.value) || 0 })} className="input-field text-sm" /></div>
                    </div>
                    <div><label className="block text-xs font-medium text-slate-600 mb-1">Geser Ukuran: {kop.logoKananSize}px</label><input type="range" min={30} max={150} value={kop.logoKananSize} onChange={e => updateKop({ logoKananSize: parseInt(e.target.value) })} className="w-full accent-indigo-600" /></div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-indigo-400 transition-colors">
                    <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'logoKanan')} className="hidden" id="logo-kanan" />
                    <label htmlFor="logo-kanan" className="cursor-pointer"><Upload size={28} className="mx-auto text-slate-400 mb-2" /><p className="text-sm font-medium text-slate-600">Upload Logo Kanan</p><p className="text-xs text-slate-400 mt-1">PNG, JPG (Maks. 2MB)</p></label>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="card space-y-4">
            <h3 className="text-sm font-semibold text-slate-800 border-b border-slate-200 pb-3">Preview KOP dengan Logo</h3>
            <div className="border rounded-xl p-8 bg-white" style={{ fontFamily: 'Times New Roman, serif' }}>
              <KopSurat settings={form} />
            </div>
          </div>

          <div className="flex justify-end">
            <button onClick={handleSave} className="btn-primary"><Save size={16} /> Simpan Pengaturan</button>
          </div>
        </div>
      )}

      {/* TTD & Stempel */}
      {activeTab === 'ttd' && (
        <div className="space-y-4">
          <div className="card space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
              <Image size={16} className="text-indigo-500" />
              <h3 className="text-sm font-semibold text-slate-800">Tanda Tangan Kepala Sekolah</h3>
            </div>
            {form.tandaTangan ? (
              <div className="flex items-center gap-4">
                <div className="border rounded-xl p-4 bg-slate-50 flex-1 flex items-center justify-center"><img src={form.tandaTangan} alt="TTD" className="max-h-32" /></div>
                <button onClick={() => setForm(p => ({ ...p, tandaTangan: undefined }))} className="btn-danger flex-shrink-0"><X size={16} /> Hapus</button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-indigo-400 transition-colors">
                <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'tandaTangan')} className="hidden" id="ttd-settings" />
                <label htmlFor="ttd-settings" className="cursor-pointer"><Upload size={32} className="mx-auto text-slate-400 mb-2" /><p className="text-sm font-medium text-slate-600">Upload tanda tangan</p><p className="text-xs text-slate-400 mt-1">PNG, JPG (Maks. 2MB)</p></label>
              </div>
            )}
          </div>

          <div className="card space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
              <Stamp size={16} className="text-indigo-500" />
              <h3 className="text-sm font-semibold text-slate-800">Stempel Sekolah</h3>
            </div>
            {form.stempel ? (
              <div className="flex items-center gap-4">
                <div className="border rounded-xl p-4 bg-slate-50 flex-1 flex items-center justify-center"><img src={form.stempel} alt="Stempel" className="max-h-32" /></div>
                <button onClick={() => setForm(p => ({ ...p, stempel: undefined }))} className="btn-danger flex-shrink-0"><X size={16} /> Hapus</button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-indigo-400 transition-colors">
                <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'stempel')} className="hidden" id="stempel-settings" />
                <label htmlFor="stempel-settings" className="cursor-pointer"><Upload size={32} className="mx-auto text-slate-400 mb-2" /><p className="text-sm font-medium text-slate-600">Upload stempel</p><p className="text-xs text-slate-400 mt-1">PNG, JPG (Maks. 2MB)</p></label>
              </div>
            )}
          </div>

          <div className="card space-y-4">
            <h3 className="text-sm font-semibold text-slate-800 border-b border-slate-200 pb-3">Preview Area Tanda Tangan</h3>
            <div className="border rounded-xl p-6 bg-white text-center" style={{ fontFamily: 'Times New Roman, serif' }}>
              <p className="text-sm">Genteng, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              <p className="text-sm font-semibold">Kepala Sekolah,</p>
              <div className="relative h-28 my-2 mx-auto" style={{ width: '200px' }}>
                {form.stempel && <img src={form.stempel} alt="Stempel" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-24 opacity-60" />}
                {form.tandaTangan && <img src={form.tandaTangan} alt="TTD" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-20" />}
                {!form.tandaTangan && !form.stempel && <div className="h-full flex items-center justify-center text-slate-300 text-xs">(Area TTD & Stempel)</div>}
              </div>
              <p className="text-sm font-semibold underline">{form.kepalaSekolah}</p>
              <p className="text-xs">NIP. {form.nipKepala}</p>
            </div>
          </div>

          <div className="flex justify-end">
            <button onClick={handleSave} className="btn-primary"><Save size={16} /> Simpan Pengaturan</button>
          </div>
        </div>
      )}

      {/* ======================= DATABASE TAB ======================= */}
      {activeTab === 'database' && (
        <div className="space-y-5">

          {/* Messages */}
          {restoreMessage && (
            <div className={`rounded-xl p-4 flex items-start gap-3 border animate-fade-in ${
              restoreMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              {restoreMessage.type === 'success' ? <CheckCircle size={20} className="flex-shrink-0 mt-0.5" /> : <AlertTriangle size={20} className="flex-shrink-0 mt-0.5" />}
              <div>
                <p className="text-sm font-semibold">{restoreMessage.type === 'success' ? 'Berhasil!' : 'Gagal!'}</p>
                <p className="text-sm mt-0.5">{restoreMessage.text}</p>
              </div>
              <button onClick={() => setRestoreMessage(null)} className="ml-auto flex-shrink-0 p-1 rounded-lg hover:bg-black/5"><X size={16} /></button>
            </div>
          )}

          {clearSuccess && (
            <div className="rounded-xl p-4 flex items-center gap-3 border bg-emerald-50 border-emerald-200 text-emerald-800 animate-fade-in">
              <CheckCircle size={20} />
              <p className="text-sm font-semibold">Data berhasil dihapus!</p>
            </div>
          )}

          {/* Header Card - Storage Overview */}
          <div className="card overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 p-6 sm:p-8 -m-5 sm:-m-6 mb-0">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center">
                  <HardDrive size={32} className="text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl sm:text-2xl font-bold text-white">Manajemen Database</h2>
                  <p className="text-indigo-100 text-sm mt-1">Backup, restore, dan kelola data aplikasi surat menyurat</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs text-indigo-200 uppercase tracking-wider">Total Penyimpanan</p>
                    <p className="text-2xl font-bold text-white">{dbStats?.totalSizeKB?.toFixed(1) || '0'} <span className="text-sm font-normal text-indigo-200">KB</span></p>
                  </div>
                  <button onClick={refreshDbStats} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors" title="Refresh">
                    <RefreshCw size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          {dbStats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Surat Masuk', count: dbStats.suratMasuk.count, size: dbStats.suratMasuk.sizeKB, color: 'blue', icon: Archive },
                { label: 'Surat Keluar', count: dbStats.suratKeluar.count, size: dbStats.suratKeluar.sizeKB, color: 'indigo', icon: Archive },
                { label: 'Disposisi', count: dbStats.disposisi.count, size: dbStats.disposisi.sizeKB, color: 'purple', icon: Archive },
                { label: 'Template', count: dbStats.templates.count, size: dbStats.templates.sizeKB, color: 'teal', icon: FileJson },
              ].map(item => (
                <div key={item.label} className="card !p-4 border border-slate-100">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-${item.color}-100`}>
                      <item.icon size={16} className={`text-${item.color}-600`} />
                    </div>
                    <span className="text-xs text-slate-500 font-medium">{item.label}</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-800">{item.count}</p>
                  <p className="text-xs text-slate-400">{item.size} KB</p>
                </div>
              ))}
            </div>
          )}

          {/* Storage Detail Table */}
          {dbStats && (
            <div className="card">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-4">
                <BarChart3 size={16} className="text-indigo-500" />
                <h3 className="text-sm font-semibold text-slate-800">Detail Penyimpanan</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase">Tabel Data</th>
                      <th className="text-right py-2 px-3 text-xs font-semibold text-slate-500 uppercase">Jumlah</th>
                      <th className="text-right py-2 px-3 text-xs font-semibold text-slate-500 uppercase">Ukuran</th>
                      <th className="text-right py-2 px-3 text-xs font-semibold text-slate-500 uppercase hidden sm:table-cell">Persentase</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {[
                      { label: 'Surat Masuk', count: dbStats.suratMasuk.count, size: dbStats.suratMasuk.sizeKB },
                      { label: 'Surat Keluar', count: dbStats.suratKeluar.count, size: dbStats.suratKeluar.sizeKB },
                      { label: 'Disposisi', count: dbStats.disposisi.count, size: dbStats.disposisi.sizeKB },
                      { label: 'Template', count: dbStats.templates.count, size: dbStats.templates.sizeKB },
                      { label: 'Pengaturan', count: '-', size: dbStats.settings.sizeKB },
                      { label: 'Pengguna', count: dbStats.users.count, size: dbStats.users.sizeKB },
                      { label: 'Hak Akses', count: '-', size: dbStats.permissions.sizeKB },
                      { label: 'Riwayat Backup', count: dbStats.backupHistory.count, size: dbStats.backupHistory.sizeKB },
                    ].map(row => {
                      const pct = dbStats.totalSizeKB > 0 ? ((row.size / dbStats.totalSizeKB) * 100) : 0;
                      return (
                        <tr key={row.label} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-medium text-slate-700">{row.label}</td>
                          <td className="py-2.5 px-3 text-right text-slate-600">{row.count}</td>
                          <td className="py-2.5 px-3 text-right text-slate-600">{row.size} KB</td>
                          <td className="py-2.5 px-3 text-right hidden sm:table-cell">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.max(pct, 1)}%` }} />
                              </div>
                              <span className="text-xs text-slate-500 w-12 text-right">{pct.toFixed(1)}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-200 font-semibold">
                      <td className="py-2.5 px-3 text-slate-800">Total</td>
                      <td className="py-2.5 px-3 text-right text-slate-800">-</td>
                      <td className="py-2.5 px-3 text-right text-slate-800">{dbStats.totalSizeKB} KB</td>
                      <td className="py-2.5 px-3 text-right text-slate-800 hidden sm:table-cell">100%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Backup & Restore Actions */}
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Backup Card */}
            <div className="card border-2 border-indigo-100 hover:border-indigo-300 transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-200">
                  <Download size={28} className="text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-800 text-lg">Backup Database</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Simpan seluruh data ke file JSON. Termasuk surat, disposisi, template, pengaturan, akun pengguna, dan hak akses.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {['Surat', 'Disposisi', 'Template', 'Pengaturan', 'Akun', 'Hak Akses'].map(t => (
                      <span key={t} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-xs rounded-full font-medium">{t}</span>
                    ))}
                  </div>
                  <button
                    onClick={handleBackup}
                    disabled={isBackingUp}
                    className="mt-4 w-full btn-primary !justify-center disabled:opacity-50"
                  >
                    {isBackingUp ? (
                      <><RefreshCw size={16} className="animate-spin" /> Membuat Backup...</>
                    ) : (
                      <><Download size={16} /> Download Backup</>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Restore Card */}
            <div className="card border-2 border-emerald-100 hover:border-emerald-300 transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-200">
                  <UploadCloud size={28} className="text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-800 text-lg">Restore Database</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Pulihkan data dari file backup JSON. Data saat ini akan <strong>ditimpa</strong> dengan data dari backup.
                  </p>
                  <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-2.5 flex items-start gap-2">
                    <AlertTriangle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700">Data yang ada akan ditimpa. Disarankan backup terlebih dahulu sebelum restore.</p>
                  </div>
                  <input
                    ref={restoreInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleRestore}
                    className="hidden"
                  />
                  <button
                    onClick={() => restoreInputRef.current?.click()}
                    disabled={isRestoring}
                    className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
                  >
                    {isRestoring ? (
                      <><RefreshCw size={16} className="animate-spin" /> Memulihkan Data...</>
                    ) : (
                      <><UploadCloud size={16} /> Upload & Restore Backup</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Backup History */}
          <div className="card">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <Clock size={16} className="text-indigo-500" /> Riwayat Backup & Restore
              </h3>
              <span className="text-xs text-slate-400">{backupHistory.length} catatan</span>
            </div>

            {backupHistory.length === 0 ? (
              <div className="text-center py-10">
                <History size={40} className="mx-auto text-slate-300 mb-3" />
                <p className="text-sm text-slate-500 font-medium">Belum ada riwayat backup</p>
                <p className="text-xs text-slate-400 mt-1">Riwayat backup & restore akan muncul di sini</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {backupHistory.map(item => (
                  <div key={item.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors hover:bg-slate-50 ${
                    item.type === 'backup' ? 'border-indigo-100' : 'border-emerald-100'
                  }`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      item.type === 'backup' ? 'bg-indigo-100' : 'bg-emerald-100'
                    }`}>
                      {item.type === 'backup'
                        ? <Download size={18} className="text-indigo-600" />
                        : <UploadCloud size={18} className="text-emerald-600" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          item.type === 'backup' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {item.type === 'backup' ? 'Backup' : 'Restore'}
                        </span>
                        <p className="text-xs text-slate-500">{formatDate(item.date)}</p>
                      </div>
                      <p className="text-sm text-slate-700 font-medium truncate mt-0.5" title={item.filename}>
                        {item.filename}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
                        <span>{item.size}</span>
                        <span>•</span>
                        <span>SM:{item.stats.suratMasuk} SK:{item.stats.suratKeluar} D:{item.stats.disposisi} T:{item.stats.templates}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Danger Zone - Delete Database */}
          <div className="card border-2 border-red-200 bg-gradient-to-r from-red-50/80 to-orange-50/50">
            <div className="flex items-center gap-2 border-b border-red-200 pb-3 mb-5">
              <AlertTriangle size={16} className="text-red-500" />
              <h3 className="text-sm font-semibold text-red-700">Zona Berbahaya — Hapus Data</h3>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {/* Selective Delete */}
              <div className="bg-white rounded-xl border border-red-100 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-xl bg-red-100 flex items-center justify-center">
                    <Trash2 size={22} className="text-red-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800">Hapus Data Selektif</h4>
                    <p className="text-xs text-slate-500">Pilih tabel yang ingin dihapus</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mb-3">
                  Hapus data tertentu saja tanpa menghapus semua. Cocok untuk membersihkan data uji coba.
                </p>
                <button
                  onClick={() => setShowClearModal(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-red-600 border-2 border-red-200 hover:bg-red-50 font-medium rounded-xl transition-colors text-sm"
                >
                  <Trash2 size={16} /> Hapus Data Selektif
                </button>
              </div>

              {/* Delete All */}
              <div className="bg-white rounded-xl border border-red-100 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-xl bg-red-500 flex items-center justify-center">
                    <Database size={22} className="text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800">Hapus Semua Data</h4>
                    <p className="text-xs text-slate-500">Reset ke kondisi awal (factory reset)</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mb-3">
                  Menghapus <strong>semua data</strong> dan mengembalikan aplikasi ke kondisi awal. Tindakan ini <strong className="text-red-600">tidak dapat dibatalkan</strong>.
                </p>
                <button
                  onClick={handleClearAll}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all text-sm ${
                    confirmReset
                      ? 'bg-red-600 text-white shadow-lg shadow-red-200 animate-pulse'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  <Trash size={16} />
                  {confirmReset ? '⚠️ Klik Lagi Untuk Konfirmasi!' : 'Hapus Semua & Reset'}
                </button>
                {confirmReset && (
                  <div className="mt-2 bg-red-100 border border-red-200 rounded-lg p-2.5 flex items-start gap-2">
                    <AlertTriangle size={14} className="text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] text-red-700">
                      Klik tombol lagi dalam 5 detik untuk konfirmasi. Halaman akan reload setelah reset.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======= CLEAR MODAL ======= */}
      {showClearModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowClearModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-orange-500 p-5 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Trash2 size={24} className="text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-white">Hapus Data Selektif</h2>
                  <p className="text-red-100 text-sm">Pilih data yang ingin dihapus secara permanen</p>
                </div>
                <button onClick={() => setShowClearModal(false)} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white"><X size={18} /></button>
              </div>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              {/* Select All */}
              <div className="flex items-center justify-between">
                <button
                  onClick={toggleAllClear}
                  className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-800"
                >
                  {selectedClearCount === totalClearOptions ? <CheckSquare size={16} /> : <Square size={16} />}
                  {selectedClearCount === totalClearOptions ? 'Batal Pilih Semua' : 'Pilih Semua'}
                </button>
                <span className="text-xs text-slate-400">{selectedClearCount} dari {totalClearOptions} dipilih</span>
              </div>

              {/* Checkboxes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(Object.keys(clearOptions) as (keyof ClearOptions)[]).map(key => {
                  const info = clearTableNames[key];
                  const checked = clearOptions[key];
                  const count = dbStats ? (
                    key === 'suratMasuk' ? dbStats.suratMasuk.count :
                    key === 'suratKeluar' ? dbStats.suratKeluar.count :
                    key === 'disposisi' ? dbStats.disposisi.count :
                    key === 'templates' ? dbStats.templates.count :
                    key === 'users' ? dbStats.users.count :
                    key === 'backupHistory' ? dbStats.backupHistory.count :
                    null
                  ) : null;

                  return (
                    <label
                      key={key}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        checked
                          ? 'border-red-300 bg-red-50 shadow-sm'
                          : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={e => setClearOptions(p => ({ ...p, [key]: e.target.checked }))}
                        className="hidden"
                      />
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        checked ? 'bg-red-200' : 'bg-slate-100'
                      }`}>
                        {checked
                          ? <CheckSquare size={16} className="text-red-600" />
                          : <info.icon size={16} className="text-slate-400" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${checked ? 'text-red-700' : 'text-slate-700'}`}>{info.label}</p>
                        {count !== null && <p className="text-xs text-slate-400">{count} data</p>}
                      </div>
                    </label>
                  );
                })}
              </div>

              {/* Warning */}
              {selectedClearCount > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-red-700">Peringatan!</p>
                      <p className="text-xs text-red-600 mt-0.5">
                        {selectedClearCount} tabel data akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan. 
                        Disarankan untuk membuat <strong>backup</strong> terlebih dahulu.
                      </p>
                    </div>
                  </div>

                  {/* Confirmation Input */}
                  <div>
                    <label className="block text-xs font-semibold text-red-700 mb-1.5">
                      Ketik <strong className="font-mono bg-red-100 px-1.5 py-0.5 rounded">HAPUS</strong> untuk konfirmasi:
                    </label>
                    <input
                      type="text"
                      value={confirmClearText}
                      onChange={e => setConfirmClearText(e.target.value)}
                      placeholder="Ketik HAPUS di sini..."
                      className="w-full px-3 py-2 border-2 border-red-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400 placeholder-red-300"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-100">
              <button onClick={() => { setShowClearModal(false); setConfirmClearText(''); }} className="btn-secondary">
                Batal
              </button>
              <button
                onClick={handleClearDatabase}
                disabled={selectedClearCount === 0 || confirmClearText !== 'HAPUS'}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Trash2 size={16} /> Hapus {selectedClearCount} Tabel Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mode Aplikasi (Demo Mode) */}
      {activeTab === 'demo' && (
        <div className="space-y-4">
          <div className="card overflow-hidden">
            <div className={`p-6 sm:p-8 transition-colors duration-500 ${
              demoMode
                ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-b-2 border-amber-200'
                : 'bg-gradient-to-r from-emerald-50 to-teal-50 border-b-2 border-emerald-200'
            }`}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <div className={`flex-shrink-0 w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg ${
                  demoMode
                    ? 'bg-gradient-to-br from-amber-400 to-orange-500'
                    : 'bg-gradient-to-br from-emerald-400 to-teal-500'
                }`}>
                  {demoMode ? <FlaskConical size={36} className="text-white" /> : <ShieldCheck size={36} className="text-white" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className={`text-xl sm:text-2xl font-bold ${demoMode ? 'text-amber-800' : 'text-emerald-800'}`}>
                      {demoMode ? 'Mode Demo' : 'Mode Produksi'}
                    </h2>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      demoMode ? 'bg-amber-200 text-amber-800' : 'bg-emerald-200 text-emerald-800'
                    }`}>AKTIF</span>
                  </div>
                  <p className={`text-sm ${demoMode ? 'text-amber-700' : 'text-emerald-700'}`}>
                    {demoMode
                      ? 'Aplikasi berjalan dalam mode demo. Tombol login cepat ditampilkan di halaman login untuk memudahkan pengujian.'
                      : 'Aplikasi berjalan dalam mode produksi. Halaman login tampil bersih tanpa tombol login cepat.'}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <button
                    onClick={() => setDemoMode(!demoMode)}
                    className={`relative inline-flex h-10 w-20 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-4 shadow-inner ${
                      demoMode ? 'bg-amber-500 focus:ring-amber-200' : 'bg-emerald-500 focus:ring-emerald-200'
                    }`}
                  >
                    <span className={`inline-block h-8 w-8 transform rounded-full bg-white transition-transform duration-300 shadow-lg ${
                      demoMode ? 'translate-x-10' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className={`card border-2 transition-all duration-300 ${
              demoMode ? 'border-amber-300 ring-2 ring-amber-100 shadow-lg' : 'border-slate-200 opacity-60'
            }`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center"><FlaskConical size={20} className="text-amber-600" /></div>
                <div><h3 className="font-semibold text-slate-800">Mode Demo</h3><p className="text-xs text-slate-500">Untuk pengujian & demonstrasi</p></div>
                {demoMode && <span className="ml-auto px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">AKTIF</span>}
              </div>
              <ul className="space-y-2.5 text-sm text-slate-600">
                <li className="flex items-start gap-2"><Monitor size={16} className="text-amber-500 mt-0.5 flex-shrink-0" /><span>Tombol <strong>Login Cepat</strong> ditampilkan di halaman login</span></li>
                <li className="flex items-start gap-2"><Monitor size={16} className="text-amber-500 mt-0.5 flex-shrink-0" /><span>Badge <strong>"Mode Demo Aktif"</strong> muncul di login page</span></li>
                <li className="flex items-start gap-2"><Monitor size={16} className="text-amber-500 mt-0.5 flex-shrink-0" /><span>Mudah berpindah akun untuk demo <strong>(Admin, Operator, Kepsek)</strong></span></li>
                <li className="flex items-start gap-2"><AlertTriangle size={16} className="text-amber-500 mt-0.5 flex-shrink-0" /><span className="text-amber-700 font-medium">Tidak disarankan untuk lingkungan produksi</span></li>
              </ul>
              {!demoMode && <button onClick={() => setDemoMode(true)} className="mt-4 w-full py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 font-medium rounded-xl border border-amber-200 transition-colors text-sm">Aktifkan Mode Demo</button>}
            </div>

            <div className={`card border-2 transition-all duration-300 ${
              !demoMode ? 'border-emerald-300 ring-2 ring-emerald-100 shadow-lg' : 'border-slate-200 opacity-60'
            }`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center"><ShieldCheck size={20} className="text-emerald-600" /></div>
                <div><h3 className="font-semibold text-slate-800">Mode Produksi</h3><p className="text-xs text-slate-500">Untuk penggunaan sehari-hari</p></div>
                {!demoMode && <span className="ml-auto px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">AKTIF</span>}
              </div>
              <ul className="space-y-2.5 text-sm text-slate-600">
                <li className="flex items-start gap-2"><ShieldCheck size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" /><span>Halaman login <strong>bersih & profesional</strong></span></li>
                <li className="flex items-start gap-2"><ShieldCheck size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" /><span>Tombol login cepat <strong>tidak ditampilkan</strong></span></li>
                <li className="flex items-start gap-2"><ShieldCheck size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" /><span>Tampilan <strong>aman untuk presentasi</strong> & akses publik</span></li>
                <li className="flex items-start gap-2"><ShieldCheck size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" /><span className="text-emerald-700 font-medium">Direkomendasikan untuk penggunaan nyata</span></li>
              </ul>
              {demoMode && <button onClick={() => setDemoMode(false)} className="mt-4 w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium rounded-xl border border-emerald-200 transition-colors text-sm">Aktifkan Mode Produksi</button>}
            </div>
          </div>

          {/* Preview Login */}
          <div className="card space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
              <Eye size={16} className="text-indigo-500" />
              <h3 className="text-sm font-semibold text-slate-800">Preview Halaman Login</h3>
            </div>
            <div className="rounded-xl overflow-hidden border border-slate-200 shadow-inner">
              <div className="bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 p-6 sm:p-8">
                <div className="max-w-xs mx-auto">
                  <div className="text-center mb-4">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-white/10 rounded-xl mb-2">
                      <School size={24} className="text-indigo-300" />
                    </div>
                    <h4 className="text-sm font-bold text-white">SMP Negeri 1 Genteng</h4>
                    <p className="text-[10px] text-indigo-300">Sistem Administrasi Surat Menyurat</p>
                  </div>

                  {demoMode && (
                    <div className="flex justify-center mb-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-medium rounded-full">
                        <FlaskConical size={10} /> Mode Demo Aktif
                      </span>
                    </div>
                  )}

                  <div className="bg-white/10 backdrop-blur rounded-xl border border-white/10 overflow-hidden">
                    <div className="p-4 space-y-2">
                      <div className="bg-white/10 rounded-lg h-8 w-full" />
                      <div className="bg-white/10 rounded-lg h-8 w-full" />
                      <div className="bg-indigo-600 rounded-lg h-8 w-full flex items-center justify-center">
                        <span className="text-white text-[10px] font-medium">Masuk</span>
                      </div>
                    </div>
                    {demoMode && (
                      <div className="border-t border-white/10 bg-white/5 p-3">
                        <p className="text-[9px] text-amber-300/80 text-center mb-2">Demo Login Cepat</p>
                        <div className="grid grid-cols-3 gap-1.5">
                          {['Admin', 'Operator', 'Kepsek'].map(r => (
                            <div key={r} className="bg-white/5 rounded p-1.5 text-center border border-white/10">
                              <div className="w-3 h-3 bg-indigo-400/40 rounded-full mx-auto mb-0.5" />
                              <span className="text-[8px] text-indigo-200">{r}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {!demoMode && (
                      <div className="border-t border-white/10 bg-white/5 p-3">
                        <p className="text-[9px] text-indigo-300/50 text-center">Hubungi administrator untuk mendapatkan akses</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-500 text-center">
              {demoMode
                ? '↑ Tampilan login saat ini menampilkan tombol demo login cepat'
                : '↑ Tampilan login saat ini bersih tanpa tombol demo'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
