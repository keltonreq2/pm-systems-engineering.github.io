import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {onRequest as middleware} from '../functions/_middleware.js';
import {onRequestGet as config} from '../functions/api/public-config.js';
import {onRequestGet as getCep} from '../functions/api/cep.js';
import {onRequestPut as upload,onRequestDelete as remove,onRequestGet as metadata} from '../functions/api/admin/cep.js';
import {onRequestGet as preview} from '../functions/api/admin/cep/file.js';
import {onRequestPut as publication} from '../functions/api/admin/cep/settings.js';
import {onRequestPut as access} from '../functions/api/admin/cv-access.js';
import {onRequestPost as unlock} from '../functions/api/cv/unlock.js';
import {onRequestPost as revoke} from '../functions/api/admin/cv-access/revoke.js';
import {onRequestGet as getFr} from '../functions/api/cv.js';
import {onRequestGet as getEn} from '../functions/api/cv/en.js';
import {sha256Hex,readSetting} from '../functions/lib/security.js';
import {inspectCep,CEP_FORMATS} from '../functions/lib/cep.js';
const origin='https://portfolio.example';
const req=(path,method='GET',body=null,cookie='',sameOrigin=origin)=>new Request(origin+path,{method,headers:{Origin:sameOrigin,...(cookie?{Cookie:cookie}:{}),...(body&&!(body instanceof FormData)?{'Content-Type':'application/json'}:{})},...(body?{body:body instanceof FormData?body:JSON.stringify(body)}:{})});
async function fixture(){
 const sql=new DatabaseSync(':memory:');sql.exec(readFileSync(new URL('../schema.sql',import.meta.url),'utf8'));
 sql.exec(readFileSync(new URL('../migrations/0010_portfolio_views.sql',import.meta.url),'utf8'));
 sql.prepare("UPDATE settings SET value='true' WHERE key='site_public'").run();
 sql.prepare('INSERT INTO admin_sessions VALUES(?,?,?)').run(await sha256Hex('admin'),Math.floor(Date.now()/1000)+3600,0);
 const DB={async batch(statements){sql.exec('BEGIN');try{const results=[];for(const statement of statements)results.push(await statement.run());sql.exec('COMMIT');return results;}catch(error){sql.exec('ROLLBACK');throw error;}},prepare(query){const st=sql.prepare(query);let args=[];return{bind(...v){args=v;return this;},async first(){return st.get(...args)||null;},async all(){return{results:st.all(...args)};},async run(){return st.run(...args);}};}};
 const files=new Map();const env={DB,SESSION_SECRET:'local-test-only',CV_BUCKET:{async put(k,b){files.set(k,new Uint8Array(b));},async head(k){return files.has(k)?{size:files.get(k).length}:null;},async get(k){return files.has(k)?{body:files.get(k),writeHttpMetadata(){}}:null;},async delete(k){files.delete(k);}}};
 const admin='__Host-pm_admin=admin';
 const put=async file=>{const form=new FormData();form.set('cep',file);return upload({request:req('/api/admin/cep','PUT',form,admin),env});};
 const sign=async(code='local-valid-code')=>{const r=await unlock({request:req('/api/cv/unlock','POST',{code}),env});assert.equal(r.status,200);return r.headers.get('Set-Cookie').split(';')[0];};
 await access({request:req('/api/admin/cv-access','PUT',{code:'local-valid-code'},admin),env});
 return{env,sql,files,admin,put,sign};
}
const pdf=(version=1)=>new File([`%PDF-1.7\n% test fixture version ${version}\n%%EOF`],`test-${version}.pdf`,{type:'application/pdf'});
const pptx=n=>new File([readFileSync(new URL(`./fixtures/cep-${n}-slides.pptx`,import.meta.url))],`test-${n}.pptx`,{type:CEP_FORMATS.pptx.mime});
test('PDF and PPTX upload, replacement, preview, download, legacy PDF and deletion use one document slot',async()=>{
 const {env,sql,files,admin,put,sign}=await fixture();
 assert.equal((await put(pdf())).status,200);
 // Legacy uploads have no format setting: they still resolve to the existing PDF.
 sql.prepare("DELETE FROM settings WHERE key='cep_format'").run();
 const cookie=await sign();
 assert.equal((await publication({request:req('/api/admin/cep/settings','PUT',{public:true,protected:true},admin),env})).status,200);
 let response=await getCep({request:req('/api/cep','GET',null,cookie),env});assert.equal(response.status,200);assert.match(response.headers.get('Content-Disposition'),/^inline/);
 response=await getCep({request:req('/api/cep?download=1','GET',null,cookie),env});assert.match(response.headers.get('Content-Disposition'),/^attachment/);
 assert.equal((await put(pdf(2))).status,200);assert.match(await (await getCep({request:req('/api/cep','GET',null,cookie),env})).text(),/version 2/);
 assert.equal((await put(pptx(5))).status,200);assert.equal(files.has('cep-presentation.pdf'),false);
 let info=await (await metadata({request:req('/api/admin/cep','GET',null,admin),env})).json();assert.equal(info.format,'pptx');assert.equal(info.slides,5);
 response=await getCep({request:req('/api/cep','GET',null,cookie),env});assert.equal(response.headers.get('Content-Type'),CEP_FORMATS.pptx.mime);assert.match(response.headers.get('Content-Disposition'),/^attachment;.*\.pptx/);assert.deepEqual(new Uint8Array(await response.arrayBuffer()),new Uint8Array(await pptx(5).arrayBuffer()));
 assert.equal((await preview({request:req('/api/admin/cep/file','GET',null,admin),env})).status,200);
 assert.equal((await put(pptx(5))).status,200);
 assert.equal((await put(pdf(3))).status,200);assert.equal(files.has('cep-presentation.pptx'),false);
 assert.equal((await remove({request:req('/api/admin/cep','DELETE',null,admin),env})).status,200);assert.equal(files.size,0);
 assert.equal((await getCep({request:req('/api/cep','GET',null,cookie),env})).status,404);
});
test('same code unlocks CEP and both CVs; missing, wrong, expired, rotated and revoked cookies fail closed',async()=>{
 const {env,sql,files,admin,put,sign}=await fixture();await put(pdf());
 sql.prepare("UPDATE settings SET value='true' WHERE key IN ('cep_public','cv_available','cv_en_available','cv_access_enabled')").run();
 for(const k of ['cv-pm-systems-engineering.pdf','cv-pm-systems-engineering-en.pdf'])files.set(k,new Uint8Array(await pdf().arrayBuffer()));
 for(const path of ['/cep','/cep/','/cep/index.html','/cep/index','/c%65p/','/en/c%65p/index','/en/cep','/en/cep/','/en/cep/index.html','/pitch/']){
  let reached=false;const r=await middleware({request:req(path),env,next(){reached=true;return new Response('private');}});assert.equal(r.status,401,path);assert.equal(reached,false);
 }
 assert.equal((await getCep({request:req('/api/cep'),env})).status,401);
 const publicInfo=await (await config({request:req('/api/public-config'),env})).json();assert.equal(publicInfo.cepAvailable,false);assert.equal(publicInfo.cepFormat,null);assert.ok(!JSON.stringify(publicInfo).includes('digest'));
 assert.equal((await unlock({request:req('/api/cv/unlock','POST',{code:'wrong-code-here'}),env})).status,401);
 const cookie=await sign();
 for(const [path,handler] of [['/api/cep',getCep],['/api/cv',getFr],['/api/cv/en',getEn]])assert.equal((await handler({request:req(path,'GET',null,cookie),env})).status,200);
 const page=await middleware({request:req('/cep/','GET',null,cookie),env,next:async()=>new Response('CEP',{headers:{'Content-Type':'text/html'}})});assert.equal(page.status,200);assert.match(page.headers.get('Cache-Control'),/no-store/);assert.equal(page.headers.get('X-Robots-Tag'),'noindex, nofollow');
 const [name,encoded]=cookie.split('=');const parts=decodeURIComponent(encoded).split('.');const expired=`${name}=${parts[0]}.${Math.floor(Date.now()/1000)-1}.${parts[2]}`;
 assert.equal((await getCep({request:req('/api/cep','GET',null,expired),env})).status,401);
 await revoke({request:req('/api/admin/cv-access/revoke','POST',null,admin),env});assert.equal((await getCep({request:req('/api/cep','GET',null,cookie),env})).status,401);
 const nextCookie=await sign();await access({request:req('/api/admin/cv-access','PUT',{code:'a-new-local-code'},admin),env});assert.equal((await getCep({request:req('/api/cep','GET',null,nextCookie),env})).status,401);
 await access({request:req('/api/admin/cv-access','PUT',{enabled:false},admin),env});assert.equal((await getCep({request:req('/api/cep'),env})).status,401);
 assert.equal((await publication({request:req('/api/admin/cep/settings','PUT',{public:true,protected:false},admin),env})).status,400);
});
test('invalid types, six-slide PPTX, excessive sizes and unauthorised writes preserve the current file',async()=>{
 const {env,files,admin,put}=await fixture();await put(pdf());const before=files.get('cep-presentation.pdf');
 for(const file of [pptx(6),new File(['PK nonsense'],'broken.pptx',{type:CEP_FORMATS.pptx.mime}),new File(['<html>'],'fake.pdf',{type:'application/pdf'}),new File(['%PDF-1.7'],'wrong.pptx',{type:'application/pdf'}),new File(['%PDF-1.7'],'wrong.txt',{type:'application/pdf'}),new File([new Uint8Array(10*1024*1024+1)],'large.pdf',{type:'application/pdf'})])assert.equal((await put(file)).status,400);
 assert.deepEqual(files.get('cep-presentation.pdf'),before);assert.equal(await readSetting(env.DB,'cep_format'),'pdf');
 const form=new FormData();form.set('cep',pdf());
 assert.equal((await upload({request:req('/api/admin/cep','PUT',form),env})).status,401);
 assert.equal((await upload({request:req('/api/admin/cep','PUT',form,admin,'https://elsewhere.example'),env})).status,403);
 assert.equal((await preview({request:req('/api/admin/cep/file'),env})).status,401);
});
test('mobility migration updates only requested texts, preserves CV/LinkedIn and publication flags',async()=>{
 const {sql}=await fixture();sql.prepare("UPDATE settings SET value='https://www.linkedin.com/in/patrice-m-893633210' WHERE key='linkedin_url'").run();
 sql.prepare("INSERT INTO content_overrides VALUES('fr','hero.title','Keep my title',0)").run();
 const migration=readFileSync(new URL('../migrations/0011_cep_cam_2026.sql',import.meta.url),'utf8');sql.exec(migration);sql.exec(migration);
 assert.equal(sql.prepare("SELECT value FROM content_overrides WHERE content_key='hero.title'").get().value,'Keep my title');
 assert.match(sql.prepare("SELECT value FROM settings WHERE key='linkedin_url'").get().value,/patrice-m-/);
 assert.equal(sql.prepare('SELECT count(*) n FROM publication_flags').get().n,0);
 for(const language of ['fr','en'])assert.match(sql.prepare("SELECT value FROM content_overrides WHERE language=? AND content_key='project.timeline.step_4.date'").get(language).value,/2029–2031/);
 for(const file of ['index.html','en/index.html']){const html=readFileSync(new URL('../'+file,import.meta.url),'utf8');assert.match(html,/data-professional-action="cep"/);assert.ok(!html.includes('data-professional-action="pitch"'));assert.ok(!html.includes('="cep"="true"'));}
});

test('automatic CAM migration is atomic, runs once and preserves later admin edits',async()=>{
 const {ensureCamMigration}=await import('../functions/lib/cam-migration.js');
 const {env,sql}=await fixture();
 sql.prepare("INSERT INTO content_overrides VALUES('fr','hero.title','Keep unrelated title',0)").run();
 sql.prepare("INSERT INTO content_overrides VALUES('fr','project.mobility_focus.fact_2','Old vague period',0)").run();
 assert.equal(await ensureCamMigration(env),true);
 assert.equal(await readSetting(env.DB,'cam_2026_cep_applied'),'true');
 assert.equal(sql.prepare("SELECT value FROM content_overrides WHERE content_key='hero.title'").get().value,'Keep unrelated title');
 assert.match(sql.prepare("SELECT value FROM content_overrides WHERE content_key='project.mobility_focus.fact_2' AND language='fr'").get().value,/août 2027/);
 sql.prepare("UPDATE content_overrides SET value='Later admin edit' WHERE content_key='project.mobility_focus.fact_2' AND language='fr'").run();
 assert.equal(await ensureCamMigration(env),false);
 assert.equal(sql.prepare("SELECT value FROM content_overrides WHERE content_key='project.mobility_focus.fact_2' AND language='fr'").get().value,'Later admin edit');
 const broken=await fixture();const realBatch=broken.env.DB.batch;
 broken.env.DB.batch=async statements=>{
   const invalid={async run(){throw new Error('Injected batch failure');}};
   return realBatch([...statements.slice(0,2),invalid,...statements.slice(2)]);
 };
 await assert.rejects(ensureCamMigration(broken.env));
 assert.equal(await readSetting(broken.env.DB,'cam_2026_cep_applied'),null);
 assert.equal(broken.sql.prepare('SELECT count(*) n FROM content_overrides').get().n,0);
});
