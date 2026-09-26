import {readSetting} from './security.js';
import {mediaCatalog} from './media-catalog.js';
import {positions} from './media.js';
const sections=['international_detail','scenario_a','scenario_b','scenario_c'];
export async function applyPresentation(response,env,language){
 if(!response.ok||!response.headers.get('Content-Type')?.includes('text/html'))return response;
 let flags=new Set(),media=new Map(),cep=false;
 try{
  const [pub,med,available,visible,object]=await Promise.all([
   env.DB.prepare('SELECT section FROM publication_flags WHERE language=?1 AND visible=1').bind(language).all(),
   env.DB.prepare('SELECT media_key,r2_key,alt_fr,alt_en,object_position FROM media_overrides').all(),
   readSetting(env.DB,'cep_available'),readSetting(env.DB,'cep_public'),env.CV_BUCKET?.head('cep-presentation.pdf')
  ]);
  flags=new Set((pub.results||[]).map(row=>row.section).filter(x=>sections.includes(x)));
  media=new Map((med.results||[]).filter(row=>Object.hasOwn(mediaCatalog,row.media_key)).map(row=>[row.media_key,row]));
  cep=available==='true'&&visible==='true'&&Boolean(object);
 }catch{/* Authored content stays private by default. */}
 const visibleScenario=sections.slice(1).some(section=>flags.has(section));
 const rewrite=new HTMLRewriter().on('[data-publication-section]',{element(element){
  const key=element.getAttribute('data-publication-section');
  if(flags.has(key)||(key==='scenario_group'&&visibleScenario)||(key==='cep_document'&&cep))element.removeAttribute('hidden');
  else element.remove();
 }}).on('[data-media-key]',{element(element){
  const key=element.getAttribute('data-media-key');const row=media.get(key);if(!row)return;
  const alt=language==='en'?row.alt_en:row.alt_fr;
  if(alt)element.setAttribute('alt',alt);
  if(positions.includes(row.object_position))element.setAttribute('style',`object-position: ${row.object_position}`);
  if(row.r2_key){element.setAttribute('src',`/api/media?key=${encodeURIComponent(key)}`);element.removeAttribute('srcset');element.removeAttribute('sizes');}
 }});
 return rewrite.transform(response);
}
