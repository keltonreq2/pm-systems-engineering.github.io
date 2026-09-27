import {json} from '../../../lib/security.js';
import {adminGuard,readJson} from '../../../lib/request.js';
import {contentField,validText} from '../../../lib/content.js';
import {auditAdmin} from '../../../lib/audit.js';
export async function onRequestPost({request,env}){
 const denied=await adminGuard(request,env,true);if(denied)return denied;
 let body;try{body=await readJson(request,4096);}catch{return json({error:'Requête invalide'},400);}
 if(typeof body.id!=='string'||!/^[0-9a-f-]{36}$/u.test(body.id))return json({error:'Historique invalide'},400);
 try{
  const event=await env.DB.prepare("SELECT type,item_key,language,previous_value,new_value FROM admin_audit WHERE id=?1").bind(body.id).first();
  const field=event?.type==='text'?contentField(event.language,event.item_key):null;
  if(!field||!validText(event.previous_value,field.maxLength)||!validText(event.new_value,field.maxLength))return json({error:'Cette modification ne peut pas être restaurée'},400);
  const row=await env.DB.prepare('SELECT value FROM content_overrides WHERE language=?1 AND content_key=?2').bind(event.language,event.item_key).first();
  const current=row?.value??field.defaultValue;
  if(current!==event.new_value)return json({error:'Le texte a été modifié depuis cette version. Actualisez l’historique.'},409);
  if(event.previous_value===field.defaultValue)await env.DB.prepare('DELETE FROM content_overrides WHERE language=?1 AND content_key=?2').bind(event.language,event.item_key).run();
  else await env.DB.prepare('INSERT INTO content_overrides(language,content_key,value,updated_at) VALUES(?1,?2,?3,unixepoch()) ON CONFLICT(language,content_key) DO UPDATE SET value=excluded.value,updated_at=unixepoch()').bind(event.language,event.item_key,event.previous_value).run();
  await auditAdmin(env,{type:'text',key:event.item_key,language:event.language,action:'restore',previousValue:current,newValue:event.previous_value});
  return json({ok:true,value:event.previous_value});
 }catch{return json({error:'Restauration impossible'},503);}
}
