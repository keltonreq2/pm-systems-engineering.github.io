import { json } from '../../../lib/security.js';
import { adminGuard, readJson } from '../../../lib/request.js';
async function mutate({ request, env, params }, remove) {
  const denied = await adminGuard(request, env, true);
  if (denied) return denied;
  if (!/^[a-f0-9-]{36}$/u.test(params.id || '')) return json({ error: 'Identifiant invalide' }, 400);
  let read;
  if (!remove) {
    try { ({ read } = await readJson(request, 1024)); } catch { return json({ error: 'Requête invalide' }, 400); }
    if (typeof read !== 'boolean') return json({ error: 'État invalide' }, 400);
  }
  try {
    const result = remove
      ? await env.DB.prepare('DELETE FROM contact_messages WHERE id = ?1').bind(params.id).run()
      : await env.DB.prepare('UPDATE contact_messages SET read_at = ?1 WHERE id = ?2').bind(read ? Math.floor(Date.now()/1000) : null, params.id).run();
    if (!result.meta?.changes) return json({ error: 'Message introuvable' }, 404);
    return json({ ok:true });
  } catch { return json({ error: 'Modification impossible' }, 503); }
}
export const onRequestPatch = context => mutate(context, false);
export const onRequestDelete = context => mutate(context, true);
