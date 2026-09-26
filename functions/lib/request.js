import { getSession } from './auth.js';
import { json, requireSameOrigin } from './security.js';

export async function adminGuard(request, env, mutation = false) {
  if (mutation && !requireSameOrigin(request)) return json({ error: 'Requête refusée' }, 403);
  try {
    if (!env.DB || !await getSession(request, env.DB)) return json({ error: 'Session administrateur requise' }, 401);
  } catch { return json({ error: 'Service indisponible' }, 503); }
  return null;
}

// Bound the actual stream, including requests without Content-Length.
export async function readJson(request, limit = 32768) {
  if (!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')) throw new Error('Invalid content type');
  if (Number(request.headers.get('Content-Length')) > limit) throw new Error('Body too large');
  if (!request.body) throw new Error('Missing body');
  const reader = request.body.getReader();
  let size = 0;
  const parts = [];
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) { await reader.cancel(); throw new Error('Body too large'); }
    parts.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) { bytes.set(part, offset); offset += part.byteLength; }
  const body = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Invalid object');
  return body;
}

export async function readMultipart(request, limit) {
  if (Number(request.headers.get('Content-Length')) > limit) throw new Error('Body too large');
  if (!request.headers.get('Content-Type')?.toLowerCase().startsWith('multipart/form-data;') || !request.body) throw new Error('Invalid multipart');
  const reader=request.body.getReader();let size=0;const parts=[];
  while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>limit){await reader.cancel();throw new Error('Body too large');}parts.push(value);}
  const bytes=new Uint8Array(size);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.length;}
  return new Response(bytes,{headers:{'Content-Type':request.headers.get('Content-Type')}}).formData();
}
