import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useDorothy } from 'dorothy-dna-react';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import _ from 'lodash';

/* components */

import Card from '../../components/Card';

// import HelpBoxButton from './HelpBoxButton';
// import GetHelpButton from './GetHelpButton';

import FilePlus from '../../components/icons/FilePlus';

import { Renderer, mapData2Form } from '../../components/FormRenderer'

import form from './form1.yml'
import form_view from './form1_view.yml'
import lists from './lists1.yml'

/* style */
// import style from './information.module.scss';

export default function InformationsTab({ entityId }) {
  /* hooks */
  const { server } = useDorothy();
  const queryClient = useQueryClient();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  /* states */
  const [originalEntity, _originalEntity] = useState([]);
  const [entity, _entity] = useState([]);

  //get commission_data
  const { data } = useQuery(['commission_info', { entityId }], {
    queryFn: async () => (await axios.get(`${server}commission/${entityId}/draft`)).data,
  });

  // TODO: ABAIXO: responsabilidade do formRenderer?

  useEffect(() => {
    if (!data || !form) return;

    // TODO: remove teste composicao_cadeiras_outros
    const mData = mapData2Form(data, form);

    _entity(mData);
    _originalEntity(mData);

    // console.log(data)
  }, [data, form]);
  
  const handleDataChange = (field, value, iterative /* k = block key, index */) => {
    if (iterative === undefined) { /* campos fora de blocos ou em blocos não iterativos */

      _entity(entity => ({
        ...entity,
        [field]: value
      }))

    } else { /* campos em blocos iterativos */

      let complexValue = entity[iterative.k];
      if (!!complexValue && Array.isArray(complexValue)) {
        complexValue[iterative.index][field] = value;

        _entity(entity => ({
          ...entity,
          [iterative.k]: complexValue
        }))

      }
    }
  }

  const handleRemoveIterative = (iterative) => {
    let complexValue = entity[iterative.k];
    complexValue.splice(iterative.index, 1);

    _entity(entity => ({
      ...entity,
      [iterative.k]: complexValue
    }))
  }

  const handleAddIterative = (block) => {

    let newEmptyValue = {};
    for(let field of block.elements) newEmptyValue[field] = null;

    let newComplexValue;
    if(!entity[block.key]) newComplexValue = [newEmptyValue];
    else newComplexValue = [...entity[block.key], newEmptyValue];

    _entity(entity => ({
      ...entity,
      [block.key]: newComplexValue
    }))
  }

  return (
    <>
      {entity && (
        <div className="page-content">
          <div className="page-body">
            <Card middle /*  sx={{ button: { color: 'inherit' } }} */ headerless>
              <div className="p-3">

                <Renderer
                  form={form}
                  view={form_view}
                  lists={lists}
                  data={entity}
                  onDataChange={handleDataChange}
                  onRemoveIterative={handleRemoveIterative}
                  onAddIterative={handleAddIterative}
                />

                <div className="section-header">
                  <div className="section-title"></div>
                  <div className="section-actions">
                    <button className="button-primary" onClick={() => console.log(entity)}> {/* TODO: responsabilidade do Renderer */}
                      <FilePlus></FilePlus>
                      Gravar
                    </button>
                  </div>
                </div>

              </div>

            </Card>

            {/* <Helpbox content={contentText} onClose={() => _contentText(null)} /> */}
          </div>
        </div>
      )}
    </>
  );
}