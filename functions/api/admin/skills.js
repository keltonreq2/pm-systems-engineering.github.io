import {json} from '../../lib/security.js';
import {adminGuard,readJson} from '../../lib/request.js';
import {defaultSkills,normalizedSkill,proofLabels,validProofs,validSkill} from '../../lib/skills.js';
import {auditAdmin} from '../../lib/audit.js';
export async function onRequestGet({request,env}){
 const denied=await adminGuard(request,env);if(denied)return denied;
 const language=new URL(request.url).searchParams.get('language')||'fr';if(!['fr','en'].includes(language))return json({error:'Langue invalide'},400);
 try{const {results}=await env.DB.prepare('SELECT skill_key,proofs_json,visible FROM skills_overrides WHERE language=?1').bind(language).all();const rows=new Map((results||[]).map(row=>[row.skill_key,row]));return json({language,proofLabels:proofLabels[language],items:Object.keys(defaultSkills).map(key=>normalizedSkill(rows.get(key),key))});}
 catch{return json({error:'Compétences indisponibles. Appliquez la migration V9.'},503);}
}
export async function onRequestPut({request,env}){
 const denied=await adminGuard(request,env,true);if(denied)return denied;
 let body;try{body=await readJson(request,4096);}catch{return json({error:'Requête invalide'},400);}
 if(!['fr','en'].includes(body.language)||!validSkill(body.key)||typeof body.visible!=='boolean'||!validProofs(body.proofs))return json({error:'Compétence ou preuve invalide'},400);
 try{await env.DB.prepare('INSERT INTO skills_overrides(language,skill_key,proofs_json,visible,updated_at) VALUES(?1,?2,?3,?4,unixepoch()) ON CONFLICT(language,skill_key) DO UPDATE SET proofs_json=excluded.proofs_json,visible=excluded.visible,updated_at=unixepoch()').bind(body.language,body.key,JSON.stringify(body.proofs),body.visible?1:0).run();await auditAdmin(env,{type:'skill',key:body.key,language:body.language,action:'update'});return json({ok:true});}
 catch{return json({error:'Enregistrement impossible'},503);}
}
