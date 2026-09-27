// Native dialog keeps the image viewer inside the public FR/EN pages only.
const lightbox = document.querySelector('#image-lightbox');
if (lightbox && typeof lightbox.showModal === 'function') {
  const triggers = [...document.querySelectorAll('.image-zoom')];
  const enlarged = lightbox.querySelector('img');
  const caption = lightbox.querySelector('#lightbox-caption');
  const previous = lightbox.querySelector('.lightbox-prev');
  const next = lightbox.querySelector('.lightbox-next');
  let gallery = [], index = 0, opener = null;

  function display(position) {
    index = (position + gallery.length) % gallery.length;
    const trigger = gallery[index];
    const thumb = trigger.querySelector('img');
    // The largest authored source is sharp even after opening a small thumbnail.
    const sources = thumb.getAttribute('srcset')?.split(',').map(item => item.trim().split(/\s+/u)[0]);
    enlarged.src = sources?.at(-1) || thumb.currentSrc || thumb.src;
    enlarged.alt = thumb.alt;
    const description = trigger.closest('figure')?.querySelector('figcaption')?.textContent.trim();
    caption.textContent = description || '';
    caption.hidden = !description;
    const multiple = gallery.length > 1;
    previous.hidden = !multiple;
    next.hidden = !multiple;
  }

  triggers.forEach(trigger => trigger.addEventListener('click', () => {
    const group = trigger.dataset.gallery;
    gallery = group ? triggers.filter(item => item.dataset.gallery === group) : [trigger];
    opener = trigger;
    display(gallery.indexOf(trigger));
    lightbox.showModal();
    document.body.classList.add('lightbox-open');
    lightbox.querySelector('.lightbox-close').focus();
  }));
  previous.addEventListener('click', () => display(index - 1));
  next.addEventListener('click', () => display(index + 1));
  lightbox.querySelector('.lightbox-close').addEventListener('click', () => lightbox.close());
  lightbox.addEventListener('click', event => {
    if (!event.target.closest('button, img, figcaption')) lightbox.close();
  });
  lightbox.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' && gallery.length > 1) { event.preventDefault(); display(index - 1); }
    if (event.key === 'ArrowRight' && gallery.length > 1) { event.preventDefault(); display(index + 1); }
  });
  lightbox.addEventListener('close', () => {
    document.body.classList.remove('lightbox-open');
    enlarged.removeAttribute('src');
    opener?.focus();
  });
}
