import {bytesToBase64Url,constantTimeEqual,getCookie,hmacHex,sha256Hex} from './security.js';
const COOKIE='__Host-pm_grant';
export const grantToken=()=>bytesToBase64Url(crypto.getRandomValues(new Uint8Array(32)));
export const grantCookie=async(env,hash,maxAge)=>`${COOKIE}=${hash}.${await hmacHex(env.SESSION_SECRET,`grant-cookie:${hash}`)}; Path=/; Max-Age=${maxAge}; Secure; HttpOnly; SameSite=Lax`;
export async function validGrant(request,env,scope){
 try{
  if(!env.DB||!env.SESSION_SECRET||!['fr','en','cep'].includes(scope))return false;
  const cookie=getCookie(request,COOKIE);const [hash,signature,...rest]=cookie?.split('.')||[];
  if(rest.length||!hash||!/^[a-f0-9]{64}$/u.test(hash)||!/^[a-f0-9]{64}$/u.test(signature||''))return false;
  if(!constantTimeEqual(signature,await hmacHex(env.SESSION_SECRET,`grant-cookie:${hash}`)))return false;
  const column={fr:'allow_fr',en:'allow_en',cep:'allow_cep'}[scope];
  const row=await env.DB.prepare(`SELECT ${column} AS allowed FROM access_grants WHERE token_hash=?1 AND expires_at>unixepoch() AND revoked_at IS NULL`).bind(hash).first();
  return row?.allowed===1;
 }catch{return false;}
}
export async function hashGrantToken(token){return sha256Hex(token);}
