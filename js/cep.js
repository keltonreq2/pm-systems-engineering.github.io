(() => {
  const english=document.documentElement.lang==='en';
  fetch('/api/public-config',{cache:'no-store'}).then(response=>{
    if(!response.ok)throw new Error();return response.json();
  }).then(config=>{
    if(!config.cepAvailable||!config.cepPublic)return;
    const powerPoint=config.cepFormat==='pptx';
    document.querySelector('#cep-file-actions').hidden=false;
    document.querySelector('#cep-open').hidden=powerPoint;
    document.querySelector('#cep-file-status').textContent=powerPoint
      ? (english?'PowerPoint (.pptx) · download available.':'PowerPoint (.pptx) · téléchargement disponible.')
      : (english?'PDF · open or download.':'PDF · ouverture ou téléchargement.');
  }).catch(()=>{
    document.querySelector('#cep-file-status').textContent=english?'Unable to check the presentation. Please reload the page.':'Impossible de vérifier le diaporama. Merci de recharger la page.';
  });
})();
