"use client";

import { useEffect, useMemo, useState } from "react";
import { CATEGORY_LABELS, CategoryLabel, MateriItem } from "@/lib/materi/types";
import { EMPTY_FORM_VALUES, MateriFormValues } from "@/lib/materi/client-types";
import MateriForm from "./MateriForm";

type LoadState = "loading" | "ready" | "unauthorized" | "error";

export default function MateriApp() {
  const [items, setItems] = useState<MateriItem[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<CategoryLabel | null>(null);
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function loadItems() {
    setLoadState("loading");
    try {
      const res = await fetch("/api/materi");
      if (res.status === 401) {
        setLoadState("unauthorized");
        return;
      }
      if (!res.ok) throw new Error("gagal memuat");
      const data = await res.json();
      setItems(data.items || []);
      setLoadState("ready");
    } catch {
      setLoadState("error");
    }
  }

  useEffect(() => {
    loadItems();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesTag = activeTag ? item.kategori === activeTag : true;
      const matchesSearch = q
        ? [item.judul, item.penyelenggara, item.temuan, item.implikasi]
            .join(" ")
            .toLowerCase()
            .includes(q)
        : true;
      return matchesTag && matchesSearch;
    });
  }, [items, search, activeTag]);

  function toggleOpen(id: string) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function toggleStatus(item: MateriItem) {
    setActionError(null);
    const nextStatus = item.status === "sudah" ? "belum" : "sudah";
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: nextStatus } : i)));
    try {
      const res = await fetch(`/api/materi/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) throw new Error("gagal");
      const data = await res.json();
      setItems((prev) => prev.map((i) => (i.id === item.id ? data.item : i)));
    } catch {
      setItems((prev) => prev.map((i) => (i.id === item.id ? item : i)));
      setActionError("Gagal mengubah status di Google Drive. Coba lagi.");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus materi ini dari arsip? File di Google Drive juga akan dihapus.")) return;
    setActionError(null);
    const prevItems = items;
    setItems((prev) => prev.filter((i) => i.id !== id));
    try {
      const res = await fetch(`/api/materi/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("gagal");
    } catch {
      setItems(prevItems);
      setActionError("Gagal menghapus materi. Coba lagi.");
    }
  }

  function openAddForm() {
    setEditingId(null);
    setFormOpen(true);
  }

  function openEditForm(id: string) {
    setEditingId(id);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
  }

  async function handleSubmit(values: MateriFormValues) {
    setSaving(true);
    setActionError(null);
    try {
      const res = editingId
        ? await fetch(`/api/materi/${editingId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(values),
          })
        : await fetch("/api/materi", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(values),
          });

      if (res.status === 401) {
        setLoadState("unauthorized");
        setFormOpen(false);
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Gagal menyimpan.");
      }

      const data = await res.json();
      setItems((prev) => {
        if (editingId) return prev.map((i) => (i.id === editingId ? data.item : i));
        return [data.item, ...prev];
      });
      closeForm();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Gagal menyimpan materi.");
    } finally {
      setSaving(false);
    }
  }

  if (loadState === "unauthorized") {
    return (
      <div className="materi-connect">
        <div className="materi-connect__card">
          <h1>Koneksi Drive terputus</h1>
          <p>Sesi Google Drive-mu sudah tidak berlaku. Hubungkan ulang untuk melanjutkan.</p>
          <a className="materi-btn" href="/api/auth/google">
            Hubungkan ulang Google Drive
          </a>
        </div>
      </div>
    );
  }

  const editingItem = editingId ? items.find((i) => i.id === editingId) : null;
  const initialFormValues: MateriFormValues = editingItem
    ? {
        judul: editingItem.judul,
        kategori: editingItem.kategori,
        tanggal: editingItem.tanggal,
        penyelenggara: editingItem.penyelenggara,
        pembicara: editingItem.pembicara,
        konteks: editingItem.konteks,
        temuan: editingItem.temuan,
        dataMetode: editingItem.dataMetode,
        implikasi: editingItem.implikasi,
        referensi: editingItem.referensi,
        overlap: editingItem.overlap,
        action: editingItem.action,
      }
    : EMPTY_FORM_VALUES(CATEGORY_LABELS[0]);

  return (
    <div id="materi-app">
      <div className="materi-masthead">
        <div>
          <h1>Arsip materi seminar</h1>
          <p>Katalog seminar &middot; workshop &middot; pelatihan &middot; tersimpan di Google Drive</p>
        </div>
        <div className="materi-count-badge">
          {loadState === "loading" ? "Memuat..." : `${items.length} entri`}
        </div>
      </div>

      <div className="materi-toolbar">
        <input
          type="text"
          placeholder="Cari judul, penyelenggara, atau catatan..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="materi-btn" onClick={openAddForm}>
          + Tambah materi
        </button>
      </div>

      <div className="materi-tags-row">
        <span
          className={`materi-tag-pill${activeTag === null ? " materi-tag-pill--active" : ""}`}
          onClick={() => setActiveTag(null)}
        >
          Semua
        </span>
        {CATEGORY_LABELS.map((c) => (
          <span
            key={c}
            className={`materi-tag-pill${activeTag === c ? " materi-tag-pill--active" : ""}`}
            onClick={() => setActiveTag(c)}
          >
            {c}
          </span>
        ))}
      </div>

      {actionError && <div className="materi-action-error">{actionError}</div>}

      {formOpen && (
        <MateriForm
          initial={initialFormValues}
          isEditing={Boolean(editingId)}
          saving={saving}
          onCancel={closeForm}
          onSubmit={handleSubmit}
        />
      )}

      {loadState === "error" && (
        <div className="materi-empty">
          Gagal memuat materi dari Google Drive. <button onClick={loadItems}>Coba lagi</button>
        </div>
      )}

      {loadState === "ready" && filtered.length === 0 && (
        <div className="materi-empty">
          Belum ada materi yang cocok. Tambahkan materi pertama lewat tombol di atas.
        </div>
      )}

      <div className="materi-list">
        {filtered.map((item) => (
          <div className={`materi-card${item.status === "sudah" ? " materi-card--reviewed" : ""}`} key={item.id}>
            <div className="materi-card-top">
              <div className="materi-card-click" onClick={() => toggleOpen(item.id)}>
                <p className="materi-card-title">{item.judul || "(tanpa judul)"}</p>
                <p className="materi-card-meta">
                  {item.tanggal || "-"} &middot; {item.penyelenggara || "-"}
                </p>
              </div>
              <div className="materi-card-actions">
                <span
                  className={`materi-status-toggle materi-status-toggle--${item.status}`}
                  onClick={() => toggleStatus(item)}
                >
                  {item.status === "sudah" ? "Sudah direview" : "Belum direview"}
                </span>
                <button
                  className="materi-icon-btn"
                  title="Edit"
                  aria-label="Edit"
                  onClick={() => openEditForm(item.id)}
                >
                  &#9998;
                </button>
                <button
                  className="materi-icon-btn"
                  title="Hapus"
                  aria-label="Hapus"
                  onClick={() => handleDelete(item.id)}
                >
                  &#10005;
                </button>
                {item.driveFileLink && (
                  <a
                    className="materi-icon-btn"
                    href={item.driveFileLink}
                    target="_blank"
                    rel="noreferrer"
                    title="Buka di Google Drive"
                    aria-label="Buka di Google Drive"
                  >
                    &#8599;
                  </a>
                )}
              </div>
            </div>
            <div className="materi-card-tags">
              <span className="materi-mini-tag">{item.kategori}</span>
            </div>
            {openIds.has(item.id) && (
              <div className="materi-card-body materi-card-body--open">
                {item.konteks && (
                  <>
                    <h4>Latar belakang</h4>
                    <p>{item.konteks}</p>
                  </>
                )}
                {item.temuan && (
                  <>
                    <h4>Temuan / poin kunci</h4>
                    <p>{item.temuan}</p>
                  </>
                )}
                {item.dataMetode && (
                  <>
                    <h4>Data / metode penting</h4>
                    <p>{item.dataMetode}</p>
                  </>
                )}
                {item.implikasi && (
                  <>
                    <h4>Implikasi praktis</h4>
                    <p>{item.implikasi}</p>
                  </>
                )}
                {item.referensi && (
                  <>
                    <h4>Referensi / kutipan</h4>
                    <p>{item.referensi}</p>
                  </>
                )}
                {item.overlap && (
                  <>
                    <h4>Overlap dengan materi lain</h4>
                    <p>{item.overlap}</p>
                  </>
                )}
                {item.action && (
                  <>
                    <h4>Action item</h4>
                    <p>{item.action}</p>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
