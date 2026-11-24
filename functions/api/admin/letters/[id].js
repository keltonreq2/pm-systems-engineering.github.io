import {adminGuard,readMultipart} from '../../../lib/request.js';
import {json,readSetting} from '../../../lib/security.js';
import {auditAdmin} from '../../../lib/audit.js';
import {LETTER_MAX,letterSlot,serveLetter} from '../../../lib/letters.js';
export async function onRequestGet({request,env,params}) {
  const denied=await adminGuard(request,env);if(denied)return denied;
  return serveLetter(request,env,params.id,{admin:true});
}
export const onRequestHead=onRequestGet;
export async function onRequestPut({request,env,params}) {
  const denied=await adminGuard(request,env,true);if(denied)return denied;
  const slot=letterSlot(params.id);if(!slot)return json({error:'Employeur ou langue invalide'},404);
  if(!env.CV_BUCKET)return json({error:'Stockage privé non configuré'},503);
  if(!await readSetting(env.DB,'cv_access_digest'))return json({error:'Configurez d’abord le code commun des documents'},409);
  let form;
  try {form=await readMultipart(request,LETTER_MAX+65536);}
  catch(error){return json({error:error.message==='Body too large'?'PDF de 10 Mio maximum':'Envoi invalide'},error.message==='Body too large'?413:400);}
  const file=form.get('letter');
  if(!(file instanceof File)||!file.size||file.size>LETTER_MAX||!file.name.toLowerCase().endsWith('.pdf')||file.type!=='application/pdf')return json({error:'PDF valide de 10 Mio maximum requis'},400);
  const bytes=new Uint8Array(await file.arrayBuffer());
  if(new TextDecoder().decode(bytes.subarray(0,5))!=='%PDF-')return json({error:'PDF valide requis'},400);
  try {
    await env.CV_BUCKET.put(slot.key,bytes,{httpMetadata:{contentType:'application/pdf',cacheControl:'private, no-store',contentDisposition:`attachment; filename="${slot.filename}"`}});
    await auditAdmin(env,{type:'letter',key:params.id,language:slot.language,action:'upload'});
    return json({ok:true,id:params.id});
  } catch {return json({error:'Téléversement impossible'},503);}
}
export async function onRequestDelete({request,env,params}) {
  const denied=await adminGuard(request,env,true);if(denied)return denied;
  const slot=letterSlot(params.id);if(!slot)return json({error:'Employeur ou langue invalide'},404);
  try {
    if(!env.CV_BUCKET)throw new Error();
    await env.CV_BUCKET.delete(slot.key);
    await auditAdmin(env,{type:'letter',key:params.id,language:slot.language,action:'delete'});
    return json({ok:true});
  } catch {return json({error:'Suppression impossible'},503);}
}
