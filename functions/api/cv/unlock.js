import { constantTimeEqual,hmacHex,json,readSetting,requireSameOrigin } from '../../lib/security.js';
import { cvCookie,createCvToken } from '../../lib/cv-access.js';
import { readJson } from '../../lib/request.js';
export async function onRequestPost({request,env}){
  if(!requireSameOrigin(request))return json({error:'Requête refusée'},403);
  if(!env.DB||!env.SESSION_SECRET)return json({error:'Accès indisponible'},503);
  try{
    const digest=await readSetting(env.DB,'cv_access_digest');
    if(!digest)return json({error:'Code d’accès non configuré'},503);
    const ip=request.headers.get('CF-Connecting-IP')||'unknown';
    const rateKey=await hmacHex(env.SESSION_SECRET,`cv-access:${ip}`);
    const now=Math.floor(Date.now()/1000);
    await env.DB.prepare('DELETE FROM cv_access_attempts WHERE window_started < ?1').bind(now-86400).run();
    const rate=await env.DB.prepare('INSERT INTO cv_access_attempts (rate_key,attempts,window_started) VALUES (?1,1,?2) ON CONFLICT(rate_key) DO UPDATE SET attempts=CASE WHEN window_started <= ?3 THEN 1 ELSE attempts+1 END,window_started=CASE WHEN window_started <= ?3 THEN ?2 ELSE window_started END RETURNING attempts,window_started').bind(rateKey,now,now-900).first();
    if(!rate||rate.attempts>5)return json({error:'Trop de tentatives. Réessayez dans 15 minutes.'},429,{'Retry-After':String(Math.max(1,(rate?.window_started||now)+900-now))});
    let body;try{body=await readJson(request,4096);}catch{return json({error:'Requête invalide'},400);}
    const code=body.code;
    if(typeof code!=='string'||code.length<10||code.length>128)return json({error:'Code incorrect'},401);
    if(!constantTimeEqual(await hmacHex(env.SESSION_SECRET,`cv-access:${code}`),digest))return json({error:'Code incorrect'},401);
    const token=await createCvToken(env);
    await env.DB.prepare('DELETE FROM cv_access_attempts WHERE rate_key=?1').bind(rateKey).run();
    return json({ok:true},200,{'Set-Cookie':cvCookie(token)});
  }catch{return json({error:'Accès indisponible'},503);}
}
