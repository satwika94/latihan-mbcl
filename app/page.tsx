"use client";

import { useEffect, useState } from "react";
import NamePicker from "@/components/NamePicker";
import StatusBoard from "@/components/StatusBoard";
import { TEAM_MEMBERS } from "@/lib/team";

const STORAGE_KEY = "papan-status-tim:nama-saya";

export default function HomePage() {
  const [selectedId, setSelectedId] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const isValid = stored && TEAM_MEMBERS.some((m) => m.id === stored);
    setSelectedId(isValid ? stored : null);
  }, []);

  function handleSelect(memberId: string) {
    window.localStorage.setItem(STORAGE_KEY, memberId);
    setSelectedId(memberId);
  }

  function handleChangeUser() {
    window.localStorage.removeItem(STORAGE_KEY);
    setSelectedId(null);
  }

  if (selectedId === undefined) {
    return <div className="loading">Memuat...</div>;
  }

  if (selectedId === null) {
    return <NamePicker onSelect={handleSelect} />;
  }

  return <StatusBoard currentUserId={selectedId} onChangeUser={handleChangeUser} />;
}
