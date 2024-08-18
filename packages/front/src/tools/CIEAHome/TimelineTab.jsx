import { useState, useEffect, useCallback, useRef } from 'react';

import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useDorothy } from 'dorothy-dna-react';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import _, { now } from 'lodash';

import dayjs from 'dayjs';
import 'dayjs/locale/pt-br'

/* components */
import Card from '../../components/Card';
import { TextField, Switch, FormGroup, Stack, MenuItem, unstable_useId } from '@mui/material';
import DatePicker from '../../components/DatePicker';
import UploaderField from '../../components/UploaderField';

import Plus from '../../components/icons/plus.svg?react';
import Trash from '../../components/icons/trash.svg?react';
import no_thumb from '../../images/no_thumb.png';

/* styles */
import styles from './timeline.module.scss';

export default function TimelineTab({ entityId }) {
  /* hooks */
  const { server } = useDorothy();
  const queryClient = useQueryClient();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  /* states */
  const [originalEntity, _originalEntity] = useState([]);
  const [entity, _entity] = useState([]);

  //get commission_data
  const { data } = useQuery(['commission_info', { entityId }], {
    queryFn: async () => (await axios.get(`${server}commission/${entityId}/draft/timeline`)).data,
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!data) return;

    _entity(data);
    _originalEntity(data);

    // console.log(data)
  }, [data]);

  /* const handleFieldChange = field => value => {
    _editing(true);

    let newEntityInfo = {};

    if ([
      'documento_criacao_tipo',
      'regimento_interno_tipo',
      'ppea_tipo',
    ].includes(field)) {
      const doc = field.replace('_tipo', '');

      newEntityInfo = {
        ...entity,
        [`${doc}_arquivo`]: originalEntity[`${doc}_tipo`] === value ? originalEntity[`${doc}_arquivo`] : '',
        [field]: value,
      };

    } else newEntityInfo = { ...entity, [field]: value };

    console.log(`changing ${field}:`, value, newEntityInfo);

    _entity(newEntityInfo);
  };

  const handleFileChange = type => value => {

  } */

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

                  <div className="row">
                    <div className={`col-xs-2 ${styles['vcentered']}`}>
                      <DatePicker
                        className="input-datepicker"
                        label="Mês"
                        value={new Date()}
                        onChange={console.log}
                        views={['month', 'year']}
                        inputFormat="MM/yyyy"
                      />
                    </div>

                    <div className="col-xs-1">
                      <UploaderField
                        onChange={console.log}
                        url={null} /* value?.url */
                        alt="imagem"
                        title="Imagem"
                      />
                    </div>

                    <div className="col-xs-8">
                      <TextField
                        className="input-text"
                        label="Texto"
                        value={''}
                        onChange={console.log}
                        multiline
                        rows={4}
                      />
                    </div>

                    <div className={`col-xs-1 ${styles['vcentered']}`}>
                      <button className={styles.add} /* onClick={append} */>
                        <Plus></Plus>
                      </button>
                    </div>
                  </div>

                </section>

              </div>
            </Card>

            <Card middle /*  sx={{ button: { color: 'inherit' } }} */ headerless>
              <div className="p-3">

                <section id="details">

                  {<div className={styles.timeline}>

                    {!!data && entity.map(e => <div key={e.id} className={styles.each}>
                      <div className={styles.date}> &#9900; {dayjs(e.date).locale('pt-br').format('MMM [de] YYYY')}</div>

                      <div className={styles.thumb}>

                        <div className={styles['thumb-image']}>
                          {!!e.image && <img src={e.image} alt="imagem de timeline" />}
                          {!e.image && <img src={no_thumb} alt="sem imagem de timeline" />}
                        </div>

                      </div>

                      <div className={styles.text}>{e.texto}</div>

                      <div>
                        <button className={styles.remove} /* onClick={append} */>
                          <Trash></Trash>
                        </button>
                      </div>
                    </div>)}

                  </div>}

                </section>

              </div>
            </Card>


          </div>
        </div>
      )}
    </>
  );
}