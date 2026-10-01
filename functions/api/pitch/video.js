import {servePitch} from '../../lib/pitch.js';
export async function onRequest(context){
  try{return await servePitch(context.request,context.env);}catch{return new Response('Video unavailable',{status:503,headers:{'Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow'}});}
}
