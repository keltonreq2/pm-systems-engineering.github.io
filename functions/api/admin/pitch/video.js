import {adminGuard} from '../../../lib/request.js';
import {servePitch} from '../../../lib/pitch.js';
export async function onRequest(context){
  const denied=await adminGuard(context.request,context.env);if(denied)return denied;
  try{return await servePitch(context.request,context.env,{admin:true});}catch{return new Response('Video unavailable',{status:503,headers:{'Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow'}});}
}
