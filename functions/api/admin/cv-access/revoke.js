import {json,writeSetting} from '../../../lib/security.js';
import {adminGuard} from '../../../lib/request.js';
export async function onRequestPost({request,env}){
 const denied=await adminGuard(request,env,true);if(denied)return denied;
 try{await writeSetting(env.DB,'cv_access_version',crypto.randomUUID());return json({ok:true});}
 catch{return json({error:'Révocation impossible'},503);}
}
