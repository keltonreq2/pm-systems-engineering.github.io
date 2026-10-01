import {hasCvAccess} from './cv-access.js';
import {readSetting} from './security.js';

export const PITCH_KEY='pitch-video.mp4';
const privateHeaders={'Cache-Control':'private, no-store','X-Robots-Tag':'noindex, nofollow','X-Content-Type-Options':'nosniff','Accept-Ranges':'bytes'};
export const pitchDenied=()=>new Response('Video access required',{status:401,headers:privateHeaders});
export async function pitchAvailable(env){
  return Boolean(await readSetting(env.DB,'cv_access_digest')) && await readSetting(env.DB,'pitch_available')==='true' && Boolean(await env.CV_BUCKET?.head(PITCH_KEY));
}
export async function pitchAuthorized(request,env){
  return Boolean(await readSetting(env.DB,'cv_access_digest')) && await hasCvAccess(request,env);
}

// One HTTP byte range at a time; R2 streams only the selected bytes.
export async function servePitch(request,env,{admin=false}={}){
  const method=request.method;
  if(method!=='GET'&&method!=='HEAD')return new Response('Method not allowed',{status:405,headers:privateHeaders});
  if(!admin && !await pitchAuthorized(request,env))return pitchDenied();
  const head=await env.CV_BUCKET?.head(PITCH_KEY);
  if(!head || (!admin && await readSetting(env.DB,'pitch_available')!=='true'))return new Response('Video unavailable',{status:404,headers:privateHeaders});
  const size=head.size;
  const raw=request.headers.get('Range');
  let offset=0,length=size;
  if(raw){
    const match=/^bytes=(\d*)-(\d*)$/u.exec(raw);
    if(!match || (!match[1]&&!match[2]))return new Response(null,{status:416,headers:{...privateHeaders,'Content-Range':`bytes */${size}`}});
    if(!match[1]){
      const suffix=Number(match[2]);
      if(!Number.isSafeInteger(suffix)||suffix<1)return new Response(null,{status:416,headers:{...privateHeaders,'Content-Range':`bytes */${size}`}});
      offset=Math.max(0,size-suffix);
    }else{
      offset=Number(match[1]);
      const end=match[2]?Number(match[2]):size-1;
      if(!Number.isSafeInteger(offset)||!Number.isSafeInteger(end)||offset>=size||end<offset)return new Response(null,{status:416,headers:{...privateHeaders,'Content-Range':`bytes */${size}`}});
      length=Math.min(end,size-1)-offset+1;
    }
    if(!match[1])length=size-offset;
  }
  const headers=new Headers({...privateHeaders,'Content-Type':'video/mp4','Content-Disposition':'inline; filename="pitch-video.mp4"','Content-Length':String(length)});
  if(raw)headers.set('Content-Range',`bytes ${offset}-${offset+length-1}/${size}`);
  if(method==='HEAD')return new Response(null,{status:raw?206:200,headers});
  const object=await env.CV_BUCKET.get(PITCH_KEY,raw?{range:{offset,length}}:undefined);
  if(!object)return new Response('Video unavailable',{status:404,headers:privateHeaders});
  return new Response(object.body,{status:raw?206:200,headers});
}
