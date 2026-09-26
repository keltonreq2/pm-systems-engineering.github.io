import { readFile, writeFile } from 'node:fs/promises';
const files=[['fr','index.html'],['en','en/index.html']];
const slots={};
for(const [lang,path] of files){
 const html=await readFile(path,'utf8');
 for(const match of html.matchAll(/<img\b([^>]*\bdata-media-key="([^"]+)"[^>]*)>/gu)){
  const [,attrs,key]=match;
  const attr=name=>attrs.match(new RegExp(`\\b${name}="([^"]*)"`,'u'))?.[1];
  const src=attr('src')?.replace(/^\.\.\//u,'');
  if(!src?.startsWith('assets/images/') || !/^[a-z][a-z0-9_.]*$/u.test(key))throw new Error(`Invalid media slot ${key}`);
  const slot=slots[key]??={key,src,alt:{}};
  if(slot.src!==src || slot.alt[lang])throw new Error(`Inconsistent media slot ${key}`);
  slot.alt[lang]=attr('alt')||'';
 }
}
if(Object.keys(slots).length!==7||Object.values(slots).some(v=>!v.alt.fr||!v.alt.en))throw new Error('Missing V8 photo slot');
await writeFile('functions/lib/media-catalog.js','// Generated from bilingual static image fallbacks.\nexport const mediaCatalog = '+JSON.stringify(slots,null,2)+';\n');
