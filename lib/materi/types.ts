export const CATEGORIES = [
  { label: "Gizi Olahraga", slug: "01_Gizi-Olahraga" },
  { label: "RED-S / LEA", slug: "02_RED-S_LEA" },
  { label: "Digitalisasi Gizi", slug: "03_Digitalisasi-Gizi" },
  { label: "AI & Teknologi", slug: "04_AI-Teknologi" },
  { label: "Metodologi Riset", slug: "05_Metodologi-Riset" },
  { label: "Ergogenic / Suplemen", slug: "06_Ergogenic-Suplemen" },
  { label: "Lainnya", slug: "07_Lainnya" },
] as const;

export type CategoryLabel = (typeof CATEGORIES)[number]["label"];

export const CATEGORY_LABELS: CategoryLabel[] = CATEGORIES.map((c) => c.label);

export type ReviewStatus = "belum" | "sudah";

export type MateriItem = {
  id: string;
  judul: string;
  kategori: CategoryLabel;
  tanggal: string;
  penyelenggara: string;
  pembicara: string;
  konteks: string;
  temuan: string;
  dataMetode: string;
  implikasi: string;
  referensi: string;
  overlap: string;
  action: string;
  status: ReviewStatus;
  driveFileId: string | null;
  driveFileLink: string | null;
  createdAt: string;
  updatedAt: string;
};

export const ROOT_FOLDER_NAME = "Materi Seminar & Workshop";
export const INDEX_JSON_NAME = "_index.json";
export const INDEX_MD_NAME = "INDEX.md";
