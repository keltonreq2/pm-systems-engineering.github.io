import {adminGuard} from '../../lib/request.js';
import {json} from '../../lib/security.js';
import {LETTERS,letterAvailability} from '../../lib/letters.js';
export async function onRequestGet({request,env}) {
  const denied=await adminGuard(request,env);if(denied)return denied;
  try {
    const available=await letterAvailability(env);
    return json({letters:Object.entries(LETTERS).map(([id,slot])=>({id,employer:slot.employer,language:slot.language,filename:slot.filename,available:available[id]}))});
  } catch {return json({error:'Lettres indisponibles'},503);}
}
