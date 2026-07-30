"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MemberRow, StatusValue } from "@/lib/types";
import MemberCard from "./MemberCard";

const POLL_INTERVAL_MS = 5000;

export default function StatusBoard({
  currentUserId,
  onChangeUser,
}: {
  currentUserId: string;
  onChangeUser: () => void;
}) {
  const [rows, setRows] = useState<MemberRow[] | null>(null);
  const [draftStatus, setDraftStatus] = useState<StatusValue>("belum_mulai");
  const [draftTask, setDraftTask] = useState("");
  const [draftInitialized, setDraftInitialized] = useState(false);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const savedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadData = useCallback(async () => {
    const res = await fetch("/api/status", { cache: "no-store" });
    const data = await res.json();
    const members: MemberRow[] = data.members;
    setRows(members);

    if (!draftInitialized) {
      const mine = members.find((m) => m.id === currentUserId);
      if (mine) {
        setDraftStatus(mine.status);
        setDraftTask(mine.task);
        setDraftInitialized(true);
      }
    }
  }, [currentUserId, draftInitialized]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loadData]);

  useEffect(() => {
    return () => {
      if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current);
    };
  }, []);

  async function handleSave() {
    setSaving(true);
    setJustSaved(false);
    try {
      const res = await fetch("/api/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: currentUserId,
          status: draftStatus,
          task: draftTask,
        }),
      });
      const updated = await res.json();

      setRows((prev) =>
        prev
          ? prev.map((r) => (r.id === currentUserId ? { ...r, ...updated } : r))
          : prev
      );
      setJustSaved(true);
      savedTimeoutRef.current = setTimeout(() => setJustSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  const myName = rows?.find((r) => r.id === currentUserId)?.name ?? "";

  return (
    <div className="page">
      <header className="app-header">
        <h1 className="app-title">Papan Status Tim</h1>
        <div className="you-badge">
          <span className="you-badge__avatar">{myName.charAt(0).toUpperCase()}</span>
          <button type="button" className="link-button" onClick={onChangeUser}>
            Bukan {myName || "kamu"}?
          </button>
        </div>
      </header>

      <div className="refresh-row">
        <span>Diperbarui otomatis setiap beberapa detik</span>
        <button type="button" className="refresh-button" onClick={loadData}>
          Perbarui
        </button>
      </div>

      {!rows && <p className="loading">Memuat...</p>}

      {rows && (
        <div className="card-list">
          {rows.map((row) => (
            <MemberCard
              key={row.id}
              row={row}
              isMine={row.id === currentUserId}
              draftStatus={row.id === currentUserId ? draftStatus : undefined}
              draftTask={row.id === currentUserId ? draftTask : undefined}
              onDraftStatusChange={row.id === currentUserId ? setDraftStatus : undefined}
              onDraftTaskChange={row.id === currentUserId ? setDraftTask : undefined}
              onSave={row.id === currentUserId ? handleSave : undefined}
              saving={row.id === currentUserId ? saving : undefined}
              justSaved={row.id === currentUserId ? justSaved : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
