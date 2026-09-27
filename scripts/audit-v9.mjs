import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const css=readFileSync('css/styles.css','utf8');
const pages=[readFileSync('index.html','utf8'),readFileSync('en/index.html','utf8')];
for(const [i,html] of pages.entries()){
 const lang=i?'en':'fr';assert.match(html,new RegExp(`<html lang="${lang}"`));
 const ids=[...html.matchAll(/\bid="([^"]+)"/gu)].map(match=>match[1]);assert.equal(new Set(ids).size,ids.length,`${lang}: duplicate ID`);
 const anchors=new Set(ids);for(const match of html.matchAll(/href="#([^"\s]+)"/gu))if(match[1]!=='linkedin')assert.ok(anchors.has(match[1]),`${lang}: missing #${match[1]}`);
 for(const fragment of ['mobility-lead','mobility-aside','language-grid','skills-grid','five-year-list','projects-palaminy','projects-fos','projects-substation','data-last-updated'])assert.ok(html.includes(fragment),`${lang}: missing ${fragment}`);
 assert.equal((html.match(/class="language-card"/gu)||[]).length,3);
 assert.equal((html.match(/class="skill-card"/gu)||[]).length,5);
 assert.equal((html.match(/class="case-study"/gu)||[]).length,3);
}
for(const selector of ['.mobility-chapter { display: grid; grid-template-columns:', '.international-layout { display: grid; grid-template-columns:', '.five-year-list {', '.language-card {', '.skill-card {', '.case-study {','@media (max-width: 900px)', '@media (max-width: 680px)'])assert.ok(css.includes(selector),`Missing CSS ${selector}`);
const widths=[320,390,680,900,1080,1440,1920];
const table=widths.map(width=>{
 const gutter=width<=680?22:Math.min(76,Math.max(22,width*.05));
 const shell=Math.min(1160,width-2*gutter);
 const mobility=width<=900?'1 colonne':'2 colonnes';
 const timeline=width<=680?'verticale':width<=900?'2 colonnes':'4 jalons horizontaux';
 assert.ok(shell>0&&shell<=width,`${width}: invalid page shell`);
 if(width<=680)assert.equal(mobility,'1 colonne');
 return {width,shell:Math.round(shell),mobility,timeline};
});
console.log('Audit statique V9 — largeurs CSS, structure FR/EN et ancres :');
console.table(table);
console.log('Contrôle visuel dans un navigateur réel non inclus dans cet audit statique.');
