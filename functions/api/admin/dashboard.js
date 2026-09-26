import {json,readSetting} from '../../lib/security.js';
import {adminGuard} from '../../lib/request.js';
export async function onRequestGet({request,env}){
 const denied=await adminGuard(request,env);if(denied)return denied;
 try{
  const [site,linkedin,cvProtection,cvFr,cvEn,cep,unread,content,media,keys,years]=await Promise.all([
   readSetting(env.DB,'site_public'),readSetting(env.DB,'linkedin_url'),readSetting(env.DB,'cv_access_enabled'),
   env.CV_BUCKET?.head('cv-pm-systems-engineering.pdf'),env.CV_BUCKET?.head('cv-pm-systems-engineering-en.pdf'),env.CV_BUCKET?.head('cep-presentation.pdf'),
   env.DB.prepare('SELECT count(*) AS n FROM contact_messages WHERE read_at IS NULL').first(),
   env.DB.prepare('SELECT count(*) AS n FROM content_overrides').first(),
   env.DB.prepare('SELECT count(*) AS n FROM media_overrides WHERE r2_key IS NOT NULL').first(),
   env.DB.prepare("SELECT count(DISTINCT content_key) AS n FROM content_overrides WHERE language='fr' AND content_key IN ('project.international_detail.country','project.international_detail.organisation')").first(),
   env.DB.prepare("SELECT count(*) AS n FROM content_overrides WHERE language='fr' AND content_key LIKE 'project.timeline.%'").first()
  ]);
  const checklist={cvFr:Boolean(cvFr),cvEn:Boolean(cvEn),linkedin:Boolean(linkedin),cep:Boolean(cep),internationalTarget:keys.n===2,fiveYearPlan:years.n>0};
  return json({sitePublic:site==='true',linkedin:Boolean(linkedin),cvFr:Boolean(cvFr),cvEn:Boolean(cvEn),cvProtected:cvProtection==='true',unread:unread.n,content:content.n,media:media.n,cepReady:Object.values(checklist).filter(Boolean).length,checklist});
 }catch{return json({error:'Tableau de bord indisponible'},503);}
}
