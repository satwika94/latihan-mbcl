import { kv } from "@vercel/kv";
import { TEAM_MEMBERS } from "./team";
import { MemberRow, MemberStatus } from "./types";

function keyFor(memberId: string) {
  return `papan-status-tim:member:${memberId}`;
}

const DEFAULT_STATUS: MemberStatus = {
  status: "belum_mulai",
  task: "",
  updatedAt: null,
};

export async function getAllMemberRows(): Promise<MemberRow[]> {
  if (TEAM_MEMBERS.length === 0) return [];

  const keys = TEAM_MEMBERS.map((m) => keyFor(m.id));
  const results = await kv.mget<MemberStatus[]>(...keys);

  return TEAM_MEMBERS.map((member, i) => ({
    id: member.id,
    name: member.name,
    ...(results[i] ?? DEFAULT_STATUS),
  }));
}

export async function setMemberStatus(
  memberId: string,
  data: { status: MemberStatus["status"]; task: string }
): Promise<MemberStatus> {
  const record: MemberStatus = {
    status: data.status,
    task: data.task,
    updatedAt: Date.now(),
  };

  await kv.set(keyFor(memberId), record);

  return record;
}
