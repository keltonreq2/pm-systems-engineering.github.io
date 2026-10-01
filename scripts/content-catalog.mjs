import { readFile, writeFile } from 'node:fs/promises';

// Only authored data-content-key elements are part of the editor. Never parse user HTML.
const decode = (text) => text.replace(/<br\s*\/?>/gu, '\n').replace(/<[^>]*>/gu, '')
  .replace(/&(amp|lt|gt|quot|apos|#39|#160|nbsp);/gu, (_, entity) => ({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",'#39':"'",'#160':' ',nbsp:' '})[entity]).trim();
const catalog = {};
for (const [language, paths] of [['fr', ['index.html','pitch/index.html']], ['en', ['en/index.html','en/pitch/index.html']]]) {
  const source = (await Promise.all(paths.map(path=>readFile(path,'utf8')))).join('\n');
  catalog[language] = [];
  const pattern = /<([a-z][a-z0-9]*)\b([^>]*\bdata-content-key="([^"]+)"[^>]*)>([\s\S]*?)<\/\1>/gu;
  for (const match of source.matchAll(pattern)) {
    const [, tag, attributes, key, raw] = match;
    const value = decode(raw);
    const label = attributes.match(/data-content-label="([^"]+)"/u)?.[1] || key;
    const multiline = !['h1','h2','h3','time','strong','dt'].includes(tag);
    catalog[language].push({ key, label: decode(label), defaultValue: value, multiline, maxLength: multiline ? 5000 : 500 });
  }
  if (new Set(catalog[language].map(f => f.key)).size !== catalog[language].length) throw new Error(`Duplicate content keys: ${language}`);
}
await writeFile('functions/lib/content-catalog.js', '// Generated from the fallback HTML by scripts/content-catalog.mjs.\nexport const contentCatalog = '+JSON.stringify(catalog,null,2)+';\n');
