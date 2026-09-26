import {json} from '../../lib/security.js';
import {adminGuard,readJson} from '../../lib/request.js';
import {contentField} from '../../lib/content.js';
const sections=['international_detail','scenario_a','scenario_b','scenario_c'];
const required={international_detail:['country','organisation','period','status','objective','skills','languages','motivation','technical_goals','competencies','benefits','language_plan','five_year_link'],scenario_a:['title','description','interests','constraints','status'],scenario_b:['title','description','interests','constraints','status'],scenario_c:['title','description','interests','constraints','status']};
export async function onRequestGet({request,env}){
 const denied=await adminGuard(request,env);if(denied)return denied;
 try{const {results}=await env.DB.prepare('SELECT language,section,visible FROM publication_flags').all();return json({flags:results||[]});}catch{return json({error:'Publication indisponible'},503);}
}
export async function onRequestPut({request,env}){
 const denied=await adminGuard(request,env,true);if(denied)return denied;
 let body;try{body=await readJson(request,4096);}catch{return json({error:'Requête invalide'},400);}
 const {language,section,visible}=body;
 if(!['fr','en'].includes(language)||!sections.includes(section)||typeof visible!=='boolean')return json({error:'Choix invalide'},400);
 try{
  if(visible){
   const keys=required[section].map(x=>`project.${section}.${x}`);
   const {results}=await env.DB.prepare('SELECT content_key,value FROM content_overrides WHERE language=?1').bind(language).all();
   const overrides=new Map((results||[]).map(row=>[row.content_key,row.value]));
   if(keys.some(key=>!overrides.has(key)||overrides.get(key)===contentField(language,key)?.defaultValue))return json({error:'Complétez et enregistrez tous les champs de ce bloc dans cette langue avant publication.'},400);
  }
  await env.DB.prepare('INSERT INTO publication_flags(language,section,visible,updated_at) VALUES(?1,?2,?3,unixepoch()) ON CONFLICT(language,section) DO UPDATE SET visible=excluded.visible,updated_at=unixepoch()').bind(language,section,visible?1:0).run();
  return json({ok:true});
 }catch{return json({error:'Publication impossible'},503);}
}
