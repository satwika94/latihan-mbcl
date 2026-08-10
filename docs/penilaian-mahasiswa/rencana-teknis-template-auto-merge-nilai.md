# Rencana Teknis: Template Standar + Auto-Merge Script (Kunci: NIM)

## 1. Ringkasan & Tujuan

Solusi ini menyelesaikan masalah **"data nilai kadang tercecer di Excel berbagai kelas dan tidak masuk ke sistem"** untuk 3 kelas x 30 mahasiswa. Nilai tetap diinput per kelas seperti biasa, tapi lewat template baku yang tervalidasi, lalu digabung otomatis ke satu rekap pusat menggunakan NIM sebagai kunci pencocokan (bukan nama, sehingga tidak perlu cek nama satu-satu).

**Constraint yang harus dipenuhi:**
- Tidak perlu cek data manual satu per satu
- Tidak perlu upload file laporan/kuis/tugas
- Tidak perlu cek nama mahasiswa satu per satu

**Syarat wajib dari hasil evaluasi sebelumnya** (tanpa ini, risiko kegagalan diam-diam tinggi):
1. NIM di template **dikunci dari roster resmi** (dropdown/data validation), tidak diketik bebas
2. Merge bersifat **idempoten** (upsert, bukan append) — aman dijalankan berkali-kali
3. Ada **laporan hasil merge** eksplisit yang menyebutkan baris gagal/dilewati dan alasannya
4. Trigger merge **jelas dan sengaja** (bukan otomatis tersembunyi) untuk menghindari race condition saat masih input

## 2. Arsitektur

Satu Google Spreadsheet berisi beberapa sheet dengan peran berbeda:

```
[Spreadsheet: Rekap Nilai Semester]
├── Roster           -> sumber kebenaran NIM + Nama + Kelas (diisi 1x di awal semester)
├── Kelas_A           -> sheet input, terkunci strukturnya, NIM via dropdown
├── Kelas_B           -> sheet input, sama seperti Kelas_A
├── Kelas_C           -> sheet input, sama seperti Kelas_A
├── Rekap_Pusat       -> hasil merge, 1 baris = 1 (NIM, Kelas, Nama Tugas/Minggu)
└── Log_Merge         -> riwayat setiap kali merge dijalankan: apa yang berhasil, apa yang dilewati, dan kenapa
```

Semua dalam satu file (bukan file terpisah per kelas) untuk menghindari masalah izin akses/lokasi file yang berbeda-beda — salah satu penyebab data "tercecer" di alur lama.

## 3. Struktur Data

### 3.1 Sheet `Roster`

| NIM (Text) | Nama | Kelas |
|---|---|---|
| 202301001 | ... | Kelas_A |

Diisi sekali dari data akademik resmi. Kolom NIM diformat sebagai **Plain Text**, bukan Number, agar angka nol di depan tidak hilang.

### 3.2 Sheet `Kelas_A` / `Kelas_B` / `Kelas_C` (template baku, identik strukturnya)

| NIM | Nama Tugas/Minggu | Nilai | Diinput Tanggal |
|---|---|---|---|
| (dropdown dari Roster) | (dropdown dari daftar tugas baku) | (0-100) | (auto timestamp) |

Validasi wajib di level sheet:
- **Kolom NIM:** Data validation "List from a range" → `Roster!A:A`, **reject input** (bukan sekadar warning), format Plain Text.
- **Kolom Nama Tugas/Minggu:** dropdown dari daftar tetap (mis. "Kuis 1", "Tugas 1", "Laporan 1", dst.) — mencegah variasi penulisan ("Tugas1" vs "Tugas 1") yang bikin pencocokan gagal.
- **Kolom Nilai:** Data validation number **between 0–100**, reject input di luar rentang.
- **Header row:** diproteksi (Protect range) supaya tidak sengaja tergeser/terhapus — ini mencegah penyebab silent-failure paling umum.

### 3.3 Sheet `Rekap_Pusat` (output merge)

| Kunci Komposit | NIM | Nama | Kelas | Nama Tugas/Minggu | Nilai | Terakhir Diperbarui |
|---|---|---|---|---|---|---|
| `NIM\|Kelas\|Tugas` | ... | ... | ... | ... | ... | ... |

Kunci komposit **(NIM + Kelas + Nama Tugas/Minggu)** dipakai untuk upsert — bukan NIM saja, supaya nilai Kuis 1 tidak menimpa nilai Tugas 1 milik mahasiswa yang sama.

### 3.4 Sheet `Log_Merge`

| Timestamp | Baris Diproses | Baris Baru | Baris Diperbarui | Baris Dilewati | Detail Alasan Dilewati |
|---|---|---|---|---|---|

Contoh isi kolom terakhir: `"Kelas_B baris 15: NIM tidak ditemukan di Roster"`, `"Kelas_A baris 8: Nilai kosong/bukan angka"`.

## 4. Logika Script (Google Apps Script)

Trigger: **tombol manual** di custom menu (`Nilai > Jalankan Merge Sekarang`), bukan terjadwal — supaya Anda yang mengontrol kapan merge terjadi (biasanya setelah selesai input untuk 1 sesi), menghindari race condition saat masih mengetik.

Pseudocode:

```
function jalankanMerge() {
  roster = bacaSheet("Roster")              // Map: NIM -> {Nama, Kelas}
  rekapLama = bacaSheet("Rekap_Pusat")       // Map: kunciKomposit -> {Nilai, ...}
  hasilLog = { baru: 0, diperbarui: 0, dilewati: [] }

  for setiapKelas in ["Kelas_A", "Kelas_B", "Kelas_C"]:
    baris = bacaSheet(setiapKelas)
    for row in baris (skip header):
      nim = row.NIM
      tugas = row.NamaTugas
      nilai = row.Nilai

      if nim not in roster:
        hasilLog.dilewati.push(f"{setiapKelas} baris {row.index}: NIM tidak dikenali")
        continue
      if nilai bukan angka 0-100:
        hasilLog.dilewati.push(f"{setiapKelas} baris {row.index}: Nilai tidak valid")
        continue

      kunci = nim + "|" + setiapKelas + "|" + tugas

      if kunci in rekapLama and rekapLama[kunci].Nilai == nilai:
        continue   // tidak ada perubahan, skip diam-diam (bukan error, memang tidak perlu ditulis ulang)
      else if kunci in rekapLama:
        updateBarisRekapPusat(kunci, nilai)
        hasilLog.diperbarui += 1
      else:
        tambahBarisRekapPusat(kunci, nim, roster[nim].Nama, setiapKelas, tugas, nilai)
        hasilLog.baru += 1

  tulisLogMerge(hasilLog)
  tampilkanRingkasanKeUser(hasilLog)   // dialog: "12 baru, 3 diperbarui, 2 dilewati — lihat Log_Merge"
}
```

Poin penting dari desain ini:
- **Idempoten**: menjalankan merge berkali-kali tanpa perubahan data tidak menghasilkan duplikat atau baris baru.
- **Upsert berbasis kunci komposit**, bukan overwrite berbasis NIM saja — mendukung revisi nilai secara aman (edit nilai di sheet kelas, jalankan ulang merge, `Rekap_Pusat` ikut ter-update).
- **Tidak ada silent failure**: setiap baris yang gagal diproses tercatat eksplisit di `Log_Merge` dengan alasan, dan ringkasan langsung ditampilkan ke user setiap kali merge dijalankan.

## 5. Alur Revisi Nilai

Karena upsert berbasis kunci komposit:
1. Anda edit nilai langsung di sheet kelas (`Kelas_A`, dst.) — satu-satunya tempat edit yang sah.
2. Jalankan ulang "Jalankan Merge Sekarang".
3. `Rekap_Pusat` otomatis memperbarui baris yang sesuai (bukan menambah duplikat), dan `Log_Merge` mencatatnya sebagai "diperbarui".

`Rekap_Pusat` tidak pernah diedit manual — ini menjaga satu sumber kebenaran yang konsisten.

## 6. Rencana Rollout Bertahap

| Fase | Yang Dikerjakan | Tujuan |
|---|---|---|
| 0 | Susun `Roster` resmi (NIM+Nama+Kelas) dari data akademik | Fondasi validasi |
| 1 | Bangun template `Kelas_A/B/C` dengan validasi (tanpa script) | Uji apakah validasi input terasa lancar, dipakai 1-2 minggu paralel dengan Excel lama |
| 2 | Bangun fungsi merge dasar (1 kelas, append + log, tanpa upsert) | Validasi konsep pembacaan & pencocokan NIM |
| 3 | Tambahkan logika upsert + kunci komposit | Pastikan revisi nilai aman, uji re-run berulang |
| 4 | Gabungkan 3 kelas + dialog ringkasan + `Log_Merge` lengkap | Sistem siap diuji penuh |
| 5 | Jalankan **paralel** dengan proses manual lama selama 1 minggu penuh | Bandingkan hasil rekap manual vs otomatis, pastikan tidak ada selisih |
| 6 | Cutover — hentikan proses manual lama | `Log_Merge` jadi audit trail berkelanjutan |

Jangan lompat ke Fase 6 sebelum Fase 5 selesai — ini yang mencegah Anda kehilangan data nyata akibat bug yang belum ketahuan.

## 7. Skenario Uji Wajib (Edge Cases)

Berdasarkan kritik sebelumnya, ini harus dicoba sebelum cutover:

- [ ] NIM dengan angka nol di depan tidak hilang setelah merge
- [ ] NIM yang diketik/dipilih salah (tidak ada di Roster) → muncul di `Log_Merge`, tidak masuk `Rekap_Pusat`
- [ ] Nilai kosong atau berupa teks → dilewati dengan alasan jelas di log
- [ ] NIM yang sama muncul 2x di satu sheet kelas untuk tugas yang sama → perlu didefinisikan perilaku (disarankan: ambil baris terakhir, catat sebagai "duplikat terdeteksi" di log)
- [ ] Revisi nilai: ubah 1 nilai, jalankan merge, pastikan `Rekap_Pusat` ter-update dan tidak duplikat
- [ ] Jalankan merge 2x berturut-turut tanpa perubahan apa pun → `Rekap_Pusat` dan `Log_Merge` tidak berubah (baru=0, diperbarui=0)
- [ ] Header row sengaja digeser/dihapus satu kolom → proses harus berhenti dengan error jelas, bukan menyimpan data yang salah kolom

## 8. Kepemilikan & Perawatan

- Dokumentasikan cara pakai dalam SOP 1 halaman (cara mengisi template, kapan menjalankan merge, cara membaca `Log_Merge`).
- Simpan salinan/backup `Rekap_Pusat` di akhir setiap bulan (Google Sheets version history bisa dipakai, tapi export manual berkala tetap disarankan sebagai lapisan kedua).
- Kalau ada perubahan struktur penilaian (jenis tugas baru, bobot berubah), update daftar dropdown "Nama Tugas/Minggu" dan skema `Rekap_Pusat` **sebelum** semester berjalan, bukan di tengah jalan.

## 9. Batasan yang Masih Ada

Jujur soal apa yang solusi ini **tidak** selesaikan:
- Tidak mempercepat proses **menilai** (membaca laporan, memutuskan skor) — itu masalah terpisah (6 jam/minggu) yang butuh solusi lain (mis. rubrik terstruktur).
- Bergantung pada satu orang yang memahami Apps Script untuk perawatan jangka panjang; sebaiknya didokumentasikan cukup detail agar bisa diserahterimakan.
- Tidak menggantikan kebutuhan untuk sesekali membuka `Log_Merge` — ini bukan solusi "pasang lalu lupa", tapi "pasang lalu cek log tiap kali merge".
