(() => {
  const container=document.querySelector('#letter-admin-list');
  const state=document.querySelector('#letter-admin-status');
  const api=async(path,method='GET',body)=>{
    const response=await fetch(path,{method,body,cache:'no-store'});
    if(response.status===401){window.location.assign('/admin/login/');throw new Error('Session expirée');}
    const data=await response.json();
    if(!response.ok)throw new Error(data.error||'Opération impossible');
    return data;
  };
  const element=(tag,text)=>{const node=document.createElement(tag);if(text)node.textContent=text;return node;};
  async function refresh(){
    try {
      const data=await api('/api/admin/letters');container.replaceChildren();
      for(const letter of data.letters){
        const group=element('section');group.className='admin-letter-slot';
        const language=letter.language==='en'?'anglais':'français';
        const title=`${letter.employer} · ${language}`;
        group.append(element('h3',title),element('p',letter.available?'PDF enregistré dans le stockage privé.':'Aucun PDF enregistré.'));
        const form=element('form');form.className='admin-upload';
        const label=element('label',`Lettre ${title} (PDF, 10 Mio maximum)`);label.htmlFor=`letter-${letter.id}`;
        const input=element('input');input.type='file';input.id=label.htmlFor;input.accept='application/pdf,.pdf';input.required=true;
        const submit=element('button','Déposer ou remplacer');submit.type='submit';submit.className='admin-button';
        form.append(label,input,submit);
        const message=element('p');message.className='admin-status';message.setAttribute('role','status');message.setAttribute('aria-live','polite');
        form.addEventListener('submit',async event=>{
          event.preventDefault();const file=input.files[0];if(!file)return;
          submit.disabled=true;const body=new FormData();body.set('letter',file);
          try {await api(`/api/admin/letters/${letter.id}`,'PUT',body);await refresh();state.textContent=`Lettre ${title} enregistrée.`;}
          catch(error){message.textContent=error.message;}
          finally{submit.disabled=false;}
        });
        group.append(form,message);
        if(letter.available){
          const actions=element('div');actions.className='admin-inline-actions';
          const preview=element('a',`Télécharger ${title}`);preview.href=`/api/admin/letters/${letter.id}`;preview.className='admin-button admin-button-quiet';
          const remove=element('button','Retirer');remove.type='button';remove.className='admin-button admin-button-danger';
          remove.addEventListener('click',async()=>{
            if(!confirm(`Retirer définitivement la lettre ${title} ?`))return;
            remove.disabled=true;
            try{await api(`/api/admin/letters/${letter.id}`,'DELETE');await refresh();state.textContent=`Lettre ${title} retirée.`;}
            catch(error){message.textContent=error.message;remove.disabled=false;}
          });
          actions.append(preview,remove);group.append(actions);
        }
        container.append(group);
      }
    } catch(error){state.textContent=error.message;}
  }
  refresh();
})();
