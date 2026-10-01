import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {onRequest as middleware} from '../functions/_middleware.js';
import {onRequest as pitchVideo} from '../functions/api/pitch/video.js';
import {onRequestGet as pitchAdminGet,onRequestPut as pitchUpload,onRequestDelete as pitchDelete} from '../functions/api/admin/pitch.js';
import {onRequestGet as publicConfig} from '../functions/api/public-config.js';
import {onRequestPost as unlock} from '../functions/api/cv/unlock.js';
import {onRequestGet as pageViews} from '../functions/api/admin/page-views.js';
import {onRequestGet as seoCheck,onRequestPut as seoSave} from '../functions/api/admin/seo.js';
import {hmacHex,sha256Hex} from '../functions/lib/security.js';
globalThis.HTMLRewriter ??= class {on(){return this;}transform(response){return response;}};
const origin='https://portfolio.example';
async function fixture(){
 const sqlite=new DatabaseSync(':memory:');sqlite.exec(readFileSync(new URL('../schema.sql',import.meta.url),'utf8'));
 for(const file of ['0009_editorial_access_history.sql','0010_portfolio_views.sql'])sqlite.exec(readFileSync(new URL(`../migrations/${file}`,import.meta.url),'utf8'));
 sqlite.prepare("UPDATE settings SET value='true' WHERE key='site_public'").run();
 sqlite.prepare('INSERT INTO admin_sessions VALUES (?,?,?)').run(await sha256Hex('test-admin'),Math.floor(Date.now()/1000)+3600,1);
 const DB={prepare(sql){const statement=sqlite.prepare(sql);let params=[];return{bind(...args){params=args;return this;},async first(){return statement.get(...params)||null;},async all(){return{results:statement.all(...params)};},async run(){return statement.run(...params);}}}};
 const files=new Map(),calls=[];
 const CV_BUCKET={async head(key){return files.has(key)?{size:files.get(key).byteLength}:null;},async get(key,options){calls.push(options);const value=files.get(key);if(!value)return null;const range=options?.range;return{body:range?value.slice(range.offset,range.offset+range.length):value};},async put(key,bytes){files.set(key,new Uint8Array(bytes));},async delete(key){files.delete(key);}};
 const ASSETS={async fetch(request){const path=new URL(request.url).pathname;const local=path==='/'?'index.html':path==='/en/'?'en/index.html':path.slice(1);try{return new Response(readFileSync(new URL(`../${local}`,import.meta.url)),{headers:{'Content-Type':local.endsWith('.png')?'image/png':local.endsWith('.xml')?'application/xml':'text/html'}});}catch{return new Response('missing',{status:404});}}};
 return {sqlite,files,calls,env:{DB,CV_BUCKET,ASSETS,SESSION_SECRET:'unit-secret'}};
}
const req=(path,options={})=>new Request(origin+path,options);
const admin=(path,method='GET',body=null)=>req(path,{method,headers:{Origin:origin,Cookie:'__Host-pm_admin=test-admin',...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
const videoBytes=new Uint8Array([0,0,0,24,102,116,121,112,105,115,111,109,0,0,0,0,1,2,3,4,5,6,7,8]);

test('V11.2 migration is additive, repeatable and stores only date, page and count',async()=>{
 const {sqlite}=await fixture();const sql=readFileSync(new URL('../migrations/0010_portfolio_views.sql',import.meta.url),'utf8');sqlite.exec(sql);sqlite.exec(sql);
 assert.deepEqual(sqlite.prepare('PRAGMA table_info(portfolio_page_views)').all().map(row=>row.name),['view_date','page_path','views']);
 assert.equal(sqlite.prepare("SELECT value FROM settings WHERE key='site_public'").get().value,'true');
});
test('pitch is hidden until a video and CV code exist; same unlock cookie gates direct page and R2 bytes',async()=>{
 const {env,files,calls}=await fixture();
 assert.equal((await (await publicConfig({request:req('/api/public-config'),env})).json()).pitchAvailable,false);
 files.set('pitch-video.mp4',videoBytes);await env.DB.prepare("INSERT INTO settings(key,value,updated_at) VALUES('pitch_available','true',unixepoch())").run();
 assert.equal((await (await publicConfig({request:req('/api/public-config'),env})).json()).pitchAvailable,false);
 await env.DB.prepare("UPDATE settings SET value=?1 WHERE key='cv_access_digest'").bind(await hmacHex(env.SESSION_SECRET,'cv-access:correct-access-code')).run();
 await env.DB.prepare("UPDATE settings SET value=?1 WHERE key='cv_access_version'").bind(crypto.randomUUID()).run();
 assert.equal((await (await publicConfig({request:req('/api/public-config'),env})).json()).pitchAvailable,true);
 assert.equal((await pitchVideo({request:req('/api/pitch/video'),env})).status,401);
 assert.equal((await middleware({request:req('/pitch/'),env,next:async()=>new Response('private page',{headers:{'Content-Type':'text/html'}})})).status,401);
 const signed=await unlock({request:req('/api/cv/unlock',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({code:'correct-access-code'})}),env});
 assert.equal(signed.status,200);const cookie=signed.headers.get('Set-Cookie').split(';')[0];assert.ok(cookie.startsWith('__Host-pm_cv='));
 const cookieRequest=(range)=>req('/api/pitch/video',{headers:{Cookie:cookie,...(range?{Range:range}:{})}});
 const full=await pitchVideo({request:cookieRequest(),env});assert.equal(full.status,200);assert.deepEqual(new Uint8Array(await full.arrayBuffer()),videoBytes);
 assert.equal(full.headers.get('X-Robots-Tag'),'noindex, nofollow');
 const partial=await pitchVideo({request:cookieRequest('bytes=4-11'),env});assert.equal(partial.status,206);assert.equal(partial.headers.get('Content-Range'),'bytes 4-11/24');assert.equal(partial.headers.get('Content-Length'),'8');assert.deepEqual(new Uint8Array(await partial.arrayBuffer()),videoBytes.slice(4,12));assert.deepEqual(calls.at(-1),{range:{offset:4,length:8}});
 assert.equal((await pitchVideo({request:cookieRequest('bytes=-4'),env})).status,206);
 assert.equal((await pitchVideo({request:cookieRequest('bytes=500-600'),env})).status,416);
 const page=await middleware({request:req('/pitch/',{headers:{Cookie:cookie}}),env,next:async()=>new Response('player',{headers:{'Content-Type':'text/html'}})});assert.equal(page.status,200);assert.equal(page.headers.get('X-Robots-Tag'),'noindex, nofollow');
 assert.equal((await (await publicConfig({request:cookieRequest(),env})).json()).cvUnlocked,true);
});
test('admin upload verifies MP4, previews through admin session and removes file',async()=>{
 const {env,files}=await fixture();
 const form=new FormData();form.set('pitch',new File([videoBytes],'pitch.mp4',{type:'video/mp4'}));
 const request=req('/api/admin/pitch',{method:'PUT',headers:{Cookie:'__Host-pm_admin=test-admin',Origin:origin},body:form});
 assert.equal((await pitchUpload({request,env})).status,200);
 assert.equal((await (await pitchAdminGet({request:admin('/api/admin/pitch'),env})).json()).available,true);
 assert.ok(files.has('pitch-video.mp4'));
 assert.equal((await pitchDelete({request:admin('/api/admin/pitch','DELETE'),env})).status,200);
 assert.ok(!files.has('pitch-video.mp4'));
});
test('only successful public HTML GET pages increment anonymous daily counts',async()=>{
 const {env,sqlite}=await fixture();
 const next=async()=>new Response('<html><head></head><body>FR</body></html>',{headers:{'Content-Type':'text/html'}});
 for(const path of ['/','/index.html','/en/'])assert.equal((await middleware({request:req(path),env,next})).status,200);
 for(const path of ['/assets/pic.webp','/api/public-config','/robots.txt'])await middleware({request:req(path),env,next});
 await middleware({request:req('/',{method:'HEAD'}),env,next:async()=>new Response(null,{headers:{'Content-Type':'text/html'}})});
 await middleware({request:req('/',{headers:{'User-Agent':'Googlebot/2.1'}}),env,next});
 const data=await (await pageViews({request:admin('/api/admin/page-views'),env})).json();
 assert.equal(data.total,3);assert.equal(data.pages['/'].total,2);assert.equal(data.pages['/en/'].total,1);
 assert.deepEqual(sqlite.prepare('PRAGMA table_info(portfolio_page_views)').all().map(row=>row.name),['view_date','page_path','views']);
});
test('SEO checks actual static pages and injects only validated Google/Bing meta into public HTML',async()=>{
 const {env}=await fixture();
 let result=await (await seoCheck({request:admin('/api/admin/seo'),env})).json();assert.ok(result.checks.some(item=>item.name==='Page FR indexable'&&item.status==='OK'));
 assert.ok(result.checks.some(item=>item.name==='sitemap.xml'&&item.status==='OK'));
 assert.deepEqual(result.checks.filter(item=>item.status!=='OK'),[]);
 assert.equal((await seoSave({request:admin('/api/admin/seo','PUT',{google:'"><script>',bing:''}),env})).status,400);
 assert.equal((await seoSave({request:admin('/api/admin/seo','PUT',{google:'abcDef_123',bing:'ABCDEF0123456789'}),env})).status,200);
 result=await (await seoCheck({request:admin('/api/admin/seo'),env})).json();assert.equal(result.googleConfigured,true);
 const html=await (await middleware({request:req('/'),env,next:async()=>new Response('<html><head></head><body>FR</body></html>',{headers:{'Content-Type':'text/html'}})})).text();
 assert.match(html,/<meta name="google-site-verification" content="abcDef_123">/u);
 assert.match(html,/<meta name="msvalidate\.01" content="ABCDEF0123456789">/u);
});
test('lightbox uses viewport overlay and an independent uncropped centered image',()=>{
 const css=readFileSync(new URL('../css/styles.css',import.meta.url),'utf8');
 assert.match(css,/\.image-lightbox\[open\]\s*\{[^}]*place-items: center;/u);
 assert.match(css,/\.image-lightbox img\s*\{[^}]*width: 100%;[^}]*height: 100%;[^}]*object-fit: contain;[^}]*margin: 0 auto;[^}]*aspect-ratio: auto;/u);
 assert.match(css,/@media \(max-width: 390px\) \{[\s\S]*?\.header-inner \{ flex-wrap: wrap;/u);
 for(const page of ['../index.html','../en/index.html'])assert.match(readFileSync(new URL(page,import.meta.url),'utf8'),/data-professional-action="pitch" hidden/u);
});
