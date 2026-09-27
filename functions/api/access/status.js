import {json} from '../../lib/security.js';
import {validGrant} from '../../lib/grants.js';
export async function onRequestGet({request,env}){const [fr,en,cep]=await Promise.all(['fr','en','cep'].map(scope=>validGrant(request,env,scope)));return json({fr,en,cep});}
