import {json,readSetting,writeSetting} from '../../../lib/security.js';
import {adminGuard,readJson} from '../../../lib/request.js';
import {auditAdmin} from '../../../lib/audit.js';
export async function onRequestPut({request,env}){
 const denied=await adminGuard(request,env,true);if(denied)return denied;
 let body;try{body=await readJson(request,4096);}catch{return json({error:'Requête invalide'},400);}
 if(typeof body.public!=='boolean'||typeof body.protected!=='boolean')return json({error:'Paramètres invalides'},400);
 try{
  if(body.public&&(!await env.CV_BUCKET?.head('cep-presentation.pdf')||await readSetting(env.DB,'cep_available')!=='true'))return json({error:'Ajoutez le PDF avant publication'},400);
  if(body.public&&body.protected&&(!env.SESSION_SECRET||!await readSetting(env.DB,'cv_access_digest')))return json({error:'Définissez le code d’accès avant de protéger le CEP'},400);
  await writeSetting(env.DB,'cep_protected',String(body.protected));await writeSetting(env.DB,'cep_public',String(body.public));await auditAdmin(env,{type:'cep',key:'publication',action:'update'});return json({ok:true});
 }catch{return json({error:'Enregistrement impossible'},503);}
}
