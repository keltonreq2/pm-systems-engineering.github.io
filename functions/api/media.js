import {safeMediaKey,serveImage} from '../lib/media.js';
export async function onRequestGet({request,env}){
 const key=new URL(request.url).searchParams.get('key');
 if(!safeMediaKey(key))return new Response('Image not found',{status:404,headers:{'Cache-Control':'no-store'}});
 return serveImage(request,env,key);
}
