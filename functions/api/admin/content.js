import { json } from '../../lib/security.js';
import { adminGuard, readJson } from '../../lib/request.js';
import { contentCatalog, contentField, readOverrides, validText } from '../../lib/content.js';
import {auditAdmin} from '../../lib/audit.js';

export async function onRequestGet({ request, env }) {
  const denied = await adminGuard(request, env);
  if (denied) return denied;
  const language = new URL(request.url).searchParams.get('language') || 'fr';
  if (!['fr','en'].includes(language)) return json({ error: 'Langue invalide' }, 400);
  try {
    const overrides = await readOverrides(env.DB, language);
    return json({ language, fields: contentCatalog[language].map(field => ({ ...field,
      value: overrides.get(field.key)?.value ?? field.defaultValue,
      overridden: overrides.has(field.key), updatedAt: overrides.get(field.key)?.updated_at ?? null
    })) });
  } catch { return json({ error: 'Contenus indisponibles. Vérifiez la migration D1 V7.' }, 503); }
}

async function mutate({ request, env }, restore) {
  const denied = await adminGuard(request, env, true);
  if (denied) return denied;
  let body;
  try { body = await readJson(request); } catch { return json({ error: 'Requête invalide ou trop volumineuse' }, 400); }
  const { language, key, value } = body;
  const field = ['fr','en'].includes(language) ? contentField(language, key) : null;
  if (!field) return json({ error: 'Champ inconnu' }, 400);
  if (!restore && !validText(value, field.maxLength)) return json({ error: `Texte requis, ${field.maxLength} caractères maximum.` }, 400);
  try {
    const before=await env.DB.prepare('SELECT value FROM content_overrides WHERE language=?1 AND content_key=?2').bind(language,key).first();
    const previousValue=before?.value??field.defaultValue;
    if (restore) await env.DB.prepare('DELETE FROM content_overrides WHERE language = ?1 AND content_key = ?2').bind(language, key).run();
    else await env.DB.prepare('INSERT INTO content_overrides (language, content_key, value, updated_at) VALUES (?1, ?2, ?3, unixepoch()) ON CONFLICT(language, content_key) DO UPDATE SET value = excluded.value, updated_at = unixepoch()').bind(language, key, value.trim()).run();
    await auditAdmin(env,{type:'text',key,language,action:restore?'default':'update',previousValue,newValue:restore?field.defaultValue:value.trim()});
    return json({ ok: true, value: restore ? field.defaultValue : value.trim(), overridden: !restore });
  } catch { return json({ error: 'Enregistrement impossible. Réessayez.' }, 503); }
}
export const onRequestPut = context => mutate(context, false);
export const onRequestDelete = context => mutate(context, true);
