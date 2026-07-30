"use client";

import { TEAM_MEMBERS } from "@/lib/team";

export default function NamePicker({
  onSelect,
}: {
  onSelect: (memberId: string) => void;
}) {
  return (
    <div className="picker">
      <h1 className="picker__title">Papan Status Tim</h1>
      <p className="picker__subtitle">Kamu yang mana? Pilih nama kamu di bawah ini.</p>
      <div className="picker__list">
        {TEAM_MEMBERS.map((member) => (
          <button
            key={member.id}
            type="button"
            className="picker__button"
            onClick={() => onSelect(member.id)}
          >
            {member.name}
          </button>
        ))}
      </div>
    </div>
  );
}
