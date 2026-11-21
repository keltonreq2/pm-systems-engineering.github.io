import {readSetting} from './security.js';
import {hasCvAccess} from './cv-access.js';
import {validGrant} from './grants.js';

export const CEP_MAX = 10 * 1024 * 1024;
export const CEP_FORMATS = {
  pdf: {key:'cep-presentation.pdf', mime:'application/pdf'},
  pptx: {key:'cep-presentation.pptx', mime:'application/vnd.openxmlformats-officedocument.presentationml.presentation'}
};
export const cepHeaders = {'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow'};
export const cepDenied = () => new Response('Document access required',{status:401,headers:cepHeaders});
export async function cepAuthorized(request,env) {
  return await validGrant(request,env,'cep') ||
    Boolean(await readSetting(env.DB,'cv_access_digest')) && await hasCvAccess(request,env);
}
export async function cepDocument(env) {
  // Existing PDF uploads keep working without a data conversion.
  const format = await readSetting(env.DB,'cep_format') || 'pdf';
  if (!Object.hasOwn(CEP_FORMATS,format)) return null;
  const descriptor = CEP_FORMATS[format];
  const object = await env.CV_BUCKET?.head(descriptor.key);
  return object ? {...descriptor,format,size:object.size} : null;
}
export async function serveCep(request,env,{admin=false}={}) {
  if (!admin && !await cepAuthorized(request,env)) return cepDenied();
  if (!admin && await readSetting(env.DB,'cep_available') !== 'true') return new Response('Document unavailable',{status:404,headers:cepHeaders});
  if (!admin && await readSetting(env.DB,'cep_public') !== 'true' && !await validGrant(request,env,'cep')) return new Response('Document unavailable',{status:404,headers:cepHeaders});
  const document = await cepDocument(env);
  const object = document && await env.CV_BUCKET.get(document.key);
  if (!object) return new Response('Document unavailable',{status:404,headers:cepHeaders});
  const download = document.format === 'pptx' || new URL(request.url).searchParams.get('download') === '1';
  return new Response(object.body,{headers:{...cepHeaders,'Content-Type':document.mime,
    'Content-Disposition':`${download?'attachment':'inline'}; filename="Presentation-CEP-CAM.${document.format}"`}});
}

// Inspect the ZIP directory without extracting the archive. Only the two small
// XML parts needed for the type and slide count are decompressed, with a bound.
async function pptxSlides(bytes) {
  const view = new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  let end = bytes.length-22;
  for (;end>=Math.max(0,bytes.length-65557);end--) {
    if(view.getUint32(end,true)===0x06054b50 && end+22+view.getUint16(end+20,true)===bytes.length) break;
  }
  if(end<0 || view.getUint32(end,true)!==0x06054b50) throw new Error('PPTX invalide');
  const count=view.getUint16(end+10,true), start=view.getUint32(end+16,true), size=view.getUint32(end+12,true);
  if(view.getUint16(end+4,true)||view.getUint16(end+6,true)||count!==view.getUint16(end+8,true)||!count||count>4096||start+size!==end) throw new Error('PPTX invalide');
  const entries=new Map(); let at=start;
  for(let i=0;i<count;i++) {
    if(at+46>end||view.getUint32(at,true)!==0x02014b50) throw new Error('PPTX invalide');
    const flags=view.getUint16(at+8,true), method=view.getUint16(at+10,true), compressed=view.getUint32(at+20,true), expanded=view.getUint32(at+24,true);
    const length=view.getUint16(at+28,true), extra=view.getUint16(at+30,true), comment=view.getUint16(at+32,true), offset=view.getUint32(at+42,true);
    const name=new TextDecoder().decode(bytes.subarray(at+46,at+46+length));
    if(at+46+length+extra+comment>end||flags&1||![0,8].includes(method)||entries.has(name)||name.includes('..')||name.startsWith('/')||/vbaProject\.bin$/iu.test(name)) throw new Error('PPTX invalide');
    if(offset+30>start||view.getUint32(offset,true)!==0x04034b50||view.getUint16(offset+8,true)!==method) throw new Error('PPTX invalide');
    const localNameLength=view.getUint16(offset+26,true), from=offset+30+localNameLength+view.getUint16(offset+28,true);
    if(new TextDecoder().decode(bytes.subarray(offset+30,offset+30+localNameLength))!==name||from+compressed>start) throw new Error('PPTX invalide');
    entries.set(name,{from,compressed,expanded,method});at+=46+length+extra+comment;
  }
  if(at!==end) throw new Error('PPTX invalide');
  async function xml(name) {
    const entry=entries.get(name);
    if(!entry||entry.expanded>512*1024) throw new Error('PPTX invalide');
    let stream=new Blob([bytes.subarray(entry.from,entry.from+entry.compressed)]).stream();
    if(entry.method===8) stream=stream.pipeThrough(new DecompressionStream('deflate-raw'));
    const reader=stream.getReader();const chunks=[];let total=0;
    for(;;) { const {done,value}=await reader.read();if(done)break;total+=value.length;if(total>512*1024){await reader.cancel();throw new Error('PPTX invalide');}chunks.push(value); }
    if(total!==entry.expanded) throw new Error('PPTX invalide');
    return new TextDecoder().decode(await new Blob(chunks).arrayBuffer());
  }
  const types=await xml('[Content_Types].xml'), presentation=await xml('ppt/presentation.xml');
  if(!types.includes('application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml')) throw new Error('PPTX invalide');
  const slides=[...presentation.matchAll(/<(?:[\w-]+:)?sldId\s/gu)].length;
  const files=[...entries.keys()].filter(name=>/^ppt\/slides\/slide\d+\.xml$/u.test(name)).length;
  if(slides!==files||slides<1) throw new Error('PPTX invalide');
  if(slides>5) throw new Error('Le diaporama CEP doit contenir cinq diapositives maximum.');
  return slides;
}
export async function inspectCep(file,bytes) {
  const format=file.name.split('.').at(-1)?.toLowerCase();
  if(!Object.hasOwn(CEP_FORMATS,format)) throw new Error('PDF ou PowerPoint (.pptx) requis.');
  if(format==='pdf') {
    if(file.type!=='application/pdf'||new TextDecoder().decode(bytes.subarray(0,5))!=='%PDF-') throw new Error('PDF valide requis.');
    return {format,slides:null};
  }
  if(![CEP_FORMATS.pptx.mime,'application/octet-stream',''].includes(file.type)) throw new Error('PPTX valide requis.');
  try { return {format,slides:await pptxSlides(bytes)}; }
  catch(error) { throw new Error(error.message.includes('cinq diapositives')?error.message:'PPTX valide requis.'); }
}
