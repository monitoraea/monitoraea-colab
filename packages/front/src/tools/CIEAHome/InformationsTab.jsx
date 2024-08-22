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

const emptyFiles = {
  'logo_arquivo': null,
  'documento_criacao_arquivo2': null,
  'regimento_interno_arquivo2': null,
  'ppea_arquivo2': null,
  'ppea2_arquivo2': null,
}

export default function InformationsTab({ entityId }) {
  /* hooks */
  const { server } = useDorothy();
  const queryClient = useQueryClient();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  /* states */
  const [originalEntity, _originalEntity] = useState({});
  const [entity, _entity] = useState({});
  const [files, _files] = useState(emptyFiles);

  //get commission_data
  const { data } = useQuery(['commission_info', { entityId }], {
    queryFn: async () => (await axios.get(`${server}commission/${entityId}/draft`)).data,
    retry: false,
    refetchOnWindowFocus: false,
  });

  // TODO: ABAIXO: responsabilidade do formRenderer?
  // onde digo "responsabilidade do renderer" pode ser responsabilidade de um outro componente controller, fazendo o papel que hoje está com o componente que usa o renderer

  useEffect(() => {
    if (!data || !form) return;

    const mData = mapData2Form(data, form);

    _entity(mData);
    _originalEntity(mData);

    _files(emptyFiles);

    // console.log(data)
  }, [data, form]);

  const handleDataChange = (field, value, iterative /* k = block key, index */) => {
    if (iterative === undefined) { /* campos fora de blocos ou em blocos não iterativos */

      let newEntity = {...entity};

      if(field.includes('tipo') && value === 'link') {
        console.log()

        const mainField = field.replace('_tipo','');
        newEntity = {
          ...newEntity,
          [`${mainField}_arquivo`]: originalEntity[`${mainField}_tipo`] === 'link' ? originalEntity[`${mainField}_arquivo`] : '',
        };
      }

      // handle files
      if (['logo_arquivo', 'documento_criacao_arquivo2', 'regimento_interno_arquivo2', 'ppea_arquivo2', 'ppea2_arquivo2'].includes(field)) {

        newEntity = {
          ...newEntity,
          [field]: value ? value : 'remove',
        };

        _files({ ...files, [field]: value?.file });

      } else {

        newEntity = {
          ...newEntity,
          [field]: value
        };

      }

      console.log(`changing ${field}:`, value, newEntity);

      _entity(newEntity)

    } else { /* campos em blocos iterativos */

      /* TODO: files */

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
    for (let field of block.elements) newEmptyValue[field] = null;

    let newComplexValue;
    if (!entity[block.key]) newComplexValue = [newEmptyValue];
    else newComplexValue = [...entity[block.key], newEmptyValue];

    _entity(entity => ({
      ...entity,
      [block.key]: newComplexValue
    }))
  }

  const handleSave = async () => {

    /* save */
    let data = new FormData();

    if (!!files['logo_arquivo']) data.append('logo', files['logo_arquivo']);
    if (entity.documento_criacao_tipo === 'file' && !!files['documento_criacao_arquivo2']) data.append('documento_criacao', files['documento_criacao_arquivo2']);
    if (entity.regimento_interno_tipo === 'file' && !!files['regimento_interno_arquivo2']) data.append('regimento_interno', files['regimento_interno_arquivo2']);
    if (entity.ppea_tipo === 'file' && !!files['ppea_arquivo2']) data.append('ppea', files['ppea_arquivo2']);
    if (entity.ppea2_tipo === 'file' && !!files['ppea2_arquivo2']) data.append('ppea2', files['ppea2_arquivo2']);

    const snackKey = enqueueSnackbar('Gravando...', {
      /* variant: 'info', */
      /* hideIconVariant: true, */
      persist: true,
      anchorOrigin: {
        vertical: 'top',
        horizontal: 'center',
      },
    });

    try {
      let method, url;
      /* edit */
      method = 'put';
      url = `${server}commission/${entityId}/draft`;
      data.set('entity', JSON.stringify(entity));

      const { data: response } = await axios({
        method,
        url,
        data,
        config: { headers: { 'Content-Type': 'multipart/form-data' } },
      });

      // console.log(response);

      queryClient.invalidateQueries('commission_info');

      // onSave(!_.isEqual(originalEntity, entity));

      closeSnackbar(snackKey);

      enqueueSnackbar('Registro gravado com sucesso!', {
        variant: 'success',
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'center',
        },
      });
    } catch (error) {
      closeSnackbar(snackKey);

      console.error(error);

      enqueueSnackbar('Erro ao gravar o registro!', {
        variant: 'error',
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'center',
        },
      });
    }
  };

  return (
    <>
      {entity && (
        <div className="page-content">
          <div className="page-body">
            <Card middle /*  sx={{ button: { color: 'inherit' } }} */ headerless>
              <div className="p-3">

              <div className="section-header">
                  <div className="section-title"></div>
                  <div className="section-actions">
                    <button className="button-primary" onClick={handleSave}>
                      <FilePlus></FilePlus>
                      Gravar
                    </button>
                  </div>
                </div>

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
                    <button className="button-primary" onClick={handleSave}>
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