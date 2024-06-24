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
import UploaderField from '../../components/UploaderField';
import HelpBoxButton from './HelpBoxButton';
import GetHelpButton from './GetHelpButton';

import GenericMultiple from '../../components/GenericMultiple';

/* style */
import style from './information.module.scss';

export default function InformationsTab({ entityId }) {
  /* hooks */
  const { server } = useDorothy();
  const queryClient = useQueryClient();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  /* states */
  const [originalEntity, _originalEntity] = useState([]);
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
    _originalEntity(data);

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

    if ([
      'composicao_cadeiras_set_pub',
      'composicao_cadeiras_soc_civ'
    ].includes(field)) {
      value = value.replace(/[^0-9]/g, '');
    }

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

  }

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
                    <div className={style.logo_wrapper}>
                      <UploaderField onChange={value => handleFieldChange('logo')(value?.file)} url={entity.logo} alt="imagem" title="Logotipo" />
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
                    <div className="col-xs-3" style={{ display: 'flex' }}>
                      <DatePicker
                        className="input-datepicker"
                        label="Data da criação"
                        value={entity.data_criacao}
                        onChange={handleFieldChange('data_criacao')}
                        views={['year']}
                        inputFormat="yyyy"
                      />
                    </div>
                    <div className="col-xs-3" style={{ display: 'flex' }}>
                      <TextField
                        select
                        id="money-select"
                        label="Ativo"
                        className="input-select"
                        value={entity.ativo || 'none'}
                        onChange={e => handleFieldChange('ativo')(e.target.value)}
                      >
                        <MenuItem value="none">Não respondido</MenuItem>
                        <MenuItem value="1">Sim</MenuItem>
                        <MenuItem value="2">Em reestruturação</MenuItem>
                        <MenuItem value="3">Não</MenuItem>
                      </TextField>
                      <HelpBoxButton keyRef={['documento_criacao_tipo']} openHelpbox={_contentText} />
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-xs-12" style={{ display: 'flex' }}>
                      <TextField
                        className="input-text"
                        label="Link para o site"
                        value={entity.link || ''}
                        onChange={e => handleFieldChange('link')(e.target.value)}
                      />
                    </div>
                  </div>

                </section>

                <hr className="hr-spacer my-4" />
                <section id="criacao">
                  <div className="section-header">
                    <div className="section-title">Documento de criação</div>
                  </div>
                  <div className="row">
                    <div className="col-xs-4" style={{ display: 'flex' }}>
                      <TextField
                        className="input-text"
                        label="Título do documento de criação"
                        value={entity.documento_criacao || ''}
                        onChange={e => handleFieldChange('documento_criacao')(e.target.value)}
                      />
                    </div>

                    <div className="col-xs-2" style={{ display: 'flex' }}>
                      <TextField
                        select
                        id="money-select"
                        label="Tipo de documento de criação"
                        className="input-select"
                        value={entity.documento_criacao_tipo || 'none'}
                        onChange={e => handleFieldChange('documento_criacao_tipo')(e.target.value)}
                      >
                        <MenuItem value="none">Não respondido</MenuItem>
                        <MenuItem value="link">Link</MenuItem>
                        <MenuItem value="file">Arquivo</MenuItem>
                      </TextField>
                      <HelpBoxButton keyRef={['documento_criacao_tipo']} openHelpbox={_contentText} />
                    </div>

                    <div className="col-xs-6" style={{ display: 'flex' }}>
                      {entity.documento_criacao_tipo === 'link' && <TextField
                        className="input-text"
                        label="Link do documento de criação"
                        value={entity.documento_criacao_arquivo || ''}
                        onChange={e => handleFieldChange('documento_criacao_arquivo')(e.target.value)}
                      />}
                      {entity.documento_criacao_tipo === 'file' && <UploaderField
                        onChange={handleFileChange('documento_criacao')}
                        url={entity.documento_criacao_arquivo}
                        type="file"
                        filename={entity.documento_criacao_file_name}
                        /* accept="application/pdf" */
                        title="Arquivo de criação"
                      />}
                    </div>
                  </div>
                </section>

                <hr className="hr-spacer my-4" />
                <section id="composicao">
                  <div className="section-header">
                    <div className="section-title">Composição</div>
                  </div>
                  <div className="row">
                    <div className="col-xs-3" style={{ display: 'flex' }}>
                      <TextField
                        className="input-text"
                        label="Núm. cadeiras - setor público"
                        value={entity.composicao_cadeiras_set_pub || ''}
                        onChange={e => handleFieldChange('composicao_cadeiras_set_pub')(e.target.value)}
                      />
                    </div>
                    <div className="col-xs-3" style={{ display: 'flex' }}>
                      <TextField
                        className="input-text"
                        label="Núm. cadeiras - sociedade civil"
                        value={entity.composicao_cadeiras_soc_civ || ''}
                        onChange={e => handleFieldChange('composicao_cadeiras_soc_civ')(e.target.value)}
                      />
                    </div>
                  </div>

                  <GenericMultiple
                    data={entity.composicao_cadeiras_outros}
                    newData={{
                      name: '',
                      num: '',
                    }}
                    addtype="bottom"
                    addtitle="Adicionar setor"
                    onChange={handleFieldChange('composicao_cadeiras_outros')}
                  >
                    <Composicao />
                  </GenericMultiple>

                </section>

                <hr className="hr-spacer my-4" />
                <section id="coordenacao">
                  <div className="section-header">
                    <div className="section-title">Coordenação</div>
                  </div>
                  <div className="row">
                    <div className="col-xs-6" style={{ display: 'flex' }}>
                      <TextField
                        select
                        id="money-select"
                        label="Órgão Gestor"
                        className="input-select"
                        value={entity.coordenacao || 'none'}
                        onChange={e => handleFieldChange('coordenacao')(e.target.value)}
                      >
                        <MenuItem value="none">Não respondido</MenuItem>
                        <MenuItem value="1">Secretarias Estaduais de Meio Ambiente (ou correlatas) e de Educação</MenuItem>
                        <MenuItem value="2">Apenas Secretaria de Estado de Meio Ambiente (ou correlatas)</MenuItem>
                        <MenuItem value="3">Apenas Secretaria de Estado de Educação</MenuItem>
                        <MenuItem value="4">Outra Pasta do Estado</MenuItem>
                        <MenuItem value="5">Instituição da Sociedade Civil</MenuItem>
                        <MenuItem value="6">Instituição de outro segmento</MenuItem>
                      </TextField>
                      <HelpBoxButton keyRef={['documento_criacao_tipo']} openHelpbox={_contentText} />
                    </div>
                    <div className="col-xs-6" style={{ display: 'flex' }}>
                      {['4', '6'].includes(entity.coordenacao) && <TextField
                        className="input-text"
                        label="Especifique"
                        value={entity.coordenacao_especifique || ''}
                        onChange={e => handleFieldChange('coordenacao_especifique')(e.target.value)}
                      />}
                    </div>
                  </div>
                </section>

                <hr className="hr-spacer my-4" />
                <section id="regimento_interno">
                  <div className="section-header">
                    <div className="section-title">Regimento interno</div>
                  </div>
                  <div className="row">
                    <div className="col-xs-4" style={{ display: 'flex' }}>
                      <TextField
                        select
                        id="money-select"
                        label="Tem regimento"
                        className="input-select"
                        value={entity.regimento_interno_tem || 'none'}
                        onChange={e => handleFieldChange('regimento_interno_tem')(e.target.value)}
                      >
                        <MenuItem value="none">Não respondido</MenuItem>
                        <MenuItem value="1">Sim</MenuItem>
                        <MenuItem value="2">Não</MenuItem>
                      </TextField>
                      <HelpBoxButton keyRef={['regimento_interno_tem']} openHelpbox={_contentText} />
                    </div>
                    {!!entity.regimento_interno_tem && <>
                      <div className="col-xs-2" style={{ display: 'flex' }}>
                        <TextField
                          select
                          id="money-select"
                          label="Tipo de arquivo regimento interno"
                          className="input-select"
                          value={entity.regimento_interno_tipo || 'none'}
                          onChange={e => handleFieldChange('regimento_interno_tipo')(e.target.value)}
                        >
                          <MenuItem value="none">Não respondido</MenuItem>
                          <MenuItem value="link">Link</MenuItem>
                          <MenuItem value="file">Arquivo</MenuItem>
                        </TextField>
                        <HelpBoxButton keyRef={['regimento_interno_tipo']} openHelpbox={_contentText} />
                      </div>

                      <div className="col-xs-6" style={{ display: 'flex' }}>
                        {entity.regimento_interno_tipo === 'link' && <TextField
                          className="input-text"
                          label="Link do regimento interno"
                          value={entity.regimento_interno_arquivo || ''}
                          onChange={e => handleFieldChange('regimento_interno_arquivo')(e.target.value)}
                        />}
                        {entity.regimento_interno_tipo === 'file' && <UploaderField
                          onChange={handleFileChange('regimento_interno')}
                          url={entity.regimento_interno_arquivo}
                          type="file"
                          filename={entity.regimento_interno_file_name}
                          /* accept="application/pdf" */
                          title="Regimento interno"
                        />}
                      </div>
                    </>}
                  </div>
                </section>

                <hr className="hr-spacer my-4" />
                <section id="organizacao">
                  <div className="section-header">
                    <div className="section-title">Organização interna</div>
                  </div>
                  <div className="row">
                    <div className="col-xs-6" style={{ display: 'flex' }}>
                      <TextField
                        select
                        id="money-select"
                        label="Periodicidade"
                        className="input-select"
                        value={entity.org_interna_periodicidade || 'none'}
                        onChange={e => handleFieldChange('org_interna_periodicidade')(e.target.value)}
                      >
                        <MenuItem value="none">Não respondido</MenuItem>
                        <MenuItem value="1">Mensal</MenuItem>
                        <MenuItem value="2">Bimestral</MenuItem>
                        <MenuItem value="3">Semestral</MenuItem>
                        <MenuItem value="4">Anual</MenuItem>
                        <MenuItem value="5">Outro</MenuItem>
                      </TextField>
                      <HelpBoxButton keyRef={['org_interna_periodicidade']} openHelpbox={_contentText} />
                    </div>
                    <div className="col-xs-6" style={{ display: 'flex' }}>
                      {['5'].includes(entity.org_interna_periodicidade) && <TextField
                        className="input-text"
                        label="Especifique"
                        value={entity.organizacao_interna_periodicidade_especifique || ''}
                        onChange={e => handleFieldChange('organizacao_interna_periodicidade_especifique')(e.target.value)}
                      />}
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-xs-6" style={{ display: 'flex' }}>
                      <TextField
                        select
                        id="money-select"
                        label="Possui câmaras técnicas ou grupos de trabalho?"
                        className="input-select"
                        value={entity.organizacao_interna_estrutura_tem || 'none'}
                        onChange={e => handleFieldChange('organizacao_interna_estrutura_tem')(e.target.value)}
                      >
                        <MenuItem value="none">Não respondido</MenuItem>
                        <MenuItem value="1">Sim</MenuItem>
                        <MenuItem value="2">Não</MenuItem>
                      </TextField>
                      <HelpBoxButton keyRef={['organizacao_interna_estrutura_tem']} openHelpbox={_contentText} />
                    </div>
                    <div className="col-xs-6" style={{ display: 'flex' }}>
                      {['1'].includes(entity.organizacao_interna_estrutura_tem) && <TextField
                        className="input-text"
                        label="Especifique"
                        value={entity.organizacao_interna_estrutura_especifique || ''}
                        onChange={e => handleFieldChange('organizacao_interna_estrutura_especifique')(e.target.value)}
                      />}
                    </div>
                  </div>
                </section>

                <hr className="hr-spacer my-4" />
                <section id="ppea">
                  <div className="section-header">
                    <div className="section-title">Política Pública de Educação Ambiental</div>
                  </div>

                  <div className="row">
                    <div className="col-xs-4" style={{ display: 'flex' }}>
                      <TextField
                        select
                        id="money-select"
                        label="Tem política pública"
                        className="input-select"
                        value={entity.ppea_tem || 'none'}
                        onChange={e => handleFieldChange('ppea_tem')(e.target.value)}
                      >
                        <MenuItem value="none">Não respondido</MenuItem>
                        <MenuItem value="1">Sim</MenuItem>
                        <MenuItem value="2">Não</MenuItem>
                      </TextField>
                      <HelpBoxButton keyRef={['ppea_tem']} openHelpbox={_contentText} />
                    </div>
                    {!!entity.ppea_tem && <>
                      <div className="col-xs-2" style={{ display: 'flex' }}>
                        <TextField
                          select
                          id="money-select"
                          label="Tipo de arquivo política pública"
                          className="input-select"
                          value={entity.ppea_tipo || 'none'}
                          onChange={e => handleFieldChange('ppea_tipo')(e.target.value)}
                        >
                          <MenuItem value="none">Não respondido</MenuItem>
                          <MenuItem value="link">Link</MenuItem>
                          <MenuItem value="file">Arquivo</MenuItem>
                        </TextField>
                        <HelpBoxButton keyRef={['ppea_tipo']} openHelpbox={_contentText} />
                      </div>

                      <div className="col-xs-6" style={{ display: 'flex' }}>
                        {entity.ppea_tipo === 'link' && <TextField
                          className="input-text"
                          label="Link do regimento interno"
                          value={entity.ppea_arquivo || ''}
                          onChange={e => handleFieldChange('ppea_arquivo')(e.target.value)}
                        />}
                        {entity.ppea_tipo === 'file' && <UploaderField
                          onChange={handleFileChange('ppea')}
                          url={entity.ppea_arquivo}
                          type="file"
                          filename={entity.ppea_file_name}
                          /* accept="application/pdf" */
                          title="Política pública"
                        />}
                      </div>
                    </>}
                  </div>
                  {!!entity.ppea_tem && <div className="row">
                    <div className="col-xs-3" style={{ display: 'flex' }}>
                      <TextField
                        className="input-text"
                        label="Decreto"
                        value={entity.ppea_decreto || ''}
                        onChange={e => handleFieldChange('ppea_decreto')(e.target.value)}
                      />
                    </div>
                    <div className="col-xs-3" style={{ display: 'flex' }}>
                      <TextField
                        className="input-text"
                        label="Lei"
                        value={entity.ppea_lei || ''}
                        onChange={e => handleFieldChange('ppea_lei')(e.target.value)}
                      />
                    </div>
                  </div>}
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

function Composicao({ row, DefaultRemove, handleChange, /*, handleRemove, index */ }) {
  return <div className="row">
    <div className="col-xs-3" style={{ display: 'flex' }}>
      <TextField
        className="input-text"
        label="Setor"
        value={row.name || ''}
        onChange={(e) => handleChange('name')(e.target.value)}
      />
    </div>
    <div className="col-xs-3" style={{ display: 'flex' }}>
      <TextField
        className="input-text"
        label="Núm. cadeiras"
        value={row.num || ''}
        onChange={(e) => handleChange('num')(e.target.value)}
      />
    </div>
    <div className="col-xs-1" style={{ display: 'flex' }}>
      {DefaultRemove}
    </div>

  </div>
}

function TitleAndHelpbox({ title, keyRef, openHelpbox }) {
  return (<div style={{ display: 'flex', alignItems: 'center' }}><div>{title}</div> <HelpBoxButton keyRef={keyRef} openHelpbox={openHelpbox} /></div>)
}