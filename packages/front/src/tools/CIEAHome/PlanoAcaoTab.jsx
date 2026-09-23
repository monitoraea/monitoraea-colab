import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useDorothy, useUser } from 'dorothy-dna-react';
import axios from 'axios';
import { useSnackbar } from 'notistack';

import { CMS_COMMUNITY } from '../../utils/configs.jsx';

/* components */

import Card from '../../components/Card';

import FilePlus from '../../components/icons/FilePlus';

import { Renderer, mapData2Form, getFormData } from '../../components/FormRenderer';

import form from '../../../../../forms/ciea/form2.yml';
import form_view from '../../../../../forms/ciea/form2_view.yml';
import lists from '../../../../../forms/ciea/lists1.yml';

export default function PlanoAcaoTab({ entityId }) {
  /* hooks */
  const { server } = useDorothy();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  /* states */
  const [entity, _entity] = useState({});
  const [files, _files] = useState({});
  const [originalEntity, _originalEntity] = useState({});

  //get commission_data
  const { data } = useQuery(['commission_info', { entityId }], {
    queryFn: async () => (await axios.get(`${server}commission/${entityId}/draft`)).data,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const { data: content } = useQuery([`content_for_form_plano_acao`], {
    queryFn: async () => (await axios.get(`${server}content/for_form/ciea/ciea/plano_acao`)).data,
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (data) _originalEntity(data);
  }, [data]);

  const handleDataChange = (entity, files) => {
    _entity(entity);
    _files(files);
  };

  const handleSave = async () => {
    /* save */
    const data = getFormData(form, entity, files); // prepare information (Renderer)

    const snackKey = enqueueSnackbar('Gravando...', {
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

      await axios({
        method,
        url,
        data,
        config: { headers: { 'Content-Type': 'multipart/form-data' } },
      });

      queryClient.invalidateQueries('commission_info');
      queryClient.invalidateQueries('ciea_analysis');

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

  if (!data) return <></>;

  return (
    <>
      {entity && (
        <div className="page-content">
          <div className="page-body">
            <Card middle headerless>
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
                  data={mapData2Form(originalEntity, form)}
                  onDataChange={handleDataChange}
                  helpbox={{
                    isADM: user.membership.find(m => m.id === CMS_COMMUNITY),
                    content,
                    prefix: 'ciea.',
                    type: 'plano_acao',
                  }}
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
          </div>
        </div>
      )}
    </>
  );
}
