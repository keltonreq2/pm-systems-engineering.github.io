import {json} from '../../../lib/security.js';
import {adminGuard} from '../../../lib/request.js';
import {auditAdmin} from '../../../lib/audit.js';
export async function onRequestDelete({request,env,params}){
 const denied=await adminGuard(request,env,true);if(denied)return denied;
 if(!/^[a-f0-9]{64}$/u.test(params.hash))return json({error:'Accès inconnu'},404);
 try{const result=await env.DB.prepare('UPDATE access_grants SET revoked_at=unixepoch() WHERE token_hash=?1 AND revoked_at IS NULL').bind(params.hash).run();if(!(result.meta?.changes??result.changes))return json({error:'Accès introuvable ou déjà révoqué'},404);await auditAdmin(env,{type:'access',key:params.hash,action:'revoke'});return json({ok:true});}
 catch{return json({error:'Révocation impossible'},503);}
}
