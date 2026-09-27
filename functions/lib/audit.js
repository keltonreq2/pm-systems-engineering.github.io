// Audit records deliberately omit secrets, token values, file bodies and visitors' messages.
export async function auditAdmin(env,{type,key,language=null,action,previousValue=null,newValue=null}){
 try{await env.DB.prepare('INSERT INTO admin_audit(id,at,type,item_key,language,action,previous_value,new_value) VALUES(?1,unixepoch(),?2,?3,?4,?5,?6,?7)')
  .bind(crypto.randomUUID(),type,key,language,action,type==='text'?previousValue:null,type==='text'?newValue:null).run();}
 catch{/* An unavailable audit log must not break an already accepted V8 operation. */}
}
