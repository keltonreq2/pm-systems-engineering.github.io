import {json,readSetting,writeSetting} from '../../lib/security.js';
import {adminGuard,readMultipart} from '../../lib/request.js';
import {auditAdmin} from '../../lib/audit.js';
import {CEP_MAX,CEP_FORMATS,cepDocument,inspectCep} from '../../lib/cep.js';
export async function onRequestGet({request,env}) {
  const denied=await adminGuard(request,env);if(denied)return denied;
  try {
    const doc=await cepDocument(env);
    return json({available:Boolean(doc),size:doc?.size||0,format:doc?.format||null,
      filename:doc?await readSetting(env.DB,'cep_filename')||`Presentation-CEP-CAM.${doc.format}`:null,
      slides:doc?Number(await readSetting(env.DB,'cep_slides'))||null:null,
      public:await readSetting(env.DB,'cep_public')==='true',protected:true,
      codeConfigured:Boolean(await readSetting(env.DB,'cv_access_digest'))});
  } catch { return json({error:'Document indisponible'},503); }
}
export async function onRequestPut({request,env}) {
  const denied=await adminGuard(request,env,true);if(denied)return denied;
  if(!env.CV_BUCKET)return json({error:'Stockage non configuré'},503);
  let form;
  try { form=await readMultipart(request,CEP_MAX+65536); }
  catch(error) { return json({error:error?.message==='Body too large'?'Fichier de 10 Mio maximum':'Envoi invalide'},error?.message==='Body too large'?413:400); }
  const file=form.get('cep');
  if(!(file instanceof File)||!file.size||file.size>CEP_MAX)return json({error:'PDF ou PPTX de 10 Mio maximum'},400);
  const bytes=new Uint8Array(await file.arrayBuffer());let checked;
  try { checked=await inspectCep(file,bytes); } catch(error) { return json({error:error.message},400); }
  try {
    const {format,slides}=checked, descriptor=CEP_FORMATS[format];
    await env.CV_BUCKET.put(descriptor.key,bytes,{httpMetadata:{contentType:descriptor.mime,cacheControl:'private, no-store'}});
    await writeSetting(env.DB,'cep_format',format);
    await writeSetting(env.DB,'cep_filename',file.name.replace(/[\u0000-\u001f\u007f]/gu,'').slice(0,255));
    await writeSetting(env.DB,'cep_slides',slides===null?'':String(slides));
    await writeSetting(env.DB,'cep_protected','true');
    await writeSetting(env.DB,'cep_available','true');
    // Switch the active format before discarding the previous version.
    await env.CV_BUCKET.delete(CEP_FORMATS[format==='pdf'?'pptx':'pdf'].key);
    await auditAdmin(env,{type:'cep',key:'file',action:'upload'});
    return json({ok:true,format,slides});
  } catch { return json({error:'Téléversement impossible'},503); }
}
export async function onRequestDelete({request,env}) {
  const denied=await adminGuard(request,env,true);if(denied)return denied;
  try {
    await writeSetting(env.DB,'cep_public','false');await writeSetting(env.DB,'cep_available','false');
    for(const format of Object.values(CEP_FORMATS))await env.CV_BUCKET?.delete(format.key);
    await writeSetting(env.DB,'cep_filename','');await writeSetting(env.DB,'cep_slides','');
    await auditAdmin(env,{type:'cep',key:'file',action:'delete'});return json({ok:true});
  } catch { return json({error:'Suppression impossible'},503); }
}
