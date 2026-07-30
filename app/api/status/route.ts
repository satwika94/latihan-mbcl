import { NextRequest, NextResponse } from "next/server";
import { TEAM_MEMBERS } from "@/lib/team";
import { getAllMemberRows, setMemberStatus } from "@/lib/kv";
import { STATUS_VALUES, TASK_MAX_LENGTH } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await getAllMemberRows();
  return NextResponse.json({ members: rows });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });
  }

  const { memberId, status, task } = (body ?? {}) as Record<string, unknown>;

  const member = TEAM_MEMBERS.find((m) => m.id === memberId);
  if (!member) {
    return NextResponse.json({ error: "Anggota tidak ditemukan." }, { status: 400 });
  }

  if (typeof status !== "string" || !STATUS_VALUES.includes(status as any)) {
    return NextResponse.json({ error: "Status tidak valid." }, { status: 400 });
  }

  const cleanTask = typeof task === "string" ? task.trim().slice(0, TASK_MAX_LENGTH) : "";

  const updated = await setMemberStatus(member.id, {
    status: status as (typeof STATUS_VALUES)[number],
    task: cleanTask,
  });

  return NextResponse.json({ id: member.id, name: member.name, ...updated });
}
