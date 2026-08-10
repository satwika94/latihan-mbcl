import { cookies } from "next/headers";
import ConnectDrive from "@/components/materi/ConnectDrive";
import MateriApp from "@/components/materi/MateriApp";
import { COOKIE_NAME } from "@/lib/materi/google-auth";
import "./materi.css";

export const metadata = {
  title: "Arsip Materi Seminar",
  description: "Review & arsip materi seminar/workshop, tersimpan langsung di Google Drive.",
};

export default async function MateriPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const store = await cookies();
  const connected = Boolean(store.get(COOKIE_NAME)?.value);

  if (!connected) {
    return <ConnectDrive error={searchParams.error} />;
  }

  return <MateriApp />;
}
