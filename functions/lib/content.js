import { contentCatalog } from './content-catalog.js';
export { contentCatalog };
export const contentField = (language, key) => contentCatalog[language]?.find(field => field.key === key);
export const validText = (value, limit) => typeof value === 'string' && value.trim().length > 0 && value.length <= limit && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(value);

export async function readOverrides(db, language) {
  const { results } = await db.prepare('SELECT content_key, value, updated_at FROM content_overrides WHERE language = ?1').bind(language).all();
  return new Map((results || []).filter(row => {
    const field = contentField(language, row.content_key);
    return field && validText(row.value, field.maxLength);
  }).map(row => [row.content_key, row]));
}

export function contentHandler(overrides) {
  return { element(element) {
    const row = overrides.get(element.getAttribute('data-content-key'));
    if (row) element.setInnerContent(row.value, { html: false });
  } };
}

export async function applyContent(response, db, language) {
  if (!response.ok || !response.headers.get('Content-Type')?.includes('text/html')) return response;
  let overrides;
  try { overrides = await readOverrides(db, language); } catch { return response; }
  if (!overrides.size) return response;
  // Cloudflare parses the authored HTML and escapes every replacement as text.
  return new HTMLRewriter().on('[data-content-key]', contentHandler(overrides)).transform(response);
}
