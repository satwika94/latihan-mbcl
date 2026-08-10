import { NextResponse } from "next/server";
import { getAuthUrl } from "@/lib/materi/google-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.redirect(getAuthUrl());
  } catch {
    const url = new URL("/materi", process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000");
    url.searchParams.set("error", "auth_not_configured");
    return NextResponse.redirect(url);
  }
}
