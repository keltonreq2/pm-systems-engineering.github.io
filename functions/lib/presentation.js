import {readSetting} from './security.js';
import {mediaCatalog} from './media-catalog.js';
import {positions} from './media.js';
import {defaultSkills,normalizedSkill,proofLabels} from './skills.js';
import {validGrant} from './grants.js';
const sections=['international_detail','scenario_a','scenario_b','scenario_c'];
export async function applyPresentation(response,env,language,request){
 if(!response.ok||!response.headers.get('Content-Type')?.includes('text/html'))return response;
 let flags=new Set(),media=new Map(),cep=false,skills=new Map(),lastUpdated=null;
 try{
  const [pub,med,available,visible,object,skillRows,revision]=await Promise.all([
   env.DB.prepare('SELECT section FROM publication_flags WHERE language=?1 AND visible=1').bind(language).all(),
   env.DB.prepare('SELECT media_key,r2_key,alt_fr,alt_en,object_position FROM media_overrides').all(),
   readSetting(env.DB,'cep_available'),readSetting(env.DB,'cep_public'),env.CV_BUCKET?.head('cep-presentation.pdf'),
   env.DB.prepare('SELECT skill_key,proofs_json,visible FROM skills_overrides WHERE language=?1').bind(language).all(),
   env.DB.prepare("SELECT max(ts) AS n FROM (SELECT max(updated_at) ts FROM content_overrides UNION ALL SELECT max(updated_at) FROM media_overrides UNION ALL SELECT max(updated_at) FROM publication_flags UNION ALL SELECT max(updated_at) FROM skills_overrides UNION ALL SELECT CAST(value AS INTEGER) FROM settings WHERE key='site_last_updated')").first()
  ]);
  flags=new Set((pub.results||[]).map(row=>row.section).filter(x=>sections.includes(x)));
  media=new Map((med.results||[]).filter(row=>Object.hasOwn(mediaCatalog,row.media_key)).map(row=>[row.media_key,row]));
  cep=available==='true'&&Boolean(object)&&(visible==='true'||(request&&await validGrant(request,env,'cep')));
  skills=new Map((skillRows.results||[]).filter(row=>Object.hasOwn(defaultSkills,row.skill_key)).map(row=>[row.skill_key,normalizedSkill(row,row.skill_key)]));
  if(Number.isSafeInteger(revision?.n)&&revision.n>0)lastUpdated=new Intl.DateTimeFormat(language==='en'?'en-GB':'fr-FR',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(revision.n*1000));
 }catch{/* Authored content stays private by default. */}
 const visibleScenario=sections.slice(1).some(section=>flags.has(section));
 const rewrite=new HTMLRewriter().on('[data-publication-section]',{element(element){
  const key=element.getAttribute('data-publication-section');
  if(flags.has(key)||(key==='scenario_group'&&visibleScenario)||(key==='cep_document'&&cep))element.removeAttribute('hidden');
  else element.remove();
 }}).on('[data-publication-placeholder]',{element(element){
  if(flags.has(element.getAttribute('data-publication-placeholder')))element.remove();
 }}).on('[data-skill-key]',{element(element){
  const row=skills.get(element.getAttribute('data-skill-key'));
  if(row&&!row.visible)element.remove();
 }}).on('[data-skill-key] .skill-proofs',{element(element){
  // Proof IDs and labels come solely from the fixed server-side catalogue.
  const key=element.getAttribute('data-proof-for');
  const row=skills.get(key);if(!row)return;
  const markup=row.proofs.map(id=>`<li><a href="#${id}">${proofLabels[language][id].replaceAll('&','&amp;')}</a></li>`).join('');
  element.setInnerContent(markup,{html:true});
 }}).on('[data-last-updated]',{element(element){
  if(lastUpdated)element.setInnerContent(`${language==='en'?'Last updated':'Dernière mise à jour'} : ${lastUpdated}`,{html:false});
 }}).on('[data-media-key]',{element(element){
  const key=element.getAttribute('data-media-key');const row=media.get(key);if(!row)return;
  const alt=language==='en'?row.alt_en:row.alt_fr;
  if(alt)element.setAttribute('alt',alt);
  if(positions.includes(row.object_position))element.setAttribute('style',`object-position: ${row.object_position}`);
  if(row.r2_key){element.setAttribute('src',`/api/media?key=${encodeURIComponent(key)}`);element.removeAttribute('srcset');element.removeAttribute('sizes');}
 }});
 return rewrite.transform(response);
}
