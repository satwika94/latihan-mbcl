"use client";

import { MemberRow, StatusValue, STATUS_LABELS, STATUS_VALUES, TASK_MAX_LENGTH } from "@/lib/types";
import { formatRelativeTime } from "@/lib/time";

type Props = {
  row: MemberRow;
  isMine: boolean;
  draftStatus?: StatusValue;
  draftTask?: string;
  onDraftStatusChange?: (status: StatusValue) => void;
  onDraftTaskChange?: (task: string) => void;
  onSave?: () => void;
  saving?: boolean;
  justSaved?: boolean;
};

export default function MemberCard({
  row,
  isMine,
  draftStatus,
  draftTask,
  onDraftStatusChange,
  onDraftTaskChange,
  onSave,
  saving,
  justSaved,
}: Props) {
  return (
    <div className={`card${isMine ? " card--mine" : ""}`}>
      <div className="card__top">
        <h2 className="card__name">{row.name}</h2>
        {isMine ? (
          <span className="card__mine-tag">Ini kamu</span>
        ) : (
          <span className={`badge badge--${row.status}`}>{STATUS_LABELS[row.status]}</span>
        )}
      </div>

      {!isMine && (
        <>
          <p className={`card__task${row.task ? "" : " card__task--empty"}`}>
            {row.task || "Belum ada tugas"}
          </p>
          <p className="card__time">{formatRelativeTime(row.updatedAt)}</p>
        </>
      )}

      {isMine && (
        <div className="editor">
          <span className="editor__label">Status kamu sekarang</span>
          <div className="status-choices">
            {STATUS_VALUES.map((value) => (
              <button
                key={value}
                type="button"
                className={`status-choice status-choice--${value}${
                  draftStatus === value ? " status-choice--active" : ""
                }`}
                onClick={() => onDraftStatusChange?.(value)}
              >
                {STATUS_LABELS[value]}
              </button>
            ))}
          </div>

          <span className="editor__label">Tugas singkat kamu</span>
          <input
            type="text"
            className="task-input"
            placeholder="Contoh: Desain banner klien X"
            maxLength={TASK_MAX_LENGTH}
            value={draftTask ?? ""}
            onChange={(e) => onDraftTaskChange?.(e.target.value)}
          />
          <p className="task-hint">
            {(draftTask ?? "").length}/{TASK_MAX_LENGTH}
          </p>

          <button
            type="button"
            className="save-button"
            onClick={onSave}
            disabled={saving}
          >
            {saving ? "Menyimpan..." : "Simpan"}
          </button>

          {justSaved && <p className="save-feedback">Tersimpan!</p>}

          <p className="card__time" style={{ marginTop: 10 }}>
            {formatRelativeTime(row.updatedAt)}
          </p>
        </div>
      )}
    </div>
  );
}
