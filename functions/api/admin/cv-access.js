import {hmacHex,json,readSetting} from '../../lib/security.js';
import {adminGuard,readJson} from '../../lib/request.js';
export async function onRequestGet({request,env}){
 const denied=await adminGuard(request,env);if(denied)return denied;
 try{return json({enabled:await readSetting(env.DB,'cv_access_enabled')==='true',configured:Boolean(await readSetting(env.DB,'cv_access_digest'))});}
 catch{return json({error:'Réglages indisponibles'},503);}
}
export async function onRequestPut({request,env}){
 const denied=await adminGuard(request,env,true);if(denied)return denied;
 let body;try{body=await readJson(request,4096);}catch{return json({error:'Requête invalide'},400);}
 if(!env.SESSION_SECRET)return json({error:'Secret de session absent'},503);
 try{
  if(typeof body.code==='string'){
   if(body.code.length<10||body.code.length>128||/[\u0000-\u001f\u007f]/u.test(body.code))return json({error:'Code de 10 à 128 caractères requis'},400);
   const digest=await hmacHex(env.SESSION_SECRET,`cv-access:${body.code}`);
   const updated=await env.DB.prepare("UPDATE settings SET value=CASE key WHEN 'cv_access_digest' THEN ?1 ELSE ?2 END,updated_at=unixepoch() WHERE key IN ('cv_access_digest','cv_access_version')").bind(digest,crypto.randomUUID()).run();
   if((updated.meta?.changes??updated.changes)!==2)throw new Error('Migration V8 missing');
  }else if(typeof body.enabled==='boolean'){
   if(body.enabled&&!await readSetting(env.DB,'cv_access_digest'))return json({error:'Définissez d’abord un code'},400);
   // Both updates are atomic: enabling or disabling always revokes older cookies.
   const updated=await env.DB.prepare("UPDATE settings SET value=CASE key WHEN 'cv_access_enabled' THEN ?1 ELSE ?2 END,updated_at=unixepoch() WHERE key IN ('cv_access_enabled','cv_access_version')").bind(String(body.enabled),crypto.randomUUID()).run();
   if((updated.meta?.changes??updated.changes)!==2)throw new Error('Migration V8 missing');
  }else return json({error:'Opération invalide'},400);
  return json({ok:true,enabled:await readSetting(env.DB,'cv_access_enabled')==='true',configured:Boolean(await readSetting(env.DB,'cv_access_digest'))});
 }catch{return json({error:'Enregistrement impossible'},503);}
}
