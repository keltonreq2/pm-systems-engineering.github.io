(() => {
  const form = document.querySelector('#contact-form');
  if (!form) return;
  const en = document.documentElement.lang === 'en';
  const status = document.querySelector('#contact-status');
  const button = form.querySelector('button[type="submit"]');
  const messages = en ? {
    sending:'Sending…', success:'Your message has been received. Thank you for getting in touch.',
    invalid:'Please check the fields and use a valid email address.', rate_limit:'Too many attempts. Please try again in 15 minutes.',
    unavailable:'Your message could not be sent. Please try again later.'
  } : {
    sending:'Envoi en cours…', success:'Votre message a bien été reçu. Merci pour votre prise de contact.',
    invalid:'Vérifiez les champs et utilisez une adresse e-mail valide.', rate_limit:'Trop de tentatives. Réessayez dans 15 minutes.',
    unavailable:'Votre message n’a pas pu être envoyé. Réessayez plus tard.'
  };
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (button.disabled || !form.reportValidity()) return;
    button.disabled = true;
    status.classList.remove('is-error');
    status.textContent = messages.sending;
    for (const field of form.querySelectorAll('[aria-invalid]')) field.removeAttribute('aria-invalid');
    try {
      const response = await fetch('/api/contact', { method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify(Object.fromEntries(new FormData(form))), cache:'no-store' });
      const data = response.headers.get('Content-Type')?.includes('application/json') ? await response.json() : {};
      if (!response.ok) {
        if (['name','email','subject','message'].includes(data.field)) {
          const field = form.elements.namedItem(data.field);
          field.setAttribute('aria-invalid','true'); field.setAttribute('aria-describedby','contact-status');
        }
        throw new Error(messages[data.error] || messages.unavailable);
      }
      form.reset(); status.textContent = messages.success;
    } catch (error) { status.classList.add('is-error'); status.textContent = error instanceof TypeError ? messages.unavailable : error.message; }
    finally { button.disabled = false; }
  });
})();
