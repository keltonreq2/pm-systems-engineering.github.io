import { mediaCatalog } from './media-catalog.js';
export const mediaKeys=Object.keys(mediaCatalog);
export const positions=['center','top','bottom','left','right'];
export const safeMediaKey=(key)=>Object.hasOwn(mediaCatalog,key);
export const imageType=(bytes,mime)=>{
  if(mime==='image/jpeg'&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255)return mime;
  if(mime==='image/png'&&[137,80,78,71,13,10,26,10].every((b,i)=>bytes[i]===b))return mime;
  if(mime==='image/webp'&&new TextDecoder().decode(bytes.slice(0,4))==='RIFF'&&new TextDecoder().decode(bytes.slice(8,12))==='WEBP')return mime;
  return null;
};
export async function fallbackImage(request,env,key){
  if(!env.ASSETS)return new Response('Image unavailable',{status:503,headers:{'Cache-Control':'no-store'}});
  const response=await env.ASSETS.fetch(new Request(new URL('/'+mediaCatalog[key].src,request.url)));
  const headers=new Headers(response.headers);headers.set('Cache-Control','private, no-store');headers.set('X-Content-Type-Options','nosniff');
  return new Response(response.body,{status:response.status,headers});
}
export async function serveImage(request,env,key){
  try{
    const row=await env.DB.prepare('SELECT r2_key,mime_type FROM media_overrides WHERE media_key=?1').bind(key).first();
    if(row?.r2_key&&['image/png','image/jpeg','image/webp'].includes(row.mime_type)){
      const object=await env.CV_BUCKET?.get(row.r2_key);
      if(object)return new Response(object.body,{headers:{'Content-Type':row.mime_type,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow'}});
    }
  }catch{/* The authored image is the safe fallback. */}
  return fallbackImage(request,env,key);
}
