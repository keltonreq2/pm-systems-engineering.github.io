import {contentField} from './content.js';

export const CAM_REVISION='cam-2026-cep-1';
const marker='cam_2026_cep_applied';
const keys=[
  "project.chapter_1.text",
  "project.chapter_2.period",
  "project.chapter_2.text",
  "project.chapter_3.period",
  "project.chapter_3.text",
  "project.timeline.step_1.title",
  "project.timeline.step_1.text",
  "project.timeline.step_2.date",
  "project.timeline.step_2.title",
  "project.timeline.step_2.text",
  "project.timeline.step_3.title",
  "project.timeline.step_3.text",
  "project.timeline.step_4.date",
  "project.timeline.step_4.title",
  "project.timeline.step_4.text",
  "project.international.narrative",
  "project.mobility_focus.fact_1",
  "project.mobility_focus.fact_2",
  "project.mobility_focus.fact_3",
  "project.mobility_focus.fact_4",
  "project.mobility_focus.fact_5",
  "project.mobility_focus.fact_6",
  "project.international_detail.heading",
  "project.international_detail.country",
  "project.international_detail.organisation",
  "project.international_detail.location",
  "project.international_detail.period",
  "project.international_detail.status",
  "project.international_detail.objective",
  "project.international_detail.skills",
  "project.international_detail.languages",
  "project.international_detail.motivation",
  "project.international_detail.technical_goals",
  "project.international_detail.competencies",
  "project.international_detail.benefits",
  "project.international_detail.language_plan",
  "project.international_detail.five_year_link",
  "project.cep.intro"
];

// The reviewed CAM copy is installed once. The SQL guards also run inside the
// atomic D1 batch, so two first requests cannot overwrite later admin edits.
export async function ensureCamMigration(env) {
  const current=await env.DB.prepare("SELECT value FROM settings WHERE key='cam_2026_cep_applied'").first();
  if(current?.value==='true')return false;
  const rows=[];
  for(const language of ['fr','en'])for(const key of keys) {
    const field=contentField(language,key);
    if(!field)throw new Error('Missing CAM content field');
    rows.push([language,key,field.defaultValue]);
  }
  const statements=[];
  for(let i=0;i<rows.length;i+=18) {
    const chunk=rows.slice(i,i+18);
    const values=chunk.map((_,j)=>`(?${j*3+1},?${j*3+2},?${j*3+3})`).join(',');
    statements.push(env.DB.prepare(`INSERT INTO content_overrides(language,content_key,value,updated_at)
      SELECT column1,column2,column3,unixepoch() FROM (VALUES ${values})
      WHERE NOT EXISTS(SELECT 1 FROM settings WHERE key='${marker}' AND value='true')
      ON CONFLICT(language,content_key) DO UPDATE SET value=excluded.value,updated_at=unixepoch()`)
      .bind(...chunk.flat()));
  }
  statements.push(env.DB.prepare(`INSERT INTO settings(key,value,updated_at)
    SELECT 'cep_protected','true',unixepoch()
    WHERE NOT EXISTS(SELECT 1 FROM settings WHERE key='${marker}' AND value='true')
    ON CONFLICT(key) DO UPDATE SET value='true',updated_at=unixepoch()`));
  statements.push(env.DB.prepare(`INSERT INTO settings(key,value,updated_at)
    VALUES('${marker}','true',unixepoch()) ON CONFLICT(key) DO UPDATE SET value='true',updated_at=unixepoch()`));
  await env.DB.batch(statements);
  return true;
}
