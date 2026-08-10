import { NextRequest, NextResponse } from "next/server";
import { getAuthorizedClient } from "@/lib/materi/google-auth";
import {
  CATEGORY_LIST,
  deleteMateriFile,
  ensureCategoryFolder,
  ensureRootFolder,
  readIndex,
  uploadMateriFile,
  writeIndex,
} from "@/lib/materi/drive";
import { MateriItem } from "@/lib/materi/types";

export const dynamic = "force-dynamic";

function strOr(value: unknown, fallback: string): string {
  return typeof value === "string" ? value.trim() : fallback;
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
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

  const rootId = await ensureRootFolder(auth);
  const items = await readIndex(auth, rootId);
  const idx = items.findIndex((i) => i.id === params.id);
  if (idx === -1) {
    return NextResponse.json({ error: "Materi tidak ditemukan." }, { status: 404 });
  }

  const existing = items[idx];
  const kategori =
    typeof body.kategori === "string" && CATEGORY_LIST.some((c) => c.label === body.kategori)
      ? (body.kategori as MateriItem["kategori"])
      : existing.kategori;
  const status = body.status === "sudah" || body.status === "belum" ? body.status : existing.status;

  const updated: MateriItem = {
    ...existing,
    judul: strOr(body.judul, existing.judul) || existing.judul,
    kategori,
    tanggal: body.tanggal === undefined ? existing.tanggal : strOr(body.tanggal, ""),
    penyelenggara: strOr(body.penyelenggara, existing.penyelenggara),
    pembicara: strOr(body.pembicara, existing.pembicara),
    konteks: strOr(body.konteks, existing.konteks),
    temuan: strOr(body.temuan, existing.temuan),
    dataMetode: strOr(body.dataMetode, existing.dataMetode),
    implikasi: strOr(body.implikasi, existing.implikasi),
    referensi: strOr(body.referensi, existing.referensi),
    overlap: strOr(body.overlap, existing.overlap),
    action: strOr(body.action, existing.action),
    status,
    updatedAt: new Date().toISOString(),
  };

  const categorySlug = CATEGORY_LIST.find((c) => c.label === updated.kategori)!.slug;
  const folderId = await ensureCategoryFolder(auth, rootId, categorySlug);
  const uploaded = await uploadMateriFile(auth, folderId, updated);
  updated.driveFileId = uploaded.id;
  updated.driveFileLink = uploaded.link;

  items[idx] = updated;
  await writeIndex(auth, rootId, items);

  return NextResponse.json({ item: updated });
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await getAuthorizedClient();
  if (!auth) {
    return NextResponse.json({ error: "Belum terhubung ke Google Drive." }, { status: 401 });
  }

  const rootId = await ensureRootFolder(auth);
  const items = await readIndex(auth, rootId);
  const idx = items.findIndex((i) => i.id === params.id);
  if (idx === -1) {
    return NextResponse.json({ error: "Materi tidak ditemukan." }, { status: 404 });
  }

  const [removed] = items.splice(idx, 1);
  if (removed.driveFileId) {
    await deleteMateriFile(auth, removed.driveFileId);
  }
  await writeIndex(auth, rootId, items);

  return NextResponse.json({ ok: true });
}
