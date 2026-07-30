export const STATUS_VALUES = ["belum_mulai", "dikerjakan", "selesai"] as const;

export type StatusValue = (typeof STATUS_VALUES)[number];

export const STATUS_LABELS: Record<StatusValue, string> = {
  belum_mulai: "Belum Mulai",
  dikerjakan: "Dikerjakan",
  selesai: "Selesai",
};

export type MemberStatus = {
  status: StatusValue;
  task: string;
  updatedAt: number | null;
};

export type MemberRow = MemberStatus & {
  id: string;
  name: string;
};

export const TASK_MAX_LENGTH = 60;
