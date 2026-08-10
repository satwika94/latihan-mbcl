import { NextRequest, NextResponse } from "next/server";
import { getAuthorizedClient } from "@/lib/materi/google-auth";
import {
  CATEGORY_LIST,
  ensureCategoryFolder,
  ensureRootFolder,
  readIndex,
  uploadMateriFile,
  writeIndex,
} from "@/lib/materi/drive";
import { MateriItem } from "@/lib/materi/types";

export const dynamic = "force-dynamic";

function uid(): string {
  return "m" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function GET() {
  const auth = await getAuthorizedClient();
  if (!auth) {
    return NextResponse.json({ error: "Belum terhubung ke Google Drive." }, { status: 401 });
  }

  const rootId = await ensureRootFolder(auth);
  const items = await readIndex(auth, rootId);
  items.sort((a, b) => (b.tanggal || "").localeCompare(a.tanggal || ""));
  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const auth = await getAuthorizedClient();
  if (!auth) {
    return NextResponse.json({ error: "Belum terhubung ke Google Drive." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });
  }

  const judul = str(body.judul);
  if (!judul) {
    return NextResponse.json({ error: "Judul materi wajib diisi." }, { status: 400 });
  }

  const kategori =
    CATEGORY_LIST.find((c) => c.label === body.kategori)?.label ??
    CATEGORY_LIST[CATEGORY_LIST.length - 1].label;

  const now = new Date().toISOString();
  const item: MateriItem = {
    id: uid(),
    judul,
    kategori,
    tanggal: str(body.tanggal),
    penyelenggara: str(body.penyelenggara),
    pembicara: str(body.pembicara),
    konteks: str(body.konteks),
    temuan: str(body.temuan),
    dataMetode: str(body.dataMetode),
    implikasi: str(body.implikasi),
    referensi: str(body.referensi),
    overlap: str(body.overlap),
    action: str(body.action),
    status: "belum",
    driveFileId: null,
    driveFileLink: null,
    createdAt: now,
    updatedAt: now,
  };

  const rootId = await ensureRootFolder(auth);
  const categorySlug = CATEGORY_LIST.find((c) => c.label === kategori)!.slug;
  const folderId = await ensureCategoryFolder(auth, rootId, categorySlug);

  const uploaded = await uploadMateriFile(auth, folderId, item);
  item.driveFileId = uploaded.id;
  item.driveFileLink = uploaded.link;

  const items = await readIndex(auth, rootId);
  items.unshift(item);
  await writeIndex(auth, rootId, items);

  return NextResponse.json({ item }, { status: 201 });
}
