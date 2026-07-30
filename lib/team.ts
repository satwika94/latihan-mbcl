// Daftar anggota tim.
//
// CARA EDIT: tambah/hapus/ubah baris di array TEAM_MEMBERS di bawah ini,
// lalu commit & push (atau redeploy di Vercel). Tidak ada UI untuk ini,
// sengaja dibuat sederhana — cukup edit file ini.
//
// - id: harus unik, huruf kecil, tanpa spasi (dipakai sebagai kunci data).
// - name: nama yang ditampilkan di layar.
//
// Disarankan 5-10 anggota.

export type TeamMember = {
  id: string;
  name: string;
};

export const TEAM_MEMBERS: TeamMember[] = [
  { id: "andi", name: "Andi" },
  { id: "budi", name: "Budi" },
  { id: "citra", name: "Citra" },
  { id: "dewi", name: "Dewi" },
  { id: "eka", name: "Eka" },
  { id: "fajar", name: "Fajar" },
  { id: "gita", name: "Gita" },
  { id: "hana", name: "Hana" },
];
