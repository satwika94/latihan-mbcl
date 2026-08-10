import { CategoryLabel, MateriItem } from "./types";

export type MateriFormValues = Pick<
  MateriItem,
  | "judul"
  | "kategori"
  | "tanggal"
  | "penyelenggara"
  | "pembicara"
  | "konteks"
  | "temuan"
  | "dataMetode"
  | "implikasi"
  | "referensi"
  | "overlap"
  | "action"
>;

export const EMPTY_FORM_VALUES = (defaultKategori: CategoryLabel): MateriFormValues => ({
  judul: "",
  kategori: defaultKategori,
  tanggal: "",
  penyelenggara: "",
  pembicara: "",
  konteks: "",
  temuan: "",
  dataMetode: "",
  implikasi: "",
  referensi: "",
  overlap: "",
  action: "",
});
