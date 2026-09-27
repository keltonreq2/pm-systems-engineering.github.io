import {json} from '../../lib/security.js';
import {adminGuard} from '../../lib/request.js';
export async function onRequestGet({request,env}){
 const denied=await adminGuard(request,env);if(denied)return denied;
 const limit=Math.min(100,Math.max(1,Number(new URL(request.url).searchParams.get('limit'))||40));
 try{const {results}=await env.DB.prepare('SELECT id,at,type,item_key,language,action,previous_value,new_value FROM admin_audit ORDER BY at DESC,id DESC LIMIT ?1').bind(limit).all();return json({events:results||[]});}
 catch{return json({error:'Historique indisponible. Appliquez la migration V9.'},503);}
}
