import {json,readSetting,writeSetting} from '../../lib/security.js';
import {adminGuard,readJson} from '../../lib/request.js';
import {auditAdmin} from '../../lib/audit.js';
const origin='https://pm-systems-engineering-github-io.pages.dev';
const token=/^[A-Za-z0-9_-]{5,128}$/u;
const check=(name,ok,detail,level='error')=>({name,status:ok?'OK':level==='error'?'Erreur':'Attention',detail});
const capture=(html,regex)=>regex.exec(html)?.[1]||'';
async function asset(env,path,base){
  if(!env.ASSETS?.fetch)throw new Error('Actifs du site indisponibles');
  const response=await env.ASSETS.fetch(new Request(new URL(path,base)));
  return response.ok?await response.text():null;
}
export async function onRequestGet({request,env}){
 const denied=await adminGuard(request,env);if(denied)return denied;
 try{
  const [google,bing,sitePublic]=await Promise.all(['google_site_verification','bing_site_verification','site_public'].map(key=>readSetting(env.DB,key)));
  const checks=[check('Site public',sitePublic==='true','La visibilité doit être publique pour les moteurs.')];
  const read=async path=>{try{return (await asset(env,path,request.url))?.replaceAll('__SITE_ORIGIN__',origin)||null;}catch{return null;}};
  const [fr,en,robots,sitemap]=await Promise.all(['/','/en/','/robots.txt','/sitemap.xml'].map(read));
  checks.push(check('robots.txt',Boolean(robots?.includes(`${origin}/sitemap.xml`)),'Fichier présent et sitemap au domaine de production.'));
  checks.push(check('sitemap.xml',Boolean(sitemap?.includes(`${origin}/en/`)&&sitemap.includes(`${origin}/`)&&!/\/(admin|api|pitch|access)\b/u.test(sitemap)),'Routes FR et EN seulement, sans accès protégés.'));
  for(const [lang,html,path] of [['FR',fr,'/'],['EN',en,'/en/']]){
    checks.push(check(`Page ${lang} indexable`,Boolean(html&&!/<meta\s+name="robots"\s+content="[^"]*noindex/iu.test(html)),`Page ${lang} présente sans noindex.`));
    checks.push(check(`Canonique ${lang}`,Boolean(html?.includes(`<link rel="canonical" href="${origin}${path}">`)),`Adresse canonique ${origin}${path}.`));
    checks.push(check(`Hreflang ${lang}`,Boolean(html?.includes('hreflang="fr"')&&html.includes('hreflang="en"')),`Alternatives FR et EN sur la page ${lang}.`));
    checks.push(check(`Title ${lang}`,Boolean(capture(html||'',/<title>([^<]+)<\/title>/iu).trim()),`Titre de la page ${lang}.`));
    checks.push(check(`Description ${lang}`,Boolean(capture(html||'',/<meta name="description" content="([^"]+)"/iu).trim()),`Description de la page ${lang}.`));
    checks.push(check(`Open Graph ${lang}`,Boolean(html?.includes('property="og:title"')&&html.includes('property="og:description"')&&html.includes('property="og:image"')),`Métadonnées de partage ${lang}.`));
    checks.push(check(`JSON-LD ${lang}`,Boolean(html?.includes('type="application/ld+json"')),`Données structurées ${lang}.`));
    const ids=new Set([...((html||'').matchAll(/\bid="([^"]+)"/gu))].map(match=>match[1]));
    // #linkedin is an intentional placeholder handled by the public settings script.
    const links=[...((html||'').matchAll(/\bhref="#([^"]+)"/gu))].map(match=>match[1]).filter(anchor=>anchor!=='linkedin');
    checks.push(check(`Liens internes ${lang}`,Boolean(html&&links.every(anchor=>ids.has(anchor))),`Ancres internes de la page ${lang}.`));
  }
  checks.push(check('Image Open Graph',Boolean(fr?.includes('og-pm-systems-engineering.png')&&await env.ASSETS?.fetch?.(new Request(new URL('/assets/images/og-pm-systems-engineering.png',request.url))).then(response=>response.ok)),'Image de partage accessible.'));
  checks.push(check('Domaine de production',!env.SITE_ORIGIN||env.SITE_ORIGIN.replace(/\/$/u,'')===origin,`Domaine attendu : ${origin}.`,'attention'));
  return json({checks,googleConfigured:Boolean(google),bingConfigured:Boolean(bing),googleCode:google||'',bingCode:bing||'',canonicalOrigin:origin});
 }catch{return json({error:'Diagnostic indisponible'},503);}
}
export async function onRequestPut({request,env}){
 const denied=await adminGuard(request,env,true);if(denied)return denied;
 let body;try{body=await readJson(request,2048);}catch{return json({error:'Requête invalide'},400);}
 const values={google:body.google,bing:body.bing};
 if(Object.keys(body).length!==2 || Object.values(values).some(value=>typeof value!=='string'||(value.trim()&&!token.test(value.trim()))))return json({error:'Codes de vérification invalides (5 à 128 caractères, lettres, chiffres, tiret ou soulignement).'},400);
 try{
  await writeSetting(env.DB,'google_site_verification',values.google.trim());
  await writeSetting(env.DB,'bing_site_verification',values.bing.trim());
  await auditAdmin(env,{type:'seo',key:'verification',action:'update'});
  return json({ok:true,googleConfigured:Boolean(values.google.trim()),bingConfigured:Boolean(values.bing.trim())});
 }catch{return json({error:'Enregistrement impossible'},503);}
}
