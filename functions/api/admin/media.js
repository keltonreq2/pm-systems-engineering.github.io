import {json} from '../../lib/security.js';
import {adminGuard} from '../../lib/request.js';
import {mediaCatalog} from '../../lib/media-catalog.js';
export async function onRequestGet({request,env}){
 const denied=await adminGuard(request,env);if(denied)return denied;
 try{
 const {results}=await env.DB.prepare('SELECT media_key,r2_key,mime_type,size,alt_fr,alt_en,object_position,updated_at FROM media_overrides').all();
 const rows=new Map((results||[]).map(row=>[row.media_key,row]));
 return json({items:Object.values(mediaCatalog).map(item=>({...item,custom:Boolean(rows.get(item.key)?.r2_key),mimeType:rows.get(item.key)?.mime_type||null,size:rows.get(item.key)?.size||0,altFr:rows.get(item.key)?.alt_fr||'',altEn:rows.get(item.key)?.alt_en||'',position:rows.get(item.key)?.object_position||'center'}))});
 }catch{return json({error:'Médias indisponibles. Appliquez la migration V8.'},503);}
}
