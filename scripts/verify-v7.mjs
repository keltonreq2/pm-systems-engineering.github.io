// Optional integration/visual audit. Dependencies live outside the production project.
// V7_TOOL_MODULES=/tmp/pm-v7-tools/node_modules
// V7_PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs V7_CHROMIUM=/path/to/chromium node scripts/verify-v7.mjs
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const moduleRoot=process.env.V7_TOOL_MODULES;
if(!moduleRoot)throw new Error('Set V7_TOOL_MODULES to the optional tooling node_modules directory.');
const {Miniflare}=await import(pathToFileURL(resolve(moduleRoot,'miniflare/dist/src/index.js')));
const {chromium}=await import(pathToFileURL(process.env.V7_PLAYWRIGHT_MODULE || resolve(moduleRoot,'playwright/index.mjs')));
const {default:serverChromium}=await import(pathToFileURL(resolve(moduleRoot,'@sparticuz/chromium/build/index.js')));
const root=process.cwd();
const output=resolve(root,'deliverables/v7-audit');await mkdir(output,{recursive:true});
const routes={
 '/api/contact':'functions/api/contact.js','/api/admin/content':'functions/api/admin/content.js','/api/admin/messages':'functions/api/admin/messages.js',
 '/api/admin/settings':'functions/api/admin/settings.js','/api/public-config':'functions/api/public-config.js',
 '/api/admin/cv':'functions/api/admin/cv.js','/api/admin/cv/en':'functions/api/admin/cv/en.js','/api/cv':'functions/api/cv.js','/api/cv/en':'functions/api/cv/en.js'
};
const imports=Object.entries(routes).map(([path,file],i)=>`import * as route${i} from './${file}';`).join('\n');
const mapping=Object.keys(routes).map((path,i)=>`${JSON.stringify(path)}:route${i}`).join(',');
const worker=`import {onRequest} from './functions/_middleware.js';
import * as message from './functions/api/admin/messages/[id].js';
${imports}
const routes={${mapping}};
export default {fetch(request,env){
 const path=new URL(request.url).pathname;const id=path.match(/^\\/api\\/admin\\/messages\\/([^/]+)$/)?.[1];
 const route=id?message:routes[path];const handler=route?.['onRequest'+request.method[0]+request.method.slice(1).toLowerCase()];
 const context={request,env,params:{id},next:()=>handler?handler(context):env.ASSETS.fetch(request)};
 return onRequest(context);
}};`;
const files=await readdir('functions',{recursive:true});
const mf=new Miniflare({host:'127.0.0.1',port:0,workers:[{name:'portfolio',modulesRoot:root,modules:[{type:'ESModule',path:resolve(root,'v7-audit-worker.js'),contents:worker},...files.filter(p=>p.endsWith('.js')).map(p=>({type:'ESModule',path:resolve(root,'functions',p)}))],compatibilityDate:'2026-09-24',d1Databases:['DB'],r2Buckets:['CV_BUCKET'],bindings:{SESSION_SECRET:'local-audit-only',SITE_ORIGIN:'https://pm-systems-engineering-github-io.pages.dev'},serviceBindings:{ASSETS:async request=>{
 let path=new URL(request.url).pathname;if(path.endsWith('/'))path+='index.html';if(path==='/en')path='/en/index.html';
 const full=resolve(root,'dist','.'+path);
 if(!full.startsWith(resolve(root,'dist')+'/'))return new Response('Not found',{status:404});
 try{return new Response(await readFile(full),{headers:{'Content-Type':({'.html':'text/html','.css':'text/css','.js':'application/javascript','.webp':'image/webp','.png':'image/png','.txt':'text/plain','.xml':'application/xml'})[extname(full)]||'application/octet-stream'}});}catch{return new Response('Not found',{status:404});}
}}}]});
let browser;
try{
 const db=await mf.getD1Database('DB');
 for(const statement of (await readFile('schema.sql','utf8')).split(';').filter(s=>s.trim()))await db.prepare(statement).run();
 await db.prepare("UPDATE settings SET value='true' WHERE key='site_public'").run();
 const token='audit-session-only';await db.prepare('INSERT INTO admin_sessions VALUES (?1, ?2, ?3)').bind(createHash('sha256').update(token).digest('hex'),Math.floor(Date.now()/1000)+3600,1).run();
 const base=(await mf.ready).origin;
 const headers={Origin:base,Cookie:`__Host-pm_admin=${token}`,'Content-Type':'application/json'};
 const api=async(path,method='GET',body)=>{const response=await mf.dispatchFetch(base+path,{method,headers,...(body?{body:JSON.stringify(body)}:{})});assert.ok(response.ok,`${method} ${path}: ${response.status} ${await response.clone().text()}`);return response.json();};
 // Run the actual Cloudflare HTMLRewriter, not a mock.
 const attack='<script>window.injected=true</script><iframe src="https://example.test"></iframe>';
 await api('/api/admin/content','PUT',{language:'fr',key:'hero.title',value:attack});
 let response=await mf.dispatchFetch(base+'/');let html=await response.text();
 assert.ok(html.includes('&lt;script>') || html.includes('&lt;script&gt;'));assert.ok(!html.includes(attack));
 assert.ok(!(await (await mf.dispatchFetch(base+'/en/')).text()).includes('window.injected'));
 await api('/api/admin/content','DELETE',{language:'fr',key:'hero.title'});
 assert.equal((await mf.dispatchFetch(base+'/api/admin/messages')).status,401);
 browser=await chromium.launch({executablePath:process.env.V7_CHROMIUM || await serverChromium.executablePath(),args:serverChromium.args.filter(arg=>arg!=="--disable-web-security"),headless:true});
 const context=await browser.newContext({extraHTTPHeaders:{Cookie:`__Host-pm_admin=${token}`},reducedMotion:'reduce'});
 const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await db.prepare('INSERT INTO contact_messages (id,name,email,subject,message,created_at) VALUES (?1,?2,?3,?4,?5,?6)').bind(crypto.randomUUID(),'Visiteur de démonstration','test@example.test','Question sur les protections électriques','Un message de test assez long pour vérifier la lecture sur téléphone. '+ 'Texte '.repeat(40),Math.floor(Date.now()/1000)).run();
 const widths=process.env.V7_QUICK ? [] : [320,390,680,900,1080,1440,1920];const measurements=[];
 for(const width of widths){
  await page.setViewportSize({width,height:1000});
  for(const route of ['/','/en/','/admin/']){
   await page.goto(base+route,{waitUntil:'networkidle'});
   if(route==='/admin/'){
    await page.waitForFunction(()=>document.querySelector('#content-status').textContent.includes('textes modifiables'));
    await page.locator('.content-section').first().locator('summary').click();
    await page.locator('.message-card summary').click();
    assert.equal(await page.locator('#preview-cv-fr').isVisible(),false);assert.equal(await page.locator('#delete-cv-en').isVisible(),false);
   }
   const measurement=await page.evaluate(()=>({viewport:innerWidth,scroll:document.documentElement.scrollWidth}));
   measurements.push({width,route,...measurement});
   if(measurement.scroll>width){console.log(await page.evaluate(()=>[...document.querySelectorAll('body *')].map(el=>({tag:el.tagName,cls:el.className,id:el.id,right:el.getBoundingClientRect().right,width:el.getBoundingClientRect().width})).filter(el=>el.right>innerWidth)));await page.screenshot({path:resolve(output,'overflow.png'),fullPage:true});}
   assert.ok(measurement.scroll<=width,`Horizontal overflow: ${route} at ${width}, actual ${measurement.scroll}`);
   if(route!=='/admin/'){
    if(width<=900){await page.locator('.menu-toggle').click();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Open menu overflows');await page.keyboard.press('Escape');}
    const colours=await page.evaluate(()=>Object.fromEntries(['protection-training','career','mentors','objectives'].map(id=>[id,getComputedStyle(document.getElementById(id)).backgroundColor])));
    assert.equal(colours['protection-training'],'rgb(255, 255, 255)');assert.notEqual(colours.mentors,colours.career);
    assert.equal(await page.locator('#career #mentors').count(),0);
   }
   if([390,1440].includes(width) && route==='/')for(const id of ['protection-training','mentors','about','contact'])await page.locator('#'+id).screenshot({path:resolve(output,`${id}-${width}.png`),style:'.site-header, .skip-link { visibility: hidden !important; }'});
   if([390,1440].includes(width)){await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:resolve(output,`${route==='/admin/'?'admin':route==='/en/'?'en':'fr'}-${width}.png`),fullPage:true});}
  }
 }
 await db.prepare('DELETE FROM contact_messages').run();
 // Browser editing: form -> authenticated API -> D1 -> server-rendered public page.
 await page.goto(base+'/admin/',{waitUntil:'networkidle'});
 await page.waitForSelector('#content-fr-hero-title',{state:'attached'});await page.locator('.content-section').first().locator('summary').click();
 const title=page.locator('#content-fr-hero-title');await title.fill('Titre de vérification V7');await title.locator('..').getByRole('button',{name:'Enregistrer',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('#content-fr-hero-title-status').textContent.startsWith('Enregistré') || document.querySelector('#content-fr-hero-title-status').classList.contains('is-error'));
 console.log('Editor save:',await page.locator('#content-fr-hero-title-status').textContent());
 assert.ok((await page.locator('#content-fr-hero-title-status').textContent()).startsWith('Enregistré'));
 const publicPage=await context.newPage();await publicPage.goto(base+'/');assert.equal(await publicPage.locator('#hero-title').textContent(),'Titre de vérification V7');
 await publicPage.goto(base+'/en/');assert.notEqual(await publicPage.locator('#hero-title').textContent(),'Titre de vérification V7');
 page.once('dialog',dialog=>dialog.accept());await title.locator('..').getByRole('button',{name:'Restaurer le texte par défaut'}).click();await page.waitForFunction(()=>document.querySelector('#content-fr-hero-title-status').textContent.includes('restauré'));
 // Contact -> private inbox -> read/unread -> delete through actual UI.
 await publicPage.goto(base+'/');
 await publicPage.locator('#contact-name').fill('Visiteur de test');await publicPage.locator('#contact-email').fill('audit@example.test');await publicPage.locator('#contact-subject').fill('Vérification V7');await publicPage.locator('#contact-message').fill('<script>window.injected=true</script> Message texte.');
 await publicPage.locator('#contact-form button').click();await publicPage.waitForFunction(()=>document.querySelector('#contact-status').textContent.includes('bien été reçu'));
 await page.locator('#refresh-messages').click();await page.waitForSelector('.message-card');await page.locator('.message-card summary').click();
 assert.ok((await page.locator('.message-text').textContent()).includes('<script>'));
 assert.equal(await page.evaluate(()=>window.injected),undefined);
 await page.getByRole('button',{name:'Marquer comme lu',exact:true}).click();await page.waitForFunction(()=>document.querySelector('#unread-count').textContent==='0 non lu');
 await page.locator('.message-card summary').click();await page.getByRole('button',{name:'Marquer non lu',exact:true}).click();await page.waitForFunction(()=>document.querySelector('#unread-count').textContent==='1 non lu');
 await page.locator('.message-card summary').click();page.once('dialog',dialog=>dialog.accept());await page.getByRole('button',{name:'Supprimer',exact:true}).click();await page.waitForFunction(()=>!document.querySelector('.message-card'));
 assert.deepEqual(errors,[]);
 await db.prepare("UPDATE settings SET value='false' WHERE key='site_public'").run();assert.equal((await mf.dispatchFetch(base+'/')).status,404);assert.equal((await mf.dispatchFetch(base+'/api/contact',{method:'POST',headers,body:'{}'})).status,404);
 await writeFile(resolve(output,'results.json'),JSON.stringify({engine:'Cloudflare workerd / Miniflare + Chromium',measurements,checks:['real HTMLRewriter escaping','FR/EN independent edits and restoration','public contact to D1','inbox read/unread/delete','session required','private mode','no browser JavaScript errors'],passed:true},null,2));
 console.log(`PASS: ${measurements.length} viewport/page checks; real D1, HTMLRewriter and browser flows. Reports: ${output}`);
}finally{if(browser)await browser.close();await mf.dispose();}
