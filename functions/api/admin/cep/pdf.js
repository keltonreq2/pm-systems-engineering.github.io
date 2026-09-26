import {adminGuard} from '../../../lib/request.js';
export async function onRequestGet({request,env}){
 const denied=await adminGuard(request,env);if(denied)return denied;
 try{const object=await env.CV_BUCKET?.get('cep-presentation.pdf');if(!object)return new Response('Document absent',{status:404});return new Response(object.body,{headers:{'Content-Type':'application/pdf','Content-Disposition':'inline; filename="Presentation-CEP.pdf"','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow'}});}catch{return new Response('Document indisponible',{status:503});}
}
