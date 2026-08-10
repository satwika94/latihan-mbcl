# Papan Status Tim

Satu layar sederhana untuk melihat status kerja tim (Belum Mulai / Dikerjakan /
Selesai) beserta tugas singkat yang sedang dikerjakan tiap orang. Dibuat untuk
tim kecil (5-10 orang) yang dibuka lewat browser HP, tanpa login/akun.

## Cara kerja singkat

- Semua orang membuka satu link yang sama dan bisa **melihat** semua baris
  tanpa login.
- Saat pertama kali buka, tiap orang **memilih namanya sendiri** dari daftar.
  Pilihan itu disimpan di HP/browser masing-masing (localStorage), jadi tidak
  perlu pilih ulang tiap buka. Kalau device dipakai orang lain, tinggal tekan
  "Bukan (nama)?" di pojok kanan atas untuk ganti.
- Tiap orang **hanya bisa mengubah barisnya sendiri** (status + tugas
  singkat).
- Layar memperbarui data otomatis tiap ±5 detik, dan ada juga tombol
  "Perbarui" untuk refresh manual.

## Mengedit daftar anggota tim

Daftar nama anggota **tidak diedit lewat aplikasi**, tapi lewat file kode:

`lib/team.ts`

```ts
export const TEAM_MEMBERS: TeamMember[] = [
  { id: "andi", name: "Andi" },
  { id: "budi", name: "Budi" },
  // tambah / hapus / ubah baris di sini
];
```

- `id` harus unik, huruf kecil, tanpa spasi.
- `name` adalah nama yang tampil di layar.
- Setelah diedit, commit + push (atau redeploy di Vercel) supaya perubahan
  tayang.

## Menjalankan di komputer sendiri (opsional)

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`. Catatan: tanpa database (lihat bagian setup di
bawah), memuat data status akan gagal — untuk deploy sungguhan ikuti langkah
setup Vercel di bawah.

## Deploy ke Vercel — langkah demi langkah

### 1. Import project ke Vercel

1. Push repo ini ke GitHub (kalau belum).
2. Buka [vercel.com](https://vercel.com) → **Add New... → Project**.
3. Pilih repo ini. Vercel otomatis mendeteksi Next.js — tidak perlu ubah
   pengaturan build apa pun. Klik **Deploy** (boleh dilanjut dulu, database
   disambungkan di langkah berikut).

### 2. Tambahkan database (untuk menyimpan status)

Data status disimpan di **Redis** (key-value store) lewat integrasi Vercel
Marketplace (nama produknya sekarang "Upstash for Redis" — dulu disebut
"Vercel KV", tapi cara pakainya sama).

1. Di dashboard project kamu di Vercel, buka tab **Storage**.
2. Klik **Create Database** (atau **Connect Store**), pilih **Redis** /
   **Upstash for Redis**.
3. Pilih paket **Free**, beri nama (bebas, misal `papan-status-tim`), lalu
   buat.
4. Vercel akan menawarkan untuk **menyambungkan (connect)** database itu ke
   project kamu — pilih project ini dan konfirmasi. Vercel otomatis
   menambahkan environment variable yang dibutuhkan ke project:
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
   - (beberapa variabel lain juga ditambahkan otomatis, tidak perlu diutak-atik)

Kamu **tidak perlu mengetik env var ini secara manual** — cukup pastikan
langkah "connect" di atas dilakukan, karena Vercel yang mengisinya otomatis
ke tab **Settings → Environment Variables** project kamu.

### 3. Redeploy

Setelah database tersambung, buka tab **Deployments** → klik titik tiga pada
deployment terakhir → **Redeploy**. Ini perlu supaya aplikasi membaca
environment variable yang baru ditambahkan.

### 4. Selesai

Buka URL project kamu (misalnya `https://papan-status-tim.vercel.app`) dari
HP, pilih nama, dan mulai pakai.

## Yang sengaja tidak ada di versi ini

- Tidak ada tambah/hapus anggota dari UI (edit `lib/team.ts`).
- Tidak ada banyak tugas per orang — satu status, satu tugas aktif.
- Tidak ada notifikasi/WhatsApp/reminder.
- Tidak ada riwayat status sebelumnya.
- Tidak ada dashboard/laporan/statistik/filter.
- Tidak ada role admin berbeda, tidak ada dark mode/kustomisasi.

---

# Arsip Materi Seminar (`/materi`)

Fitur kedua di repo ini: arsip & review materi seminar/workshop/pelatihan yang
datanya **tersimpan langsung di Google Drive milik pengguna** (bukan di
database aplikasi). Setiap materi yang disimpan otomatis menjadi:

- Folder kategori di dalam folder `Materi Seminar & Workshop/` di Drive-mu
  (`01_Gizi-Olahraga/`, `02_RED-S_LEA/`, dst — sesuai struktur di
  `Template_Review_Materi_Seminar.md`).
- File markdown per materi, mengikuti format ringkasan (Latar Belakang,
  Temuan, Data/Metode, Implikasi Praktis, Referensi, Overlap, Action Item).
- File `INDEX.md` di folder utama yang diperbarui otomatis, berisi tabel
  semua materi dan status reviewnya.

Aplikasi juga menyimpan satu file index terstruktur (`_index.json`) di folder
utama supaya daftar materi bisa dimuat cepat tanpa membaca ulang semua file.

## Cara kerja autentikasi

- Login pakai OAuth2 akun Google pribadi (bukan service account) — kamu
  login sekali di browser, aplikasi minta izin akses Drive.
- Scope yang dipakai sengaja dibatasi ke `drive.file`: aplikasi **hanya**
  bisa melihat/mengubah folder & file yang dibuat oleh aplikasi ini sendiri,
  bukan seluruh isi Drive-mu.
- Konsekuensi dari scope terbatas ini: kalau kamu sudah pernah membuat
  folder `Materi Seminar & Workshop/` secara manual mengikuti panduan di
  `Template_Review_Materi_Seminar.md`, aplikasi **tidak** akan melihat folder
  manual itu (karena bukan ia yang membuatnya). Biarkan saja — aplikasi akan
  membuat folder baru dengan nama yang sama saat pertama kali dipakai.
- Sesi disimpan sebagai refresh token terenkripsi (AES-256-GCM) di cookie
  `httpOnly`, bukan di database.

## Setup fitur Arsip Materi Seminar (Google Drive)

### 1. Buat OAuth Client di Google Cloud Console

1. Buka [Google Cloud Console](https://console.cloud.google.com/) → buat
   project baru (atau pakai yang sudah ada).
2. Aktifkan **Google Drive API**: menu **APIs & Services → Library**, cari
   "Google Drive API", klik **Enable**.
3. Atur **OAuth consent screen** (APIs & Services → OAuth consent screen):
   - User type: **External** (kalau akun pribadi/bukan Google Workspace)
     lalu tambahkan emailmu sebagai **test user**, atau **Internal** kalau
     pakai akun Google Workspace.
   - Isi nama aplikasi & email kontak seperlunya, tidak perlu verifikasi
     untuk pemakaian pribadi/test.
4. Buat kredensial: **APIs & Services → Credentials → Create Credentials →
   OAuth client ID**, tipe **Web application**.
   - **Authorized redirect URIs**, tambahkan:
     - `http://localhost:3000/api/auth/google/callback` (untuk `npm run dev`)
     - `https://<domain-vercel-kamu>/api/auth/google/callback` (untuk
       deployment produksi)
   - Simpan **Client ID** dan **Client Secret** yang muncul.

### 2. Isi environment variable

Salin `.env.example` ke `.env.local` (untuk lokal) lalu isi:

```
GOOGLE_CLIENT_ID=isi-dari-google-cloud-console
GOOGLE_CLIENT_SECRET=isi-dari-google-cloud-console
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
SESSION_SECRET=hasil-dari-openssl-rand--hex-32
```

Buat `SESSION_SECRET` dengan:

```bash
openssl rand -hex 32
```

Untuk deploy di Vercel, tambahkan keempat variabel ini juga di **Settings →
Environment Variables** project-mu, dengan `GOOGLE_REDIRECT_URI` mengarah ke
domain produksi (dan tambahkan URI itu juga ke daftar Authorized redirect
URIs di langkah 1).

### 3. Jalankan & pakai

```bash
npm install
npm run dev
```

Buka `http://localhost:3000/materi`, klik **Hubungkan Google Drive**, login
dan setujui izin akses. Setelah itu kamu bisa langsung menambah materi —
setiap simpan akan langsung membuat/memperbarui folder & file di Drive-mu.

## Struktur kode fitur ini

- `lib/materi/types.ts` — tipe data materi & daftar 7 kategori.
- `lib/materi/google-auth.ts` — OAuth2 client, cookie sesi.
- `lib/materi/drive.ts` — semua operasi Google Drive (folder, file markdown,
  index JSON, `INDEX.md`).
- `app/api/auth/google/*` — mulai login & callback OAuth.
- `app/api/materi/*` — CRUD materi (baca/tulis lewat Drive API).
- `app/materi/page.tsx`, `components/materi/*` — halaman & UI.
