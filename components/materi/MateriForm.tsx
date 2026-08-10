"use client";

import { useState } from "react";
import { CATEGORY_LABELS } from "@/lib/materi/types";
import { MateriFormValues } from "@/lib/materi/client-types";

export default function MateriForm({
  initial,
  isEditing,
  saving,
  onCancel,
  onSubmit,
}: {
  initial: MateriFormValues;
  isEditing: boolean;
  saving: boolean;
  onCancel: () => void;
  onSubmit: (values: MateriFormValues) => void;
}) {
  const [values, setValues] = useState<MateriFormValues>(initial);
  const [judulError, setJudulError] = useState(false);

  function update<K extends keyof MateriFormValues>(key: K, value: MateriFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!values.judul.trim()) {
      setJudulError(true);
      return;
    }
    onSubmit(values);
  }

  return (
    <form className="materi-overlay" onSubmit={handleSubmit}>
      <h2>{isEditing ? "Edit materi" : "Tambah materi baru"}</h2>

      <div className="materi-form-grid">
        <div className="materi-form-row">
          <label htmlFor="f_judul">Judul materi</label>
          <input
            id="f_judul"
            type="text"
            value={values.judul}
            onChange={(e) => {
              update("judul", e.target.value);
              if (judulError) setJudulError(false);
            }}
          />
          {judulError && <p className="materi-field-error">Judul materi wajib diisi.</p>}
        </div>
        <div className="materi-form-row">
          <label htmlFor="f_kategori">Kategori</label>
          <select
            id="f_kategori"
            value={values.kategori}
            onChange={(e) => update("kategori", e.target.value as MateriFormValues["kategori"])}
          >
            {CATEGORY_LABELS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="materi-form-row">
          <label htmlFor="f_tanggal">Tanggal</label>
          <input
            id="f_tanggal"
            type="date"
            value={values.tanggal}
            onChange={(e) => update("tanggal", e.target.value)}
          />
        </div>
        <div className="materi-form-row">
          <label htmlFor="f_penyelenggara">Penyelenggara / acara</label>
          <input
            id="f_penyelenggara"
            type="text"
            value={values.penyelenggara}
            onChange={(e) => update("penyelenggara", e.target.value)}
          />
        </div>
        <div className="materi-form-row">
          <label htmlFor="f_pembicara">Pembicara</label>
          <input
            id="f_pembicara"
            type="text"
            value={values.pembicara}
            onChange={(e) => update("pembicara", e.target.value)}
          />
        </div>
      </div>

      <div className="materi-form-row">
        <label htmlFor="f_konteks">Latar belakang / konteks</label>
        <textarea
          id="f_konteks"
          value={values.konteks}
          onChange={(e) => update("konteks", e.target.value)}
        />
      </div>
      <div className="materi-form-row">
        <label htmlFor="f_temuan">Temuan / poin kunci</label>
        <textarea
          id="f_temuan"
          value={values.temuan}
          onChange={(e) => update("temuan", e.target.value)}
        />
      </div>
      <div className="materi-form-row">
        <label htmlFor="f_dataMetode">Data/metode penting (jika ada)</label>
        <textarea
          id="f_dataMetode"
          value={values.dataMetode}
          onChange={(e) => update("dataMetode", e.target.value)}
        />
      </div>
      <div className="materi-form-row">
        <label htmlFor="f_implikasi">Implikasi praktis</label>
        <textarea
          id="f_implikasi"
          value={values.implikasi}
          onChange={(e) => update("implikasi", e.target.value)}
        />
      </div>
      <div className="materi-form-row">
        <label htmlFor="f_referensi">Referensi / kutipan yang bisa disitasi</label>
        <textarea
          id="f_referensi"
          value={values.referensi}
          onChange={(e) => update("referensi", e.target.value)}
        />
      </div>
      <div className="materi-form-row">
        <label htmlFor="f_overlap">Overlap dengan materi lain</label>
        <textarea
          id="f_overlap"
          value={values.overlap}
          onChange={(e) => update("overlap", e.target.value)}
        />
      </div>
      <div className="materi-form-row">
        <label htmlFor="f_action">Action item</label>
        <textarea
          id="f_action"
          value={values.action}
          onChange={(e) => update("action", e.target.value)}
        />
      </div>

      <div className="materi-form-actions">
        <button type="submit" className="materi-btn" disabled={saving}>
          {saving ? "Menyimpan..." : "Simpan"}
        </button>
        <button type="button" className="materi-btn materi-btn--secondary" onClick={onCancel} disabled={saving}>
          Batal
        </button>
      </div>
    </form>
  );
}
