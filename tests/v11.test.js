import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {contentCatalog} from '../functions/lib/content-catalog.js';

const css=readFileSync(new URL('../css/styles.css',import.meta.url),'utf8');
test('V11 removes the fixed watermark and inserts one silent header logo per language',()=>{
  assert.doesNotMatch(css,/body::after/u);
  assert.doesNotMatch(css,/background[^;]*logo-watermark/u);
  assert.match(css,/\.header-signature\s*\{[^}]*object-fit: contain;/u);
  assert.match(css,/@media \(max-width: 980px\) \{ \.header-signature \{ display: none;/u);
  for(const file of ['index.html','en/index.html']){
    const html=readFileSync(new URL(`../${file}`,import.meta.url),'utf8');
    const brand=html.indexOf('class="brand"');
    const graphic=html.indexOf('class="header-signature"');
    const navigation=html.indexOf('class="primary-nav"');
    assert.ok(brand>=0&&brand<graphic&&graphic<navigation,`${file}: header order`);
    assert.match(html,/<img class="header-signature"[^>]+alt="" aria-hidden="true"/u);
    assert.equal((html.match(/class="header-signature"/gu)||[]).length,1);
    assert.match(html,/og-pm-systems-engineering\.png/u);
    assert.match(html,/id="image-lightbox"/u);
    assert.match(html,/data-media-key="contact\.rotor"/u);
  }
});

test('V11 justifies only narrative text in wide columns and restores left alignment at narrow widths',()=>{
  const rule=css.match(/@media \(min-width: 901px\) \{\s*([^{}]+)\{\s*text-align: justify;\s*text-justify: inter-word;\s*hyphens: auto;/u);
  assert.ok(rule,'wide narrative rule');
  for(const selector of ['.prose p','.project-copy > p','.experience-copy > p','.career-timeline li','.mobility-lead > p','.language-note > p','.case-study dd'])assert.ok(rule[1].includes(selector));
  for(const short of ['.mentor-card','.objective-card','.skill-card','.language-card','.eyebrow','.button'])assert.ok(!rule[1].split(',').some(selector=>selector.trim()===short),`${short} should stay left`);
  assert.match(css,/@media \(max-width: 900px\) \{[\s\S]*?\.mobility-lead > p:not\(\.eyebrow\)[\s\S]*?text-align: left; hyphens: none;/u);
});

test('V11 Hero title and tagline are bilingual independent admin defaults',()=>{
  const expectations={
    fr:['Ingénierie électrique, systèmes de puissance & protections','Du terrain à l’ingénierie : comprendre, fiabiliser et transmettre.'],
    en:['Electrical Engineering, Power Systems & Protection','From field experience to engineering: understanding systems, improving reliability and sharing knowledge.']
  };
  for(const [language,[title,tagline]] of Object.entries(expectations)){
    const fields=new Map(contentCatalog[language].map(field=>[field.key,field]));
    assert.equal(fields.get('hero.title')?.defaultValue,title);
    assert.equal(fields.get('hero.tagline')?.defaultValue,tagline);
    assert.equal(fields.get('hero.intro')?.defaultValue.length>50,true);
    const html=readFileSync(new URL(`../${language==='fr'?'index.html':'en/index.html'}`,import.meta.url),'utf8');
    assert.ok(html.indexOf('data-content-key="hero.title"')<html.indexOf('data-content-key="hero.tagline"'));
    assert.ok(html.indexOf('data-content-key="hero.tagline"')<html.indexOf('data-content-key="hero.intro"'));
  }
  assert.match(css,/\.hero-tagline\s*\{[^}]*text-align: left;/u);
});
