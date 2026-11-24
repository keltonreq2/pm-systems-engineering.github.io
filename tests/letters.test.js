import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,existsSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {onRequestGet as getLetter,onRequestHead as headLetter} from '../functions/api/letters/[id].js';
import {onRequestGet as preview,onRequestPut as upload,onRequestDelete as remove} from '../functions/api/admin/letters/[id].js';
import {onRequestGet as metadata} from '../functions/api/admin/letters.js';
import {onRequest as middleware} from '../functions/_middleware.js';
import {onRequestGet as config} from '../functions/api/public-config.js';
import {onRequestPut as access} from '../functions/api/admin/cv-access.js';
import {onRequestPost as unlock} from '../functions/api/cv/unlock.js';
import {onRequestPost as revoke} from '../functions/api/admin/cv-access/revoke.js';
import {onRequestGet as getFr} from '../functions/api/cv.js';
import {onRequestGet as getEn} from '../functions/api/cv/en.js';
import {onRequestPost as invitation} from '../functions/api/admin/access.js';
import {onRequestGet as exchange} from '../functions/access/[token].js';
import {sha256Hex,writeSetting} from '../functions/lib/security.js';
import {LETTERS,LETTER_MAX} from '../functions/lib/letters.js';
const origin='https://portfolio.example';
const request=(path,method='GET',body=null,cookie='',from=origin)=>new Request(origin+path,{method,headers:{Origin:from,...(cookie?{Cookie:cookie}:{}),...(body&&!(body instanceof FormData)?{'Content-Type':'application/json'}:{})},...(body?{body:body instanceof FormData?body:JSON.stringify(body)}:{})});
const pdf=(text='fixture')=>new File([`%PDF-1.7\n${text}\n%%EOF`],'letter.pdf',{type:'application/pdf'});
async function fixture(){
 const sql=new DatabaseSync(':memory:');sql.exec(readFileSync(new URL('../schema.sql',import.meta.url),'utf8'));
 const DB={prepare(query){const st=sql.prepare(query);let args=[];return{bind(...v){args=v;return this;},async first(){return st.get(...args)||null;},async all(){return{results:st.all(...args)};},async run(){return st.run(...args);}};}};
 const files=new Map();let reads=0;
 const env={DB,SESSION_SECRET:'letters-test-only',CV_BUCKET:{async put(k,b){files.set(k,new Uint8Array(b));},async head(k){return files.has(k)?{size:files.get(k).length}:null;},async get(k){reads++;return files.has(k)?{body:files.get(k),writeHttpMetadata(){}}:null;},async delete(k){files.delete(k);}}};
 sql.prepare('INSERT INTO admin_sessions VALUES(?,?,?)').run(await sha256Hex('admin'),Math.floor(Date.now()/1000)+3600,0);
 const admin='__Host-pm_admin=admin';
 await access({request:request('/api/admin/cv-access','PUT',{code:'letters-local-code'},admin),env});
 const ctx=(id,method='GET',body=null,cookie='',from=origin)=>({request:request(`/api/letters/${id}`,method,body,cookie,from),env,params:{id}});
 const put=async(id,file=pdf(id),cookie=admin,from=origin)=>{const form=new FormData();form.set('letter',file);return upload(ctx(id,'PUT',form,cookie,from));};
 const sign=async()=>{const response=await unlock({request:request('/api/cv/unlock','POST',{code:'letters-local-code'}),env});assert.equal(response.status,200);return response.headers.get('Set-Cookie').split(';')[0];};
 return{sql,env,files,admin,ctx,put,sign,reads:()=>reads};
}
test('one CV code/session unlocks both CVs and all four correctly named employer/language downloads',async()=>{
 const f=await fixture();
 for(const id of Object.keys(LETTERS))assert.equal((await f.put(id)).status,200);
 for(const key of ['cv-pm-systems-engineering.pdf','cv-pm-systems-engineering-en.pdf'])f.files.set(key,new Uint8Array(await pdf(key).arrayBuffer()));
 for(const key of ['cv_access_enabled','cv_available','cv_en_available'])await writeSetting(f.env.DB,key,'true');
 const locked=await (await config({request:request('/api/public-config'),env:f.env})).json();assert.deepEqual(locked.lettersAvailable,{});
 const cookie=await f.sign();
 for(const handler of [getFr,getEn])assert.equal((await handler({request:request('/api/cv','GET',null,cookie),env:f.env})).status,200);
 const info=await (await config({request:request('/api/public-config','GET',null,cookie),env:f.env})).json();assert.equal(info.cvUnlocked,true);assert.equal(Object.values(info.lettersAvailable).filter(Boolean).length,4);
 for(const [id,slot] of Object.entries(LETTERS)){
  const response=await getLetter(f.ctx(id,'GET',null,cookie));assert.equal(response.status,200);
  assert.equal(response.headers.get('Content-Type'),'application/pdf');assert.equal(response.headers.get('Content-Language'),slot.language);
  assert.equal(response.headers.get('Content-Disposition'),`attachment; filename="${slot.filename}"`);
  assert.match(response.headers.get('Cache-Control'),/private, no-store/);assert.match(response.headers.get('X-Robots-Tag'),/noindex/);
  assert.deepEqual(new Uint8Array(await response.arrayBuffer()),new Uint8Array(await pdf(id).arrayBuffer()));
  const head=await headLetter(f.ctx(id,'HEAD',null,cookie));assert.equal(head.status,200);assert.equal(await head.text(),'');
 }
});
test('direct URLs fail before any storage read; wrong, expired, tampered and revoked sessions disclose no PDF',async()=>{
 const f=await fixture();for(const id of Object.keys(LETTERS))await f.put(id);
 for(const id of Object.keys(LETTERS))for(const method of ['GET','HEAD']){
  const r=await (method==='HEAD'?headLetter:getLetter)(f.ctx(id,method));assert.equal(r.status,401);assert.match(r.headers.get('Cache-Control'),/no-store/);
 }
 assert.equal(f.reads(),0);
 assert.equal((await unlock({request:request('/api/cv/unlock','POST',{code:'wrong-local-code'}),env:f.env})).status,401);
 const cookie=await f.sign();const [name,value]=cookie.split('=');const parts=decodeURIComponent(value).split('.');
 for(const bad of [cookie.slice(0,-2)+'xx',`${name}=${parts[0]}.${Math.floor(Date.now()/1000)-1}.${parts[2]}`])for(const id of Object.keys(LETTERS))assert.equal((await getLetter(f.ctx(id,'GET',null,bad))).status,401);
 await revoke({request:request('/api/admin/cv-access/revoke','POST',null,f.admin),env:f.env});
 for(const id of Object.keys(LETTERS))assert.equal((await getLetter(f.ctx(id,'GET',null,cookie))).status,401);
 await access({request:request('/api/admin/cv-access','PUT',{enabled:false},f.admin),env:f.env});
 assert.equal((await getLetter(f.ctx('esb-en'))).status,401);
 const latest=await f.sign();
 await writeSetting(f.env.DB,'cv_access_digest','');
 assert.equal((await getLetter(f.ctx('esb-en','GET',null,latest))).status,401);
});
test('admin upload, replacement and removal stay isolated by employer and language; no unauthorised preview or writes',async()=>{
 const f=await fixture();for(const id of Object.keys(LETTERS))await f.put(id);
 assert.equal((await metadata({request:request('/api/admin/letters'),env:f.env})).status,401);
 assert.equal((await preview(f.ctx('esb-en'))).status,401);
 assert.equal((await f.put('esb-en',pdf(),'' )).status,401);
 assert.equal((await f.put('esb-en',pdf(),f.admin,'https://elsewhere.example')).status,403);
 assert.equal((await remove(f.ctx('esb-en','DELETE',null,f.admin,'https://elsewhere.example'))).status,403);
 const before=new Map(f.files);await f.put('esb-en',pdf('replacement'));
 assert.notDeepEqual(f.files.get(LETTERS['esb-en'].key),before.get(LETTERS['esb-en'].key));
 for(const id of ['esb-fr','landsvirkjun-en','landsvirkjun-fr'])assert.deepEqual(f.files.get(LETTERS[id].key),before.get(LETTERS[id].key));
 assert.equal((await preview(f.ctx('esb-en','GET',null,f.admin))).status,200);
 const data=await (await metadata({request:request('/api/admin/letters','GET',null,f.admin),env:f.env})).json();assert.equal(data.letters.length,4);assert.ok(data.letters.every(x=>x.available));
 assert.equal((await remove(f.ctx('esb-en','DELETE',null,f.admin))).status,200);
 assert.equal((await getLetter(f.ctx('esb-en','GET',null,await f.sign()))).status,404);assert.equal(f.files.size,3);
});
test('invalid uploads/slots and oversized bodies preserve stored letters; missing storage/auth configuration fails closed',async()=>{
 const f=await fixture();await f.put('esb-en');const before=f.files.get(LETTERS['esb-en'].key);
 for(const file of [new File(['not a PDF'],'fake.pdf',{type:'application/pdf'}),new File(['%PDF-1.7'],'fake.txt',{type:'application/pdf'}),new File(['%PDF-1.7'],'fake.pdf',{type:'text/html'}),new File([new Uint8Array(LETTER_MAX+1)],'large.pdf',{type:'application/pdf'})])assert.equal((await f.put('esb-en',file)).status,400);
 assert.deepEqual(f.files.get(LETTERS['esb-en'].key),before);
 for(const id of ['__proto__','constructor','ESB-en','esb-de','../esb-en'])assert.equal((await f.put(id)).status,404);
 const oversized=f.ctx('esb-en','PUT',new FormData(),f.admin);oversized.request.headers.set('Content-Length',String(LETTER_MAX+65537));assert.equal((await upload(oversized)).status,413);
 const cookie=await f.sign();
 f.env.SESSION_SECRET='';assert.equal((await getLetter(f.ctx('esb-en','GET',null,cookie))).status,401);
 f.env.CV_BUCKET=null;assert.equal((await f.put('esb-en')).status,503);
 f.env.CV_BUCKET={};await writeSetting(f.env.DB,'cv_access_digest','');assert.equal((await f.put('esb-en')).status,409);
});
test('Only a full recruiter invitation provides access to cover letters',async()=>{
 const f=await fixture();await f.put('esb-en');
 for(const key of ['cv_available','cv_en_available','cep_available'])await writeSetting(f.env.DB,key,'true');
 for(const key of ['cv-pm-systems-engineering.pdf','cv-pm-systems-engineering-en.pdf','cep-presentation.pdf'])f.files.set(key,new Uint8Array(await pdf(key).arrayBuffer()));
 for (const [en, expected] of [[true, 200], [false, 401]]) {
   const response = await invitation({request: request('/api/admin/access','POST',{fr:true,en,cep:true,hours:24},f.admin), env:f.env});
   assert.equal(response.status, 200);
   const result = await response.json();
   const token = new URL(result.url).pathname.split('/').pop();
   const exchanged = await exchange({request:request('/access/'+token),env:f.env,params:{token}});
   const cookie = exchanged.headers.get('Set-Cookie').split(';')[0];
   const metadata = await config({request:request('/api/public-config','GET',null,cookie),env:f.env});
   const data = await metadata.json();
   assert.equal(data.lettersUnlocked, en);
   assert.equal(Boolean(data.lettersAvailable['esb-en']), en);
   assert.equal((await getLetter(f.ctx('esb-en','GET',null,cookie))).status, expected);
 }
});
test('FR/EN pages point to the four fixed slots, English primary links and French versions; PDFs stay outside static output',()=>{
 for(const language of ['fr','en']){
  const html=readFileSync(new URL(language==='fr'?'../cep/index.html':'../en/cep/index.html',import.meta.url),'utf8');
  for(const id of Object.keys(LETTERS))assert.match(html,new RegExp(`href="/api/letters/${id}" data-professional-action="letter-${id}" hidden`));
  for(const employer of ['ESB','Landsvirkjun'])assert.match(html,new RegExp(`button button-dark" href="/api/letters/${employer.toLowerCase()}-en"`));
 }
 function walk(path){return readdirSync(path,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(new URL(e.name+'/',path)):[e.name]);}
 if(existsSync(new URL('../dist/',import.meta.url)))assert.ok(!walk(new URL('../dist/',import.meta.url)).some(name=>/Patrice_Masson_.*(?:ESB|Landsvirkjun)|cep-letter-/i.test(name)));
});

test('site privacy also blocks direct letter URLs, including an otherwise valid shared CV session',async()=>{
 const f=await fixture();await f.put('esb-en');const cookie=await f.sign();
 await writeSetting(f.env.DB,'site_public','false');let called=false;
 const response=await middleware({request:request('/api/letters/esb-en','GET',null,cookie),env:f.env,next:async()=>{called=true;return getLetter(f.ctx('esb-en','GET',null,cookie));}});
 assert.equal(response.status,404);assert.equal(called,false);assert.doesNotMatch(await response.text(),/%PDF/);
 await writeSetting(f.env.DB,'site_public','true');
 for(const path of ['/api/letters/esb-en','/api/letters/esb-en?download=1','/api/letters/esb-en/','/api/letters/%65sb-en']){
  const denied=await middleware({request:request(path),env:f.env,next:()=>getLetter(f.ctx('esb-en'))});assert.equal(denied.status,401,path);
 }
});
