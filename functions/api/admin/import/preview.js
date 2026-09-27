import {json} from '../../../lib/security.js';
import {adminGuard,readJson} from '../../../lib/request.js';
import {importDigest,importSummary,normalizeImport} from '../../../lib/config-import.js';
export async function onRequestPost({request,env}){
 const denied=await adminGuard(request,env,true);if(denied)return denied;
 let body;try{body=await readJson(request,1024*1024);}catch{return json({error:'Fichier invalide ou trop volumineux (1 Mio maximum)'},400);}
 try{const normalized=await normalizeImport(body.data,env);return json({digest:await importDigest(normalized),summary:await importSummary(normalized,env)});}
 catch(error){return json({error:error.message||'Prévisualisation impossible'},400);}
}
