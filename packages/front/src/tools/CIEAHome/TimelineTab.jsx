import { useState, useEffect, useCallback, useRef } from 'react';

import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useDorothy } from 'dorothy-dna-react';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import _, { now } from 'lodash';

import dayjs from 'dayjs';
import 'dayjs/locale/pt-br'

/* components */
import FilePlus from '../../components/icons/FilePlus';
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
    queryFn: async () => (await axios.get(`${server}commission/${entityId}/draft`)).data,
  });

  useEffect(() => {
    if (!data) return;

    // _entity(data);
    // fake data
    _entity([
      {
        id: 1,
        date: dayjs('2023-05-01'),
        texto: `Curabitur arcu dolor, vulputate vitae purus a, feugiat commodo lacus. Nam hendrerit a nisl a feugiat. Nulla ipsum erat, fermentum aliquet rutrum id, dignissim vitae mi. Suspendisse sodales nisi libero, in efficitur nibh ornare sed. Aliquam vitae arcu vitae dui pretium blandit. Suspendisse sapien dolor, congue sit amet lectus vitae, convallis tempor tellus. Phasellus imperdiet libero mauris, ut dictum ante gravida eget. In id felis quam.`,
        image: 'https://images.pexels.com/photos/7551762/pexels-photo-7551762.jpeg',
      },

      {
        id: 2,
        date: dayjs('2023-07-01'),
        texto: `Pellentesque ac malesuada magna. Fusce at magna elit. Fusce lacinia nunc id neque feugiat, ut porta magna euismod. Ut sed odio sit amet leo efficitur suscipit. Proin maximus luctus felis, nec vehicula est fermentum finibus. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Nullam augue ante, fermentum non ex eu, bibendum posuere nibh. Sed euismod nisl sit amet ipsum molestie, vel bibendum velit pellentesque. Quisque ut placerat mauris.Fusce lacinia nunc id neque feugiat, ut porta magna euismod. Ut sed odio sit amet leo efficitur suscipit. Proin maximus luctus felis, nec vehicula est fermentum finibus. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Nullam augue ante, fermentum non ex eu, bibendum posuere nibh. Sed euismod nisl sit amet ipsum molestie, vel bibendum velit pellentesque. Quisque ut placerat mauris.`,
        image: 'https://as2.ftcdn.net/v2/jpg/02/70/96/71/1000_F_270967198_bjVDtAtUWi1bKqFaFs0TG3IzqpI1ne9E.jpg',
      },

      {
        id: 3,
        date: dayjs('2024-01-01'),
        texto: `Maecenas lectus erat, feugiat sed turpis nec, convallis accumsan justo. Fusce nulla tellus, vehicula nec erat eget, eleifend vestibulum magna. Ut sem urna, consequat ac pellentesque ac, rutrum id purus. Aliquam ornare venenatis vehicula. Pellentesque fermentum justo id orci auctor vulputate.`,
      },

    ]);
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
                  <div className="section-header">
                    <div className="section-title"></div>
                    <div className="section-actions">
                      {/* <GetHelpButton tab="timeline" /> */}

                      <button className="button-primary" onClick={() => handleSave()}>
                        <FilePlus></FilePlus>
                        Gravar
                      </button>
                    </div>
                  </div>

                  <div className={styles.timeline}>

                    {entity.map(e => <div key={e.id} className={styles.each}>
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

                  </div>

                </section>

              </div>
            </Card>


          </div>
        </div>
      )}
    </>
  );
}