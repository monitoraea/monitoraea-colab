import { useState, useEffect } from 'react';

import { TextField, MenuItem, Autocomplete, Chip } from '@mui/material';

import Helpbox from '../CMS/helpbox';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useDorothy, useRouter } from 'dorothy-dna-react';
import axios from 'axios';
import { useSnackbar } from 'notistack';
/* components */
import FilePlus from '../../components/icons/FilePlus';
import Card from '../../components/Card';
import AsyncAutocompleteSuggest from '../../components/AsyncAutocompleteSuggest';
import HelpBoxButton from './HelpBoxButton';
import GetHelpButton from './GetHelpButton';

/* styles */
// import styles from './information.module.scss';

export default function ConectionsTab({ projectId }) {
  /* hooks */
  const { server } = useDorothy();
  const queryClient = useQueryClient();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const { currentCommunity } = useRouter();

  /* states */
  const [entity, _entity] = useState(null);
  const [errors, _errors] = useState([]);

  const [contentText, _contentText] = useState(null);

  // const [avoid, _avoid] = useState({
  //   pp: [],
  //   apoia: [],
  //   apoiada: [],
  // });

  //get project_data
  const { data } = useQuery(['project_info', { projectId }], {
    queryFn: async () => (await axios.get(`${server}project/${projectId}/draft/info`)).data,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!data) return;

    _entity(data.project);

    // TODO: Atualiza avoids (3)
  }, [data]);

  useEffect(() => {
    console.log({ errors });
  }, [errors]);

  const mutationSave = useMutation(
    entity => {
      if (entity) return axios.put(`${server}project/${projectId}/draft/network`, { ...entity, communityId: currentCommunity.id });
    },
    {
      onSuccess: () => queryClient.invalidateQueries(`project/${projectId}/draft/info`),
    },
  );

  const handleFieldChange = (field, idx, prop) => value => {
    let newEntity = { ...entity };

    console.log({ prop, value })

    if (idx !== undefined) {

      let newSpecificEntity = entity[field][idx];

      if (prop.includes('name')) {
        const { value: eValue, reason } = value;
        if (reason === 'clear') newSpecificEntity = { ...newSpecificEntity, [prop]: '' };
        else if (['input', 'reset'].includes(reason)) newSpecificEntity = { ...newSpecificEntity, [prop]: eValue };
        else return;
      } else if (field === 'id' && !value) {
        return;
      } else newSpecificEntity = { ...newSpecificEntity, [prop]: value };

      // se trocar instituicao, remove iniciativa
      if (prop.includes('instituicao')) newSpecificEntity = { ...newSpecificEntity, iniciativa_id: null, iniciativa_name: '' };

      newEntity[field][idx] = newSpecificEntity;

    } else {
      newEntity[field] = value;
    }

    console.log(`changing ${field}:`, value, newEntity);

    _entity(newEntity);

    // if (!!prop && prop.includes('id')) {
    //   let newAvoid = {
    //     pp: [],
    //     apoiada: [],
    //     apoia: [],
    //   };

    //   if (!!newEntity.instituicao_id) {
    //     newAvoid.apoiada.push(newEntity.instituicao_id);
    //     newAvoid.apoia.push(newEntity.instituicao_id);
    //   }

    //   console.log({field, prop})

    //   for (let i = 0; i < 5; i++) {
    //     if (!!newEntity.pp[i].id) newAvoid.pp.push(newEntity.pp[i].id);
    //     if (!!newEntity.apoiada[i].id)
    //       newAvoid.apoiada.push(newEntity.apoiada[i].id);
    //     if (!!newEntity.apoia[i].id) newAvoid.apoia.push(newEntity.apoia[i].id);
    //   }

    //   _avoid({
    //     ...avoid,
    //     pp: newAvoid.pp,
    //     apoiada: newAvoid.apoiada,
    //     apoia: newAvoid.apoia,
    //   });
    // }
  };

  const handleSave = async () => {
    let newErrors = [];

    // console.log({ entity });

    // sem as pergutas bases
    if (entity.pp_base === 'none') newErrors.push('pp_base');
    if (entity.apoiada_base === 'none') newErrors.push('apoiada_base');
    if (entity.apoia_base === 'none') newErrors.push('apoia_base');

    // sem item de ranking com pergunta base 'sim' ou lacuna entre itens
    if (entity[`pp_base`] === 'sim') {
      let maxFilled = null;
      for (let i = 0; i < 5; i++)
        if (!!entity.pp[i].name.length) {
          maxFilled = i;
          if (!entity.pp[i].type.length) newErrors.push(`pp_${i}_type`);
        }

      if (maxFilled === null) newErrors.push(`pp_0_id`);
      else for (let i = maxFilled; i >= 0; i--) if (!entity.pp[i].name.length) newErrors.push(`pp_${i}_id`);
    }

    ['apoiada', 'apoia'].forEach(what => {
      if (entity[`${what}_base`] === 'sim') {
        let maxFilled = null;
        for (let i = 0; i < 5; i++)
          if (!!entity[what][i].instituicao_name.length || !!entity[what][i].iniciativa_name.length) {
            maxFilled = i;
            if (what === 'apoia' && entity[what][i].iniciativa_name === '') newErrors.push(`apoia_${i}_iniciativa_id`);
            if (entity[what][i].instituicao_name === '') newErrors.push(`${what}_${i}_instituicao_id`);
            if (!entity[what][i].type.length) newErrors.push(`${what}_${i}_type`);
          }

        if (maxFilled === null) newErrors.push(`${what}_0_instituicao_id`);
        else for (let i = maxFilled; i >= 0; i--) if (!entity[what][i].instituicao_name.length) newErrors.push(`${what}_${i}_instituicao_id`);
      }
    });

    _errors(newErrors);
    if (newErrors.length) {
      return;
    }

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

      queryClient.invalidateQueries(`project_info`);
      queryClient.invalidateQueries(`project_indics`);

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
                <section id="pp">

                  <div className="section-header">
                    <div className="section-title" style={{ display: 'flex', alignItems: 'center' }}>
                      <div>A ação/projeto se conecta com alguma Política Pública de Educação Ambiental?</div>
                      <HelpBoxButton keyRef={['politicas']} openHelpbox={_contentText} />
                    </div>
                    <div className="section-actions">
                      <GetHelpButton tab="conexoes" />
                      <button className="button-primary" onClick={() => handleSave()}>
                        <FilePlus></FilePlus>
                        Gravar
                      </button>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-xs-6" styles={{ display: 'flex' }}>
                      <TextField
                        select
                        id="money-select"
                        label=""
                        className="input-text"
                        value={entity.pp_base}
                        onChange={e => handleFieldChange('pp_base')(e.target.value)}
                        error={errors.includes('pp_base')}
                      >
                        <MenuItem value="none">Selecione uma opção</MenuItem>
                        <MenuItem value="sim">Sim</MenuItem>
                        <MenuItem value="nao">Não</MenuItem>
                      </TextField>
                    </div>
                  </div>
                </section>

                {entity.pp_base === 'sim' && (
                  <section id="pp_detalhe">
                    <div className="section-header">
                      <div className="section-title">Indique as políticas em ordem de relevância</div>
                    </div>

                    {[0, 1, 2, 3, 4].map(i => (
                      <div key={i} className="row">
                        <div className="col-xs-3">
                          <AsyncAutocompleteSuggest
                            label={`Política ${i + 1}`}
                            url="policy"
                            // query={`?avoid=${avoid.pp.join(',')}`}

                            value={entity['pp'][i]?.id}
                            onChange={handleFieldChange('pp', i, 'id')}

                            inputValue={entity['pp'][i]?.name || ''}
                            onInputChange={(e, value, reason) => handleFieldChange('pp', i, 'name')({ value, reason })}

                            freeSolo
                            error={errors.includes(`pp_${i}_id`)}
                          />

                        </div>
                        <div className="col-xs-6">
                          <Autocomplete
                            multiple
                            id="fixed-tags-demo"
                            className="input-autocomplete"
                            value={entity['pp'][i]?.type}
                            onChange={(_, value) => handleFieldChange('pp', i, 'type')(value)}
                            options={[
                              { value: 'principios', title: 'Alinhamento com princípios e diretrizes' },
                              { value: 'instrumentos', title: 'Atuação em instrumentos específicos' },
                              { value: 'planos', title: 'Atuação em planos e programas conectados à política' },
                              { value: 'atividades', title: 'Atuação em atividades vinculadas à política' },
                            ]}
                            getOptionLabel={(option) => option.title}
                            renderTags={(tagValue, getTagProps) =>
                              tagValue.map((option, index) => (
                                <Chip
                                  label={option.title}
                                  {...getTagProps({ index })}
                                />
                              ))
                            }
                            renderInput={(params) => (
                              <TextField {...params} label="Relação" error={errors.includes(`pp_${i}_type`)} />
                            )}
                          />
                        </div>

                        <div className="col-xs-3">
                          <TextField
                            className="input-text"
                            id="text-email"
                            label="Outra relação"
                            value={entity['pp'][i]?.other_type}
                            onChange={e => handleFieldChange('pp', i, 'other_type')(e.target.value)}
                          />
                        </div>
                      </div>
                    ))}
                  </section>
                )}

                <hr className="hr-spacer my-4"></hr>

                <section id="apoiada">
                  <div className="section-header">
                    <div className="section-title" style={{ display: 'flex', alignItems: 'center' }}>
                      <div>A sua iniciativa (ação ou projeto) <strong>é apoiada ou recebe algum suporte</strong> de alguma
                        outra instituição para viabilizar suas ações?</div>
                      <HelpBoxButton keyRef={['apoiada']} openHelpbox={_contentText} />
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-xs-6" styles={{ display: 'flex' }}>
                      <TextField
                        select
                        id="money-select"
                        label=""
                        className="input-text"
                        value={entity.apoiada_base}
                        onChange={e => handleFieldChange('apoiada_base')(e.target.value)}
                        error={errors.includes('apoiada_base')}
                      >
                        <MenuItem value="none">Selecione uma opção</MenuItem>
                        <MenuItem value="sim">Sim</MenuItem>
                        <MenuItem value="nao">Não</MenuItem>
                      </TextField>
                    </div>
                  </div>
                </section>

                {entity.apoiada_base === 'sim' && (
                  <section id="apoiada_detalhe">
                    <div className="section-header">
                      <div className="section-title">Indique as instituições em ordem de relevância</div>
                    </div>

                    {[0, 1, 2, 3, 4].map(i => (
                      <div key={i} className="row">
                        <div className="col-xs-3">
                          <AsyncAutocompleteSuggest
                            label={`Instituição ${i + 1}`}
                            url="institution"
                            // query={`?avoid=${avoid.apoiada.join(',')}`}

                            value={entity['apoiada'][i]?.instituicao_id}
                            onChange={handleFieldChange('apoiada', i, 'instituicao_id')}

                            inputValue={entity['apoiada'][i]?.instituicao_name || ''}
                            onInputChange={(e, value, reason) => handleFieldChange('apoiada', i, 'instituicao_name')({ value, reason })}

                            freeSolo
                            error={errors.includes(`apoiada_${i}_instituicao_id`)}
                          />

                        </div>

                        <div className="col-xs-3">
                          <AsyncAutocompleteSuggest
                            label={`Iniciativa ${i + 1}`}
                            url="project/opt_relations"
                            urlSingle="project/opt_relations"
                            // query={`?avoid=${avoid.apoiada.join(',')}`}
                            query={`?${!!entity['apoiada'][i]?.instituicao_id ? `&institution=${entity['apoiada'][i]?.instituicao_id}` : !!entity['apoiada'][i]?.instituicao_name.length ? '&institution=0' : ''}`}

                            value={entity['apoiada'][i]?.iniciativa_id}
                            onChange={handleFieldChange('apoiada', i, 'iniciativa_id')}

                            inputValue={entity['apoiada'][i]?.iniciativa_name || ''}
                            onInputChange={(e, value, reason) => handleFieldChange('apoiada', i, 'iniciativa_name')({ value, reason })}

                            freeSolo
                          />
                        </div>

                        <div className="col-xs-3">
                          <Autocomplete
                            multiple
                            id="fixed-tags-demo"
                            className="input-autocomplete"
                            value={entity['apoiada'][i]?.type}
                            onChange={(_, value) => handleFieldChange('apoiada', i, 'type')(value)}
                            options={[
                              { value: 'financiamento', title: 'Fomento financeiro/financiamento' },
                              { value: 'infraestrutura', title: 'Compartilhamento de infraestrutura' },
                              { value: 'rh', title: 'Compartilhamento de recursos humanos' },
                              { value: 'info', title: 'Compartilhamento de informações' },
                            ]}
                            getOptionLabel={(option) => option.title}
                            renderTags={(tagValue, getTagProps) =>
                              tagValue.map((option, index) => (
                                <Chip
                                  label={option.title}
                                  {...getTagProps({ index })}
                                />
                              ))
                            }
                            renderInput={(params) => (
                              <TextField {...params} label="Relação" error={errors.includes(`apoiada_${i}_type`)} />
                            )}
                          />
                        </div>

                        <div className="col-xs-3">
                          <TextField
                            className="input-text"
                            id="text-email"
                            label="Outra relação"
                            value={entity['apoiada'][i]?.other_type}
                            onChange={e => handleFieldChange('apoiada', i, 'other_type')(e.target.value)}
                          />
                        </div>
                      </div>
                    ))}
                  </section>
                )}

                <hr className="hr-spacer my-4"></hr>

                <section id="apoia">
                  <div className="section-header">
                    <div className="section-title" style={{ display: 'flex', alignItems: 'center' }}>
                      <div>A sua iniciativa (ação ou projeto) <strong>apoia ou dá algum tipo de suporte</strong> a outra
                        ação/projeto na Zona Costeira e Marinha do Brasil?</div>
                      <HelpBoxButton keyRef={['apoia']} openHelpbox={_contentText} />
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-xs-6" styles={{ display: 'flex' }}>
                      <TextField
                        select
                        id="money-select"
                        label=""
                        className="input-text"
                        value={entity.apoia_base}
                        onChange={e => handleFieldChange('apoia_base')(e.target.value)}
                        error={errors.includes('apoia_base')}
                      >
                        <MenuItem value="none">Selecione uma opção</MenuItem>
                        <MenuItem value="sim">Sim</MenuItem>
                        <MenuItem value="nao">Não</MenuItem>
                      </TextField>
                    </div>
                  </div>
                </section>

                {entity.apoia_base === 'sim' && (
                  <section id="apoia_detalhe">
                    <div className="section-header">
                      <div className="section-title">Indique as iniciativas em ordem de relevância</div>
                    </div>

                    {[0, 1, 2, 3, 4].map(i => (
                      <div key={i} className="row">
                        <div className="col-xs-3">
                          <AsyncAutocompleteSuggest
                            label={`Instituição ${i + 1}`}
                            url="institution"
                            // query={`?avoid=${avoid.apoia.join(',')}`}

                            value={entity['apoia'][i]?.instituicao_id}
                            onChange={handleFieldChange('apoia', i, 'instituicao_id')}

                            inputValue={entity['apoia'][i]?.instituicao_name || ''}
                            onInputChange={(e, value, reason) => handleFieldChange('apoia', i, 'instituicao_name')({ value, reason })}

                            freeSolo
                            error={errors.includes(`apoia_${i}_instituicao_id`)}
                          />

                        </div>

                        <div className="col-xs-3">
                          <AsyncAutocompleteSuggest
                            label={`Iniciativa ${i + 1}`}
                            url="project/opt_relations"
                            urlSingle="project/opt_relations"
                            // query={`?avoid=${avoid.apoia.join(',')}`}
                            query={`?${!!entity['apoia'][i]?.instituicao_id ? `&institution=${entity['apoia'][i]?.instituicao_id}` : !!entity['apoia'][i]?.instituicao_name.length ? '&institution=0' : ''}`}

                            value={entity['apoia'][i]?.iniciativa_id}
                            onChange={handleFieldChange('apoia', i, 'iniciativa_id')}

                            inputValue={entity['apoia'][i]?.iniciativa_name || ''}
                            onInputChange={(e, value, reason) => handleFieldChange('apoia', i, 'iniciativa_name')({ value, reason })}

                            freeSolo
                            error={errors.includes(`apoia_${i}_iniciativa_id`)}
                          />
                        </div>

                        <div className="col-xs-3">
                          <Autocomplete
                            multiple
                            id="fixed-tags-demo"
                            className="input-autocomplete"
                            value={entity['apoia'][i]?.type}
                            onChange={(_, value) => handleFieldChange('apoia', i, 'type')(value)}
                            options={[
                              { value: 'financiamento', title: 'Fomento financeiro/financiamento' },
                              { value: 'infraestrutura', title: 'Compartilhamento de infraestrutura' },
                              { value: 'rh', title: 'Compartilhamento de recursos humanos' },
                              { value: 'info', title: 'Compartilhamento de informações' },
                            ]}
                            getOptionLabel={(option) => option.title}
                            renderTags={(tagValue, getTagProps) =>
                              tagValue.map((option, index) => (
                                <Chip
                                  label={option.title}
                                  {...getTagProps({ index })}
                                />
                              ))
                            }
                            renderInput={(params) => (
                              <TextField {...params} label="Relação" error={errors.includes(`apoia_${i}_type`)} />
                            )}
                          />
                        </div>

                        <div className="col-xs-3">
                          <TextField
                            className="input-text"
                            id="text-email"
                            label="Outra relação"
                            value={entity['apoia'][i]?.other_type}
                            onChange={e => handleFieldChange('apoia', i, 'other_type')(e.target.value)}
                          />
                        </div>
                      </div>
                    ))}
                  </section>
                )}

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
