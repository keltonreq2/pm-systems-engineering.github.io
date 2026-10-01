import {json,writeSetting} from '../../lib/security.js';
import {adminGuard,readMultipart} from '../../lib/request.js';
import {auditAdmin} from '../../lib/audit.js';
import {PITCH_KEY} from '../../lib/pitch.js';
const max=30*1024*1024;
export async function onRequestGet({request,env}){
 const denied=await adminGuard(request,env);if(denied)return denied;
 try{const [object,configured]=await Promise.all([env.CV_BUCKET?.head(PITCH_KEY),env.DB.prepare("SELECT value FROM settings WHERE key='cv_access_digest'").first()]);return json({available:Boolean(object),size:object?.size||0,codeConfigured:Boolean(configured?.value)});}catch{return json({error:'Pitch indisponible'},503);}
}
export async function onRequestPut({request,env}){
 const denied=await adminGuard(request,env,true);if(denied)return denied;
 if(!env.CV_BUCKET)return json({error:'Stockage non configuré'},503);
 let form;try{form=await readMultipart(request,max+65536);}catch(error){return json({error:error?.message==='Body too large'?'Vidéo de 30 Mio maximum':'Envoi invalide'},error?.message==='Body too large'?413:400);}
 const file=form.get('pitch');
 if(!(file instanceof File)||!file.size||file.size>max)return json({error:'Vidéo MP4 de 30 Mio maximum'},400);
 const bytes=new Uint8Array(await file.arrayBuffer());
 // ISO Base Media File Format: ftyp at byte offset 4. The browser needs H.264/AAC-compatible encoding.
 if(!['video/mp4','application/mp4'].includes(file.type)||new TextDecoder().decode(bytes.subarray(4,8))!=='ftyp')return json({error:'Fichier MP4 valide requis'},400);
 try{await env.CV_BUCKET.put(PITCH_KEY,bytes,{httpMetadata:{contentType:'video/mp4',cacheControl:'private, no-store'}});await writeSetting(env.DB,'pitch_available','true');await auditAdmin(env,{type:'pitch',key:'file',action:'upload'});return json({ok:true});}
 catch{return json({error:'Téléversement impossible'},503);}
}
export async function onRequestDelete({request,env}){
 const denied=await adminGuard(request,env,true);if(denied)return denied;
 try{await writeSetting(env.DB,'pitch_available','false');await env.CV_BUCKET?.delete(PITCH_KEY);await auditAdmin(env,{type:'pitch',key:'file',action:'delete'});return json({ok:true});}
 catch{return json({error:'Suppression impossible'},503);}
}
