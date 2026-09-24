import { base64UrlToBytes, bytesToBase64Url, constantTimeEqual, getCookie, sha256Hex } from "./security.js";

const encoder = new TextEncoder();
const SESSION_TTL = 60 * 60;

export async function verifyPassword(password, encodedHash) {
  const [scheme, iterationsText, saltText, expectedText] = String(encodedHash || "").split("$");
  const iterations = Number(iterationsText);
  if (scheme !== "pbkdf2_sha256" || !Number.isSafeInteger(iterations) || iterations < 600000 || iterations > 1000000 || !saltText || !expectedText) return false;
  try {
    const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
    const actual = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: base64UrlToBytes(saltText), iterations }, key, 256);
    return constantTimeEqual(bytesToBase64Url(actual), expectedText);
  } catch {
    return false;
  }
}

export async function createSession(db) {
  const token = bytesToBase64Url(crypto.getRandomValues(new Uint8Array(32)));
  const tokenHash = await sha256Hex(token);
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL;
  await db.prepare("INSERT INTO admin_sessions (token_hash, expires_at, created_at) VALUES (?1, ?2, unixepoch())")
    .bind(tokenHash, expiresAt).run();
  return { token, expiresAt };
}

export async function getSession(request, db) {
  const token = getCookie(request, "__Host-pm_admin");
  if (!token) return null;
  const tokenHash = await sha256Hex(token);
  const now = Math.floor(Date.now() / 1000);
  const row = await db.prepare("SELECT token_hash, expires_at FROM admin_sessions WHERE token_hash = ?1 AND expires_at > ?2")
    .bind(tokenHash, now).first();
  return row ? { tokenHash, expiresAt: row.expires_at } : null;
}

export async function deleteSession(request, db) {
  const token = getCookie(request, "__Host-pm_admin");
  if (!token) return;
  await db.prepare("DELETE FROM admin_sessions WHERE token_hash = ?1").bind(await sha256Hex(token)).run();
}

export const sessionMaxAge = SESSION_TTL;
