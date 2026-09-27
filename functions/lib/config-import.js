import {contentField,validText} from './content.js';
import {mediaCatalog} from './media-catalog.js';
import {positions} from './media.js';
import {defaultSkills,validProofs} from './skills.js';
import {required} from '../api/admin/publication.js';
import {readSetting,sha256Hex} from './security.js';
const linkedin=/^https:\/\/(www\.)?linkedin\.com\/in\/[A-Za-z0-9_%.-]+\/?(?:\?[A-Za-z0-9_=&%-]*)?$/u;
const sectionKeys=new Set(Object.keys(required));
const lang=value=>['fr','en'].includes(value);
function checkText(value,limit){return typeof value==='string'&&value.length<=limit&&!/[\u0000-\u001f\u007f]/u.test(value);}
export async function normalizeImport(raw,env){
 if(!raw||typeof raw!=='object'||!['pm-systems-v8-personalisation','pm-systems-v9-personalisation'].includes(raw.format))throw new Error('Format d’export V8/V9 attendu.');
 if(!Array.isArray(raw.contentOverrides)||!Array.isArray(raw.mediaMetadata)||!Array.isArray(raw.publicationFlags))throw new Error('Fichier incomplet.');
 if(raw.skillsOverrides!==undefined&&(!Array.isArray(raw.skillsOverrides)||raw.skillsOverrides.length>10))throw new Error('Liste de compétences invalide.');
 if([raw.contentOverrides.length,raw.mediaMetadata.length,raw.publicationFlags.length].some((n,i)=>n>[600,7,8][i]))throw new Error('Trop d’entrées.');
 const content=[],seenContent=new Set();
 for(const row of raw.contentOverrides){const field=lang(row.language)?contentField(row.language,row.content_key):null;const id=`${row.language}:${row.content_key}`;if(!field||!validText(row.value,field.maxLength)||seenContent.has(id))throw new Error('Texte inconnu, répété ou invalide.');seenContent.add(id);content.push({language:row.language,key:row.content_key,value:row.value});}
 const media=[],seenMedia=new Set();
 for(const row of raw.mediaMetadata){if(!Object.hasOwn(mediaCatalog,row.media_key)||seenMedia.has(row.media_key)||!checkText(row.alt_fr,300)||!checkText(row.alt_en,300)||!positions.includes(row.object_position))throw new Error('Métadonnées photo invalides.');seenMedia.add(row.media_key);media.push({key:row.media_key,fr:row.alt_fr,en:row.alt_en,position:row.object_position});}
 const flags=[],seenFlags=new Set();
 for(const row of raw.publicationFlags){const id=`${row.language}:${row.section}`;if(!lang(row.language)||!sectionKeys.has(row.section)||![0,1].includes(row.visible)||seenFlags.has(id))throw new Error('Publication invalide.');seenFlags.add(id);flags.push({language:row.language,section:row.section,visible:row.visible});}
 const skills=[],seenSkills=new Set();
 for(const row of raw.skillsOverrides||[]){const id=`${row.language}:${row.skill_key}`;let proofs;try{proofs=JSON.parse(row.proofs_json);}catch{throw new Error('Preuves de compétence invalides.');}if(!lang(row.language)||!Object.hasOwn(defaultSkills,row.skill_key)||!validProofs(proofs)||![0,1].includes(row.visible)||seenSkills.has(id))throw new Error('Compétence invalide.');seenSkills.add(id);skills.push({language:row.language,key:row.skill_key,proofs,visible:row.visible});}
 const publicSettings={};const settings=raw.settings||{};
 if(typeof settings.linkedin_url==='string'){if(settings.linkedin_url&&(!linkedin.test(settings.linkedin_url)||settings.linkedin_url.length>300))throw new Error('LinkedIn invalide.');publicSettings.linkedin_url=settings.linkedin_url;}
 for(const key of ['site_public','cep_public','cep_protected'])if(settings[key]!==undefined){if(!['true','false'].includes(settings[key]))throw new Error('Paramètre public invalide.');publicSettings[key]=settings[key];}
 if(publicSettings.cep_public==='true'){if(await readSetting(env.DB,'cep_available')!=='true'||!await env.CV_BUCKET?.head('cep-presentation.pdf'))throw new Error('Le PDF CEP doit déjà être présent avant sa publication.');}
 if(publicSettings.cep_protected==='true'&&!await readSetting(env.DB,'cv_access_digest'))throw new Error('Définissez un code CV avant de protéger le CEP.');
 // Publication requires every field to be present in the imported file or the current database.
 if(flags.some(row=>row.visible===1)){
  const {results}=await env.DB.prepare('SELECT language,content_key,value FROM content_overrides').all();
  const combined=new Map((results||[]).map(row=>[`${row.language}:${row.content_key}`,row.value]));
  for(const row of content)combined.set(`${row.language}:${row.key}`,row.value);
  for(const flag of flags.filter(row=>row.visible===1))for(const field of required[flag.section]){const key=`project.${flag.section}.${field}`,value=combined.get(`${flag.language}:${key}`);if(!value||value===contentField(flag.language,key)?.defaultValue)throw new Error('Un bloc à publier est incomplet.');}
 }
 return {content,media,flags,skills,settings:publicSettings};
}
export const importDigest=normalized=>sha256Hex(JSON.stringify(normalized));
export async function importSummary(normalized,env){
 const [existingContent,existingMedia,existingFlags,existingSkills]=await Promise.all([
 env.DB.prepare('SELECT language,content_key,value FROM content_overrides').all(),env.DB.prepare('SELECT media_key,alt_fr,alt_en,object_position FROM media_overrides').all(),env.DB.prepare('SELECT language,section,visible FROM publication_flags').all(),env.DB.prepare('SELECT language,skill_key,visible,proofs_json FROM skills_overrides').all()]);
 const texts=new Map((existingContent.results||[]).map(row=>[`${row.language}:${row.content_key}`,row.value]));
 const photos=new Map((existingMedia.results||[]).map(row=>[row.media_key,row]));
 const flags=new Map((existingFlags.results||[]).map(row=>[`${row.language}:${row.section}`,row.visible]));
 const skills=new Map((existingSkills.results||[]).map(row=>[`${row.language}:${row.skill_key}`,row]));
 const settings=await Promise.all(Object.keys(normalized.settings).map(key=>readSetting(env.DB,key)));
 return {texts:normalized.content.filter(row=>texts.get(`${row.language}:${row.key}`)!==row.value).length,photos:normalized.media.filter(row=>{const current=photos.get(row.key);return !current||current.alt_fr!==row.fr||current.alt_en!==row.en||current.object_position!==row.position;}).length,publications:normalized.flags.filter(row=>flags.get(`${row.language}:${row.section}`)!==row.visible).length,skills:normalized.skills.filter(row=>{const current=skills.get(`${row.language}:${row.key}`);return !current||current.visible!==row.visible||current.proofs_json!==JSON.stringify(row.proofs);}).length,settings:Object.keys(normalized.settings).filter((key,i)=>settings[i]!==normalized.settings[key]).length,ignored:'PDF, fichiers image, codes, secrets, sessions, liens temporaires et messages ne sont jamais importés.'};
}
export async function applyImport(normalized,env){
 const {results}=await env.DB.prepare('SELECT language,content_key,value FROM content_overrides').all();
 const current=new Map((results||[]).map(row=>[`${row.language}:${row.content_key}`,row.value]));
 const statements=[];
 for(const row of normalized.content){
  const field=contentField(row.language,row.key),previous=current.get(`${row.language}:${row.key}`)??field.defaultValue;
  statements.push(env.DB.prepare('INSERT INTO content_overrides(language,content_key,value,updated_at) VALUES(?1,?2,?3,unixepoch()) ON CONFLICT(language,content_key) DO UPDATE SET value=excluded.value,updated_at=unixepoch()').bind(row.language,row.key,row.value));
  if(previous!==row.value)statements.push(env.DB.prepare("INSERT INTO admin_audit(id,at,type,item_key,language,action,previous_value,new_value) VALUES(?1,unixepoch(),'text',?2,?3,'import',?4,?5)").bind(crypto.randomUUID(),row.key,row.language,previous,row.value));
 }
 for(const row of normalized.media)statements.push(env.DB.prepare('INSERT INTO media_overrides(media_key,alt_fr,alt_en,object_position,updated_at) VALUES(?1,?2,?3,?4,unixepoch()) ON CONFLICT(media_key) DO UPDATE SET alt_fr=excluded.alt_fr,alt_en=excluded.alt_en,object_position=excluded.object_position,updated_at=unixepoch()').bind(row.key,row.fr,row.en,row.position));
 for(const row of normalized.flags)statements.push(env.DB.prepare('INSERT INTO publication_flags(language,section,visible,updated_at) VALUES(?1,?2,?3,unixepoch()) ON CONFLICT(language,section) DO UPDATE SET visible=excluded.visible,updated_at=unixepoch()').bind(row.language,row.section,row.visible));
 for(const row of normalized.skills)statements.push(env.DB.prepare('INSERT INTO skills_overrides(language,skill_key,proofs_json,visible,updated_at) VALUES(?1,?2,?3,?4,unixepoch()) ON CONFLICT(language,skill_key) DO UPDATE SET proofs_json=excluded.proofs_json,visible=excluded.visible,updated_at=unixepoch()').bind(row.language,row.key,JSON.stringify(row.proofs),row.visible));
 for(const [key,value] of Object.entries(normalized.settings))statements.push(env.DB.prepare('INSERT INTO settings(key,value,updated_at) VALUES(?1,?2,unixepoch()) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=unixepoch()').bind(key,value));
 if(!statements.length)return;
 await env.DB.batch(statements);
}
