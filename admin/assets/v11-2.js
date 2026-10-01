(() => {
const $=selector=>document.querySelector(selector);
const status=(selector,message,error=false)=>{const node=$(selector);node.textContent=message;node.classList.toggle('is-error',error);};
async function api(path,options={}){
 const response=await fetch(path,{cache:'no-store',...options});
 if(response.status===401){location.assign('/admin/login/');throw new Error('Session expirée.');}
 const result=await response.json();if(!response.ok)throw new Error(result.error||'Service indisponible.');return result;
}
async function pitch(){try{
 const data=await api('/api/admin/pitch');$('#pitch-state').textContent=data.available?'Disponible':'Absent';
 $('#pitch-preview').hidden=!data.available;$('#pitch-delete').hidden=!data.available;
 status('#pitch-status',data.available?`Vidéo privée enregistrée · ${(data.size/1024/1024).toFixed(2)} Mio${data.codeConfigured?'':' · Définir le code CV pour ouvrir le bouton public.'}`:'Aucun pitch enregistré.');
}catch(error){status('#pitch-status',error.message,true);}}
$('#pitch-form').addEventListener('submit',async event=>{event.preventDefault();const file=$('#pitch-file').files[0];if(!file)return;const form=new FormData();form.append('pitch',file,file.name);try{await api('/api/admin/pitch',{method:'PUT',body:form});$('#pitch-file').value='';await pitch();}catch(error){status('#pitch-status',error.message,true);}});
$('#pitch-delete').addEventListener('click',async()=>{if(!confirm('Supprimer le pitch vidéo privé ?'))return;try{await api('/api/admin/pitch',{method:'DELETE'});await pitch();}catch(error){status('#pitch-status',error.message,true);}});
async function seo(){try{
 const data=await api('/api/admin/seo');
 $('#seo-google').value=data.googleCode;$('#seo-bing').value=data.bingCode;
 $('#seo-code-status').textContent=`Google : ${data.googleConfigured?'configuré':'non configuré'} · Bing : ${data.bingConfigured?'configuré':'non configuré'}.`;
 const list=$('#seo-results');list.replaceChildren(...data.checks.map(item=>{const li=document.createElement('li');li.textContent=`${item.status} · ${item.name} — ${item.detail}`;li.className=`seo-${item.status.toLowerCase()}`;return li;}));
 status('#seo-status',`${data.checks.filter(item=>item.status==='OK').length}/${data.checks.length} contrôles OK. Diagnostic technique uniquement.`);
}catch(error){status('#seo-status',error.message,true);}}
$('#seo-check').addEventListener('click',seo);
$('#seo-verification-form').addEventListener('submit',async event=>{event.preventDefault();try{await api('/api/admin/seo',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({google:$('#seo-google').value,bing:$('#seo-bing').value})});await seo();status('#seo-status','Codes de vérification enregistrés.');}catch(error){status('#seo-status',error.message,true);}});
async function views(){try{
 const data=await api('/api/admin/page-views');const names={today:"Aujourd’hui",seven:'7 derniers jours',thirty:'30 derniers jours',total:'Depuis activation'};
 $('#views-grid').replaceChildren(...Object.entries(names).map(([key,label])=>{const box=document.createElement('div');const title=document.createElement('span');title.textContent=label;const value=document.createElement('strong');value.textContent=String(data[key]);box.append(title,value);return box;}));
 $('#views-languages').textContent=`FR : ${data.pages['/']?.total||0} pages vues · EN : ${data.pages['/en/']?.total||0} pages vues.`;
 status('#views-status','Statistiques agrégées disponibles.');
}catch(error){status('#views-status',error.message,true);}}
$('#views-refresh').addEventListener('click',views);
pitch();seo();views();
})();
