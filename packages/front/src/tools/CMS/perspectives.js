import PP_INFO from '../../../../../forms/ppea/form1.yml';
import ING_INFO from '../../../../../forms/iniciativa/form1.yml';
import CIEA_INFO from '../../../../../forms/ciea/form1.yml';

import PP_INDIC from '../PPEAHome/indics2024';
import ING_INDIC from '../IniciativasHome/indics';
import CIEA_INDIC from '../CIEAHome/indics';

export const categories = {
  simple: ['main', 'monitoraea', 'anppea', 'cecsa', 'risco'],
  complex: ['pp', 'ing', 'ciea'],
};

export const infos = {
  pp: PP_INFO,
  ing: ING_INFO,
  ciea: CIEA_INFO,
};

export const trees = {
  pp: PP_INDIC,
  ing: ING_INDIC,
  ciea: CIEA_INDIC,
};

export const cleanField = key => {
  const idx = key.indexOf('.');
  if (idx === -1) return key;
  return key.slice(idx + 1);
};

export const getLAE = data => {
  return data.map(i => ({ id: i.id, title: i.title }));
};

export const getINDICS = data => {
  let result = [];

  for (let d of data) {
    for (let i of d.indics) {
      let indic = {
        id: i.id,
        lae_id: d.id,
        name: i.title,
        base_question: null,
        questions: [],
      };

      for (let q of i.form.fields) {
        if (indic.base_question === null) {
          indic.base_question = q.title;
        } else {
          indic.questions.push({
            id: q.key,
            title: q.title,
          });
        }
      }

      result.push(indic);
    }
  }

  return result;
};

export const getIndicDescription = (key, tree) => {
  let [dimKey, indicKey, questionKey] = key.split('.');
  if (questionKey === 'base') questionKey = '1';

  const dim = tree.find(d => d.id === dimKey);
  const indic = dim.indics.find(i => i.id === indicKey);
  const question = indic.form.fields.find(f => f.key == questionKey);

  return `${dim.title} >> ${indic.title} >> ${question.title}`;
}