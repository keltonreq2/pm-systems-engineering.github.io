import {grantCookie,hashGrantToken} from '../lib/grants.js';
const denied=()=>new Response('Link unavailable',{status:404,headers:{'Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex, nofollow'}});
export async function onRequestGet({request,env,params}){
 const token=params.token;
 if(typeof token!=='string'||!/^[A-Za-z0-9_-]{43}$/u.test(token)||!env.SESSION_SECRET)return denied();
 try{
  const hash=await hashGrantToken(token);
  const row=await env.DB.prepare('SELECT expires_at FROM access_grants WHERE token_hash=?1 AND expires_at>unixepoch() AND revoked_at IS NULL').bind(hash).first();
  if(!row)return denied();
  const maxAge=Math.max(1,row.expires_at-Math.floor(Date.now()/1000));
  return new Response(null,{status:303,headers:{Location:new URL('/',request.url).href,'Set-Cookie':await grantCookie(env,hash,maxAge),'Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex, nofollow'}});
 }catch{return denied();}
}
