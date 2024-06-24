import { useState, useEffect, useCallback, useRef } from 'react';
import { TextField, Switch, FormGroup, Stack, MenuItem, unstable_useId } from '@mui/material';
import Helpbox from '../CMS/helpbox';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useDorothy } from 'dorothy-dna-react';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import _ from 'lodash';

/* components */
import FilePlus from '../../components/icons/FilePlus';
import Card from '../../components/Card';
import HelpBoxButton from './HelpBoxButton';
import GetHelpButton from './GetHelpButton';
import UploaderField from '../../components/UploaderField';

import GenericMultiple from '../../components/GenericMultiple';

/* style */
import style from './members.module.scss';

export default function MambersTab({ entityId }) {
  /* hooks */
  const { server } = useDorothy();
  const queryClient = useQueryClient();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  /* states */
  const [originalEntity, _originalEntity] = useState([]);
  const [entity, _entity] = useState([]);

  const [editing, _editing] = useState(false);
  const [contentText, _contentText] = useState(null);

  //get commission_data
  const { data } = useQuery(['commission_info', { entityId }], {
    queryFn: async () => (await axios.get(`${server}commission/${entityId}/draft`)).data,
  });

  useEffect(() => {
    if (!data) return;

    _entity(data);
    _originalEntity(data);

    // console.log(data)
  }, [data]);

  const handleFieldChange = field => value => {
    _editing(true);


    let newEntityInfo = {};

    newEntityInfo = { ...entity, [field]: value };

    console.log(`changing ${field}:`, value, newEntityInfo);

    _entity(newEntityInfo);
  };

  const mutationSave = useMutation(
    entity => {
      if (entity) return axios.put(`${server}commission/${entityId}/draft`, entity);
    },
    {
      onSuccess: () => queryClient.invalidateQueries(`commission/${entityId}/draft`),
    },
  );

  const handleSave = async () => {
    _editing(false);

    /* if (entity.nome.trim().length === 0) {
      _errors({ ...errors, nome: true });
      return;
    }

    if (['em_desenvolvimento', 'finalizada', 'interrompida'].includes(entity.status_desenvolvimento) && !entity.mes_inicio) {
      _errors({ ...errors, mes_inicio: true });
      return;
    }

    if (['finalizada', 'interrompida'].includes(entity.status_desenvolvimento) && !entity.mes_fim) {
      _errors({ ...errors, mes_fim: true });
      return;
    } */

    _errors([]);

    const snackKey = enqueueSnackbar('Gravando...', {
      persist: true,
      anchorOrigin: {
        vertical: 'top',
        horizontal: 'right',
      },
    });

    /* save */
    try {
      await mutationSave.mutateAsync(entity);

      // queryClient.invalidateQueries(`project_indics`);

      /* !_.isEqual(originalEntity, entity); */

      closeSnackbar(snackKey);

      enqueueSnackbar('Registro gravado com sucesso!', {
        variant: 'success',
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'right',
        },
      });
    } catch (error) {
      closeSnackbar(snackKey);

      console.error(error);

      enqueueSnackbar('Erro ao gravar o registro!', {
        variant: 'error',
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'right',
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

                <section id="details">
                  <div className="section-header">
                    <div className="section-title"></div>
                    <div className="section-actions">
                      <GetHelpButton tab="timeline" />

                      <button className="button-primary" onClick={() => handleSave()}>
                        <FilePlus></FilePlus>
                        Gravar
                      </button>
                    </div>
                  </div>

                  <GenericMultiple
                    data={entity.members}
                    newData={{
                      nome: '',
                      segmento: '',
                      instituicao: '',
                      contato: '',
                      municipio: null,
                    }}
                    addtitle="Adicionar membro"
                    addtype='bottom'
                    onChange={handleFieldChange('members')}
                  >
                    <Member />
                  </GenericMultiple>

                </section>

              </div>
            </Card>

            <Helpbox content={contentText} onClose={() => _contentText(null)} />
          </div>
        </div>
      )}
    </>
  );
}

function Member({ row, DefaultRemove, handleChange, /*, handleRemove, index */ }) {
  return <>
    <div className="row">
      <div className="col-xs-3" style={{ display: 'flex' }}>
        <TextField
          className="input-text"
          label="Nome"
          value={row.nome || ''}
          onChange={(e) => handleChange('nome')(e.target.value)}
        />
      </div>
      <div className="col-xs-2" style={{ display: 'flex' }}>
        <TextField
          className="input-text"
          label="Segmento"
          value={row.segmento || ''}
          onChange={(e) => handleChange('segmento')(e.target.value)}
        />
      </div>
      <div className="col-xs-2" style={{ display: 'flex' }}>
        <TextField
          className="input-text"
          label="instituicao"
          value={row.instituicao || ''}
          onChange={(e) => handleChange('instituicao')(e.target.value)}
        />
      </div>
      <div className="col-xs-2" style={{ display: 'flex' }}>
        <TextField
          className="input-text"
          label="Contato"
          value={row.contato || ''}
          onChange={(e) => handleChange('contato')(e.target.value)}
        />
      </div>
      <div className="col-xs-2" style={{ display: 'flex' }}>
        <TextField
          className="input-text"
          label="Municipio"
          value={''}
          disabled
          onChange={console.log}
        />
      </div>
      <div className="col-xs-1" style={{ display: 'flex' }}>
        {DefaultRemove}
      </div>

    </div>
  </>
}