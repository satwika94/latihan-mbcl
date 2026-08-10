import { google } from "googleapis";
import type { OAuth2Client } from "google-auth-library";
import { cookies } from "next/headers";
import { decryptSecret, encryptSecret } from "./session";

export const COOKIE_NAME = "materi_drive_rt";

/**
 * Scope sengaja dibatasi ke drive.file (bukan full Drive access): aplikasi
 * hanya bisa melihat/mengubah folder & file yang dibuat oleh aplikasi ini
 * sendiri, bukan seluruh isi Drive pengguna.
 */
const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} belum diisi di environment (lihat README.md).`);
  }
  return value;
}

function createOAuthClient(): OAuth2Client {
  const clientId = requireEnv("GOOGLE_CLIENT_ID");
  const clientSecret = requireEnv("GOOGLE_CLIENT_SECRET");
  const redirectUri = requireEnv("GOOGLE_REDIRECT_URI");
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export function getAuthUrl(): string {
  const client = createOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [DRIVE_SCOPE],
  });
}

export async function exchangeCodeForTokens(code: string) {
  const client = createOAuthClient();
  const { tokens } = await client.getToken(code);
  return tokens;
}

export function encryptRefreshToken(token: string): string {
  return encryptSecret(token);
}

export function refreshTokenCookieOptions() {
  return {
    name: COOKIE_NAME,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 180, // 180 hari
  };
}

/** Ambil client Drive yang sudah terotentikasi dari cookie sesi, atau null kalau belum/kadaluarsa. */
export async function getAuthorizedClient(): Promise<OAuth2Client | null> {
  const store = await cookies();
  const encrypted = store.get(COOKIE_NAME)?.value;
  if (!encrypted) return null;

  const refreshToken = decryptSecret(encrypted);
  if (!refreshToken) return null;

  const client = createOAuthClient();
  client.setCredentials({ refresh_token: refreshToken });
  try {
    await client.getAccessToken();
  } catch {
    return null;
  }
  return client;
}
