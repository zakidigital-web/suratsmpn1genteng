import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  SuratMasuk,
  SuratKeluar,
  SchoolSettings,
  Disposisi,
  SuratTemplate,
  DEFAULT_SETTINGS,
  DEFAULT_TEMPLATES,
  DEFAULT_USERS,
  DEFAULT_PERMISSIONS,
  RolePermissions,
  User,
} from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

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

const META_DEMO_MODE = 'demo_mode';
const META_BACKUP_HISTORY = 'backup_history';

const normalizeSuratMasuk = (row: any): SuratMasuk => ({
  id: String(row.id),
  nomorSurat: String(row.nomor_surat),
  tanggalSurat: String(row.tanggal_surat),
  tanggalTerima: String(row.tanggal_terima),
  pengirim: String(row.pengirim),
  perihal: String(row.perihal),
  kategori: String(row.kategori),
  status: row.status as SuratMasuk['status'],
  lampiran: row.lampiran ? String(row.lampiran) : undefined,
  lampiranNama: row.lampiran_nama ? String(row.lampiran_nama) : undefined,
  lampiranTipe: row.lampiran_tipe ? String(row.lampiran_tipe) : undefined,
  catatan: String(row.catatan ?? ''),
  createdAt: String(row.created_at),
});

const normalizeSuratKeluar = (row: any): SuratKeluar => ({
  id: String(row.id),
  nomorSurat: String(row.nomor_surat),
  tanggalSurat: String(row.tanggal_surat),
  tujuan: String(row.tujuan),
  perihal: String(row.perihal),
  kategori: String(row.kategori),
  status: row.status as SuratKeluar['status'],
  isiSurat: String(row.isi_surat ?? ''),
  sifat: String(row.sifat ?? ''),
  lampiran: row.lampiran ? String(row.lampiran) : undefined,
  lampiranNama: row.lampiran_nama ? String(row.lampiran_nama) : undefined,
  lampiranTipe: row.lampiran_tipe ? String(row.lampiran_tipe) : undefined,
  tandaTangan: row.tanda_tangan ? String(row.tanda_tangan) : undefined,
  stempel: row.stempel ? String(row.stempel) : undefined,
  tembusan: String(row.tembusan ?? ''),
  catatan: String(row.catatan ?? ''),
  createdAt: String(row.created_at),
  createdBy: String(row.created_by ?? ''),
});

const normalizeDisposisi = (row: any): Disposisi => ({
  id: String(row.id),
  suratMasukId: String(row.surat_masuk_id),
  nomorSurat: String(row.nomor_surat),
  perihal: String(row.perihal),
  pengirim: String(row.pengirim),
  tujuanDisposisi: Array.isArray(row.tujuan_disposisi) ? row.tujuan_disposisi.map((x: unknown) => String(x)) : [],
  isiDisposisi: String(row.isi_disposisi ?? ''),
  sifat: row.sifat as Disposisi['sifat'],
  batasWaktu: String(row.batas_waktu),
  catatan: String(row.catatan ?? ''),
  status: row.status as Disposisi['status'],
  createdAt: String(row.created_at),
  createdBy: String(row.created_by ?? ''),
});

const normalizeTemplate = (row: any): SuratTemplate => ({
  id: String(row.id),
  nama: String(row.nama),
  kategori: String(row.kategori),
  perihal: String(row.perihal),
  isiSurat: String(row.isi_surat ?? ''),
  tujuan: String(row.tujuan ?? ''),
  sifat: String(row.sifat ?? ''),
  tembusan: String(row.tembusan ?? ''),
});

const toSuratMasukRow = (s: SuratMasuk) => ({
  id: s.id,
  nomor_surat: s.nomorSurat,
  tanggal_surat: s.tanggalSurat,
  tanggal_terima: s.tanggalTerima,
  pengirim: s.pengirim,
  perihal: s.perihal,
  kategori: s.kategori,
  status: s.status,
  lampiran: s.lampiran ?? null,
  lampiran_nama: s.lampiranNama ?? null,
  lampiran_tipe: s.lampiranTipe ?? null,
  catatan: s.catatan,
  created_at: s.createdAt,
});

const toSuratKeluarRow = (s: SuratKeluar) => ({
  id: s.id,
  nomor_surat: s.nomorSurat,
  tanggal_surat: s.tanggalSurat,
  tujuan: s.tujuan,
  perihal: s.perihal,
  kategori: s.kategori,
  status: s.status,
  isi_surat: s.isiSurat,
  sifat: s.sifat,
  lampiran: s.lampiran ?? null,
  lampiran_nama: s.lampiranNama ?? null,
  lampiran_tipe: s.lampiranTipe ?? null,
  tanda_tangan: s.tandaTangan ?? null,
  stempel: s.stempel ?? null,
  tembusan: s.tembusan,
  catatan: s.catatan,
  created_at: s.createdAt,
  created_by: s.createdBy,
});

const toDisposisiRow = (d: Disposisi) => ({
  id: d.id,
  surat_masuk_id: d.suratMasukId,
  nomor_surat: d.nomorSurat,
  perihal: d.perihal,
  pengirim: d.pengirim,
  tujuan_disposisi: d.tujuanDisposisi,
  isi_disposisi: d.isiDisposisi,
  sifat: d.sifat,
  batas_waktu: d.batasWaktu,
  catatan: d.catatan,
  status: d.status,
  created_at: d.createdAt,
  created_by: d.createdBy,
});

const toTemplateRow = (t: SuratTemplate) => ({
  id: t.id,
  nama: t.nama,
  kategori: t.kategori,
  perihal: t.perihal,
  isi_surat: t.isiSurat,
  tujuan: t.tujuan,
  sifat: t.sifat,
  tembusan: t.tembusan,
});

const toUserSnapshot = (row: any): User => ({
  id: String(row.id),
  username: String(row.username),
  password: String(row.password),
  name: String(row.name),
  role: (row.role ?? 'operator') as User['role'],
  nip: row.nip ? String(row.nip) : '',
  active: row.active !== false,
});

const mapPermissions = (rows: any[]): RolePermissions => {
  const mapped: RolePermissions = { ...DEFAULT_PERMISSIONS };
  for (const row of rows) {
    const role = String(row.role);
    if (role === 'admin' || role === 'operator' || role === 'kepala_sekolah') {
      mapped[role] = Array.isArray(row.features) ? row.features.map((x: unknown) => String(x)) as RolePermissions[typeof role] : [];
    }
  }
  return mapped;
};

const getSizeKB = (value: unknown): number => Math.round((new Blob([JSON.stringify(value)]).size / 1024) * 100) / 100;

export function SuratProvider({ children }: { children: ReactNode }) {
  const [suratMasuk, setSuratMasuk] = useState<SuratMasuk[]>(SAMPLE_SURAT_MASUK);
  const [suratKeluar, setSuratKeluar] = useState<SuratKeluar[]>(SAMPLE_SURAT_KELUAR);
  const [disposisi, setDisposisi] = useState<Disposisi[]>(SAMPLE_DISPOSISI);
  const [templates, setTemplates] = useState<SuratTemplate[]>(DEFAULT_TEMPLATES);
  const [settings, setSettingsState] = useState<SchoolSettings>(DEFAULT_SETTINGS);
  const [demoMode, setDemoModeState] = useState<boolean>(true);
  const [backupHistory, setBackupHistory] = useState<BackupHistoryItem[]>([]);
  const [usersSnapshot, setUsersSnapshot] = useState<User[]>(DEFAULT_USERS);
  const [permissionsSnapshot, setPermissionsSnapshot] = useState<RolePermissions>(DEFAULT_PERMISSIONS);

  const syncFromSupabase = async () => {
    if (!isSupabaseConfigured || !supabase) return;
    const [
      masukRes,
      keluarRes,
      disposisiRes,
      templateRes,
      settingsRes,
      metaRes,
      usersRes,
      permsRes,
    ] = await Promise.all([
      supabase.from('surat_masuk').select('*').order('tanggal_surat', { ascending: false }),
      supabase.from('surat_keluar').select('*').order('tanggal_surat', { ascending: false }),
      supabase.from('disposisi').select('*').order('created_at', { ascending: false }),
      supabase.from('surat_templates').select('*').order('nama', { ascending: true }),
      supabase.from('app_settings').select('data').eq('id', 'school').limit(1),
      supabase.from('app_meta').select('key,value').in('key', [META_DEMO_MODE, META_BACKUP_HISTORY]),
      supabase.from('users').select('*').order('name', { ascending: true }),
      supabase.from('permissions').select('role,features'),
    ]);

    if (!masukRes.error && masukRes.data) setSuratMasuk(masukRes.data.map(normalizeSuratMasuk));
    if (!keluarRes.error && keluarRes.data) setSuratKeluar(keluarRes.data.map(normalizeSuratKeluar));
    if (!disposisiRes.error && disposisiRes.data) setDisposisi(disposisiRes.data.map(normalizeDisposisi));
    if (!templateRes.error && templateRes.data) setTemplates(templateRes.data.map(normalizeTemplate));
    if (!settingsRes.error) {
      const settingsRow = settingsRes.data?.[0];
      if (settingsRow?.data?.namaSekolah) setSettingsState(settingsRow.data as SchoolSettings);
    }
    if (!metaRes.error && metaRes.data) {
      const demo = metaRes.data.find(m => m.key === META_DEMO_MODE)?.value;
      const history = metaRes.data.find(m => m.key === META_BACKUP_HISTORY)?.value;
      if (typeof demo === 'boolean') setDemoModeState(demo);
      if (Array.isArray(history)) setBackupHistory(history as BackupHistoryItem[]);
    }
    if (!usersRes.error && usersRes.data) setUsersSnapshot(usersRes.data.map(toUserSnapshot));
    if (!permsRes.error && permsRes.data) setPermissionsSnapshot(mapPermissions(permsRes.data));
  };

  useEffect(() => {
    const load = async () => {
      if (!isSupabaseConfigured || !supabase) {
        return;
      }

      const [
        masukCountRes,
        keluarCountRes,
        disposisiCountRes,
        templateCountRes,
        settingsRes,
        permsRes,
      ] = await Promise.all([
        supabase.from('surat_masuk').select('id').limit(1),
        supabase.from('surat_keluar').select('id').limit(1),
        supabase.from('disposisi').select('id').limit(1),
        supabase.from('surat_templates').select('id').limit(1),
        supabase.from('app_settings').select('id').eq('id', 'school').limit(1),
        supabase.from('permissions').select('role').limit(1),
      ]);

      if (!masukCountRes.error && (masukCountRes.data ?? []).length === 0) {
        await supabase.from('surat_masuk').upsert(SAMPLE_SURAT_MASUK.map(toSuratMasukRow), { onConflict: 'id' });
      }
      if (!keluarCountRes.error && (keluarCountRes.data ?? []).length === 0) {
        await supabase.from('surat_keluar').upsert(SAMPLE_SURAT_KELUAR.map(toSuratKeluarRow), { onConflict: 'id' });
      }
      if (!disposisiCountRes.error && (disposisiCountRes.data ?? []).length === 0) {
        await supabase.from('disposisi').upsert(SAMPLE_DISPOSISI.map(toDisposisiRow), { onConflict: 'id' });
      }
      if (!templateCountRes.error && (templateCountRes.data ?? []).length === 0) {
        await supabase.from('surat_templates').upsert(DEFAULT_TEMPLATES.map(toTemplateRow), { onConflict: 'id' });
      }
      if (!settingsRes.error && (settingsRes.data ?? []).length === 0) {
        await supabase.from('app_settings').upsert({ id: 'school', data: DEFAULT_SETTINGS }, { onConflict: 'id' });
      }
      if (!permsRes.error && (!permsRes.data || permsRes.data.length === 0)) {
        await supabase.from('permissions').upsert([
          { role: 'admin', features: DEFAULT_PERMISSIONS.admin },
          { role: 'operator', features: DEFAULT_PERMISSIONS.operator },
          { role: 'kepala_sekolah', features: DEFAULT_PERMISSIONS.kepala_sekolah },
        ], { onConflict: 'role' });
      }
      await syncFromSupabase();
    };
    void load();
  }, []);

  const setDemoMode = (v: boolean) => {
    if (isSupabaseConfigured && supabase) {
      void (async () => {
        await supabase.from('app_meta').upsert({ key: META_DEMO_MODE, value: v }, { onConflict: 'key' });
        await syncFromSupabase();
      })();
      return;
    }
    setDemoModeState(v);
  };

  const addSuratMasuk = (s: SuratMasuk) => {
    if (isSupabaseConfigured && supabase) {
      void (async () => {
        await supabase.from('surat_masuk').upsert(toSuratMasukRow(s), { onConflict: 'id' });
        await syncFromSupabase();
      })();
      return;
    }
    setSuratMasuk(prev => [s, ...prev]);
  };

  const updateSuratMasuk = (s: SuratMasuk) => {
    if (isSupabaseConfigured && supabase) {
      void (async () => {
        await supabase.from('surat_masuk').upsert(toSuratMasukRow(s), { onConflict: 'id' });
        await syncFromSupabase();
      })();
      return;
    }
    setSuratMasuk(prev => prev.map(x => x.id === s.id ? s : x));
  };

  const deleteSuratMasuk = (id: string) => {
    if (isSupabaseConfigured && supabase) {
      void (async () => {
        await supabase.from('surat_masuk').delete().eq('id', id);
        await syncFromSupabase();
      })();
      return;
    }
    setSuratMasuk(prev => prev.filter(x => x.id !== id));
  };

  const addSuratKeluar = (s: SuratKeluar) => {
    if (isSupabaseConfigured && supabase) {
      void (async () => {
        await supabase.from('surat_keluar').upsert(toSuratKeluarRow(s), { onConflict: 'id' });
        await syncFromSupabase();
      })();
      return;
    }
    setSuratKeluar(prev => [s, ...prev]);
  };

  const updateSuratKeluar = (s: SuratKeluar) => {
    if (isSupabaseConfigured && supabase) {
      void (async () => {
        await supabase.from('surat_keluar').upsert(toSuratKeluarRow(s), { onConflict: 'id' });
        await syncFromSupabase();
      })();
      return;
    }
    setSuratKeluar(prev => prev.map(x => x.id === s.id ? s : x));
  };

  const deleteSuratKeluar = (id: string) => {
    if (isSupabaseConfigured && supabase) {
      void (async () => {
        await supabase.from('surat_keluar').delete().eq('id', id);
        await syncFromSupabase();
      })();
      return;
    }
    setSuratKeluar(prev => prev.filter(x => x.id !== id));
  };

  const addDisposisi = (d: Disposisi) => {
    if (isSupabaseConfigured && supabase) {
      void (async () => {
        await supabase.from('disposisi').upsert(toDisposisiRow(d), { onConflict: 'id' });
        await syncFromSupabase();
      })();
      return;
    }
    setDisposisi(prev => [d, ...prev]);
  };

  const updateDisposisi = (d: Disposisi) => {
    if (isSupabaseConfigured && supabase) {
      void (async () => {
        await supabase.from('disposisi').upsert(toDisposisiRow(d), { onConflict: 'id' });
        await syncFromSupabase();
      })();
      return;
    }
    setDisposisi(prev => prev.map(x => x.id === d.id ? d : x));
  };

  const deleteDisposisi = (id: string) => {
    if (isSupabaseConfigured && supabase) {
      void (async () => {
        await supabase.from('disposisi').delete().eq('id', id);
        await syncFromSupabase();
      })();
      return;
    }
    setDisposisi(prev => prev.filter(x => x.id !== id));
  };

  const addTemplate = (t: SuratTemplate) => {
    if (isSupabaseConfigured && supabase) {
      void (async () => {
        await supabase.from('surat_templates').upsert(toTemplateRow(t), { onConflict: 'id' });
        await syncFromSupabase();
      })();
      return;
    }
    setTemplates(prev => [t, ...prev]);
  };

  const updateTemplate = (t: SuratTemplate) => {
    if (isSupabaseConfigured && supabase) {
      void (async () => {
        await supabase.from('surat_templates').upsert(toTemplateRow(t), { onConflict: 'id' });
        await syncFromSupabase();
      })();
      return;
    }
    setTemplates(prev => prev.map(x => x.id === t.id ? t : x));
  };

  const deleteTemplate = (id: string) => {
    if (isSupabaseConfigured && supabase) {
      void (async () => {
        await supabase.from('surat_templates').delete().eq('id', id);
        await syncFromSupabase();
      })();
      return;
    }
    setTemplates(prev => prev.filter(x => x.id !== id));
  };

  const updateSettings = (s: SchoolSettings) => {
    if (isSupabaseConfigured && supabase) {
      void (async () => {
        await supabase.from('app_settings').upsert({ id: 'school', data: s }, { onConflict: 'id' });
        await syncFromSupabase();
      })();
      return;
    }
    setSettingsState(s);
  };

  const importData = (data: { suratMasuk?: SuratMasuk[]; suratKeluar?: SuratKeluar[] }) => {
    if (data.suratMasuk && data.suratMasuk.length > 0) {
      if (isSupabaseConfigured && supabase) {
        void (async () => {
          await supabase.from('surat_masuk').upsert(data.suratMasuk!.map(toSuratMasukRow), { onConflict: 'id' });
          await syncFromSupabase();
        })();
      } else {
        setSuratMasuk(prev => [...data.suratMasuk!, ...prev]);
      }
    }
    if (data.suratKeluar && data.suratKeluar.length > 0) {
      if (isSupabaseConfigured && supabase) {
        void (async () => {
          await supabase.from('surat_keluar').upsert(data.suratKeluar!.map(toSuratKeluarRow), { onConflict: 'id' });
          await syncFromSupabase();
        })();
      } else {
        setSuratKeluar(prev => [...data.suratKeluar!, ...prev]);
      }
    }
  };

  const createBackup = (): BackupData => {
    const dataPayload = {
      suratMasuk,
      suratKeluar,
      disposisi,
      templates,
      settings,
      users: usersSnapshot,
      permissions: permissionsSnapshot,
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
        totalUsers: usersSnapshot.length,
      },
      checksum,
    };
  };

  const restoreBackup = (backup: BackupData): { success: boolean; message: string } => {
    try {
      if (!backup.version || !backup.data || !backup.appName) {
        return { success: false, message: 'Format file backup tidak valid. Pastikan file yang dipilih adalah backup dari aplikasi ini.' };
      }

      const dataString = JSON.stringify(backup.data);
      const computedChecksum = generateChecksum(dataString);
      if (backup.checksum && backup.checksum !== computedChecksum) {
        return { success: false, message: 'File backup telah dimodifikasi (checksum tidak cocok). Gunakan file backup yang asli.' };
      }

      const d = backup.data;

      if (d.suratMasuk && Array.isArray(d.suratMasuk)) {
        if (isSupabaseConfigured && supabase) {
          void (async () => {
            await supabase.from('surat_masuk').upsert(d.suratMasuk.map(toSuratMasukRow), { onConflict: 'id' });
            await syncFromSupabase();
          })();
        } else {
          setSuratMasuk(d.suratMasuk);
        }
      }
      if (d.suratKeluar && Array.isArray(d.suratKeluar)) {
        if (isSupabaseConfigured && supabase) {
          void (async () => {
            await supabase.from('surat_keluar').upsert(d.suratKeluar.map(toSuratKeluarRow), { onConflict: 'id' });
            await syncFromSupabase();
          })();
        } else {
          setSuratKeluar(d.suratKeluar);
        }
      }
      if (d.disposisi && Array.isArray(d.disposisi)) {
        if (isSupabaseConfigured && supabase) {
          void (async () => {
            await supabase.from('disposisi').upsert(d.disposisi.map(toDisposisiRow), { onConflict: 'id' });
            await syncFromSupabase();
          })();
        } else {
          setDisposisi(d.disposisi);
        }
      }
      if (d.templates && Array.isArray(d.templates)) {
        if (isSupabaseConfigured && supabase) {
          void (async () => {
            await supabase.from('surat_templates').upsert(d.templates.map(toTemplateRow), { onConflict: 'id' });
            await syncFromSupabase();
          })();
        } else {
          setTemplates(d.templates);
        }
      }
      if (d.settings && d.settings.namaSekolah) {
        if (isSupabaseConfigured && supabase) {
          void (async () => {
            await supabase.from('app_settings').upsert({ id: 'school', data: d.settings }, { onConflict: 'id' });
            await syncFromSupabase();
          })();
        } else {
          setSettingsState(d.settings);
        }
      }
      if (d.users && Array.isArray(d.users)) {
        const normalizedUsers = (d.users as any[]).map(toUserSnapshot);
        if (isSupabaseConfigured && supabase) {
          void (async () => {
            await supabase.from('users').upsert(normalizedUsers.map(u => ({
              id: u.id,
              username: u.username,
              password: u.password,
              name: u.name,
              role: u.role,
              nip: u.nip || null,
              active: u.active,
            })), { onConflict: 'id' });
            await syncFromSupabase();
          })();
        } else {
          setUsersSnapshot(normalizedUsers);
        }
      }
      if (d.permissions && typeof d.permissions === 'object') {
        const restored = d.permissions as RolePermissions;
        if (isSupabaseConfigured && supabase) {
          void (async () => {
            await supabase.from('permissions').upsert([
              { role: 'admin', features: restored.admin || [] },
              { role: 'operator', features: restored.operator || [] },
              { role: 'kepala_sekolah', features: restored.kepala_sekolah || [] },
            ], { onConflict: 'role' });
            await syncFromSupabase();
          })();
        } else {
          setPermissionsSnapshot(restored);
        }
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
      if (isSupabaseConfigured && supabase) {
        void (async () => {
          await supabase.from('surat_masuk').delete().neq('id', '');
          await syncFromSupabase();
        })();
      } else {
        setSuratMasuk([]);
      }
    }
    if (options.suratKeluar) {
      if (isSupabaseConfigured && supabase) {
        void (async () => {
          await supabase.from('surat_keluar').delete().neq('id', '');
          await syncFromSupabase();
        })();
      } else {
        setSuratKeluar([]);
      }
    }
    if (options.disposisi) {
      if (isSupabaseConfigured && supabase) {
        void (async () => {
          await supabase.from('disposisi').delete().neq('id', '');
          await syncFromSupabase();
        })();
      } else {
        setDisposisi([]);
      }
    }
    if (options.templates) {
      if (isSupabaseConfigured && supabase) {
        void (async () => {
          await supabase.from('surat_templates').delete().neq('id', '');
          await syncFromSupabase();
        })();
      } else {
        setTemplates([]);
      }
    }
    if (options.settings) {
      if (isSupabaseConfigured && supabase) {
        void (async () => {
          await supabase.from('app_settings').upsert({ id: 'school', data: DEFAULT_SETTINGS }, { onConflict: 'id' });
          await syncFromSupabase();
        })();
      } else {
        setSettingsState(DEFAULT_SETTINGS);
      }
    }
    if (options.users) {
      if (isSupabaseConfigured && supabase) {
        void (async () => {
          await supabase.from('users').delete().neq('id', '');
          await syncFromSupabase();
        })();
      } else {
        setUsersSnapshot([]);
      }
    }
    if (options.permissions) {
      if (isSupabaseConfigured && supabase) {
        void (async () => {
          await supabase.from('permissions').delete().in('role', ['admin', 'operator', 'kepala_sekolah']);
          await syncFromSupabase();
        })();
      } else {
        setPermissionsSnapshot(DEFAULT_PERMISSIONS);
      }
    }
    if (options.backupHistory) {
      if (isSupabaseConfigured && supabase) {
        void (async () => {
          await supabase.from('app_meta').upsert({ key: META_BACKUP_HISTORY, value: [] }, { onConflict: 'key' });
          await syncFromSupabase();
        })();
      } else {
        setBackupHistory([]);
      }
    }
  };

  const getBackupHistory = (): BackupHistoryItem[] => backupHistory;

  const addBackupHistory = (item: BackupHistoryItem) => {
    setBackupHistory(prev => {
      const updated = [item, ...prev].slice(0, 50);
      if (isSupabaseConfigured && supabase) {
        void (async () => {
          await supabase.from('app_meta').upsert({ key: META_BACKUP_HISTORY, value: updated }, { onConflict: 'key' });
          await syncFromSupabase();
        })();
      }
      return updated;
    });
  };

  const getDatabaseStats = (): DatabaseStats => {
    const smSize = getSizeKB(suratMasuk);
    const skSize = getSizeKB(suratKeluar);
    const dspSize = getSizeKB(disposisi);
    const tplSize = getSizeKB(templates);
    const setSize = getSizeKB(settings);
    const usrSize = getSizeKB(usersSnapshot);
    const prmSize = getSizeKB(permissionsSnapshot);
    const bkSize = getSizeKB(backupHistory);

    return {
      suratMasuk: { count: suratMasuk.length, sizeKB: smSize },
      suratKeluar: { count: suratKeluar.length, sizeKB: skSize },
      disposisi: { count: disposisi.length, sizeKB: dspSize },
      templates: { count: templates.length, sizeKB: tplSize },
      settings: { sizeKB: setSize },
      users: { count: usersSnapshot.length, sizeKB: usrSize },
      permissions: { sizeKB: prmSize },
      backupHistory: { count: backupHistory.length, sizeKB: bkSize },
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
