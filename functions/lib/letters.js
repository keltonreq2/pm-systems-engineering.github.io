import {readSetting} from './security.js';
import {hasCvAccess} from './cv-access.js';

export const LETTER_MAX = 10 * 1024 * 1024;
// Only these employer/language slots exist. Objects stay in the private CV bucket.
export const LETTERS = Object.freeze({
  'esb-en': {employer:'ESB',language:'en',key:'cep-letter-esb-en.pdf',filename:'Patrice_Masson_ESB_Cover_Letter_EN_August_2027.pdf'},
  'esb-fr': {employer:'ESB',language:'fr',key:'cep-letter-esb-fr.pdf',filename:'Patrice_Masson_ESB_Lettre_FR_Aout_2027.pdf'},
  'landsvirkjun-en': {employer:'Landsvirkjun',language:'en',key:'cep-letter-landsvirkjun-en.pdf',filename:'Patrice_Masson_Landsvirkjun_Cover_Letter_EN_August_2027.pdf'},
  'landsvirkjun-fr': {employer:'Landsvirkjun',language:'fr',key:'cep-letter-landsvirkjun-fr.pdf',filename:'Patrice_Masson_Landsvirkjun_Lettre_FR_Aout_2027.pdf'}
});
export const letterHeaders = {'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow'};
export const letterSlot = id => typeof id==='string' && Object.hasOwn(LETTERS,id) ? LETTERS[id] : null;
export async function lettersAuthorized(request,env) {
  // Reuse the CV cookie and code. A scoped CV/CEP invitation does not grant letters.
  return Boolean(await readSetting(env.DB,'cv_access_digest')) && await hasCvAccess(request,env);
}
export async function letterAvailability(env) {
  return Object.fromEntries(await Promise.all(Object.entries(LETTERS).map(async([id,slot])=>[
    id,Boolean(await env.CV_BUCKET?.head(slot.key))
  ])));
}
export async function serveLetter(request,env,id,{admin=false}={}) {
  try {
    if(!admin && !await lettersAuthorized(request,env))return new Response('Document access required',{status:401,headers:letterHeaders});
    const slot=letterSlot(id);
    if(!slot)return new Response('Document unavailable',{status:404,headers:letterHeaders});
    const object=await env.CV_BUCKET?.get(slot.key);
    if(!object)return new Response('Document unavailable',{status:404,headers:letterHeaders});
    return new Response(request.method==='HEAD'?null:object.body,{headers:{...letterHeaders,
      'Content-Type':'application/pdf','Content-Language':slot.language,
      'Content-Disposition':`attachment; filename="${slot.filename}"`}});
  } catch {return new Response('Document unavailable',{status:503,headers:letterHeaders});}
}
