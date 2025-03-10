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
// import style from './information.module.scss';

export default function InformationsTab({ projectId }) {
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

  //get project_data
  const { data } = useQuery(['project_info', { projectId }], {
    queryFn: async () => (await axios.get(`${server}project/${projectId}/draft/info`)).data,
  });

  useEffect(() => {
    if (!data) return;

    _entity(data.project);

    // console.log(data.project)
  }, [data]);

  useEffect(() => {
    if (!entity) return;
    if (!entity.atuacao) return _regioes([]);
    /* eh necessario manipular as regioes dessa maneira para nao precisar alterar a coluna atuacao no banco, o que pode comprometer a integridade de dados ja existentes */
    _regioes(
      entity.atuacao.map((value, index) => {
        return {
          id: index,
          label: value,
          value: value,
        };
      }),
    );
  }, [entity]);

  const handleFieldChange = field => value => {
    _editing(true);

    let newProjectInfo = {};

    if (field === 'nome') {
      const { value: eValue, reason } = value;
      if (reason === 'clear') newProjectInfo = { ...entity, nome: '', indicado: null };
      else if (['input', 'reset'].includes(reason)) newProjectInfo = { ...entity, nome: eValue };
      else return;
    } else if (field === 'indicado' && !value) {
      return;
    } else if (field === 'atuacao') {
      /* tratamento para salvar regioes(atuacao) no formato original do zcm v1 */
      const newAtuacao = value.map(regiao => regiao.value);
      newProjectInfo = {
        ...entity,
        atuacao: newAtuacao,
      };

      /* Descobre se uma regiao foi removida e remove estados da regiao de ufs  */
      const removed = _.difference(entity.atuacao, newAtuacao);
      if (removed.length) {
        let newUfs = entity.ufs.filter(u => u.region !== removed[0]);
        newProjectInfo.ufs = newUfs;
      }

    } else newProjectInfo = { ...entity, [field]: value };

    console.log(`changing ${field}:`, value, newProjectInfo);

    _entity(newProjectInfo);
  };

  const handleFieldCreate = (newEntity, other) => async name => {
    console.log(`creating ${newEntity}: ${name}`);

    let data = {
      entity: newEntity,
      data: {
        name,
      },
    };

    if (other && other.length) for (let field of other) data.data[field] = entity[field];

    const { data: result } = await mutationCreate.mutateAsync(data);

    return result;
  };

  const mutationCreate = useMutation(
    ({ entity, data }) => {
      return axios.post(`${server}${entity}/`, data);
    },
    {
      onSuccess: () => queryClient.invalidateQueries(`project/${projectId}/draft/info`),
    },
  );

  const mutationSave = useMutation(
    entity => {
      if (entity) return axios.put(`${server}project/${projectId}/draft/info`, entity);
    },
    {
      onSuccess: () => queryClient.invalidateQueries(`project/${projectId}/draft/info`),
    },
  );

  const handleSave = async () => {
    _editing(false);

    if (entity.nome.trim().length === 0) {
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
    }

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

      queryClient.invalidateQueries(`project_indics`);

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
                    <div className="section-title">Detalhes da instituição</div>
                    <div className="section-actions">
                      <GetHelpButton tab="informacao" />

                      <button className="button-primary" onClick={() => handleSave()}>
                        <FilePlus></FilePlus>
                        Gravar
                      </button>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-xs-6" style={{ display: 'flex' }}>
                      <AsyncAutocompleteSuggest
                        label="Nome da instituição"
                        url="institution"
                        onChange={handleFieldChange('instituicao_id')}
                        creatable={true}
                        onCreate={handleFieldCreate('institution', ['instituicao_id'])}
                        value={entity.instituicao_id}
                      />
                      <HelpBoxButton keyRef={['instituicao_id']} openHelpbox={_contentText} />
                    </div>
                    <div className="col-xs-4" style={{ display: 'flex' }}>
                      <AsyncAutocompleteMultiple
                        label="Segmento da instituição"
                        url="segmento/related"
                        urlSingle="segmento"
                        onChange={handleFieldChange('instituicao_segmentos')}
                        value={entity.instituicao_segmentos}
                        multiple
                      />
                      <HelpBoxButton keyRef={['segmento']} openHelpbox={_contentText} />
                    </div>
                    <div className="col-xs-2" style={{ display: 'flex' }}>
                      <TextField
                        select
                        id="money-select"
                        label="Porte da instituição"
                        className="input-select"
                        value={entity.instituicao_porte || 'none'}
                        onChange={e => handleFieldChange('instituicao_porte')(e.target.value)}
                      >
                        <MenuItem value="none">Não respondido</MenuItem>
                        <MenuItem value="pequeno">Pequeno - até 10 colaboradores</MenuItem>
                        <MenuItem value="medio">Médio - até 50 colaboradores</MenuItem>
                        <MenuItem value="grande">Grande - mais de 50 colaboradores</MenuItem>
                      </TextField>
                      <HelpBoxButton keyRef={['porte']} openHelpbox={_contentText} />
                    </div>
                  </div>
                </section>

                <hr className="hr-spacer my-4" />

                <section id="details">
                  <div className="section-header">
                    <div className="section-title">Detalhes da iniciativa</div>
                  </div>
                  <div className="row">
                    <div className="col-xs-12" style={{ display: 'flex' }}>
                      <AsyncAutocompleteSuggest
                        label="Nome da iniciativa"
                        url="project/list_all_indic"
                        urlSingle="project/draft/name"
                        query={`?me=${projectId}`}

                        invalidText={entity.nome}

                        value={entity.indicado}
                        onChange={handleFieldChange('indicado')}

                        inputValue={entity.nome || ''} /* aqui!? */
                        onInputChange={(e, value, reason) => handleFieldChange('nome')({ value, reason })}

                        freeSolo

                        error={!editing && errors.nome}
                      />
                      <HelpBoxButton keyRef={['nome']} openHelpbox={_contentText} />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-xs-4" style={{ display: 'flex' }}>

                      <AsyncAutocomplete
                        label="Modalidade"
                        url="modality"
                        onChange={handleFieldChange('modalidade_id')}
                        value={entity.modalidade_id}
                      />
                      <HelpBoxButton keyRef={['modalidade_id']} openHelpbox={_contentText} />

                    </div>
                    <div className="col-xs-4" style={{ display: 'flex' }}>
                      <AsyncAutocompleteMultiple
                        label="Regiões"
                        url="project/regions"
                        titleField="value"
                        onChange={handleFieldChange('atuacao')}
                        value={regioes}
                        multiple
                      />
                      <HelpBoxButton keyRef={['atuacao']} openHelpbox={_contentText} />
                    </div>
                    <div className="col-xs-4" style={{ display: 'flex' }}>
                      <AsyncAutocompleteMultiple
                        label="Estados"
                        url="uf/related"
                        urlSingle="uf"
                        query={`?f_regioes=${entity.atuacao?.length ? entity.atuacao.join(',') : ''}`}
                        titleField="value"
                        onChange={handleFieldChange('ufs')}
                        value={entity.ufs}
                        multiple
                      />
                      <HelpBoxButton keyRef={['ufs']} openHelpbox={_contentText} />
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-xs-6" style={{ display: 'flex' }}>
                      <TextField
                        select
                        id="money-select"
                        label="Situação do desenvolvimento"
                        className="input-select"
                        value={entity.status_desenvolvimento || 'none'}
                        onChange={e => handleFieldChange('status_desenvolvimento')(e.target.value)}
                      >
                        <MenuItem value="none">Não respondido</MenuItem>
                        <MenuItem value="nao_iniciada">Não iniciada</MenuItem>
                        <MenuItem value="em_desenvolvimento">Em desenvolvimento</MenuItem>
                        <MenuItem value="finalizada">Finalizada</MenuItem>
                        <MenuItem value="interrompida">Interrompida</MenuItem>
                      </TextField>
                      <HelpBoxButton keyRef={['status_desenvolvimento']} openHelpbox={_contentText} />
                    </div>
                    <div className="col-xs-3" style={{ display: 'flex' }}>
                      {['em_desenvolvimento', 'finalizada', 'interrompida'].includes(entity.status_desenvolvimento) && <DatePicker
                        className="input-datepicker"
                        label="Inicio do desenvolvimento"
                        value={entity.mes_inicio}
                        onChange={handleFieldChange('mes_inicio')}
                        views={['month', 'year']}
                        inputFormat="MM/yyyy"
                        maxDate={entity.mes_fim}
                        error={!editing && errors.mes_inicio}
                      />}
                    </div>

                    <div className="col-xs-3" style={{ display: 'flex' }}>
                      {['finalizada', 'interrompida'].includes(entity.status_desenvolvimento) && <DatePicker
                        className="input-datepicker"
                        label="Término do desenvolvimento"
                        value={entity.mes_fim}
                        onChange={handleFieldChange('mes_fim')}
                        views={['month', 'year']}
                        inputFormat="MM/yyyy"
                        minDate={entity.mes_inicio}
                        error={!editing && errors.mes_fim}
                      />}
                    </div>
                  </div>
                </section>
                <hr className="hr-spacer my-4" />
                <section id="contacts">
                  <FreeMultipleContacts
                    data={entity.contatos}
                    onChange={handleFieldChange('contatos')}
                    sectionTitle={<TitleAndHelpbox title="Contatos" keyRef={['contatos']} openHelpbox={_contentText} />}
                  />
                </section>
                <hr className="hr-spacer my-4" />
                <section id="objectives">
                  <FreeMultiple
                    data={entity.objetivos_txt}
                    onChange={handleFieldChange('objetivos_txt')}
                    sectionTitle={<TitleAndHelpbox title="Objetivos" keyRef={['objetivos_txt']} openHelpbox={_contentText} />}
                  />
                </section>
                <hr className="hr-spacer my-4" />
                <section id="general-aspects">

                  <FreeMultiple
                    data={entity.aspectos_gerais_txt}
                    onChange={handleFieldChange('aspectos_gerais_txt')}
                    sectionTitle={<TitleAndHelpbox title="Aspectos gerais" keyRef={['aspectos_gerais_txt']} openHelpbox={_contentText} />}
                  />
                </section>
                <hr className="hr-spacer my-4" />
                <section id="public">
                  {/* <FreeMultiple
                    data={entity.publico_txt}
                    onChange={handleFieldChange('publico_txt')}
                    sectionTitle={<TitleAndHelpbox title="Público" keyRef={['publico_txt']} openHelpbox={_contentText} />}
                  /> */}
                  <div className="row">
                    <div className="col-xs-6">
                      <AsyncAutocompleteMultiple
                        label="Públicos"
                        url="publico"
                        query="?others=-1"
                        titleField="label"
                        onChange={handleFieldChange('publicos')}
                        value={entity.publicos}
                        multiple
                      />
                      <HelpBoxButton keyRef={['publicos']} openHelpbox={_contentText} />
                    </div>
                    
                    {entity.publicos?.find(p => String(p.id) === '-1') && (
                      <div className="col-xs-6">
                        <TextField
                          className="input-text"
                          label="Especifique"
                          value={entity.publicos_especificar || ''}
                          onChange={e => handleFieldChange('publicos_especificar')(e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                </section>
                <hr className="hr-spacer my-4" />
                <section id="public">
                  <div className="row">
                    <div className="col-xs-6">
                      <AsyncAutocompleteMultiple
                        label="Temáticas socioambientais"
                        url="tematica_socioambiental"
                        query="?others=-1"
                        titleField="label"
                        onChange={handleFieldChange('tematicas')}
                        value={entity.tematicas}
                        multiple
                      />
                      <HelpBoxButton keyRef={['tematicas']} openHelpbox={_contentText} />
                    </div>
                    
                    {entity.tematicas?.find(p => String(p.id) === '-1') && (
                      <div className="col-xs-6">
                        <TextField
                          className="input-text"
                          label="Especifique"
                          value={entity.tematicas_especificar || ''}
                          onChange={e => handleFieldChange('tematicas_especificar')(e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                </section>
                <hr className="hr-spacer my-4" />
                <section id="partners">
                  <FreeMultiple
                    data={entity.parceiros_txt}
                    onChange={handleFieldChange('parceiros_txt')}
                    sectionTitle={<TitleAndHelpbox title="Parceiros" keyRef={['parceiros_txt']} openHelpbox={_contentText} />}
                  />
                </section>
                <hr className="hr-spacer my-4" />
                <section id="period">
                  <FreeMultiple
                    data={entity.periodo_txt}
                    onChange={handleFieldChange('periodo_txt')}
                    sectionTitle={<TitleAndHelpbox title="Período" keyRef={['periodo_txt']} openHelpbox={_contentText} />}
                  />
                </section>
                <hr className="hr-spacer my-4" />
                <section id="politics">
                  <div className="section-header">
                    <div className="section-title" style={{ display: 'flex' }}>Políticas públicas <HelpBoxButton keyRef={['relacionado_ppea']} openHelpbox={_contentText} /></div>
                  </div>
                  <div className="row">
                    <div className="col-xs-12">
                      <small>
                        A ação/projeto está vinculada, é decorrente ou é parte de alguma política pública de educação
                        ambiental (federal, estadual, municipal ou de outro segmento não público)?

                        <FormGroup>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <div>Não</div>
                            <Switch
                              className="input-switch"
                              checked={entity.relacionado_ppea === 'sim'}
                              onChange={e => handleFieldChange('relacionado_ppea')(e.target.checked ? 'sim' : 'nao')}
                            />
                            <div>Sim</div>
                          </Stack>
                        </FormGroup>
                      </small>
                    </div>
                  </div>
                  <div className="row">
                    {entity.relacionado_ppea === 'sim' && (
                      <div className="col-xs-6">
                        <TextField
                          className="input-text"
                          label="Qual PPEA?"
                          value={entity.qual_ppea || ''}
                          onChange={e => handleFieldChange('qual_ppea')(e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                </section>

                <div className="section-header">
                  <div className="section-title"></div>
                  <div className="section-actions">
                    <button className="button-primary" onClick={() => handleSave()}>
                      <FilePlus></FilePlus>
                      Gravar
                    </button>
                  </div>
                </div>
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