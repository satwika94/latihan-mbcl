const ERROR_MESSAGES: Record<string, string> = {
  auth_denied: "Izin akses Google Drive dibatalkan.",
  auth_missing_code: "Proses login tidak lengkap. Silakan coba lagi.",
  auth_no_refresh_token:
    "Google tidak memberi izin akses jangka panjang. Buka myaccount.google.com/permissions, cabut akses aplikasi ini, lalu coba hubungkan ulang.",
  auth_failed: "Gagal menghubungkan ke Google Drive. Silakan coba lagi.",
  auth_not_configured:
    "Fitur ini belum dikonfigurasi (GOOGLE_CLIENT_ID/SECRET belum diisi). Lihat README.md.",
};

export default function ConnectDrive({ error }: { error?: string }) {
  return (
    <div className="materi-connect">
      <div className="materi-connect__card">
        <h1>Arsip Materi Seminar</h1>
        <p>
          Hubungkan Google Drive-mu untuk mulai menyimpan dan mereview materi
          seminar/workshop/pelatihan. Semua materi tersimpan sebagai folder
          &amp; file langsung di Drive-mu sendiri — mengikuti struktur folder
          dan template ringkasan yang sudah disiapkan.
        </p>
        {error && (
          <p className="materi-connect__error">
            {ERROR_MESSAGES[error] || "Terjadi kesalahan yang tidak diketahui."}
          </p>
        )}
        <a className="materi-btn" href="/api/auth/google">
          Hubungkan Google Drive
        </a>
      </div>
    </div>
  );
}
