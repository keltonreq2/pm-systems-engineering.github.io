import {constantTimeEqual,json} from '../../../lib/security.js';
import {adminGuard,readJson} from '../../../lib/request.js';
import {applyImport,importDigest,importSummary,normalizeImport} from '../../../lib/config-import.js';
import {auditAdmin} from '../../../lib/audit.js';
export async function onRequestPost({request,env}){
 const denied=await adminGuard(request,env,true);if(denied)return denied;
 let body;try{body=await readJson(request,1024*1024);}catch{return json({error:'Fichier invalide'},400);}
 if(body.confirm!==true||typeof body.digest!=='string')return json({error:'Confirmation explicite requise'},400);
 try{
 const normalized=await normalizeImport(body.data,env),digest=await importDigest(normalized);
 if(!constantTimeEqual(digest,body.digest))return json({error:'Le fichier a changé depuis la prévisualisation'},409);
 const summary=await importSummary(normalized,env);
 await applyImport(normalized,env);
 await auditAdmin(env,{type:'import',key:'personalisation',action:'apply'});
 return json({ok:true,summary});
 }catch(error){return json({error:error.message||'Import impossible'},503);}
}
