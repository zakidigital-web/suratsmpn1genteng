import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SuratMasuk, SuratKeluar, SchoolSettings, Disposisi, SuratTemplate, DEFAULT_SETTINGS, DEFAULT_TEMPLATES, DEFAULT_KOP_SETTINGS } from '../types';

export interface BackupData {
  version: string;
  appName: string;
  createdAt: string;
  schoolName: string;
  data: {
    suratMasuk: SuratMasuk[];
    suratKeluar: SuratKeluar[];
    disposisi: Disposisi[];
    templates: SuratTemplate[];
    settings: SchoolSettings;
    users: unknown[];
    permissions: unknown;
    demoMode: boolean;
  };
  stats: {
    totalSuratMasuk: number;
    totalSuratKeluar: number;
    totalDisposisi: number;
    totalTemplates: number;
    totalUsers: number;
  };
  checksum: string;
}

export interface BackupHistoryItem {
  id: string;
  date: string;
  type: 'backup' | 'restore';
  filename: string;
  size: string;
  stats: {
    suratMasuk: number;
    suratKeluar: number;
    disposisi: number;
    templates: number;
  };
}

interface SuratContextType {
  suratMasuk: SuratMasuk[];
  suratKeluar: SuratKeluar[];
  disposisi: Disposisi[];
  templates: SuratTemplate[];
  settings: SchoolSettings;
  demoMode: boolean;
  setDemoMode: (v: boolean) => void;
  addSuratMasuk: (s: SuratMasuk) => void;
  updateSuratMasuk: (s: SuratMasuk) => void;
  deleteSuratMasuk: (id: string) => void;
  addSuratKeluar: (s: SuratKeluar) => void;
  updateSuratKeluar: (s: SuratKeluar) => void;
  deleteSuratKeluar: (id: string) => void;
  addDisposisi: (d: Disposisi) => void;
  updateDisposisi: (d: Disposisi) => void;
  deleteDisposisi: (id: string) => void;
  addTemplate: (t: SuratTemplate) => void;
  updateTemplate: (t: SuratTemplate) => void;
  deleteTemplate: (id: string) => void;
  updateSettings: (s: SchoolSettings) => void;
  importData: (data: { suratMasuk?: SuratMasuk[]; suratKeluar?: SuratKeluar[] }) => void;
  // Database management
  createBackup: () => BackupData;
  restoreBackup: (data: BackupData) => { success: boolean; message: string };
  clearDatabase: (options: ClearOptions) => void;
  getBackupHistory: () => BackupHistoryItem[];
  addBackupHistory: (item: BackupHistoryItem) => void;
  getDatabaseStats: () => DatabaseStats;
}

export interface ClearOptions {
  suratMasuk: boolean;
  suratKeluar: boolean;
  disposisi: boolean;
  templates: boolean;
  settings: boolean;
  users: boolean;
  permissions: boolean;
  backupHistory: boolean;
}

export interface DatabaseStats {
  suratMasuk: { count: number; sizeKB: number };
  suratKeluar: { count: number; sizeKB: number };
  disposisi: { count: number; sizeKB: number };
  templates: { count: number; sizeKB: number };
  settings: { sizeKB: number };
  users: { count: number; sizeKB: number };
  permissions: { sizeKB: number };
  backupHistory: { count: number; sizeKB: number };
  totalSizeKB: number;
}

const SuratContext = createContext<SuratContextType | null>(null);

const SAMPLE_SURAT_MASUK: SuratMasuk[] = [
  { id: 'sm1', nomorSurat: '420/101/35.09.01/2024', tanggalSurat: '2024-01-15', tanggalTerima: '2024-01-16', pengirim: 'Dinas Pendidikan Kab. Banyuwangi', perihal: 'Pelaksanaan ANBK Tahun 2024', kategori: 'Dinas', status: 'diproses', catatan: 'Segera ditindaklanjuti', createdAt: '2024-01-16T08:00:00' },
  { id: 'sm2', nomorSurat: '005/022/35.09.01/2024', tanggalSurat: '2024-01-20', tanggalTerima: '2024-01-21', pengirim: 'Kementerian Pendidikan', perihal: 'Undangan Workshop Kurikulum Merdeka', kategori: 'Undangan', status: 'belum_dibaca', catatan: '', createdAt: '2024-01-21T09:00:00' },
  { id: 'sm3', nomorSurat: '800/045/35.09.01/2024', tanggalSurat: '2024-02-01', tanggalTerima: '2024-02-02', pengirim: 'BKD Kabupaten Banyuwangi', perihal: 'Pemutakhiran Data ASN', kategori: 'Edaran', status: 'selesai', catatan: 'Data sudah dikirim', createdAt: '2024-02-02T10:00:00' },
  { id: 'sm4', nomorSurat: '421/089/2024', tanggalSurat: '2024-02-10', tanggalTerima: '2024-02-11', pengirim: 'SMPN 2 Genteng', perihal: 'Kerjasama Pertukaran Siswa', kategori: 'Pemberitahuan', status: 'dibaca', catatan: '', createdAt: '2024-02-11T08:30:00' },
];

const SAMPLE_SURAT_KELUAR: SuratKeluar[] = [
  { id: 'sk1', nomorSurat: '421/001/35.09.01/2024', tanggalSurat: '2024-01-10', tujuan: 'Dinas Pendidikan Kab. Banyuwangi', perihal: 'Laporan Kegiatan Semester 1', kategori: 'Dinas', status: 'terkirim', isiSurat: '<p>Dengan hormat,</p><p>Bersama ini kami sampaikan laporan kegiatan semester 1 tahun pelajaran 2023/2024.</p>', sifat: 'Biasa', tembusan: 'Arsip', catatan: '', createdAt: '2024-01-10T08:00:00', createdBy: 'operator' },
  { id: 'sk2', nomorSurat: '421/002/35.09.01/2024', tanggalSurat: '2024-01-25', tujuan: 'Orang Tua/Wali Murid Kelas IX', perihal: 'Persiapan Ujian Sekolah', kategori: 'Pemberitahuan', status: 'ditandatangani', isiSurat: '<p>Dengan hormat,</p><p>Menindaklanjuti persiapan Ujian Sekolah tahun 2024.</p>', sifat: 'Penting', tembusan: 'Wali Kelas IX\nArsip', catatan: '', createdAt: '2024-01-25T09:00:00', createdBy: 'operator' },
  { id: 'sk3', nomorSurat: '421/003/35.09.01/2024', tanggalSurat: '2024-02-05', tujuan: 'Kepala Dinas Pendidikan', perihal: 'Permohonan Bantuan Sarana', kategori: 'Permohonan', status: 'menunggu_ttd', isiSurat: '<p>Dengan hormat,</p><p>Dengan ini kami mengajukan permohonan bantuan sarana.</p>', sifat: 'Penting', tembusan: 'Arsip', catatan: '', createdAt: '2024-02-05T10:00:00', createdBy: 'operator' },
];

const SAMPLE_DISPOSISI: Disposisi[] = [
  {
    id: 'dsp1', suratMasukId: 'sm1',
    nomorSurat: '420/101/35.09.01/2024',
    perihal: 'Pelaksanaan ANBK Tahun 2024',
    pengirim: 'Dinas Pendidikan Kab. Banyuwangi',
    tujuanDisposisi: ['Urusan Kurikulum', 'Guru BK'],
    isiDisposisi: 'Mohon dipersiapkan pelaksanaan ANBK sesuai jadwal.',
    sifat: 'segera', batasWaktu: '2024-02-15',
    catatan: 'Koordinasi dengan proktor',
    status: 'diproses', createdAt: '2024-01-17T08:00:00', createdBy: 'admin'
  },
];

function generateChecksum(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

function getStorageSize(key: string): number {
  const data = localStorage.getItem(key);
  return data ? new Blob([data]).size / 1024 : 0;
}

export function SuratProvider({ children }: { children: ReactNode }) {
  const [suratMasuk, setSuratMasuk] = useState<SuratMasuk[]>(() => {
    const s = localStorage.getItem('surat_masuk');
    return s ? JSON.parse(s) : SAMPLE_SURAT_MASUK;
  });
  const [suratKeluar, setSuratKeluar] = useState<SuratKeluar[]>(() => {
    const s = localStorage.getItem('surat_keluar');
    return s ? JSON.parse(s) : SAMPLE_SURAT_KELUAR;
  });
  const [disposisi, setDisposisi] = useState<Disposisi[]>(() => {
    const s = localStorage.getItem('disposisi');
    return s ? JSON.parse(s) : SAMPLE_DISPOSISI;
  });
  const [templates, setTemplates] = useState<SuratTemplate[]>(() => {
    const s = localStorage.getItem('surat_templates');
    return s ? JSON.parse(s) : DEFAULT_TEMPLATES;
  });
  const [settings, setSettings] = useState<SchoolSettings>(() => {
    const s = localStorage.getItem('surat_settings');
    if (s) {
      const parsed = JSON.parse(s);
      if (!parsed.kopSettings) {
        parsed.kopSettings = { ...DEFAULT_KOP_SETTINGS };
      }
      return parsed;
    }
    return DEFAULT_SETTINGS;
  });

  const [demoMode, setDemoModeState] = useState<boolean>(() => {
    const s = localStorage.getItem('surat_demo_mode');
    return s !== null ? JSON.parse(s) : true;
  });

  const setDemoMode = (v: boolean) => {
    setDemoModeState(v);
    localStorage.setItem('surat_demo_mode', JSON.stringify(v));
  };

  useEffect(() => { localStorage.setItem('surat_masuk', JSON.stringify(suratMasuk)); }, [suratMasuk]);
  useEffect(() => { localStorage.setItem('surat_keluar', JSON.stringify(suratKeluar)); }, [suratKeluar]);
  useEffect(() => { localStorage.setItem('disposisi', JSON.stringify(disposisi)); }, [disposisi]);
  useEffect(() => { localStorage.setItem('surat_templates', JSON.stringify(templates)); }, [templates]);
  useEffect(() => { localStorage.setItem('surat_settings', JSON.stringify(settings)); }, [settings]);

  const addSuratMasuk = (s: SuratMasuk) => setSuratMasuk(prev => [s, ...prev]);
  const updateSuratMasuk = (s: SuratMasuk) => setSuratMasuk(prev => prev.map(x => x.id === s.id ? s : x));
  const deleteSuratMasuk = (id: string) => setSuratMasuk(prev => prev.filter(x => x.id !== id));

  const addSuratKeluar = (s: SuratKeluar) => setSuratKeluar(prev => [s, ...prev]);
  const updateSuratKeluar = (s: SuratKeluar) => setSuratKeluar(prev => prev.map(x => x.id === s.id ? s : x));
  const deleteSuratKeluar = (id: string) => setSuratKeluar(prev => prev.filter(x => x.id !== id));

  const addDisposisi = (d: Disposisi) => setDisposisi(prev => [d, ...prev]);
  const updateDisposisi = (d: Disposisi) => setDisposisi(prev => prev.map(x => x.id === d.id ? d : x));
  const deleteDisposisi = (id: string) => setDisposisi(prev => prev.filter(x => x.id !== id));

  const addTemplate = (t: SuratTemplate) => setTemplates(prev => [t, ...prev]);
  const updateTemplate = (t: SuratTemplate) => setTemplates(prev => prev.map(x => x.id === t.id ? t : x));
  const deleteTemplate = (id: string) => setTemplates(prev => prev.filter(x => x.id !== id));

  const updateSettings = (s: SchoolSettings) => setSettings(s);

  const importData = (data: { suratMasuk?: SuratMasuk[]; suratKeluar?: SuratKeluar[] }) => {
    if (data.suratMasuk) setSuratMasuk(prev => [...data.suratMasuk!, ...prev]);
    if (data.suratKeluar) setSuratKeluar(prev => [...data.suratKeluar!, ...prev]);
  };

  // ===== DATABASE MANAGEMENT =====

  const createBackup = (): BackupData => {
    const usersRaw = localStorage.getItem('surat_users');
    const permsRaw = localStorage.getItem('surat_permissions');
    const users = usersRaw ? JSON.parse(usersRaw) : [];
    const perms = permsRaw ? JSON.parse(permsRaw) : {};

    const dataPayload = {
      suratMasuk,
      suratKeluar,
      disposisi,
      templates,
      settings,
      users,
      permissions: perms,
      demoMode,
    };

    const dataString = JSON.stringify(dataPayload);
    const checksum = generateChecksum(dataString);

    return {
      version: '2.0.0',
      appName: 'Surat Menyurat - SMP Negeri 1 Genteng',
      createdAt: new Date().toISOString(),
      schoolName: settings.namaSekolah,
      data: dataPayload,
      stats: {
        totalSuratMasuk: suratMasuk.length,
        totalSuratKeluar: suratKeluar.length,
        totalDisposisi: disposisi.length,
        totalTemplates: templates.length,
        totalUsers: users.length,
      },
      checksum,
    };
  };

  const restoreBackup = (backup: BackupData): { success: boolean; message: string } => {
    try {
      // Validate structure
      if (!backup.version || !backup.data || !backup.appName) {
        return { success: false, message: 'Format file backup tidak valid. Pastikan file yang dipilih adalah backup dari aplikasi ini.' };
      }

      // Validate checksum
      const dataString = JSON.stringify(backup.data);
      const computedChecksum = generateChecksum(dataString);
      if (backup.checksum && backup.checksum !== computedChecksum) {
        return { success: false, message: 'File backup telah dimodifikasi (checksum tidak cocok). Gunakan file backup yang asli.' };
      }

      const d = backup.data;

      // Restore surat data
      if (d.suratMasuk && Array.isArray(d.suratMasuk)) {
        setSuratMasuk(d.suratMasuk);
      }
      if (d.suratKeluar && Array.isArray(d.suratKeluar)) {
        setSuratKeluar(d.suratKeluar);
      }
      if (d.disposisi && Array.isArray(d.disposisi)) {
        setDisposisi(d.disposisi);
      }
      if (d.templates && Array.isArray(d.templates)) {
        setTemplates(d.templates);
      }
      if (d.settings && d.settings.namaSekolah) {
        setSettings(d.settings);
      }
      if (d.users && Array.isArray(d.users)) {
        localStorage.setItem('surat_users', JSON.stringify(d.users));
      }
      if (d.permissions) {
        localStorage.setItem('surat_permissions', JSON.stringify(d.permissions));
      }
      if (d.demoMode !== undefined) {
        setDemoMode(d.demoMode);
      }

      return {
        success: true,
        message: `Backup berhasil dipulihkan! (${backup.stats.totalSuratMasuk} surat masuk, ${backup.stats.totalSuratKeluar} surat keluar, ${backup.stats.totalDisposisi} disposisi, ${backup.stats.totalTemplates} template, ${backup.stats.totalUsers} user)`
      };
    } catch {
      return { success: false, message: 'Gagal memulihkan backup. File mungkin rusak atau format tidak sesuai.' };
    }
  };

  const clearDatabase = (options: ClearOptions) => {
    if (options.suratMasuk) {
      setSuratMasuk([]);
      localStorage.removeItem('surat_masuk');
    }
    if (options.suratKeluar) {
      setSuratKeluar([]);
      localStorage.removeItem('surat_keluar');
    }
    if (options.disposisi) {
      setDisposisi([]);
      localStorage.removeItem('disposisi');
    }
    if (options.templates) {
      setTemplates([]);
      localStorage.removeItem('surat_templates');
    }
    if (options.settings) {
      setSettings(DEFAULT_SETTINGS);
      localStorage.removeItem('surat_settings');
    }
    if (options.users) {
      localStorage.removeItem('surat_users');
    }
    if (options.permissions) {
      localStorage.removeItem('surat_permissions');
    }
    if (options.backupHistory) {
      localStorage.removeItem('surat_backup_history');
    }
  };

  const getBackupHistory = (): BackupHistoryItem[] => {
    const s = localStorage.getItem('surat_backup_history');
    return s ? JSON.parse(s) : [];
  };

  const addBackupHistory = (item: BackupHistoryItem) => {
    const history = getBackupHistory();
    const updated = [item, ...history].slice(0, 50); // keep last 50
    localStorage.setItem('surat_backup_history', JSON.stringify(updated));
  };

  const getDatabaseStats = (): DatabaseStats => {
    const smSize = getStorageSize('surat_masuk');
    const skSize = getStorageSize('surat_keluar');
    const dspSize = getStorageSize('disposisi');
    const tplSize = getStorageSize('surat_templates');
    const setSize = getStorageSize('surat_settings');
    const usrSize = getStorageSize('surat_users');
    const prmSize = getStorageSize('surat_permissions');
    const bkSize = getStorageSize('surat_backup_history');

    const usersRaw = localStorage.getItem('surat_users');
    const usersCount = usersRaw ? JSON.parse(usersRaw).length : 0;
    const bkRaw = localStorage.getItem('surat_backup_history');
    const bkCount = bkRaw ? JSON.parse(bkRaw).length : 0;

    return {
      suratMasuk: { count: suratMasuk.length, sizeKB: Math.round(smSize * 100) / 100 },
      suratKeluar: { count: suratKeluar.length, sizeKB: Math.round(skSize * 100) / 100 },
      disposisi: { count: disposisi.length, sizeKB: Math.round(dspSize * 100) / 100 },
      templates: { count: templates.length, sizeKB: Math.round(tplSize * 100) / 100 },
      settings: { sizeKB: Math.round(setSize * 100) / 100 },
      users: { count: usersCount, sizeKB: Math.round(usrSize * 100) / 100 },
      permissions: { sizeKB: Math.round(prmSize * 100) / 100 },
      backupHistory: { count: bkCount, sizeKB: Math.round(bkSize * 100) / 100 },
      totalSizeKB: Math.round((smSize + skSize + dspSize + tplSize + setSize + usrSize + prmSize + bkSize) * 100) / 100,
    };
  };

  return (
    <SuratContext.Provider value={{
      suratMasuk, suratKeluar, disposisi, templates, settings, demoMode, setDemoMode,
      addSuratMasuk, updateSuratMasuk, deleteSuratMasuk,
      addSuratKeluar, updateSuratKeluar, deleteSuratKeluar,
      addDisposisi, updateDisposisi, deleteDisposisi,
      addTemplate, updateTemplate, deleteTemplate,
      updateSettings, importData,
      createBackup, restoreBackup, clearDatabase,
      getBackupHistory, addBackupHistory, getDatabaseStats,
    }}>
      {children}
    </SuratContext.Provider>
  );
}

export function useSurat() {
  const ctx = useContext(SuratContext);
  if (!ctx) throw new Error('useSurat must be used within SuratProvider');
  return ctx;
}
