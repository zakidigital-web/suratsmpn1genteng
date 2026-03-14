export type UserRole = 'admin' | 'operator' | 'kepala_sekolah';

export interface User {
  id: string;
  username: string;
  password: string;
  name: string;
  role: UserRole;
  nip?: string;
  active: boolean;
}

export interface Disposisi {
  id: string;
  suratMasukId: string;
  nomorSurat: string;
  perihal: string;
  pengirim: string;
  tujuanDisposisi: string[];
  isiDisposisi: string;
  sifat: 'biasa' | 'penting' | 'segera' | 'rahasia';
  batasWaktu: string;
  catatan: string;
  status: 'pending' | 'diproses' | 'selesai';
  createdAt: string;
  createdBy: string;
}

export interface SuratTemplate {
  id: string;
  nama: string;
  kategori: string;
  perihal: string;
  isiSurat: string;
  tujuan: string;
  sifat: string;
  tembusan: string;
}

export interface SuratMasuk {
  id: string;
  nomorSurat: string;
  tanggalSurat: string;
  tanggalTerima: string;
  pengirim: string;
  perihal: string;
  kategori: string;
  status: 'belum_dibaca' | 'dibaca' | 'diproses' | 'selesai';
  lampiran?: string;
  lampiranNama?: string;
  lampiranTipe?: string;
  catatan: string;
  createdAt: string;
}

export interface SuratKeluar {
  id: string;
  nomorSurat: string;
  tanggalSurat: string;
  tujuan: string;
  perihal: string;
  kategori: string;
  status: 'draft' | 'menunggu_ttd' | 'ditandatangani' | 'terkirim';
  isiSurat: string;
  sifat: string;
  lampiran?: string;
  lampiranNama?: string;
  lampiranTipe?: string;
  tandaTangan?: string;
  stempel?: string;
  tembusan: string;
  catatan: string;
  createdAt: string;
  createdBy: string;
}

export interface KopLine {
  text: string;
  fontSize: number; // in pt
  bold: boolean;
  italic: boolean;
  uppercase: boolean;
}

export interface KopSettings {
  lines: KopLine[];
  logoKiriSize: number; // px
  logoKananSize: number; // px
  logoKiriOffsetX: number;
  logoKiriOffsetY: number;
  logoKananOffsetX: number;
  logoKananOffsetY: number;
  borderStyle: 'double' | 'single' | 'thick' | 'none';
  showAddress: boolean;
  showContact: boolean;
  addressFontSize: number;
  contactFontSize: number;
}

export type FeatureKey =
  | 'dashboard'
  | 'surat_masuk'
  | 'surat_keluar'
  | 'disposisi'
  | 'buat_surat'
  | 'laporan'
  | 'pengaturan';

export interface RolePermissions {
  admin: FeatureKey[];
  operator: FeatureKey[];
  kepala_sekolah: FeatureKey[];
}

export interface SchoolSettings {
  namaSekolah: string;
  alamat: string;
  telepon: string;
  email: string;
  website: string;
  npsn: string;
  kodePos: string;
  kabupaten: string;
  provinsi: string;
  kepalaSekolah: string;
  nipKepala: string;
  tandaTangan?: string;
  stempel?: string;
  logoKiri?: string;
  logoKanan?: string;
  kopSettings: KopSettings;
}

export const ALL_FEATURES: { key: FeatureKey; label: string; description: string }[] = [
  { key: 'dashboard', label: 'Dashboard', description: 'Melihat ringkasan dan statistik surat' },
  { key: 'surat_masuk', label: 'Surat Masuk', description: 'Kelola surat masuk' },
  { key: 'surat_keluar', label: 'Surat Keluar', description: 'Lihat daftar surat keluar' },
  { key: 'disposisi', label: 'Disposisi', description: 'Kelola disposisi surat' },
  { key: 'buat_surat', label: 'Buat Surat', description: 'Membuat surat keluar baru' },
  { key: 'laporan', label: 'Laporan', description: 'Lihat & export laporan' },
  { key: 'pengaturan', label: 'Pengaturan', description: 'Konfigurasi sistem (khusus admin)' },
];

export const DEFAULT_KOP_SETTINGS: KopSettings = {
  lines: [
    { text: 'PEMERINTAH KABUPATEN BANYUWANGI', fontSize: 11, bold: true, italic: false, uppercase: true },
    { text: 'DINAS PENDIDIKAN', fontSize: 11, bold: true, italic: false, uppercase: true },
    { text: 'SMP NEGERI 1 GENTENG', fontSize: 16, bold: true, italic: false, uppercase: true },
  ],
  logoKiriSize: 70,
  logoKananSize: 70,
  logoKiriOffsetX: 0,
  logoKiriOffsetY: 0,
  logoKananOffsetX: 0,
  logoKananOffsetY: 0,
  borderStyle: 'double',
  showAddress: true,
  showContact: true,
  addressFontSize: 9,
  contactFontSize: 9,
};

export const DEFAULT_PERMISSIONS: RolePermissions = {
  admin: ['dashboard', 'surat_masuk', 'surat_keluar', 'disposisi', 'buat_surat', 'laporan', 'pengaturan'],
  operator: ['dashboard', 'surat_masuk', 'surat_keluar', 'disposisi', 'buat_surat', 'laporan'],
  kepala_sekolah: ['dashboard', 'surat_masuk', 'surat_keluar', 'disposisi', 'laporan'],
};

export const KATEGORI_SURAT = [
  'Dinas',
  'Undangan',
  'Edaran',
  'Keputusan',
  'Keterangan',
  'Pemberitahuan',
  'Permohonan',
  'Rekomendasi',
  'Tugas',
  'Lainnya'
];

export const SIFAT_SURAT = ['Biasa', 'Penting', 'Segera', 'Rahasia'];

export const TUJUAN_DISPOSISI = [
  'Wakil Kepala Sekolah',
  'Kepala Tata Usaha',
  'Urusan Kurikulum',
  'Urusan Kesiswaan',
  'Urusan Sarana Prasarana',
  'Urusan Humas',
  'Bendahara',
  'Guru BK',
  'Wali Kelas',
  'Guru Mata Pelajaran',
  'Staf TU',
];

export const DEFAULT_USERS: User[] = [
  { id: '1', username: 'admin', password: 'admin123', name: 'Administrator', role: 'admin', nip: '198501012010011001', active: true },
  { id: '2', username: 'operator', password: 'operator123', name: 'Siti Rahayu, S.Pd', role: 'operator', nip: '199003152015042001', active: true },
  { id: '3', username: 'kepsek', password: 'kepsek123', name: 'Drs. Ahmad Supriyadi, M.Pd', role: 'kepala_sekolah', nip: '196805101993031005', active: true },
];

export const DEFAULT_SETTINGS: SchoolSettings = {
  namaSekolah: 'SMP Negeri 1 Genteng',
  alamat: 'Jl. Raya Genteng No. 1, Genteng',
  telepon: '(0333) 845123',
  email: 'smpn1genteng@gmail.com',
  website: 'www.smpn1genteng.sch.id',
  npsn: '20525678',
  kodePos: '68465',
  kabupaten: 'Banyuwangi',
  provinsi: 'Jawa Timur',
  kepalaSekolah: 'Drs. Ahmad Supriyadi, M.Pd',
  nipKepala: '196805101993031005',
  kopSettings: { ...DEFAULT_KOP_SETTINGS },
};

export const DEFAULT_TEMPLATES: SuratTemplate[] = [
  {
    id: 'tpl1',
    nama: 'Surat Undangan Rapat',
    kategori: 'Undangan',
    perihal: 'Undangan Rapat',
    sifat: 'Biasa',
    tujuan: '',
    tembusan: '1. Arsip',
    isiSurat: `<p>Dengan hormat,</p><p>Sehubungan dengan pelaksanaan program kerja sekolah, kami mengundang Bapak/Ibu untuk hadir pada:</p><table style="border-collapse:collapse;width:80%;margin:10px 0"><tbody><tr><td style="padding:4px 12px;vertical-align:top;width:120px">Hari/Tanggal</td><td style="padding:4px 4px;width:10px">:</td><td style="padding:4px 8px">........................</td></tr><tr><td style="padding:4px 12px;vertical-align:top">Pukul</td><td style="padding:4px 4px">:</td><td style="padding:4px 8px">........................ WIB s.d selesai</td></tr><tr><td style="padding:4px 12px;vertical-align:top">Tempat</td><td style="padding:4px 4px">:</td><td style="padding:4px 8px">Ruang ........................</td></tr><tr><td style="padding:4px 12px;vertical-align:top">Acara</td><td style="padding:4px 4px">:</td><td style="padding:4px 8px">........................</td></tr></tbody></table><p>Mengingat pentingnya acara tersebut, kami mohon kehadiran Bapak/Ibu tepat pada waktunya.</p><p>Demikian undangan ini kami sampaikan, atas perhatian dan kehadiran Bapak/Ibu kami ucapkan terima kasih.</p>`
  },
  {
    id: 'tpl2',
    nama: 'Surat Keterangan Siswa',
    kategori: 'Keterangan',
    perihal: 'Surat Keterangan',
    sifat: 'Biasa',
    tujuan: 'Yang Berkepentingan',
    tembusan: '1. Arsip\n2. Wali Kelas',
    isiSurat: `<p>Yang bertanda tangan di bawah ini, Kepala SMP Negeri 1 Genteng, menerangkan bahwa:</p><table style="border-collapse:collapse;width:80%;margin:10px 0"><tbody><tr><td style="padding:4px 12px;vertical-align:top;width:140px">Nama</td><td style="padding:4px 4px;width:10px">:</td><td style="padding:4px 8px">........................</td></tr><tr><td style="padding:4px 12px;vertical-align:top">NIS / NISN</td><td style="padding:4px 4px">:</td><td style="padding:4px 8px">........................</td></tr><tr><td style="padding:4px 12px;vertical-align:top">Kelas</td><td style="padding:4px 4px">:</td><td style="padding:4px 8px">........................</td></tr><tr><td style="padding:4px 12px;vertical-align:top">Tempat, Tgl Lahir</td><td style="padding:4px 4px">:</td><td style="padding:4px 8px">........................</td></tr><tr><td style="padding:4px 12px;vertical-align:top">Alamat</td><td style="padding:4px 4px">:</td><td style="padding:4px 8px">........................</td></tr></tbody></table><p>Adalah benar siswa/siswi SMP Negeri 1 Genteng pada tahun pelajaran ......./.......</p><p>Surat keterangan ini dibuat untuk keperluan ........................ dan agar dapat dipergunakan sebagaimana mestinya.</p>`
  },
  {
    id: 'tpl3',
    nama: 'Surat Pemberitahuan Orang Tua',
    kategori: 'Pemberitahuan',
    perihal: 'Pemberitahuan Kegiatan Sekolah',
    sifat: 'Penting',
    tujuan: 'Orang Tua/Wali Murid',
    tembusan: '1. Wali Kelas\n2. Arsip',
    isiSurat: `<p>Dengan hormat,</p><p>Bersama ini kami sampaikan bahwa SMP Negeri 1 Genteng akan mengadakan kegiatan sebagai berikut:</p><table style="border-collapse:collapse;width:80%;margin:10px 0"><tbody><tr><td style="padding:4px 12px;vertical-align:top;width:120px">Kegiatan</td><td style="padding:4px 4px;width:10px">:</td><td style="padding:4px 8px">........................</td></tr><tr><td style="padding:4px 12px;vertical-align:top">Hari/Tanggal</td><td style="padding:4px 4px">:</td><td style="padding:4px 8px">........................</td></tr><tr><td style="padding:4px 12px;vertical-align:top">Pukul</td><td style="padding:4px 4px">:</td><td style="padding:4px 8px">........................ WIB</td></tr><tr><td style="padding:4px 12px;vertical-align:top">Tempat</td><td style="padding:4px 4px">:</td><td style="padding:4px 8px">........................</td></tr></tbody></table><p>Sehubungan dengan hal tersebut, kami mohon agar Bapak/Ibu Orang Tua/Wali Murid dapat memberikan izin kepada putra/putrinya untuk mengikuti kegiatan tersebut.</p><p>Demikian pemberitahuan ini kami sampaikan, atas perhatian dan kerjasama Bapak/Ibu kami ucapkan terima kasih.</p>`
  },
  {
    id: 'tpl4',
    nama: 'Surat Tugas',
    kategori: 'Tugas',
    perihal: 'Surat Tugas',
    sifat: 'Biasa',
    tujuan: '',
    tembusan: '1. Yang bersangkutan\n2. Arsip',
    isiSurat: `<p>Yang bertanda tangan di bawah ini, Kepala SMP Negeri 1 Genteng, dengan ini menugaskan kepada:</p><table style="border-collapse:collapse;width:80%;margin:10px 0"><tbody><tr><td style="padding:4px 12px;vertical-align:top;width:120px">Nama</td><td style="padding:4px 4px;width:10px">:</td><td style="padding:4px 8px">........................</td></tr><tr><td style="padding:4px 12px;vertical-align:top">NIP</td><td style="padding:4px 4px">:</td><td style="padding:4px 8px">........................</td></tr><tr><td style="padding:4px 12px;vertical-align:top">Pangkat/Gol</td><td style="padding:4px 4px">:</td><td style="padding:4px 8px">........................</td></tr><tr><td style="padding:4px 12px;vertical-align:top">Jabatan</td><td style="padding:4px 4px">:</td><td style="padding:4px 8px">........................</td></tr></tbody></table><p>Untuk melaksanakan tugas sebagai berikut:</p><ol><li>........................</li><li>........................</li></ol><p>Demikian surat tugas ini dibuat untuk dilaksanakan dengan penuh tanggung jawab.</p>`
  },
  {
    id: 'tpl5',
    nama: 'Surat Permohonan Bantuan',
    kategori: 'Permohonan',
    perihal: 'Permohonan Bantuan',
    sifat: 'Penting',
    tujuan: '',
    tembusan: '1. Arsip',
    isiSurat: `<p>Dengan hormat,</p><p>Dalam rangka meningkatkan kualitas pendidikan di SMP Negeri 1 Genteng, kami mengajukan permohonan bantuan berupa:</p><ol><li>........................</li><li>........................</li><li>........................</li></ol><p>Adapun tujuan dari permohonan ini adalah untuk ........................</p><p>Besar harapan kami permohonan ini dapat dikabulkan. Atas perhatian dan bantuan Bapak/Ibu, kami ucapkan terima kasih.</p>`
  },
  {
    id: 'tpl6',
    nama: 'Surat Edaran',
    kategori: 'Edaran',
    perihal: 'Surat Edaran',
    sifat: 'Biasa',
    tujuan: 'Seluruh Guru dan Karyawan SMP Negeri 1 Genteng',
    tembusan: '1. Arsip',
    isiSurat: `<p>Dengan hormat,</p><p>Berdasarkan ........................, dengan ini kami sampaikan hal-hal sebagai berikut:</p><ol><li>........................</li><li>........................</li><li>........................</li></ol><p>Demikian surat edaran ini disampaikan agar dapat dilaksanakan sebagaimana mestinya. Atas perhatian dan kerjasama yang baik, kami ucapkan terima kasih.</p>`
  },
];
