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
import ConfirmationDialog from '../../components/ConfirmationDialogAdvanced';

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
  const [entity, _entity] = useState([]);

  const [date, _date] = useState(new Date());
  const [thumb, _thumb] = useState(null);
  const [file, _file] = useState(null);
  const [texto, _texto] = useState(null);

  const [toRemove, _toRemove] = useState(null);
  const [toHighlight, _toHighlight] = useState(null);
  const [toHighlight2, _toHighlight2] = useState(null);

  //get commission_data
  const { data } = useQuery(['commission_timeline', { entityId }], {
    queryFn: async () => (await axios.get(`${server}commission/${entityId}/draft/timeline`)).data,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const mutationRemove = useMutation(
    id => {
      return axios.delete(`${server}commission/${entityId}/draft/timeline/${id}`);
    },
    {
      onSuccess: () => queryClient.invalidateQueries(`commission_timeline`),
    },
  );

  useEffect(() => {
    if (!data) return;

    _entity(data);

    // console.log(data)
  }, [data]);

  useEffect(()=>{
    if(toHighlight) {
      setTimeout(()=>{
        document.getElementById(`timeline_${toHighlight}`).scrollIntoView();
        _toHighlight2(toHighlight);
        _toHighlight(null);
        setTimeout(()=>_toHighlight2(null),2000);
      }, 10);
    }
  },[entity, toHighlight])

  useEffect(() => {
    if (thumb) {
      _file(thumb.file)
    } else _file(null);
  }, [thumb])

  const handleInsert = async () => {

    if (!texto || !texto.length) return;

    /* save */
    let data = new FormData();
    if (!!file) data.append('image', file);

    const snackKey = enqueueSnackbar('Gravando...', {
      persist: true,
      anchorOrigin: {
        vertical: 'top',
        horizontal: 'right',
      },
    });

    try {
      let method, url;
      /* edit */
      method = 'post';
      url = `${server}commission/${entityId}/draft/timeline`;
      data.set('entity', JSON.stringify({
        date,
        texto,
      }));

      const { data: response } = await axios({
        method,
        url,
        data,
        config: { headers: { 'Content-Type': 'multipart/form-data' } },
      });

      _toHighlight(response.id);      

      _date(new Date());
      _texto(null);
      _thumb(null);
      _file(null);

      queryClient.invalidateQueries('commission_timeline');

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

  const remove = tlId => () => {
    _toRemove(tlId);
  };

  const handleConfirmation = async action => {
    if (action === 'confirm') await mutationRemove.mutateAsync(toRemove);

    _toRemove(null);
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
                        value={date || ''}
                        onChange={_date}
                        views={['month', 'year']}
                        inputFormat="MM/yyyy"
                      />
                    </div>

                    <div className="col-xs-1">
                      <UploaderField
                        onChange={_thumb}
                        url={thumb?.url}
                        alt="imagem"
                        title="Imagem"
                      />
                    </div>

                    <div className="col-xs-8">
                      <TextField
                        className="input-text"
                        label="Texto"
                        value={texto || ''}
                        onChange={e => _texto(e.target.value)}
                        multiline
                        rows={4}
                      />
                    </div>

                    <div className={`col-xs-1 ${styles['vcentered']}`}>
                      <button className={styles.add} onClick={handleInsert}>
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

                    {!!data && entity.map(e => <div id={`timeline_${e.id}`} key={e.id} className={`${styles.each} ${toHighlight2 === e.id ? styles.highlight : ''}`}>
                      <div className={styles.date}> &#9900; {dayjs(e.date).locale('pt-br').format('MMM [de] YYYY')}</div>

                      <div className={styles.thumb}>

                        <div className={styles['thumb-image']}>
                          {!!e.image && <img src={e.image} alt="imagem de timeline" />}
                          {!e.image && <img src={no_thumb} alt="sem imagem de timeline" />}
                        </div>

                      </div>

                      <div className={styles.text}>{e.texto}</div>

                      <div>
                        <button className={styles.remove} onClick={remove(e.id)}>
                          <Trash></Trash>
                        </button>
                      </div>
                    </div>)}

                  </div>}

                </section>

              </div>
            </Card>


          </div>

          <ConfirmationDialog
            open={!!toRemove}
            content="Confirma a remoção deste item?"
            confirmButtonText="Remover"
            onClose={handleConfirmation}
          />
        </div>
      )}
    </>
  );
}