import { useState, useEffect } from 'react';
import { TextField, Switch, FormGroup, Stack, MenuItem } from '@mui/material';
import Helpbox from '../CMS/helpbox';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useDorothy } from 'dorothy-dna-react';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import _ from 'lodash';
/* components */
import FilePlus from '../../components/icons/FilePlus';
import Card from '../../components/Card';
import AsyncAutocomplete from '../../components/AsyncAutocomplete';
import AsyncAutocompleteSuggest from '../../components/AsyncAutocompleteSuggest';
import AsyncAutocompleteMultiple from '../../components/AsyncAutocompleteMultiple';
import FreeMultiple from '../../components/FreeMultiple';
import FreeMultipleContacts from '../../components/FreeMultiple/FreeMultipleContacts';
import DatePicker from '../../components/DatePicker';
import HelpBoxButton from './HelpBoxButton';
import GetHelpButton from './GetHelpButton';

/* style */
import style from './information.module.scss';

export default function InformationsTab({ entityId }) {
  /* hooks */
  const { server } = useDorothy();
  const queryClient = useQueryClient();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  /* states */
  const [entity, _entity] = useState([]);
  const [editing, _editing] = useState(false);
  const [errors, _errors] = useState({});
  const [regioes, _regioes] = useState([]);

  const [contentText, _contentText] = useState(null);

  //get commission_data
  const { data } = useQuery(['commission_info', { entityId }], {
    queryFn: async () => (await axios.get(`${server}commission/${entityId}/draft`)).data,
  });

  useEffect(() => {
    if (!data) return;

    _entity(data);

    // console.log(data)
  }, [data]);

  useEffect(() => {
    if (!entity) return;
    // if (!entity.atuacao) return _regioes([]);
    // /* eh necessario manipular as regioes dessa maneira para nao precisar alterar a coluna atuacao no banco, o que pode comprometer a integridade de dados ja existentes */
    // _regioes(
    //   entity.atuacao.map((value, index) => {
    //     return {
    //       id: index,
    //       label: value,
    //       value: value,
    //     };
    //   }),
    // );
  }, [entity]);

  const handleFieldChange = field => value => {
    _editing(true);

    let newEntityInfo = {};

    // olhar em project (ZCM)

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
                    <div className="section-title">Detalhes da comissão</div>
                    <div className="section-actions">
                      <GetHelpButton tab="informacao" />

                      <button className="button-primary" onClick={() => handleSave()}>
                        <FilePlus></FilePlus>
                        Gravar
                      </button>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-xs-3" style={{ display: 'flex' }}>
                      <div className={style.readonly}>
                        <div className={style.title}>Estado</div>
                        <div className={style.value}>{entity.uf_nome}</div>
                      </div>
                    </div>
                    <div className="col-xs-3" style={{ display: 'flex' }}>
                      <div className={style.readonly}>
                        <div className={style.title}>Região</div>
                        <div className={style.value}>{entity.regiao}</div>
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-xs-12" style={{ display: 'flex' }}>
                      <TextField
                        className="input-text"
                        label="Link para o site"
                        value={entity.link || ''}
                        onChange={e => handleFieldChange('link')}
                      />
                    </div>
                  </div>
                </section>
                {/* <hr className="hr-spacer my-4" />
                <section id="contacts">
                  <FreeMultipleContacts
                    data={entity.contatos}
                    onChange={handleFieldChange('contatos')}
                    sectionTitle={<TitleAndHelpbox title="Contatos" keyRef={['contatos']} openHelpbox={_contentText} />}
                  />
                </section> */}

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