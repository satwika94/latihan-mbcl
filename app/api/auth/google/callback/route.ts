import { NextRequest, NextResponse } from "next/server";
import {
  encryptRefreshToken,
  exchangeCodeForTokens,
  refreshTokenCookieOptions,
} from "@/lib/materi/google-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const authError = request.nextUrl.searchParams.get("error");
  const redirectTo = new URL("/materi", request.url);

  if (authError) {
    redirectTo.searchParams.set("error", "auth_denied");
    return NextResponse.redirect(redirectTo);
  }
  if (!code) {
    redirectTo.searchParams.set("error", "auth_missing_code");
    return NextResponse.redirect(redirectTo);
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    if (!tokens.refresh_token) {
      redirectTo.searchParams.set("error", "auth_no_refresh_token");
      return NextResponse.redirect(redirectTo);
    }

    const response = NextResponse.redirect(redirectTo);
    const { name, ...opts } = refreshTokenCookieOptions();
    response.cookies.set(name, encryptRefreshToken(tokens.refresh_token), opts);
    return response;
  } catch {
    redirectTo.searchParams.set("error", "auth_failed");
    return NextResponse.redirect(redirectTo);
  }
}
