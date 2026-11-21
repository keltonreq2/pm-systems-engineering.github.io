import {serveCep,cepHeaders} from '../lib/cep.js';
export async function onRequestGet({request,env}) {
  try { return await serveCep(request,env); }
  catch { return new Response('Document unavailable',{status:503,headers:cepHeaders}); }
}
