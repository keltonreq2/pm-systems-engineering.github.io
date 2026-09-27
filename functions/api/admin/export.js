import {json,readSetting} from '../../lib/security.js';
import {adminGuard} from '../../lib/request.js';
export async function onRequestGet({request,env}){
 const denied=await adminGuard(request,env);if(denied)return denied;
 try{
 const [content,media,flags,skills,settings]=await Promise.all([
  env.DB.prepare('SELECT language,content_key,value,updated_at FROM content_overrides ORDER BY language,content_key').all(),
  env.DB.prepare('SELECT media_key,mime_type,size,alt_fr,alt_en,object_position,updated_at FROM media_overrides ORDER BY media_key').all(),
  env.DB.prepare('SELECT language,section,visible,updated_at FROM publication_flags ORDER BY language,section').all(),
  env.DB.prepare('SELECT language,skill_key,proofs_json,visible,updated_at FROM skills_overrides ORDER BY language,skill_key').all(),
  Promise.all(['site_public','linkedin_url','cv_available','cv_en_available','cep_available','cep_public','cep_protected'].map(async key=>[key,await readSetting(env.DB,key)]))
 ]);
 const data={format:'pm-systems-v9-personalisation',exportedAt:new Date().toISOString(),settings:Object.fromEntries(settings),contentOverrides:content.results||[],mediaMetadata:media.results||[],publicationFlags:flags.results||[],skillsOverrides:skills.results||[],notice:'Métadonnées uniquement : fichiers PDF et images non inclus. Accès externes, secrets, sessions et messages exclus. Import contrôlé par prévisualisation et confirmation.'};
 return json(data,200,{'Content-Disposition':'attachment; filename="pm-systems-config-v9.json"','X-Content-Type-Options':'nosniff'});
 }catch{return json({error:'Export indisponible'},503);}
}
