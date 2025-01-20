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

import { Renderer, mapData2Form, getFormData } from '../../components/FormRenderer'

import form from '../../../../../forms/cne/form1.yml'
import form_view from '../../../../../forms/cne/form1_view.yml'
import lists from '../../../../../forms/cne/lists1.yml'

/* style */
// import style from './information.module.scss';

export default function InformationsTab({ entityId, problems }) {
  /* hooks */
  const { server } = useDorothy()
  const queryClient = useQueryClient()
  const { enqueueSnackbar, closeSnackbar } = useSnackbar()

  /* states */
  const [entity, _entity] = useState([])
  const [files, _files] = useState({})

  const [originalEntity, _originalEntity] = useState({})

  //get policy_data
  const { data } = useQuery(['policy_info', { entityId }], {
    queryFn: async () => (await axios.get(`${server}cne/${entityId}/draft/info`)).data,
  })

  useEffect(() => {
    if (data) _originalEntity(data)
  }, [data])

  const handleDataChange = (entity, files) => {
    _entity(entity)
    _files(files)
  }

  const handleSave = async () => {

    /* save */
    const data = getFormData(form, entity, files) // prepare information (Renderer)

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
      url = `${server}cne/${entityId}/draft`;

      /* const { data: response } =  */await axios({
        method,
        url,
        data,
        config: { headers: { 'Content-Type': 'multipart/form-data' } },
      });

      // console.log(response);

      queryClient.invalidateQueries('policy_info')
      queryClient.invalidateQueries('policy_analysis')

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
  }

  if (!data) return <></>

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
                  data={mapData2Form(originalEntity, form)}
                  problems={problems}
                  onDataChange={handleDataChange}
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