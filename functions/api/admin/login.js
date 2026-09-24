import { createSession, sessionMaxAge } from "../../lib/auth.js";
import { constantTimeEqual, hmacHex, json, requireSameOrigin, sessionCookie } from "../../lib/security.js";

const WINDOW_SECONDS = 15 * 60;
const MAX_ATTEMPTS = 5;

export async function onRequestPost({ request, env }) {
  if (!requireSameOrigin(request)) {
    return json({ error: "Requête refusée" }, 403);
  }

  if (!env.DB || !env.ADMIN_PASSWORD || !env.SESSION_SECRET) {
    return json({ error: "Service d’administration non configuré" }, 503);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Requête invalide" }, 400);
  }

  const username =
    typeof body.username === "string"
      ? body.username.slice(0, 100)
      : "";

  const password =
    typeof body.password === "string"
      ? body.password
      : "";

  if (password.length > 1024) {
    return json({ error: "Mot de passe trop long" }, 400);
  }

  if (!password || !username) {
    return json({ error: "Identifiant ou mot de passe incorrect" }, 401);
  }

  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const rateKey = await hmacHex(env.SESSION_SECRET, `login:${ip}`);
  const now = Math.floor(Date.now() / 1000);

  await env.DB
    .prepare("DELETE FROM login_attempts WHERE window_started < ?1")
    .bind(now - 24 * 60 * 60)
    .run();

  await env.DB
    .prepare("DELETE FROM admin_sessions WHERE expires_at <= ?1")
    .bind(now)
    .run();

  const rate = await env.DB
    .prepare(
      "SELECT attempts, window_started FROM login_attempts WHERE rate_key = ?1"
    )
    .bind(rateKey)
    .first();

  if (
    rate &&
    rate.window_started > now - WINDOW_SECONDS &&
    rate.attempts >= MAX_ATTEMPTS
  ) {
    return json(
      { error: "Trop de tentatives. Réessayez dans 15 minutes." },
      429,
      {
        "Retry-After": String(
          Math.max(60, rate.window_started + WINDOW_SECONDS - now)
        )
      }
    );
  }

  const configuredUsername = env.ADMIN_USERNAME || "req2";

  const usernameOk = constantTimeEqual(
    username,
    configuredUsername
  );

  const passwordOk = constantTimeEqual(
    password,
    env.ADMIN_PASSWORD
  );

  if (!usernameOk || !passwordOk) {
    await env.DB
      .prepare(
        "INSERT INTO login_attempts (rate_key, attempts, window_started) VALUES (?1, 1, ?2) ON CONFLICT(rate_key) DO UPDATE SET attempts = CASE WHEN window_started <= ?3 THEN 1 ELSE attempts + 1 END, window_started = CASE WHEN window_started <= ?3 THEN ?2 ELSE window_started END"
      )
      .bind(rateKey, now, now - WINDOW_SECONDS)
      .run();

    return json(
      { error: "Identifiant ou mot de passe incorrect" },
      401
    );
  }

  await env.DB
    .prepare("DELETE FROM login_attempts WHERE rate_key = ?1")
    .bind(rateKey)
    .run();

  const { token } = await createSession(env.DB);

  return json(
    { ok: true },
    200,
    {
      "Set-Cookie": sessionCookie(token, sessionMaxAge)
    }
  );
}