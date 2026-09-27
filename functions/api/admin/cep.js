import {json,readSetting,writeSetting} from '../../lib/security.js';
import {adminGuard,readMultipart} from '../../lib/request.js';
import {auditAdmin} from '../../lib/audit.js';
const key='cep-presentation.pdf';const max=10*1024*1024;
export async function onRequestGet({request,env}){
 const denied=await adminGuard(request,env);if(denied)return denied;
 try{const obj=await env.CV_BUCKET?.head(key);return json({available:Boolean(obj),size:obj?.size||0,public:await readSetting(env.DB,'cep_public')==='true',protected:await readSetting(env.DB,'cep_protected')==='true'});}catch{return json({error:'Document indisponible'},503);}
}
export async function onRequestPut({request,env}){
 const denied=await adminGuard(request,env,true);if(denied)return denied;
 if(!env.CV_BUCKET)return json({error:'Stockage non configuré'},503);
 if(Number(request.headers.get('Content-Length'))>max+65536)return json({error:'PDF de 10 Mio maximum'},413);
 if(!request.headers.get('Content-Type')?.toLowerCase().startsWith('multipart/form-data;'))return json({error:'PDF requis'},400);
 try{
 const form=await readMultipart(request,max+65536);const file=form.get('cep');if(!(file instanceof File)||!file.size||file.size>max)return json({error:'PDF de 10 Mio maximum'},400);
 const bytes=new Uint8Array(await file.arrayBuffer());if(file.type!=='application/pdf'||new TextDecoder().decode(bytes.slice(0,5))!=='%PDF-')return json({error:'PDF valide requis'},400);
 await env.CV_BUCKET.put(key,bytes,{httpMetadata:{contentType:'application/pdf',cacheControl:'private, no-store'}});
 await writeSetting(env.DB,'cep_available','true');await auditAdmin(env,{type:'cep',key:'file',action:'upload'});return json({ok:true});
 }catch(error){return json({error:error?.message==='Body too large'?'PDF de 10 Mio maximum':'Téléversement impossible'},error?.message==='Body too large'?413:503);}
}
export async function onRequestDelete({request,env}){
 const denied=await adminGuard(request,env,true);if(denied)return denied;
 try{await writeSetting(env.DB,'cep_public','false');await env.CV_BUCKET?.delete(key);await writeSetting(env.DB,'cep_available','false');await auditAdmin(env,{type:'cep',key:'file',action:'delete'});return json({ok:true});}
 catch{return json({error:'Suppression impossible'},503);}
}
