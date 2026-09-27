import { constantTimeEqual, getCookie, hmacHex, readSetting } from './security.js';
import {validGrant} from './grants.js';
const COOKIE='__Host-pm_cv';
const TWO_HOURS=7200;
export const cvCookie=(token)=>`${COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${TWO_HOURS}; Secure; HttpOnly; SameSite=Strict`;

export async function hasCvAccess(request,env){
  if(!env.DB || !env.SESSION_SECRET)return false;
  const cookie=getCookie(request,COOKIE);
  const parts=typeof cookie==='string'?cookie.split('.'):[];
  if(parts.length!==3)return false;
  const [version,expiration,signature]=parts;
  if(!/^[0-9a-f-]{36}$/u.test(version)||!/^[0-9]{10,12}$/u.test(expiration)||!/^[a-f0-9]{64}$/u.test(signature))return false;
  if(Number(expiration)<Math.floor(Date.now()/1000)||Number(expiration)>Math.floor(Date.now()/1000)+TWO_HOURS)return false;
  const current=await readSetting(env.DB,'cv_access_version');
  if(current!==version)return false;
  return constantTimeEqual(signature,await hmacHex(env.SESSION_SECRET,`cv-session:${version}.${expiration}`));
}
export async function createCvToken(env){
  const version=await readSetting(env.DB,'cv_access_version');
  if(!/^[0-9a-f-]{36}$/u.test(version||''))throw new Error('CV access not configured');
  const expiration=Math.floor(Date.now()/1000)+TWO_HOURS;
  return `${version}.${expiration}.${await hmacHex(env.SESSION_SECRET,`cv-session:${version}.${expiration}`)}`;
}
export async function requireCvAccess(request,env,scope='fr'){
  const enabled=await readSetting(env.DB,'cv_access_enabled');
  if(enabled!=='true')return true;
  if(await validGrant(request,env,scope))return true;
  if(!await readSetting(env.DB,'cv_access_digest'))return false;
  return hasCvAccess(request,env);
}
export const deniedCv=()=>new Response('CV access required',{status:401,headers:{'Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow','X-Content-Type-Options':'nosniff'}});
