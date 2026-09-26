import {json,readSetting} from '../../lib/security.js';
import {adminGuard} from '../../lib/request.js';
export async function onRequestGet({request,env}){
 const denied=await adminGuard(request,env);if(denied)return denied;
 try{
 const [content,media,flags,settings]=await Promise.all([
  env.DB.prepare('SELECT language,content_key,value,updated_at FROM content_overrides ORDER BY language,content_key').all(),
  env.DB.prepare('SELECT media_key,mime_type,size,alt_fr,alt_en,object_position,updated_at FROM media_overrides ORDER BY media_key').all(),
  env.DB.prepare('SELECT language,section,visible,updated_at FROM publication_flags ORDER BY language,section').all(),
  Promise.all(['site_public','linkedin_url','cv_available','cv_en_available','cep_available','cep_public','cep_protected'].map(async key=>[key,await readSetting(env.DB,key)]))
 ]);
 const data={format:'pm-systems-v8-personalisation',exportedAt:new Date().toISOString(),settings:Object.fromEntries(settings),contentOverrides:content.results||[],mediaMetadata:media.results||[],publicationFlags:flags.results||[],notice:'Métadonnées uniquement : fichiers PDF et images non inclus. Aucun import automatique.'};
 return json(data,200,{'Content-Disposition':'attachment; filename="pm-systems-config-v8.json"','X-Content-Type-Options':'nosniff'});
 }catch{return json({error:'Export indisponible'},503);}
}
