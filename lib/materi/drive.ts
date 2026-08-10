import { google, drive_v3 } from "googleapis";
import type { OAuth2Client } from "google-auth-library";
import {
  CATEGORIES,
  INDEX_JSON_NAME,
  INDEX_MD_NAME,
  MateriItem,
  ROOT_FOLDER_NAME,
} from "./types";

export const CATEGORY_LIST = CATEGORIES;

function driveClient(auth: OAuth2Client): drive_v3.Drive {
  return google.drive({ version: "v3", auth });
}

function escapeQueryValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

async function findFolder(
  drive: drive_v3.Drive,
  name: string,
  parentId?: string
): Promise<string | null> {
  const q = [
    `name = '${escapeQueryValue(name)}'`,
    "mimeType = 'application/vnd.google-apps.folder'",
    "trashed = false",
    parentId ? `'${parentId}' in parents` : "'root' in parents",
  ].join(" and ");
  const res = await drive.files.list({ q, fields: "files(id, name)", spaces: "drive" });
  return res.data.files?.[0]?.id ?? null;
}

async function createFolder(
  drive: drive_v3.Drive,
  name: string,
  parentId?: string
): Promise<string> {
  const res = await drive.files.create({
    requestBody: {
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: parentId ? [parentId] : undefined,
    },
    fields: "id",
  });
  if (!res.data.id) throw new Error("Gagal membuat folder di Google Drive.");
  return res.data.id;
}

async function ensureFolder(
  drive: drive_v3.Drive,
  name: string,
  parentId?: string
): Promise<string> {
  const existing = await findFolder(drive, name, parentId);
  if (existing) return existing;
  return createFolder(drive, name, parentId);
}

export async function ensureRootFolder(auth: OAuth2Client): Promise<string> {
  return ensureFolder(driveClient(auth), ROOT_FOLDER_NAME);
}

export async function ensureCategoryFolder(
  auth: OAuth2Client,
  rootId: string,
  categorySlug: string
): Promise<string> {
  return ensureFolder(driveClient(auth), categorySlug, rootId);
}

async function findFileByName(
  drive: drive_v3.Drive,
  name: string,
  parentId: string
): Promise<string | null> {
  const q = [
    `name = '${escapeQueryValue(name)}'`,
    "trashed = false",
    `'${parentId}' in parents`,
  ].join(" and ");
  const res = await drive.files.list({ q, fields: "files(id, name)", spaces: "drive" });
  return res.data.files?.[0]?.id ?? null;
}

export async function readIndex(auth: OAuth2Client, rootId: string): Promise<MateriItem[]> {
  const drive = driveClient(auth);
  const fileId = await findFileByName(drive, INDEX_JSON_NAME, rootId);
  if (!fileId) return [];

  const res = await drive.files.get(
    { fileId, alt: "media" },
    { responseType: "text" }
  );
  try {
    const raw = typeof res.data === "string" ? res.data : JSON.stringify(res.data);
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as MateriItem[]) : [];
  } catch {
    return [];
  }
}

function slugForFilename(value: string): string {
  const cleaned = (value || "")
    .trim()
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 60);
  return cleaned || "tanpa-judul";
}

export function fileNameFor(item: MateriItem): string {
  return `${item.tanggal || "0000-00-00"}_${slugForFilename(item.judul)}_${slugForFilename(
    item.penyelenggara
  )}.md`;
}

export function buildMarkdown(item: MateriItem): string {
  return `# ${item.judul}

**Tanggal:** ${item.tanggal || "-"}
**Penyelenggara/Acara:** ${item.penyelenggara || "-"}
**Pembicara:** ${item.pembicara || "-"}
**Kategori/Tag:** ${item.kategori}

## Latar Belakang / Konteks
${item.konteks || "-"}

## Temuan / Poin Kunci
${item.temuan || "-"}

## Data/Metode Penting (jika ada)
${item.dataMetode || "-"}

## Implikasi Praktis
${item.implikasi || "-"}

## Kutipan/Referensi yang Bisa Disitasi
${item.referensi || "-"}

## Overlap dengan Materi Lain
${item.overlap || "-"}

## Action Item
${item.action || "-"}

---
Status review: ${item.status === "sudah" ? "Sudah direview" : "Belum direview"}
`;
}

function indexMdRow(item: MateriItem): string {
  const judul = (item.judul || "-").replace(/\|/g, "/");
  const penyelenggara = (item.penyelenggara || "-").replace(/\|/g, "/");
  const link = item.driveFileLink ? `[link](${item.driveFileLink})` : "-";
  const check = item.status === "sudah" ? "✅" : "⬜";
  return `| ${item.tanggal || "-"} | ${judul} | ${penyelenggara} | ${item.kategori} | ${check} | ${link} |`;
}

async function writeIndexMd(
  drive: drive_v3.Drive,
  rootId: string,
  items: MateriItem[]
): Promise<void> {
  const sorted = [...items].sort((a, b) => (b.tanggal || "").localeCompare(a.tanggal || ""));
  const rows = sorted.map(indexMdRow).join("\n");
  const body = `# Arsip Materi Seminar & Workshop

Daftar materi yang sudah tersimpan dan status reviewnya. File ini dibuat &
diperbarui otomatis oleh aplikasi "Arsip Materi Seminar" — jangan diedit manual,
perubahan akan tertimpa saat entri berikutnya disimpan.

| Tanggal | Topik | Penyelenggara | Kategori | Sudah Direview? | Link |
|---------|-------|----------------|----------|------------------|------|
${rows}
`;
  const existingId = await findFileByName(drive, INDEX_MD_NAME, rootId);
  const media = { mimeType: "text/markdown", body };
  if (existingId) {
    await drive.files.update({ fileId: existingId, media });
  } else {
    await drive.files.create({
      requestBody: { name: INDEX_MD_NAME, parents: [rootId] },
      media,
      fields: "id",
    });
  }
}

export async function writeIndex(
  auth: OAuth2Client,
  rootId: string,
  items: MateriItem[]
): Promise<void> {
  const drive = driveClient(auth);
  const existingId = await findFileByName(drive, INDEX_JSON_NAME, rootId);
  const media = { mimeType: "application/json", body: JSON.stringify(items, null, 2) };
  if (existingId) {
    await drive.files.update({ fileId: existingId, media });
  } else {
    await drive.files.create({
      requestBody: { name: INDEX_JSON_NAME, parents: [rootId] },
      media,
      fields: "id",
    });
  }
  await writeIndexMd(drive, rootId, items);
}

export async function uploadMateriFile(
  auth: OAuth2Client,
  folderId: string,
  item: MateriItem
): Promise<{ id: string; link: string }> {
  const drive = driveClient(auth);
  const name = fileNameFor(item);
  const media = { mimeType: "text/markdown", body: buildMarkdown(item) };

  if (item.driveFileId) {
    const current = await drive.files.get({ fileId: item.driveFileId, fields: "parents" });
    const oldParents = (current.data.parents || []).join(",");
    const res = await drive.files.update({
      fileId: item.driveFileId,
      requestBody: { name },
      media,
      addParents: folderId,
      removeParents: oldParents || undefined,
      fields: "id, webViewLink",
    });
    return { id: res.data.id!, link: res.data.webViewLink || "" };
  }

  const res = await drive.files.create({
    requestBody: { name, parents: [folderId] },
    media,
    fields: "id, webViewLink",
  });
  return { id: res.data.id!, link: res.data.webViewLink || "" };
}

export async function deleteMateriFile(auth: OAuth2Client, fileId: string): Promise<void> {
  const drive = driveClient(auth);
  await drive.files.delete({ fileId }).catch(() => {});
}
