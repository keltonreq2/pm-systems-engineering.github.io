import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { contentCatalog, readOverrides, contentHandler, applyContent } from '../functions/lib/content.js';
import { onRequestGet as getContent, onRequestPut as putContent, onRequestDelete as deleteContent } from '../functions/api/admin/content.js';
import { onRequestPost as contact } from '../functions/api/contact.js';
import { onRequestGet as getMessages } from '../functions/api/admin/messages.js';
import { onRequestPatch as patchMessage, onRequestDelete as deleteMessage } from '../functions/api/admin/messages/[id].js';
import { onRequest as middleware } from '../functions/_middleware.js';
import { sha256Hex } from '../functions/lib/security.js';

const schema=readFileSync(new URL('../schema.sql',import.meta.url),'utf8');
const migration=readFileSync(new URL('../migrations/0007_content_messages.sql',import.meta.url),'utf8');
const origin='https://portfolio.example';
async function fixture(){
  const sqlite=new DatabaseSync(':memory:');sqlite.exec(schema);
  sqlite.prepare("UPDATE settings SET value = 'true' WHERE key = 'site_public'").run();
  sqlite.prepare('INSERT INTO admin_sessions VALUES (?, ?, ?)').run(await sha256Hex('unit-session'),Math.floor(Date.now()/1000)+3600,1);
  const DB={prepare(sql){const statement=sqlite.prepare(sql);let args=[];return {
    bind(...values){args=values;return this;},
    async first(){return statement.get(...args)||null;},
    async all(){return {results:statement.all(...args)};},
    async run(){const result=statement.run(...args);return {meta:{changes:result.changes}};}
  };}};
  return {sqlite,env:{DB,SESSION_SECRET:'test-only-secret-not-production'}};
}
const request=(path,method='GET',body,auth=true)=>new Request(origin+path,{method,headers:{Origin:origin,'Content-Type':'application/json',...(auth?{Cookie:'__Host-pm_admin=unit-session'}:{})},...(body!==undefined?{body:JSON.stringify(body)}:{})});
const sample={name:'Test visitor',email:'visitor@example.test',subject:'Test subject',message:'Message de test',website:''};
const submit=(env,body=sample)=>contact({request:request('/api/contact','POST',body,false),env});

test('V7 migration is repeatable and preserves V6 settings and sessions',async()=>{
  const {sqlite}=await fixture();
  sqlite.prepare("UPDATE settings SET value='https://www.linkedin.com/in/test' WHERE key='linkedin_url'").run();
  sqlite.exec(migration);sqlite.exec(migration);sqlite.exec(schema);
  assert.equal(sqlite.prepare("SELECT value FROM settings WHERE key='linkedin_url'").get().value,'https://www.linkedin.com/in/test');
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM admin_sessions').get().n,1);
  assert.equal(sqlite.prepare("SELECT value FROM settings WHERE key='site_public'").get().value,'true');
  assert.deepEqual(sqlite.prepare('PRAGMA table_info(contact_messages)').all().map(r=>r.name),['id','name','email','subject','message','created_at','read_at']);
});
test('content catalogue covers both languages and the HTML fallback',()=>{
  for(const [language,path] of [['fr','../index.html'],['en','../en/index.html']]){
    const source=readFileSync(new URL(path,import.meta.url),'utf8');
    const pitch=readFileSync(new URL(language==='fr'?'../pitch/index.html':'../en/pitch/index.html',import.meta.url),'utf8');
    const keys=[...(source+'\n'+pitch).matchAll(/data-content-key="([^"]+)"/gu)].map(m=>m[1]);
    assert.deepEqual(contentCatalog[language].map(f=>f.key),keys);
    assert.ok(keys.length>180);
    assert.ok(contentCatalog[language].every(f=>f.defaultValue.trim() && f.defaultValue.length<=f.maxLength));
    for(const section of ['hero','profile','expertise','projects','inspection','training','career','mentors','project','personality','contact'])assert.ok(keys.some(k=>k.startsWith(section+'.')));
  }
});
test('admin reads defaults and language-specific FR/EN overrides, then restores one',async()=>{
  const {env}=await fixture();
  const read=async language=>(await (await getContent({request:request(`/api/admin/content?language=${language}`),env})).json()).fields.find(f=>f.key==='hero.title');
  assert.equal((await read('fr')).overridden,false);
  for(const language of ['fr','en'])assert.equal((await putContent({request:request('/api/admin/content','PUT',{language,key:'hero.title',value:language+' CUSTOM'}),env})).status,200);
  assert.equal((await read('fr')).value,'fr CUSTOM');assert.equal((await read('en')).value,'en CUSTOM');
  assert.equal((await deleteContent({request:request('/api/admin/content','DELETE',{language:'fr',key:'hero.title'}),env})).status,200);
  assert.equal((await read('fr')).value,contentCatalog.fr.find(f=>f.key==='hero.title').defaultValue);
  assert.equal((await read('en')).value,'en CUSTOM');
});
test('content rejects blank, unknown, oversized and cross-origin changes',async()=>{
  const {env}=await fixture();
  for(const body of [{language:'fr',key:'hero.title',value:''},{language:'de',key:'hero.title',value:'text'},{language:'fr',key:'unknown',value:'text'},{language:'fr',key:'hero.title',value:'x'.repeat(501)}])assert.equal((await putContent({request:request('/api/admin/content','PUT',body),env})).status,400);
  const req=request('/api/admin/content','DELETE',{language:'fr',key:'hero.title'});req.headers.set('Origin','https://evil.example');
  assert.equal((await deleteContent({request:req,env})).status,403);
});
test('malicious text is passed only to HTMLRewriter text mode; absent keys leave HTML intact',async()=>{
  const {env}=await fixture();const malicious='<script>alert(1)</script><iframe src="https://evil.example"></iframe>&';
  await putContent({request:request('/api/admin/content','PUT',{language:'fr',key:'hero.title',value:malicious}),env});
  const overrides=await readOverrides(env.DB,'fr');const calls=[];
  const handler=contentHandler(overrides);
  handler.element({getAttribute:()=> 'hero.title',setInnerContent:(text,options)=>calls.push({text,options})});
  handler.element({getAttribute:()=> 'profile.title',setInnerContent:()=>assert.fail('Missing keys must keep fallback')});
  assert.deepEqual(calls,[{text:malicious,options:{html:false}}]);
  assert.equal((await readOverrides(env.DB,'en')).size,0);
});
test('content read failures and empty overrides return the untouched response',async()=>{
  const {env}=await fixture();
  const response=new Response('fallback',{headers:{'Content-Type':'text/html'}});
  assert.equal(await applyContent(response,env.DB,'fr'),response);
  assert.equal(await applyContent(response,{prepare(){throw new Error('D1 content unavailable');}},'fr'),response);
});
test('valid contact is stored as text without an IP address',async()=>{
  const {env,sqlite}=await fixture();
  const req=request('/api/contact','POST',{...sample,message:'<img src=x onerror=alert(1)>'},false);req.headers.set('CF-Connecting-IP','192.0.2.123');
  const response=await contact({request:req,env});assert.equal(response.status,201);assert.equal(response.headers.get('Cache-Control'),'no-store');
  const row=sqlite.prepare('SELECT * FROM contact_messages').get();
  assert.equal(row.email,sample.email);assert.equal(row.message,'<img src=x onerror=alert(1)>');assert.equal(row.read_at,null);
  const rate=sqlite.prepare('SELECT * FROM contact_rate_limits').get();assert.match(rate.rate_key,/^[0-9a-f]{64}$/u);
  assert.ok(!JSON.stringify([row,rate]).includes('192.0.2.123'));
});
test('bad email, empty fields, oversized message and scalar JSON are rejected',async()=>{
  for(const sampleBody of [{...sample,email:'bad@'},{...sample,message:'x'.repeat(5001)},{...sample,name:' '},null]){
    const {env,sqlite}=await fixture();assert.equal((await submit(env,sampleBody)).status,400);assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM contact_messages').get().n,0);
  }
});
test('actual request bytes are bounded even without Content-Length',async()=>{
  const {env}=await fixture();const response=await submit(env,{...sample,message:'x'.repeat(40000)});assert.equal(response.status,400);
});
test('honeypot appears successful but never stores a message',async()=>{
  const {env,sqlite}=await fixture();assert.equal((await submit(env,{...sample,website:'bot.example'})).status,200);assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM contact_messages').get().n,0);
});
test('contact rate limit is atomic, counts invalid attempts and expires',async()=>{
  const {env,sqlite}=await fixture();
  const responses=await Promise.all(Array.from({length:9},()=>submit(env,{...sample,email:'invalid'})));
  assert.equal(responses.filter(r=>r.status===400).length,5);assert.equal(responses.filter(r=>r.status===429).length,4);
  assert.ok(Number(responses.find(r=>r.status===429).headers.get('Retry-After'))>0);
  sqlite.prepare('UPDATE contact_rate_limits SET window_started=?').run(Math.floor(Date.now()/1000)-901);
  assert.equal((await submit(env)).status,201);
});
test('public contact requires same origin and private mode rejects contact',async()=>{
  const {env,sqlite}=await fixture();const req=request('/api/contact','POST',sample,false);req.headers.set('Origin','https://evil.example');
  assert.equal((await contact({request:req,env})).status,403);
  sqlite.prepare("UPDATE settings SET value='false' WHERE key='site_public'").run();assert.equal((await submit(env)).status,404);
});
test('messages have authenticated pagination, read/unread updates and deletion',async()=>{
  const {env,sqlite}=await fixture();
  for(let i=0;i<23;i++)sqlite.prepare('INSERT INTO contact_messages VALUES (?,?,?,?,?,?,NULL)').run(crypto.randomUUID(),sample.name,sample.email,'Subject '+i,sample.message,i+1);
  const fetchPage=async page=>{const response=await getMessages({request:request('/api/admin/messages?page='+page),env});assert.equal(response.headers.get('Cache-Control'),'no-store');return response.json();};
  let data=await fetchPage(1);assert.equal(data.messages.length,20);assert.equal(data.total,23);assert.equal(data.unread,23);assert.equal(data.messages[0].created_at,23);assert.equal((await fetchPage(2)).messages.length,3);
  const id=data.messages[0].id;
  for(const read of [true,false]){
    const response=await patchMessage({request:request('/api/admin/messages/'+id,'PATCH',{read}),env,params:{id}});assert.equal(response.status,200);
    data=await fetchPage(1);assert.equal(data.unread,read?22:23);
  }
  assert.equal((await deleteMessage({request:request('/api/admin/messages/'+id,'DELETE'),env,params:{id}})).status,200);
  assert.equal((await fetchPage(1)).total,22);
});
test('all new admin endpoints deny missing/expired sessions and mutations deny CSRF',async()=>{
  const {env,sqlite}=await fixture();
  const id=crypto.randomUUID();
  for(const [fn,path,method,body] of [[getContent,'/api/admin/content','GET'],[putContent,'/api/admin/content','PUT',{}],[deleteContent,'/api/admin/content','DELETE',{}],[getMessages,'/api/admin/messages','GET'],[patchMessage,'/api/admin/messages/'+id,'PATCH',{read:true}],[deleteMessage,'/api/admin/messages/'+id,'DELETE']]){
    assert.equal((await fn({request:request(path,method,body,false),env,params:{id}})).status,401);
    if(method!=='GET'){
      const req=request(path,method,body);req.headers.delete('Origin');assert.equal((await fn({request:req,env,params:{id}})).status,403);
    }
  }
  sqlite.prepare('UPDATE admin_sessions SET expires_at=1').run();assert.equal((await getMessages({request:request('/api/admin/messages'),env})).status,401);
});
test('private middleware still protects new public contact route and new admin routes',async()=>{
  const {env,sqlite}=await fixture();sqlite.prepare("UPDATE settings SET value='false' WHERE key='site_public'").run();
  for(const path of ['/api/contact','/api/admin/messages','/api/admin/content']){
    const response=await middleware({request:request(path,'GET',undefined,false),env,next:()=>{assert.fail('Protected content served');}});
    assert.equal(response.status,path==='/api/contact'?404:401);
  }
});
test('V7 chapters, education, contact labels and removed image references are correct',()=>{
  for(const path of ['../index.html','../en/index.html']){
    const source=readFileSync(new URL(path,import.meta.url),'utf8');
    assert.match(source,/<section class="deep-experience section-pad" id="protection-training"/u);
    assert.match(source,/<section class="mentors-section section-pad section-paper" id="mentors"/u);
    assert.doesNotMatch(source,/Cycle ingénieur|profile-field\.webp|project-field-inspection|project-training\.webp/u);
    assert.ok(source.indexOf('career.education.bac')<source.indexOf('career.education.bts'));
    assert.ok(source.indexOf('career.education.bts')<source.indexOf('career.education.engineering'));
    assert.match(source,/Diplôme en cours|Degree in progress/u);
    for(const field of ['name','email','subject','message'])assert.match(source,new RegExp(`<label for="contact-${field}">`,'u'));
    assert.match(source,/id="contact-status"[^>]*aria-live="polite"/u);
  }
});
