import { json } from '../../lib/security.js';
import { adminGuard } from '../../lib/request.js';
export async function onRequestGet({ request, env }) {
  const denied = await adminGuard(request, env);
  if (denied) return denied;
  const raw = new URL(request.url).searchParams.get('page') || '1';
  const page = Number(raw);
  if (!Number.isSafeInteger(page) || page < 1 || page > 100000) return json({ error: 'Page invalide' }, 400);
  try {
    const { results } = await env.DB.prepare('SELECT id, name, email, subject, message, created_at, read_at FROM contact_messages ORDER BY created_at DESC, id DESC LIMIT 20 OFFSET ?1').bind((page - 1) * 20).all();
    const counts = await env.DB.prepare('SELECT COUNT(*) AS total, COUNT(CASE WHEN read_at IS NULL THEN 1 END) AS unread FROM contact_messages').first();
    return json({ messages: results, page, pageSize:20, total: counts.total, unread: counts.unread });
  } catch { return json({ error: 'Messages indisponibles. Vérifiez la migration D1 V7.' }, 503); }
}
