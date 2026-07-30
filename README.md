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
