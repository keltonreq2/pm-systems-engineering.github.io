(() => {
  const $ = selector => document.querySelector(selector);
  const node = (tag, text, className) => {
    const el = document.createElement(tag);
    if (text !== undefined) el.textContent = text;
    if (className) el.className = className;
    return el;
  };
  const button = (text, quiet = true) => { const el=node('button',text,`admin-button${quiet ? ' admin-button-quiet' : ''}`);el.type='button';return el; };
  const announce = (target, message, error = false) => { target.textContent=message;target.classList.toggle('is-error',error); };
  const date = seconds => new Date(seconds*1000).toLocaleString('fr-FR');
  async function api(url, method = 'GET', body) {
    const response=await fetch(url,{method,cache:'no-store',headers:body ? {'Content-Type':'application/json'} : {},body:body ? JSON.stringify(body) : undefined});
    if(response.status===401){window.location.replace('/admin/login/');throw new Error('Session expirée.');}
    const data=response.headers.get('Content-Type')?.includes('application/json') ? await response.json() : {};
    if(!response.ok)throw new Error(data.error || 'Service indisponible.');
    return data;
  }

  let page=1, busy=false;
  async function loadMessages() {
    if(busy)return;
    busy=true;
    const status=$('#messages-status');
    const focused=document.activeElement;
    const focusWasInList=$('#message-list').contains(focused);
    announce(status,'Chargement…');
    try {
      const data=await api(`/api/admin/messages?page=${page}`);
      if(page>1 && !data.messages.length){page-=1;busy=false;return loadMessages();}
      $('#unread-count').textContent=`${data.unread} non lu${data.unread>1?'s':''}`;
      const list=$('#message-list');list.replaceChildren();
      for(const message of data.messages){
        const details=node('details',undefined,`message-card${message.read_at ? '' : ' is-unread'}`);
        const summary=node('summary',`${message.read_at ? 'Lu' : 'Non lu'} · ${message.subject}`);
        details.append(summary,node('p',`${message.name} · ${date(message.created_at)}`,'admin-help'));
        const email=node('p',message.email,'message-email');
        const text=node('p',message.message,'message-text');
        const actions=node('div',undefined,'admin-inline-actions');
        const reply=node('a','Répondre par e-mail','admin-button admin-button-quiet');
        reply.href=`mailto:${encodeURIComponent(message.email)}?subject=${encodeURIComponent('Re: '+message.subject)}`;
        const toggle=button(message.read_at?'Marquer non lu':'Marquer comme lu');
        const remove=button('Supprimer');remove.classList.add('admin-button-danger');
        async function mutate(method,body){
          toggle.disabled=remove.disabled=true;
          try{await api(`/api/admin/messages/${encodeURIComponent(message.id)}`,method,body);await loadMessages();}
          catch(error){announce(status,error.message,true);toggle.disabled=remove.disabled=false;}
        }
        toggle.addEventListener('click',()=>mutate('PATCH',{read:!message.read_at}));
        remove.addEventListener('click',()=>{if(window.confirm('Supprimer définitivement ce message ?'))mutate('DELETE');});
        actions.append(reply,toggle,remove);details.append(email,text,actions);list.append(details);
      }
      $('#messages-page').textContent=`Page ${page} / ${Math.max(1,Math.ceil(data.total/20))}`;
      $('#previous-messages').disabled=page<=1;
      $('#next-messages').disabled=page*20>=data.total;
      announce(status,data.total ? `${data.total} message${data.total>1?'s':''}.`:'Aucun message pour le moment.');
      if(focusWasInList)$('#refresh-messages').focus();
    }catch(error){announce(status,error.message,true);}
    finally{busy=false;}
  }
  $('#refresh-messages').addEventListener('click',loadMessages);
  $('#previous-messages').addEventListener('click',()=>{if(!busy){page--;loadMessages();}});
  $('#next-messages').addEventListener('click',()=>{if(!busy){page++;loadMessages();}});

  const sections = {
    hero:['Accueil / Hero','home'], profile:['Profil','profile'], expertise:['Expertise','expertise'],projects:['Projets','projects'],
    inspection:['Inspection, diagnostic et dépannage','field-inspection'], training:['Protections & formation technique','protection-training'],
    career:['Parcours & formations','career'], mentors:['Mentors','mentors'],objectives:['Objectifs','objectives'],project:['Projet professionnel / CEP','objectives'],skills:['Compétences & preuves','skills'],personality:['Personnalité & ouverture','about'],contact:['Contact','contact']
  };
  const groups={systems:'Systèmes',protection:'Protections',teaching:'Transmission',palaminy:'Palaminy · dégrilleur',fos:'Fos',substation:'Poste électrique',lessons:'Enseignements',technical:'Expertise technique',step_1:'2010–2013',step_2:'2013–2022',step_3:'2022–aujourd’hui',step_4:'Études ENSEEIHT',bac:'Bac',bts:'BTS',engineering:'École d’ingénieur',mentor_1:'Mentor 1',mentor_2:'Mentor 2',mentor_3:'Mentor 3',short_term:'Aujourd’hui',medium_term:'Moyen terme',long_term:'Long terme',curiosity:'Curiosité',adaptation:'Adaptation',rigour:'Rigueur',savate:'Savate',travel:'Voyages et montagne'};
  let language='fr';
  const dirty=new Set();
  let loading=false;
  async function loadContent(){
    if(loading)return;
    loading=true;
    const select=$('#content-language');select.disabled=true;
    const status=$('#content-status');announce(status,'Chargement des textes…');
    const selected=language;
    $('#content-editor').replaceChildren();
    const base=selected==='en'?'/en/':'/';
    $('#content-preview').href=base;
    try{
      const data=await api(`/api/admin/content?language=${selected}`);
      const editor=$('#content-editor');editor.replaceChildren();dirty.clear();
      for(const [prefix,[title,anchor]] of Object.entries(sections)){
        const fields=data.fields.filter(field=>field.key.startsWith(prefix+'.'));
        const section=node('details',undefined,'content-section');section.append(node('summary',title));
        const preview=node('a','Prévisualiser cette section','section-preview');preview.href=base+'#'+anchor;preview.target='_blank';preview.rel='noopener noreferrer';section.append(preview);
        for(const field of fields){
          const form=node('form',undefined,'content-field');
          const parts=field.key.split('.');const group=parts.length>2 ? (groups[parts.at(-2)] || '') : '';
          const label=node('label',`${group ? group+' · ' : ''}${field.label}`);
          const id=`content-${selected}-${field.key.replaceAll('.','-')}`;label.htmlFor=id;
          const input=node(field.multiline?'textarea':'input');input.id=id;input.value=field.value;input.maxLength=field.maxLength;input.required=true;
          if(field.multiline)input.rows=field.value.length>180?5:3;else input.type='text';
          const state=node('p',field.overridden ? `Personnalisé · ${date(field.updatedAt)}` : 'Texte par défaut','admin-status');state.id=id+'-status';state.setAttribute('aria-live','polite');input.setAttribute('aria-describedby',state.id);
          const actions=node('div',undefined,'admin-inline-actions');const save=button('Enregistrer',false);save.type='submit';save.disabled=true;
          const restore=button('Restaurer le texte par défaut');restore.disabled=!field.overridden;
          let saved=field.value, overridden=field.overridden, saving=false;
          input.addEventListener('input',()=>{if(input.value!==saved){dirty.add(field.key);announce(state,'Modifications non enregistrées');}else{dirty.delete(field.key);announce(state,overridden?'Texte personnalisé enregistré':'Texte par défaut');}save.disabled=input.value===saved;restore.disabled=!overridden && !dirty.has(field.key);});
          async function persist(reset){
            if(saving)return;
            saving=true;select.disabled=true;
            save.disabled=restore.disabled=true;input.readOnly=true;
            try{
              const result=await api('/api/admin/content',reset?'DELETE':'PUT',{language:selected,key:field.key,...(reset?{}:{value:input.value})});
              input.value=saved=result.value;overridden=result.overridden;dirty.delete(field.key);
              announce(state,reset?'Texte par défaut restauré.':'Enregistré · '+new Date().toLocaleTimeString('fr-FR'));
            }catch(error){announce(state,error.message,true);}
            finally{saving=false;select.disabled=false;input.readOnly=false;save.disabled=input.value===saved;restore.disabled=!overridden && !dirty.has(field.key);}
          }
          form.addEventListener('submit',event=>{event.preventDefault();persist(false);});
          restore.addEventListener('click',()=>{if(window.confirm('Restaurer ce texte par défaut ? La personnalisation de ce champ sera supprimée.'))persist(true);});
          actions.append(save,restore);form.append(label,input,state,actions);section.append(form);
        }
        editor.append(section);
      }
      announce(status,`${selected==='fr'?'FRANÇAIS':'ENGLISH'} · ${data.fields.length} textes modifiables.`);
    }catch(error){announce(status,error.message,true);}
    finally{loading=false;select.disabled=false;}
  }
  $('#content-language').addEventListener('change',event=>{
    if(dirty.size && !window.confirm('Changer de langue sans enregistrer les textes modifiés ?')){event.target.value=language;return;}
    language=event.target.value;loadContent();
  });
  window.addEventListener('beforeunload',event=>{if(dirty.size){event.preventDefault();event.returnValue='';}});
  loadMessages();loadContent();
})();
