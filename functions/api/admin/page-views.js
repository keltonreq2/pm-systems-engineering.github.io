import {json} from '../../lib/security.js';
import {adminGuard} from '../../lib/request.js';
import {pageViewTotals} from '../../lib/page-views.js';
export async function onRequestGet({request,env}){
 const denied=await adminGuard(request,env);if(denied)return denied;
 try{return json(await pageViewTotals(env.DB));}catch{return json({error:'Statistiques indisponibles : appliquer la migration V11.2.'},503);}
}
