const menuButton = document.querySelector(".menu-toggle");
const primaryNav = document.querySelector("#primary-nav");

if (menuButton && primaryNav) {
  const closeMenu = (returnFocus = false) => {
    menuButton.setAttribute("aria-expanded", "false");
    primaryNav.classList.remove("is-open");
    if (returnFocus) menuButton.focus();
  };

  menuButton.addEventListener("click", () => {
    const isOpen = menuButton.getAttribute("aria-expanded") === "true";
    menuButton.setAttribute("aria-expanded", String(!isOpen));
    primaryNav.classList.toggle("is-open", !isOpen);
  });

  primaryNav.addEventListener("click", (event) => {
    const link = event.target.closest("a");
    if (link && !link.hasAttribute("data-language-switch")) closeMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menuButton.getAttribute("aria-expanded") === "true") closeMenu(true);
  });
}

document.querySelectorAll("[data-language-switch]").forEach((link) => {
  link.addEventListener("click", (event) => {
    if (!window.location.hash) return;
    event.preventDefault();
    window.location.assign(`${link.href}${window.location.hash}`);
  });
});

const actionStatus = document.querySelector("#action-status");
let cvProtected=false,cepProtected=false,cvUnlocked=false,pendingDocument=null;
let lettersUnlocked=false;
let grantScopes={fr:false,en:false,cep:false};
const professionalActions = [...document.querySelectorAll("[data-professional-action]")];
const actionsFor = (action) => professionalActions.filter((item) => item.dataset.professionalAction === action);
const pageLanguage = document.documentElement.lang === "en" ? "en" : "fr";
const actionMessages = {
  fr: {
    linkedin: "Le lien LinkedIn n’est pas encore configuré.",
    "cv-fr": "Le CV français n’est pas encore disponible.",
    "cv-en": "Le CV anglais n’est pas encore disponible.",
    cep: "L’accès CEP est indisponible pour le moment."
  },
  en: {
    linkedin: "The LinkedIn link has not been configured yet.",
    "cv-fr": "The French CV is not available yet.",
    "cv-en": "The English CV is not available yet.",
    cep: "CEP access is currently unavailable."
  }
};

const showActionMessage = (message) => {
  if (!actionStatus) return;
  actionStatus.textContent = message;
  actionStatus.hidden = false;
  window.clearTimeout(showActionMessage.timeout);
  showActionMessage.timeout = window.setTimeout(() => { actionStatus.hidden = true; }, 5000);
};

professionalActions.forEach((link) => {
  link.addEventListener("click", (event) => {
    const action = link.dataset.professionalAction;
    if (!link.dataset.configured) {
      event.preventDefault();
      showActionMessage(actionMessages[pageLanguage][action] || (pageLanguage==='en'?'This cover letter is unavailable.':'Cette lettre est indisponible.'));
    }
  });
});

const cvDialog=document.querySelector('#cv-access-dialog');
const cvForm=document.querySelector('#cv-access-form');
const codeInput=document.querySelector('#cv-access-code');
let originatingLink=null;
document.addEventListener('click',event=>{
  const link=event.target.closest('a[data-professional-action],a[data-cep-link]');
  if(!link?.dataset.configured||cvUnlocked)return;
  const action=link.dataset.professionalAction;
  const scope=action==='cv-fr'?'fr':action==='cv-en'?'en':(action==='cep'||link.hasAttribute('data-cep-link'))?'cep':null;
  const needsCode = action?.startsWith('letter-')
    ? !lettersUnlocked
    : !grantScopes[scope] && ((scope === 'fr' || scope === 'en') ? cvProtected : scope === 'cep' && (action === 'cep' || cepProtected));
  if(needsCode){
    event.preventDefault();pendingDocument=link.href;originatingLink=link;
    document.querySelector('#cv-dialog-title').textContent=action==='cep'
      ? (pageLanguage==='en'?'CEP access code':'Code d’accès au CEP')
      : (pageLanguage==='en'?'Document access code':'Code d’accès aux documents');
    cvDialog?.showModal();codeInput?.focus();
  }
});
cvDialog?.addEventListener('close',()=>{codeInput.value='';document.querySelector('#cv-access-error').textContent='';originatingLink?.focus();});
document.querySelector('#cv-access-cancel')?.addEventListener('click',()=>cvDialog.close());
cvForm?.addEventListener('submit',async event=>{
  event.preventDefault();const submit=cvForm.querySelector('[type=submit]');submit.disabled=true;
  const error=document.querySelector('#cv-access-error');error.textContent='';
  try{
    const response=await fetch('/api/cv/unlock',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code:codeInput.value}),cache:'no-store'});
    if(!response.ok){const data=await response.json();throw new Error(data.error||'Access unavailable');}
    cvUnlocked=true;const target=pendingDocument;cvDialog.close();if(target)window.location.assign(target);
  }catch(cause){error.textContent=cause.message;codeInput.focus();}finally{submit.disabled=false;}
});

fetch("/api/public-config", { headers: { Accept: "application/json" }, cache: "no-store" })
  .then((response) => {
    if (!response.ok) throw new Error("Public configuration unavailable");
    return response.json();
  })
  .then((config) => {
    cvProtected=Boolean(config.cvProtected);
    cvUnlocked=Boolean(config.cvUnlocked);
    cepProtected=Boolean(config.cepProtected);
    if (config.linkedinUrl) {
      for (const link of actionsFor("linkedin")) {
        link.href = config.linkedinUrl;
        link.hidden = false;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.dataset.configured = "true";
      }
    }
    const cvFrAvailable = config.cvFrAvailable ?? config.cvAvailable ?? false;
    if (cvFrAvailable) {
      for (const link of actionsFor("cv-fr")) {
        link.href = "/api/cv";
        link.dataset.configured = "true";
      }
    }
    if (config.cvEnAvailable) {
      for (const link of actionsFor("cv-en")) {
        link.href = "/api/cv/en";
        link.dataset.configured = "true";
      }
    }
    for(const link of professionalActions.filter(item=>item.dataset.professionalAction.startsWith('letter-') && item.id!=='letter-unlock')){
      const id=link.dataset.professionalAction.slice(7);
      const available=Boolean(config.lettersAvailable?.[id]);
      link.hidden=!available;
      if(available)link.dataset.configured='true';
    }
    lettersUnlocked=Boolean(config.lettersUnlocked);
    const letterUnlock=document.querySelector('#letter-unlock');
    if(letterUnlock){letterUnlock.hidden=lettersUnlocked;letterUnlock.dataset.configured='true';}
    const letterStatus=document.querySelector('#letter-status');
    if(letterStatus){
      const count=Object.values(config.lettersAvailable||{}).filter(Boolean).length;
      letterStatus.textContent=count===4
        ? (pageLanguage==='en'?'Four cover letters available · PDF.':'Quatre lettres disponibles · PDF.')
        : !lettersUnlocked
          ? (pageLanguage==='en'?'Use the CV access code to view the cover letters.':'Utilisez le code des CV pour accéder aux lettres.')
          : (pageLanguage==='en'?'Some cover letters have not been made available yet.':'Certaines lettres ne sont pas encore disponibles.');
    }
    for(const link of actionsFor('cep'))link.dataset.configured='true';
    if(config.cepAvailable&&config.cepPublic){
      for(const link of document.querySelectorAll('[data-cep-link]'))link.dataset.configured='true';
    }
  })
  .catch(() => {
    professionalActions.forEach((link) => { delete link.dataset.configured; });
    const status=document.querySelector('#letter-status');
    if(status)status.textContent=pageLanguage==='en'?'Unable to check cover letters. Please reload the page.':'Impossible de vérifier les lettres. Merci de recharger la page.';
  });
fetch('/api/access/status',{cache:'no-store'}).then(response=>response.ok?response.json():null).then(data=>{
  if(!data)return;grantScopes=data;
  if(data.cep)for(const link of document.querySelectorAll('[data-cep-link]'))link.dataset.configured='true';
}).catch(()=>{});
