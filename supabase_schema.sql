create table if not exists public.users (
  id text primary key,
  username text not null unique,
  password text not null,
  name text not null,
  role text not null check (role in ('admin', 'operator', 'kepala_sekolah')),
  nip text,
  active boolean not null default true
);

create table if not exists public.permissions (
  role text primary key check (role in ('admin', 'operator', 'kepala_sekolah')),
  features text[] not null default '{}'
);

create table if not exists public.surat_masuk (
  id text primary key,
  nomor_surat text not null,
  tanggal_surat date not null,
  tanggal_terima date not null,
  pengirim text not null,
  perihal text not null,
  kategori text not null,
  status text not null check (status in ('belum_dibaca', 'dibaca', 'diproses', 'selesai')),
  lampiran text,
  lampiran_nama text,
  lampiran_tipe text,
  catatan text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.surat_keluar (
  id text primary key,
  nomor_surat text not null,
  tanggal_surat date not null,
  tujuan text not null,
  perihal text not null,
  kategori text not null,
  status text not null check (status in ('draft', 'menunggu_ttd', 'ditandatangani', 'terkirim')),
  isi_surat text not null default '',
  sifat text not null default '',
  lampiran text,
  lampiran_nama text,
  lampiran_tipe text,
  tanda_tangan text,
  stempel text,
  tembusan text not null default '',
  catatan text not null default '',
  created_at timestamptz not null default now(),
  created_by text not null default ''
);

create table if not exists public.disposisi (
  id text primary key,
  surat_masuk_id text not null,
  nomor_surat text not null,
  perihal text not null,
  pengirim text not null,
  tujuan_disposisi text[] not null default '{}',
  isi_disposisi text not null default '',
  sifat text not null check (sifat in ('biasa', 'penting', 'segera', 'rahasia')),
  batas_waktu date not null,
  catatan text not null default '',
  status text not null check (status in ('pending', 'diproses', 'selesai')),
  created_at timestamptz not null default now(),
  created_by text not null default '',
  constraint disposisi_surat_masuk_id_fkey foreign key (surat_masuk_id) references public.surat_masuk(id) on delete cascade
);

create table if not exists public.surat_templates (
  id text primary key,
  nama text not null,
  kategori text not null,
  perihal text not null,
  isi_surat text not null default '',
  tujuan text not null default '',
  sifat text not null default '',
  tembusan text not null default ''
);

create table if not exists public.app_settings (
  id text primary key,
  data jsonb not null default '{}'::jsonb
);

create table if not exists public.app_meta (
  key text primary key,
  value jsonb not null default 'null'::jsonb
);

alter table public.users enable row level security;
alter table public.permissions enable row level security;
alter table public.surat_masuk enable row level security;
alter table public.surat_keluar enable row level security;
alter table public.disposisi enable row level security;
alter table public.surat_templates enable row level security;
alter table public.app_settings enable row level security;
alter table public.app_meta enable row level security;

drop policy if exists users_all_anon on public.users;
drop policy if exists permissions_all_anon on public.permissions;
drop policy if exists surat_masuk_all_anon on public.surat_masuk;
drop policy if exists surat_keluar_all_anon on public.surat_keluar;
drop policy if exists disposisi_all_anon on public.disposisi;
drop policy if exists surat_templates_all_anon on public.surat_templates;
drop policy if exists app_settings_all_anon on public.app_settings;
drop policy if exists app_meta_all_anon on public.app_meta;

create policy users_all_anon on public.users for all to anon using (true) with check (true);
create policy permissions_all_anon on public.permissions for all to anon using (true) with check (true);
create policy surat_masuk_all_anon on public.surat_masuk for all to anon using (true) with check (true);
create policy surat_keluar_all_anon on public.surat_keluar for all to anon using (true) with check (true);
create policy disposisi_all_anon on public.disposisi for all to anon using (true) with check (true);
create policy surat_templates_all_anon on public.surat_templates for all to anon using (true) with check (true);
create policy app_settings_all_anon on public.app_settings for all to anon using (true) with check (true);
create policy app_meta_all_anon on public.app_meta for all to anon using (true) with check (true);

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
alter default privileges in schema public grant select, insert, update, delete on tables to anon, authenticated;
