import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {mediaCatalog} from '../functions/lib/media-catalog.js';
import {contentCatalog} from '../functions/lib/content-catalog.js';

test('V10 exposes the rotor below professional links, an editable photo and a viewer in both languages', () => {
  for (const page of ['index.html', 'en/index.html']) {
    const html=readFileSync(new URL(`../${page}`,import.meta.url),'utf8');
    const actions=html.indexOf('class="contact-actions"');
    const photo=html.indexOf('data-media-key="contact.rotor"');
    const form=html.indexOf('id="contact-form"');
    assert.ok(actions<photo && photo<form);
    assert.equal((html.match(/data-gallery="projects"/gu)||[]).length,3);
    assert.equal((html.match(/class="image-zoom"/gu)||[]).length,8);
    assert.match(html,/data-content-key="contact\.rotor_caption"/u);
    assert.match(html,/id="image-lightbox"/u);
    assert.match(html,/js\/lightbox\.js" defer/u);
  }
  assert.ok(existsSync(new URL('../assets/images/contact-rotor.jpg',import.meta.url)));
  assert.ok(existsSync(new URL('../assets/images/logo-watermark.png',import.meta.url)));
  assert.equal(mediaCatalog['contact.rotor'].src,'assets/images/contact-rotor.jpg');
  for(const language of ['fr','en']) assert.ok(contentCatalog[language].some(entry=>entry.key==='contact.rotor_caption'));
});

test('V10 lightbox opens full image, navigates the project gallery and closes on outside click', () => {
  class Element {
    constructor() {this.events=new Map();this.hidden=false;this.dataset={};this.focused=false;}
    addEventListener(name,handler) {this.events.set(name,handler);}
    dispatch(name,event={}) {this.events.get(name)?.({target:this,preventDefault(){},...event});}
    focus() {this.focused=true;}
  }
  const photo=(src,alt,caption,group)=>{
    const button=new Element();button.dataset.gallery=group;
    button.querySelector=()=>({src,currentSrc:src,alt,getAttribute:()=>null});
    button.closest=()=>({querySelector:()=>({textContent:caption})});
    return button;
  };
  const [first,second,rotor]=[
    photo('/one.webp','First project','First caption','projects'),
    photo('/two.webp','Second project','Second caption','projects'),
    photo('/rotor.jpg','In the rotor','Rotor caption',undefined)
  ];
  const image={src:'',alt:'',removeAttribute(name){if(name==='src')this.src='';}};
  const caption={textContent:'',hidden:false};
  const previous=new Element(),next=new Element(),close=new Element();
  const dialog=new Element();dialog.open=false;
  dialog.showModal=()=>{dialog.open=true;};
  dialog.close=()=>{dialog.open=false;dialog.dispatch('close');};
  dialog.querySelector=selector=>({img:image,'#lightbox-caption':caption,'.lightbox-prev':previous,'.lightbox-next':next,'.lightbox-close':close})[selector];
  const body={classList:{add(){},remove(){}}};
  const document={body,querySelector:()=>dialog,querySelectorAll:()=>[first,second,rotor]};
  runInNewContext(readFileSync(new URL('../js/lightbox.js',import.meta.url),'utf8'),{document});
  first.dispatch('click');assert.equal(dialog.open,true);assert.equal(image.src,'/one.webp');assert.equal(caption.textContent,'First caption');assert.equal(next.hidden,false);
  next.dispatch('click');assert.equal(image.src,'/two.webp');
  dialog.dispatch('keydown',{key:'ArrowLeft'});assert.equal(image.src,'/one.webp');
  dialog.dispatch('click',{target:{closest:()=>null}});assert.equal(dialog.open,false);assert.equal(first.focused,true);
  rotor.dispatch('click');assert.equal(image.alt,'In the rotor');assert.equal(previous.hidden,true);assert.equal(next.hidden,true);
  close.dispatch('click');assert.equal(dialog.open,false);assert.equal(rotor.focused,true);
});
