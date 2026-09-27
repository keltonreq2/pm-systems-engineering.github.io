import {readSetting} from '../lib/security.js';
import {hasCvAccess} from '../lib/cv-access.js';
import {validGrant} from '../lib/grants.js';
export async function onRequestGet({request,env}){
 try{
  const granted=await validGrant(request,env,'cep');
  if(await readSetting(env.DB,'cep_available')!=='true'||(await readSetting(env.DB,'cep_public')!=='true'&&!granted))return new Response('Document unavailable',{status:404,headers:{'Cache-Control':'no-store'}});
  if(await readSetting(env.DB,'cep_protected')==='true'&&!granted&&!await hasCvAccess(request,env))return new Response('Document access required',{status:401,headers:{'Cache-Control':'no-store'}});
  const object=await env.CV_BUCKET?.get('cep-presentation.pdf');
  if(!object)return new Response('Document unavailable',{status:404,headers:{'Cache-Control':'no-store'}});
  return new Response(object.body,{headers:{'Content-Type':'application/pdf','Content-Disposition':'inline; filename="Presentation-CEP.pdf"','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow'}});
 }catch{return new Response('Document unavailable',{status:503,headers:{'Cache-Control':'no-store'}});}
}
