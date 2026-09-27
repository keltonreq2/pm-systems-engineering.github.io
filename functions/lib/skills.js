export const proofLabels={
 fr:{'protection-training':'Protections & formation','field-inspection':'Inspection & diagnostic','projects-substation':'Poste électrique','projects-palaminy':'Palaminy','projects-fos':'Fos',career:'Parcours'},
 en:{'protection-training':'Protection & training','field-inspection':'Field inspection','projects-substation':'Substation','projects-palaminy':'Palaminy','projects-fos':'Fos',career:'Career'}
};
export const defaultSkills={
 protection:['protection-training','field-inspection','projects-substation'],
 automation:['projects-palaminy','projects-fos'],
 diagnosis:['field-inspection'],
 teaching:['protection-training'],
 systems:['career','projects-substation']
};
export const validSkill=key=>Object.hasOwn(defaultSkills,key);
export const validProofs=value=>Array.isArray(value)&&value.length>=1&&value.length<=6&&new Set(value).size===value.length&&value.every(key=>typeof key==='string'&&Object.hasOwn(proofLabels.fr,key));
export const normalizedSkill=(row,key)=>({key,proofs:(()=>{try{const parsed=JSON.parse(row?.proofs_json);return validProofs(parsed)?parsed:defaultSkills[key];}catch{return defaultSkills[key];}})(),visible:row?.visible!==0});
