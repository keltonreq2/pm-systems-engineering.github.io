import {adminGuard} from '../../../lib/request.js';
import {safeMediaKey,serveImage} from '../../../lib/media.js';
export async function onRequestGet({request,env}){
 const denied=await adminGuard(request,env);if(denied)return denied;
 const key=new URL(request.url).searchParams.get('key');if(!safeMediaKey(key))return new Response('Not found',{status:404});
 return serveImage(request,env,key);
}
