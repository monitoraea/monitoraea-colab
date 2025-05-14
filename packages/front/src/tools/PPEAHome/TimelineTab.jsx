import { useState, useEffect, useCallback, useRef, Fragment } from 'react';

import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useDorothy } from 'dorothy-dna-react';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import _, { entries, now } from 'lodash';

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
import Edit from '../../components/icons/edit-2.svg?react';
import Cancel from '../../components/icons/x.svg?react';
import Save from '../../components/icons/save.svg?react';
import no_thumb from '../../images/no_thumb.png';

/* styles */
import styles from './timeline.module.scss';

export default function TimelineTab({ entityId }) {
  /* hooks */
  const { server } = useDorothy();
  const queryClient = useQueryClient();

  /* states */
  const [entity, _entity] = useState([]);

  const [toRemove, _toRemove] = useState(null);
  const [toHighlight, _toHighlight] = useState(null);
  const [toHighlight2, _toHighlight2] = useState(null);

  const [editing, _editing] = useState(null);

  //get ppea_data
  const { data } = useQuery(['ppea_timeline', { entityId }], {
    queryFn: async () => (await axios.get(`${server}ppea/${entityId}/draft/timeline`)).data,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const mutationRemove = useMutation(
    id => {
      return axios.delete(`${server}ppea/${entityId}/draft/timeline/${id}`);
    },
    {
      onSuccess: () => queryClient.invalidateQueries(`ppea_timeline`),
    },
  );

  useEffect(() => {
    if (!data) return;

    _entity(data);

    // console.log(data)
  }, [data]);

  useEffect(() => {
    if (toHighlight) {
      setTimeout(() => {
        const el = document.getElementById(`timeline_${toHighlight}`);
        if (!el) return;

        el.scrollIntoView({ block: "end", inline: "nearest" });
        _toHighlight2(toHighlight);
        _toHighlight(null);
        setTimeout(() => _toHighlight2(null), 2000);
      }, 10);
    }
  }, [entity, toHighlight])

  const remove = tlId => () => {
    _toRemove(tlId);
  };

  const edit = tlId => () => {

    const editingEntity = entity.find(e => e.id === tlId);
    if (!!editingEntity) _editing(editingEntity);
  }

  const cancelEdit = () => {
    _editing(null);
  }

  const handleConfirmation = async action => {
    if (action === 'confirm') await mutationRemove.mutateAsync(toRemove);

    _toRemove(null);
  };

  const handleEditCancel = () => {
    _editing(null);
  }
  const handleEditSave = () => {
    _editing(null);
  }

  return (
    <>
      {entity && (
        <div className="page-content">
          <div className="page-body">
            <Card middle headerless>
              <div className="p-3">
                <section id="details">
                  A linha do tempo é uma ferramenta para a apresentação e o registro dos principais marcos/eventos da iniciativa.
Insira o mês/ano em que o marco/evento aconteceu, uma imagem ilustrativa (pode ser uma fotografia real ou um ícone/desenho) e um texto descritivo. A ferramenta organiza automaticamente a apresentação dos marcos/eventos em ordem cronológica.<br/>
Alguns exemplos de marcos/eventos: criação da iniciativa, realização de atividades relevantes, eventos públicos, publicação de normativas, relatórios, materiais educomunicativos, etc.
                </section>
              </div>
            </Card>

            <Card middle /*  sx={{ button: { color: 'inherit' } }} */ headerless>
              <div className={`p-3 ${styles['add-panel']}`}>

                <section id="details">

                  <TimelineManager
                    entityId={entityId}
                    editing={editing}
                    onHighlight={_toHighlight}
                    add={true}
                    onSave={handleEditSave}
                  />

                </section>

              </div>
            </Card>

            <Card middle /*  sx={{ button: { color: 'inherit' } }} */ headerless>
              <div className="p-3">

                <section id="details">

                  {<div className={styles.timeline}>

                    {!!data && entity.map(e => <Fragment key={e.id}>

                      {editing?.id !== e.id && <div id={`timeline_${e.id}`} className={`${styles.each} ${toHighlight2 === e.id ? styles.highlight : ''}`}>
                        <div className={styles.date}> <span className={styles.text}>{dayjs(e.date).locale('pt-br').format('MMM [de] YYYY')}</span></div>

                        <div className={styles.thumb}>

                          <div className={styles['thumb-image']}>
                            {!!e.timeline_arquivo && <img src={e.timeline_arquivo} alt="imagem de timeline" />}
                            {!e.timeline_arquivo && <img src={no_thumb} alt="sem imagem de timeline" />}
                          </div>

                        </div>

                        <div className={styles.text}>{e.texto}</div>

                        <div className={styles.buttons}>
                          <button className={styles.action} onClick={edit(e.id)} disabled={!!editing}>
                            <Edit></Edit>
                          </button>
                          {editing?.id !== e.id && <button className={styles.action} onClick={remove(e.id)} disabled={!!editing}>
                            <Trash></Trash>
                          </button>}
                        </div>
                      </div>}

                      {editing?.id === e.id && <TimelineManager
                        entityId={entityId}
                        editing={editing}
                        onHighlight={_toHighlight}
                        onCancel={handleEditCancel}
                        onSave={handleEditSave}
                      />}
                    </Fragment>)}

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

function TimelineManager({ add, entityId, editing, onHighlight, onCancel, onSave }) {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  /* hooks */
  const { server } = useDorothy();
  const queryClient = useQueryClient();

  const [date, _date] = useState(new Date());
  const [thumb, _thumb] = useState(null);
  const [file, _file] = useState(null);
  const [texto, _texto] = useState(null);

  useEffect(() => {
    if(add) {
      _date(new Date())
      _texto(null);
    } else {
      _date(editing.date);
      _texto(editing.texto);
      _thumb({
        url: editing.timeline_arquivo,
      });
    }
  }, [editing])

  const handleThumbChange = (value) => {
    _thumb(value ? value : 'remove');

    _file(value?.file);
  }

  const handleSave = async () => {

    if (!texto || !texto.length) return;

    /* save */
    let data = new FormData();
    if (!!file) data.append('imagem', file);

    const snackKey = enqueueSnackbar('Gravando...', {
      persist: true,
      anchorOrigin: {
        vertical: 'top',
        horizontal: 'right',
      },
    });

    try {
      let method, url;
      /* save */

      if(add) { /* insert */
        method = 'post';
        url = `${server}ppea/${entityId}/draft/timeline`;
      } else {
       /* edit */
        method = 'put';
        url = `${server}ppea/${entityId}/draft/timeline/${editing.id}`;
      }

      data.set('entity', JSON.stringify({
        date,
        texto,
        timeline_arquivo: thumb,
      }));

      const { data: response } = await axios({
        method,
        url,
        data,
        config: { headers: { 'Content-Type': 'multipart/form-data' } },
      });

      onHighlight(response.id);

      _date(new Date());
      _texto(null);
      _thumb(null);
      _file(null);

      onSave();

      queryClient.invalidateQueries('ppea_timeline');

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

  return (<div className={`row ${!add && !!editing ? styles.editing : ''}`}>
    <div className={`col-xs-2 ${styles['vcentered']}`}>
      <DatePicker
        className="input-datepicker"
        label="Mês"
        value={date || ''}
        onChange={_date}
        views={['month', 'year']}
        inputFormat="MM/yyyy"
        disabled={add && !!editing}
      />
    </div>

    <div className="col-xs-1">
      <UploaderField
        onChange={handleThumbChange}
        url={thumb?.url}
        alt="imagem"
        title="Imagem"
        disabled={add && !!editing}
        viewer={false}
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
        disabled={add && !!editing}
      />
    </div>

    <div className={`col-xs-1 ${styles['vcentered']}`}>
      {add && <button className={styles.add} onClick={handleSave} disabled={add && !!editing}>
        <Plus></Plus>
      </button>}
      {!add && <div className={styles['edit-buttons']}>
        <button className={styles.add} onClick={handleSave}>
          <Save></Save>
        </button>
        <button className={styles.add} onClick={onCancel}>
          <Cancel></Cancel>
        </button>
      </div>}
    </div>
  </div>)
}