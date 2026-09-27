import {json,readSetting} from '../../lib/security.js';
import {adminGuard,readJson} from '../../lib/request.js';
import {grantToken,hashGrantToken} from '../../lib/grants.js';
import {auditAdmin} from '../../lib/audit.js';
const periods={24:86400,168:604800,720:2592000};
export async function onRequestGet({request,env}){
 const denied=await adminGuard(request,env);if(denied)return denied;
 try{const {results}=await env.DB.prepare('SELECT token_hash,created_at,expires_at,allow_fr,allow_en,allow_cep,revoked_at FROM access_grants ORDER BY created_at DESC LIMIT 100').all();return json({grants:results||[]});}
 catch{return json({error:'Accès externes indisponibles. Appliquez la migration V9.'},503);}
}
export async function onRequestPost({request,env}){
 const denied=await adminGuard(request,env,true);if(denied)return denied;
 let body;try{body=await readJson(request,4096);}catch{return json({error:'Requête invalide'},400);}
 if(!Object.hasOwn(periods,body.hours)||typeof body.fr!=='boolean'||typeof body.en!=='boolean'||typeof body.cep!=='boolean'||!body.fr&&!body.en&&!body.cep)return json({error:'Sélectionnez une durée et au moins un document'},400);
 if(!env.SESSION_SECRET)return json({error:'Secret de session absent'},503);
 try{
  for(const [selected,key,object] of [[body.fr,'cv_available','cv-pm-systems-engineering.pdf'],[body.en,'cv_en_available','cv-pm-systems-engineering-en.pdf'],[body.cep,'cep_available','cep-presentation.pdf']])if(selected&&(await readSetting(env.DB,key)!=='true'||!await env.CV_BUCKET?.head(object)))return json({error:'Un des documents sélectionnés est absent'},400);
  const token=grantToken(),hash=await hashGrantToken(token),expires=Math.floor(Date.now()/1000)+periods[body.hours];
  await env.DB.prepare('INSERT INTO access_grants(token_hash,created_at,expires_at,allow_fr,allow_en,allow_cep,revoked_at) VALUES(?1,unixepoch(),?2,?3,?4,?5,NULL)').bind(hash,expires,body.fr?1:0,body.en?1:0,body.cep?1:0).run();
  await auditAdmin(env,{type:'access',key:hash,action:'create'});
  return json({url:new URL(`/access/${token}`,request.url).href,expiresAt:expires,hash});
 }catch{return json({error:'Création impossible'},503);}
}
