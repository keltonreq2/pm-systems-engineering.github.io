import { hmacHex, json, requireSameOrigin } from '../lib/security.js';
import { readJson } from '../lib/request.js';
import { validText } from '../lib/content.js';
const WINDOW = 15 * 60;
const MAX_ATTEMPTS = 5;
export async function onRequestPost({ request, env }) {
  if (!requireSameOrigin(request)) return json({ error: 'origin' }, 403);
  if (!env.DB || !env.SESSION_SECRET) return json({ error: 'unavailable' }, 503);
  try {
    // Also enforce visibility in the handler: a private site never accepts submissions.
    const visibility = await env.DB.prepare("SELECT value FROM settings WHERE key = 'site_public'").first();
    if (visibility?.value !== 'true') return json({ error: 'unavailable' }, 404);
    const now = Math.floor(Date.now() / 1000);
    const rateKey = await hmacHex(env.SESSION_SECRET, `contact:${request.headers.get('CF-Connecting-IP') || 'unknown'}`);
    await env.DB.prepare('DELETE FROM contact_rate_limits WHERE window_started < ?1').bind(now - 86400).run();
    // Atomic increment prevents concurrent requests from bypassing the limit.
    const rate = await env.DB.prepare('INSERT INTO contact_rate_limits (rate_key, attempts, window_started) VALUES (?1, 1, ?2) ON CONFLICT(rate_key) DO UPDATE SET attempts = CASE WHEN window_started <= ?3 THEN 1 ELSE attempts + 1 END, window_started = CASE WHEN window_started <= ?3 THEN ?2 ELSE window_started END RETURNING attempts, window_started').bind(rateKey, now, now - WINDOW).first();
    if (!rate || rate.attempts > MAX_ATTEMPTS) return json({ error: 'rate_limit' }, 429, { 'Retry-After': String(Math.max(1, (rate?.window_started || now) + WINDOW - now)) });
    let body;
    try { body = await readJson(request); } catch { return json({ error: 'invalid' }, 400); }
    if (typeof body.website === 'string' && body.website.trim()) return json({ ok: true });
    const fields = { name:120, email:254, subject:200, message:5000 };
    for (const [field, limit] of Object.entries(fields)) {
      if (!validText(body[field], limit)) return json({ error: 'invalid', field }, 400);
    }
    const email = body.email.trim();
    if (!/^[^\s@<>]+@[^\s@<>.]+(?:\.[^\s@<>.]+)+$/u.test(email) || /[\r\n]/u.test(body.name + body.subject)) return json({ error: 'invalid', field: 'email' }, 400);
    await env.DB.prepare('INSERT INTO contact_messages (id, name, email, subject, message, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)').bind(crypto.randomUUID(), body.name.trim(), email, body.subject.trim(), body.message.trim(), now).run();
    return json({ ok: true }, 201);
  } catch { return json({ error: 'unavailable' }, 503); }
}
