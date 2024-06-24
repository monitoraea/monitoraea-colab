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

import Plus from '../../components/icons/plus.svg?react';
import Trash from '../../components/icons/trash.svg?react';

import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'

import update from 'immutability-helper'
import { v4 as uuidv4 } from 'uuid';

/* style */
import style from './timeline.module.scss';

export default function TimelineTab({ entityId }) {
  /* hooks */
  const { server } = useDorothy();
  const queryClient = useQueryClient();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  /* states */
  const [originalEntity, _originalEntity] = useState([]);
  const [entity, _entity] = useState([]);

  const [contentText, _contentText] = useState(null);

  const [cards, _cards] = useState([
    {
      id: 1,
      date: 'No início de 2011',
      content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec sit amet enim lectus. Etiam quis euismod justo. Morbi placerat facilisis pretium. Cras euismod urna in nibh lobortis porttitor. Ut interdum a ipsum at viverra. Cras eget consectetur augue, ut pellentesque nisi. Nam a dapibus nisl. Proin urna ex, tempor in elit vel, laoreet tristique mauris. Mauris scelerisque, urna imperdiet efficitur mattis, nisl lacus rutrum urna, ut pulvinar lacus nisi ut purus. Sed euismod iaculis tristique. Aliquam ullamcorper mollis elit sit amet gravida. Sed placerat tempor eros eu sollicitudin. Aliquam sed metus convallis, ultricies urna vitae, sagittis dui. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.',
    },
    {
      id: 2,
      date: '2002',
      content: 'Sed ac interdum purus. Suspendisse tincidunt faucibus dolor eget finibus. Duis ac porta tellus, porttitor dictum lacus. Fusce nec scelerisque felis. Sed auctor orci a iaculis iaculis. In vel quam ipsum. Mauris non viverra lacus',
    },
    {
      id: 3,
      date: 'Final de 2003',
      content: 'In congue condimentum lectus, sed faucibus quam fermentum et. Vivamus erat velit, ornare ac viverra vel, vehicula id urna. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Donec ex nisi, volutpat ut massa elementum, iaculis tincidunt massa. Nullam lacinia, purus sit amet aliquet efficitur, ex felis auctor erat, in iaculis ligula ex id tortor. Duis et tincidunt neque, sed rutrum magna. Sed et mauris vitae nibh blandit pellentesque',
    },
    {
      id: 4,
      date: '2005',
      content: 'Phasellus felis mauris, scelerisque id efficitur vitae, tempus vitae justo. Cras at sodales libero, ut sollicitudin lectus. Fusce egestas lectus ac consequat vehicula. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Aliquam euismod lobortis lacus ut malesuada. Praesent ac rhoncus arcu. Donec sit amet nibh justo. Proin posuere sem justo, vel tincidunt lectus hendrerit in. Duis venenatis semper fringilla',
    },
  ])

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
  const changeField = (index, field) => (e) => {
    _cards((prevCards) =>
      update(prevCards, {
        $splice: [
          [index, 1],
          [index, 0, {
            ...prevCards[index],
            [field]: e.target.value,
          }],
        ],
      }),
    )
  }
  const append = () => {
    _cards((prevCards) =>
      update(prevCards, {
        $push: [
          {
            id: uuidv4(),
            date: '',
            content: '',
          }
        ],
      }),
    )
  }
  const remove = (index) => () => {
    _cards((prevCards) =>
      update(prevCards, {
        $splice: [
          [index, 1],
        ],
      }),
    )
  }
  const addAbove = (index) => () => {
    _cards((prevCards) =>
      update(prevCards, {
        $splice: [
          [index, 0, {
            id: uuidv4(),
            date: '',
            content: '',
          }],
        ],
      }),
    )
  }
  const moveCard = useCallback((dragIndex, hoverIndex) => {
    _cards((prevCards) =>
      update(prevCards, {
        $splice: [
          [dragIndex, 1],
          [hoverIndex, 0, prevCards[dragIndex]],
        ],
      }),
    )
  }, [])
  const renderCard = useCallback((card, index) => {
    return (
      <TLCard
        key={card.id}
        index={index}
        id={card.id}
        date={card.date}
        content={card.content}
        moveCard={moveCard}
        remove={remove}
        addAbove={addAbove}
        changeField={changeField}
      />
    )
  }, [])

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

                  <DndProvider backend={HTML5Backend}>
                    <div>{cards.map((card, i) => renderCard(card, i))}</div>
                  </DndProvider>


                  <div className={`row ${style.add_below}`}>
                    <button className={style.tl_button} onClick={append}>
                      <Plus></Plus>
                    </button>
                  </div>

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

function TitleAndHelpbox({ title, keyRef, openHelpbox }) {
  return (<div style={{ display: 'flex', alignItems: 'center' }}><div>{title}</div> <HelpBoxButton keyRef={keyRef} openHelpbox={openHelpbox} /></div>)
}

const TLCard = ({ id, date, content, index, moveCard, remove, addAbove, changeField }) => {
  const ref = useRef(null)
  const [{ handlerId }, drop] = useDrop({
    accept: ItemTypes.TIMELINE_ITEM,
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      }
    },
    hover(item, monitor) {
      if (!ref.current) {
        return
      }
      const dragIndex = item.index
      const hoverIndex = index
      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return
      }
      // Determine rectangle on screen
      const hoverBoundingRect = ref.current?.getBoundingClientRect()
      // Get vertical middle
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2
      // Determine mouse position
      const clientOffset = monitor.getClientOffset()
      // Get pixels to the top
      const hoverClientY = clientOffset.y - hoverBoundingRect.top
      // Only perform the move when the mouse has crossed half of the items height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%
      // Dragging downwards
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return
      }
      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return
      }
      // Time to actually perform the action
      moveCard(dragIndex, hoverIndex)
      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      item.index = hoverIndex
    },
  })
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.TIMELINE_ITEM,
    item: () => {
      return { id, index }
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })
  const opacity = isDragging ? 0 : 1
  drag(drop(ref))
  return (
    <div ref={ref} className={style.tlcard} style={{ opacity }} data-handler-id={handlerId}>
      <div className={`row ${style.add_above}`}>
        <button className={style.tl_button} onClick={addAbove(index)}>
          <Plus></Plus>
        </button>
      </div>
      <div className="row">
        <div className="col-xs-2">
          <div className={style.logo_wrapper}>
            <UploaderField onChange={value => console.log} url={''} alt="imagem" title="Imagem" />
          </div>
        </div>

        <div className="col-xs-9">
          <div className="row">
            <div className="col-xs-12">
              <TextField
                className="input-text"
                label="Quando"
                value={date}
                onChange={changeField(index, 'date')}
              />
            </div>
          </div>
          <div className="row">
            <div className="col-xs-12">
              <TextField
                className="input-text"
                label="Texto"
                value={content}
                onChange={changeField(index, 'content')}
                multiline
                rows={3}
              />
            </div>
          </div>
        </div>
        <div className={`col-xs-1 ${style.remove}`}>
          <button className={style.tl_button} onClick={remove(index)}>
            <Trash></Trash>
          </button>
        </div>
      </div>
    </div>
  )
}

const ItemTypes = {
  TIMELINE_ITEM: 'timeline-item',
}