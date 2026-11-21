import {adminGuard} from '../../../lib/request.js';
import {serveCep,cepHeaders} from '../../../lib/cep.js';
export async function onRequestGet({request,env}) {
  const denied=await adminGuard(request,env);if(denied)return denied;
  try { return await serveCep(request,env,{admin:true}); }
  catch { return new Response('Document indisponible',{status:503,headers:cepHeaders}); }
}
