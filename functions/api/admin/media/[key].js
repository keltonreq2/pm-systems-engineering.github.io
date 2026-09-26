import {json,requireSameOrigin} from '../../../lib/security.js';
import {adminGuard,readJson,readMultipart} from '../../../lib/request.js';
import {imageType,positions,safeMediaKey} from '../../../lib/media.js';
const MAX=5*1024*1024;
export async function onRequestPut({request,env,params}){
 const denied=await adminGuard(request,env,true);if(denied)return denied;
 const key=params.key;if(!safeMediaKey(key))return json({error:'Emplacement inconnu'},404);
 if(!env.CV_BUCKET)return json({error:'Stockage non configuré'},503);
 if(Number(request.headers.get('Content-Length'))>MAX+65536)return json({error:'Image trop volumineuse (5 Mio maximum)'},413);
 if(!request.headers.get('Content-Type')?.toLowerCase().startsWith('multipart/form-data;'))return json({error:'Fichier attendu'},400);
 try{
  const form=await readMultipart(request,MAX+65536);const file=form.get('image');
  if(!(file instanceof File)||!file.size||file.size>MAX)return json({error:'Image trop volumineuse ou absente'},400);
  const bytes=new Uint8Array(await file.arrayBuffer());const mime=imageType(bytes,file.type);
  if(!mime)return json({error:'Image JPEG, PNG ou WebP valide requise'},400);
  const previous=await env.DB.prepare('SELECT r2_key FROM media_overrides WHERE media_key=?1').bind(key).first();
  const r2Key=`media/${key}/${crypto.randomUUID()}`;
  await env.CV_BUCKET.put(r2Key,bytes,{httpMetadata:{contentType:mime,cacheControl:'private, no-store'}});
  try{await env.DB.prepare("INSERT INTO media_overrides(media_key,r2_key,mime_type,size,updated_at) VALUES(?1,?2,?3,?4,unixepoch()) ON CONFLICT(media_key) DO UPDATE SET r2_key=excluded.r2_key,mime_type=excluded.mime_type,size=excluded.size,updated_at=unixepoch()").bind(key,r2Key,mime,bytes.length).run();}
  catch(error){await env.CV_BUCKET.delete(r2Key);throw error;}
  if(previous?.r2_key)try{await env.CV_BUCKET.delete(previous.r2_key);}catch{/* Orphan cleanup can be retried. */}
  return json({ok:true});
 }catch(error){return json({error:error?.message==='Body too large'?'Image trop volumineuse (5 Mio maximum)':'Téléversement impossible'},error?.message==='Body too large'?413:503);}
}
export async function onRequestPatch({request,env,params}){
 const denied=await adminGuard(request,env,true);if(denied)return denied;
 const key=params.key;if(!safeMediaKey(key))return json({error:'Emplacement inconnu'},404);
 let body;try{body=await readJson(request,4096);}catch{return json({error:'Requête invalide'},400);}
 if(typeof body.altFr!=='string'||typeof body.altEn!=='string'||body.altFr.length>300||body.altEn.length>300||/[\u0000-\u001f\u007f]/u.test(body.altFr+body.altEn)||!positions.includes(body.position))return json({error:'Métadonnées invalides'},400);
 try{await env.DB.prepare("INSERT INTO media_overrides(media_key,alt_fr,alt_en,object_position,updated_at) VALUES(?1,?2,?3,?4,unixepoch()) ON CONFLICT(media_key) DO UPDATE SET alt_fr=excluded.alt_fr,alt_en=excluded.alt_en,object_position=excluded.object_position,updated_at=unixepoch()").bind(key,body.altFr.trim(),body.altEn.trim(),body.position).run();return json({ok:true});}
 catch{return json({error:'Enregistrement impossible'},503);}
}
export async function onRequestDelete({request,env,params}){
 const denied=await adminGuard(request,env,true);if(denied)return denied;
 const key=params.key;if(!safeMediaKey(key))return json({error:'Emplacement inconnu'},404);
 try{const row=await env.DB.prepare('SELECT r2_key FROM media_overrides WHERE media_key=?1').bind(key).first();await env.DB.prepare('DELETE FROM media_overrides WHERE media_key=?1').bind(key).run();if(row?.r2_key)await env.CV_BUCKET?.delete(row.r2_key);return json({ok:true});}
 catch{return json({error:'Restauration impossible'},503);}
}
