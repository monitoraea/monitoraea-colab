import { useEffect, useState, useReducer } from 'react';
import { useDorothy, useRouter } from 'dorothy-dna-react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import {
  FormControl,
  FormLabel,
  FormControlLabel,
  FormGroup,
  Checkbox,
  Select,
  MenuItem,
  TextField,
} from '@mui/material';
import Helpbox from '../CMS/helpbox';

/* components */
import FreeMultiple from '../../components/FreeMultiple';
import Card from './../../commons/components/Card';
import { IntegerNumberFormat } from '../../components/FormatedFields';
import ConfirmationDialog from '../../components/ConfirmationDialogAdvanced';
import HelpBoxButton from './HelpBoxButton';
import GetHelpButton from './GetHelpButton';

/* icons */
import CheckCircle from '../../components/icons/CheckCircle';
import XCircle from '../../components/icons/XCircle';

/* styles */
import styles from './indicators.module.scss';

/* utils */
import { indicsTree } from '../../utils/indicsTree';

const TYPES = {
  INT: 1,
  TEXT: 2,
  TEXT_M: 3,
  // TEXT_FILE: 4,
  SEL_S: 5,
  SEL_M: 6,
  SEL_SO: 7,
  SEL_MO: 8,
  ITEMS: 9,
  SN: 10,
};

export default function IndicatorsTab({ analysis }) {
  const { currentCommunity, changeRoute, params } = useRouter();
  const { server } = useDorothy();
  const queryClient = useQueryClient();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const [tree, _tree] = useState(null);
  const [currentIndics, _currentIndics] = useState(null);

  const [indic, _indic] = useState(null);
  const [problems, _problems] = useState([]);

  const [changed, _changed] = useState(false);
  const [toNavigate, _toNavigate] = useState(null);
  const [openedBranch, _openedBranch] = useState(null);
  const [navBranch, _navBranch] = useState(null);

  const [contentText, _contentText] = useState(null);

  const [data, dispatch] = useReducer((state, action) => {
    switch (action.type) {
      case 'setup':
        return action.payload;
      case 'change':
        console.log('change', action.payload.question, action.payload.value);
        return { ...state, [action.payload.question]: action.payload.value };
      default:
        return state;
    }
  }, null);

  //get project_id
  const { data: project } = useQuery('project', {
    queryFn: async () => (await axios.get(`${server}project/id_from_community/${currentCommunity.id}`)).data,
  });

  const { data: indicData } = useQuery(['indic_data', { project_id: project?.id, currentIndics }], {
    queryFn: async () => (await axios.get(`${server}project/${project?.id}/indic/${currentIndics}`)).data,
    enabled: !!project?.id && !!currentIndics,
  });

  const mutation = useMutation(() => axios.put(`${server}project/${project?.id}/indic/${currentIndics}`, data), {
    onSuccess: () => {
      queryClient.invalidateQueries('indic_data');
      queryClient.invalidateQueries('project_indics');
    },
  });

  useEffect(() => {
    if (analysis) _tree(indicsTree(analysis));

    // console.log('analysis', analysis, indicsTree(analysis));
  }, [analysis]);

  useEffect(() => {
    if (params && params[1]) _currentIndics(params[1]);
    else _currentIndics('1_1');
  }, [params]);

  useEffect(() => {
    if (!currentIndics) return;
    _openedBranch(currentIndics.split('_')[0]);
  }, [currentIndics]);

  useEffect(() => {
    async function setup() {
      await dispatch({
        type: 'setup',
        payload: indicData.data,
      });

      _changed(false);
    }

    if (indicData) {
      console.log('indicData', indicData);
      _indic(indicData.indic);
      _problems(indicData.problems);
      setup();
    }
  }, [indicData]);

  useEffect(() => { }, [problems]);

  const handleChange = question => value => {
    dispatch({
      type: 'change',
      payload: { question, value },
    });

    _changed(true);
  };

  const checkError = id => {
    return !changed && problems.includes(`${currentIndics}_${id}`);
  };

  const handleSave = async () => {
    const snackKey = enqueueSnackbar('Gravando...', {
      persist: true,
      anchorOrigin: {
        vertical: 'top',
        horizontal: 'right',
      },
    });

    /* save */
    try {
      await mutation.mutateAsync();

      queryClient.invalidateQueries(`project_indics`);

      closeSnackbar(snackKey);

      enqueueSnackbar('Indicador gravado com sucesso!', {
        variant: 'success',
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'right',
        },
      });

      _changed(false);
    } catch (error) {
      closeSnackbar(snackKey);

      console.error(error);

      enqueueSnackbar('Erro ao gravar o indicador!', {
        variant: 'error',
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'right',
        },
      });
    }
  };

  const handleCancel = async () => {
    await dispatch({
      type: 'setup',
      payload: indicData.data,
    });
    _changed(false);
  };

  const handleNavigation = (childId, rootId) => () => {
    _navBranch(rootId);
    if (!changed) changeRoute({ params: ['indicadores', childId] });
    else _toNavigate(childId);
  };

  const handleNavBranch = id => {
    if (navBranch !== id) _navBranch(id);
    else _navBranch(null);
  };

  const handleConfirmation = async action => {
    if (action === 'confirm') changeRoute({ params: ['indicadores', toNavigate] });

    _toNavigate(null);
  };

  return (
    <>
      <div className="page-content">
        <div className="page-sidebar">
          <div className={`sidebar-body ${styles.tree}`}>
            {tree && (
              <ul>
                {tree.map(d => (
                  <li key={d.id} className={`mb-3 ${styles.li_lae_titles}`} onClick={() => handleNavBranch(d.id)}>
                    <ListItemStatus
                      title={d.title}
                      ready={d.ready}
                      className={openedBranch === d.id || navBranch === d.id ? styles.strong : ''}
                    />
                    <ul className={`${openedBranch === d.id || navBranch === d.id ? styles.show : styles.hide}`}>
                      {d.indics.map(i => (
                        <li key={i.id} className={`${styles.li_indicators}`} onClick={handleNavigation(i.id, d.id)}>
                          <ListItemStatus
                            title={i.title}
                            ready={i.ready}
                            className={`${styles.indic} ${currentIndics === i.id ? styles.selected : ''}`}
                          />
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="page-body">
          {indic && (
            <Card sx={{ button: { color: 'inherit' } }} headerless>
              <div className="p-3">
                <div className={`${styles['indic-header']} mb-3`}>
                  <div className={`${styles.title_box}`}>
                    <strong>{`${indic.lae_title} >> ${indic.name}`}</strong>
                  </div>
                  <div className={styles['actions']}>
                    <GetHelpButton tab="indicadores" />
                    <button className="button-primary" onClick={handleSave} disabled={!changed}>
                      Gravar
                    </button>
                    <button className={styles.button_delete} onClick={handleCancel} disabled={!changed}>
                      Restaurar
                    </button>
                  </div>
                </div>

                <div>
                  <Field
                    question={{ title: indic.base_question, type: 'base' }}
                    data={data?.base}
                    onChange={handleChange('base')}
                    hasError={checkError('base')}
                    keyRef={[indic.lae_id, indic.id, 'base']}
                    openHelpbox={value => _contentText(value)}
                  />
                </div>

                {/* questions (if base is 'sim') */}
                {data && data.base === 'sim' && (
                  <div>
                    {indic.questions.map(q => (
                      <Field
                        key={q.id}
                        question={q}
                        data={data ? data[q.id] : null}
                        onChange={handleChange(q.id)}
                        hasError={checkError(q.id)}
                        keyRef={[indic.lae_id, indic.id, q.id]}
                        openHelpbox={value => _contentText(value)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </Card>
          )}
          <Helpbox content={contentText} onClose={() => _contentText(null)} />
        </div>
      </div>

      <ConfirmationDialog
        open={!!toNavigate}
        content="Você deseja sair do indicador sem salvar as alterações?"
        confirmButtonText="Confirmar"
        onClose={handleConfirmation}
      />
    </>
  );
}

function ListItemStatus({ title, ready, className }) {
  let icon = ready ? <CheckCircle /> : <XCircle />;

  return (
    <div className={`${styles['item-container']} ${className}`}>
      <div className={`${styles[ready ? 'done' : 'error']}`}>{icon}</div>
      <div>{title}</div>
    </div>
  );
}

function Field({ question: { title, type, options }, data, hasError, onChange, keyRef, openHelpbox }) {
  return (
    <div className={`${styles.field}`}>
      {type === 'base' && (
        <FormControl fullWidth>
          <FormLabel id="base-label">
            <div className={styles.title_box}>
              {hasError && (
                <div className={`${styles.error}`}>
                  <XCircle />
                </div>
              )}
              <div className={`${styles['form-label-title']}`}>{title}</div>
              <HelpBoxButton keyRef={keyRef} openHelpbox={openHelpbox} />
            </div>
          </FormLabel>
          <Select
            id="base-select"
            value={data || 'none'}
            onChange={e => onChange(e.target.value)}
            className="input-select"
          >
            <MenuItem value="none"> -- Selecione -- </MenuItem>
            <MenuItem value="sim">Sim</MenuItem>
            <MenuItem value="nao">Não</MenuItem>
            <MenuItem value="nao_aplica">Não se aplica</MenuItem>
          </Select>
        </FormControl>
      )}

      {type === TYPES.INT && (
        <FormControl fullWidth>
          <FormLabel id="int-label">
            <div className={styles.title_box}>
              {hasError && (
                <div className={`${styles.error}`}>
                  <XCircle />
                </div>
              )}
              <div className={`${styles['form-label-title']}`}>{title}</div>
              <HelpBoxButton keyRef={keyRef} openHelpbox={openHelpbox} />
            </div>
          </FormLabel>
          <TextField
            className="input-text"
            sx={{ maxWidth: '200px', width: '50%' }}
            value={data || ''}
            onChange={e => onChange(e.target.value || '')}
            InputProps={{
              inputComponent: IntegerNumberFormat,
            }}
          />
        </FormControl>
      )}

      {type === TYPES.TEXT && (
        <FormControl fullWidth>
          <FormLabel id="text-label">
            <div className={styles.title_box}>
              {hasError && (
                <div className={`${styles.error}`}>
                  <XCircle />
                </div>
              )}
              <div className={`${styles['form-label-title']}`}>{title}</div>
              <HelpBoxButton keyRef={keyRef} openHelpbox={openHelpbox} />
            </div>
          </FormLabel>
          <TextField className="input-text" value={data || ''} onChange={e => onChange(e.target.value)} />
        </FormControl>
      )}

      {type === TYPES.TEXT_M && (
        <FormControl fullWidth>
          <FormLabel id="text-label">
            <div className={styles.title_box}>
              {hasError && (
                <div className={`${styles.error}`}>
                  <XCircle />
                </div>
              )}
              <div className={`${styles['form-label-title']}`}>{title}</div>
              <HelpBoxButton keyRef={keyRef} openHelpbox={openHelpbox} />
            </div>
          </FormLabel>
          <TextField
            className="input-text"
            value={data || ''}
            onChange={e => onChange(e.target.value)}
            multiline
            rows={4}
          />
        </FormControl>
      )}

      {type === TYPES.SEL_S && (
        <FormControl fullWidth>
          <FormLabel id="sels-label">
            <div className={styles.title_box}>
              {hasError && (
                <div className={`${styles.error}`}>
                  <XCircle />
                </div>
              )}
              <div className={`${styles['form-label-title']}`}>{title}</div>
              <HelpBoxButton keyRef={keyRef} openHelpbox={openHelpbox} />
            </div>
          </FormLabel>
          <Select
            id="base-select"
            value={data || 'none'}
            onChange={e => onChange(e.target.value)}
            className="input-select"
          >
            <MenuItem value="none"> -- Selecione -- </MenuItem>
            {options &&
              options.map(o => (
                <MenuItem key={o.value} value={o.value}>
                  {o.title}
                </MenuItem>
              ))}
          </Select>
        </FormControl>
      )}

      {type === TYPES.SEL_M && (
        <>
          <MultipleCheck
            title={title}
            value={data || []}
            options={options}
            onChange={onChange}
            hasError={hasError}
            keyRef={keyRef}
            openHelpbox={openHelpbox}
          />
        </>
      )}

      {type === TYPES.SEL_SO && (
        <SelectAndOther
          title={title}
          value={data || 'none'}
          options={options}
          onChange={onChange}
          hasError={hasError}
          keyRef={keyRef}
          openHelpbox={openHelpbox}
        />
      )}

      {type === TYPES.SEL_MO && (
        <SelectMultipleAndOther
          title={title}
          value={data || []}
          options={options}
          onChange={onChange}
          hasError={hasError}
          keyRef={keyRef}
          openHelpbox={openHelpbox}
        />
      )}

      {/* {type === TYPES.ITEMS && <MultipleText
        title={title}
        value={data || ''}
        onChange={onChange}
        hasError={hasError}
        />} */}

      {type === TYPES.ITEMS && (
        <>
          <FormControl fullWidth>
            <FormLabel id="sn-label">
              <div className={styles.title_box}>
                {hasError && (
                  <div className={`${styles.error}`}>
                    <XCircle />
                  </div>
                )}
                <div className={`${styles['form-label-title']}`}>{title}</div>
                <HelpBoxButton keyRef={keyRef} openHelpbox={openHelpbox} />
              </div>
            </FormLabel>
            <FreeMultiple data={data || ''} onChange={onChange} />
          </FormControl>
        </>
      )}

      {type === TYPES.SN && (
        <FormControl fullWidth>
          <FormLabel id="sn-label">
            <div className={styles.title_box}>
              {hasError && (
                <div className={`${styles.error}`}>
                  <XCircle />
                </div>
              )}
              <div className={`${styles['form-label-title']}`}>{title}</div>
              <HelpBoxButton keyRef={keyRef} openHelpbox={openHelpbox} />
            </div>
          </FormLabel>
          <Select
            id="sn-select"
            value={data || 'none'}
            onChange={e => onChange(e.target.value)}
            className="input-select"
          >
            <MenuItem value="none"> -- Selecione -- </MenuItem>
            <MenuItem value="sim">Sim</MenuItem>
            <MenuItem value="nao">Não</MenuItem>
          </Select>
        </FormControl>
      )}
      <hr className="hr-spacer my-4" />
    </div>
  );
}

function MultipleCheck({ title, value, options, hasError, onChange, keyRef, openHelpbox }) {
  const handleChange = optionValue => e => {
    if (e.target.checked) onChange([...value, optionValue]);
    else onChange(value.filter(v => v !== optionValue));
  };

  return (
    <FormControl fullWidth>
      <FormLabel id="base-label">
        <div className={styles.title_box}>
          {hasError && (
            <div className={`${styles.error}`}>
              <XCircle />
            </div>
          )}
          <div className={`${styles['form-label-title']}`}>{title}</div>
          <HelpBoxButton keyRef={keyRef} openHelpbox={openHelpbox} />
        </div>
      </FormLabel>
      <FormGroup>
        {options &&
          options.map(o => (
            <FormControlLabel
              key={o.value}
              control={
                <Checkbox checked={value && value.includes(o.value)} onChange={handleChange(o.value)} name={o.title} />
              }
              label={o.title}
            />
          ))}
      </FormGroup>
    </FormControl>
  );
}

function SelectAndOther({ title, value, options, hasError, onChange, keyRef, openHelpbox }) {
  const handleChange = what => e => {
    onChange({ ...value, [what]: e.target.value });
  };

  return (
    <>
      <div className="row">
        <div className="col-md-12">
          <FormControl fullWidth>
            <FormLabel id="so-label">
              <div className={styles.title_box}>
                {hasError && (
                  <div className={`${styles.error}`}>
                    <XCircle />
                  </div>
                )}
                <div className={`${styles['form-label-title']}`}>{title}</div>
                <HelpBoxButton keyRef={keyRef} openHelpbox={openHelpbox} />
              </div>
            </FormLabel>
            <Select
              id="base-select"
              value={value ? value.value : 'none'}
              onChange={handleChange('value')}
              className="input-select"
            >
              <MenuItem value="none"> -- Selecione -- </MenuItem>
              {options &&
                options.map(o => (
                  <MenuItem key={o.value} value={o.value}>
                    {o.title}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        </div>
      </div>

      <div className="row">
        <div className="col-md-12">
          <TextField
            className="input-text"
            label="outro"
            value={(value && value.other) || ''}
            onChange={handleChange('other')}
          />
        </div>
      </div>
    </>
  );
}

function SelectMultipleAndOther({ title, value, options, hasError, onChange, keyRef, openHelpbox }) {
  const handleChange = what => data => {
    onChange({ ...value, [what]: data });
  };

  return (
    <>
      <div className="row">
        <div className="col-md-12">
          <MultipleCheck
            title={title}
            value={value && value.items ? value.items : []}
            options={options}
            onChange={handleChange('items')}
            hasError={hasError}
            keyRef={keyRef}
            openHelpbox={openHelpbox}
          />
        </div>
      </div>

      <div className="row">
        <div className="col-md-12">
          <TextField
            className="input-text"
            label="outro"
            value={(value && value.other) || ''}
            onChange={e => handleChange('other')(e.target.value)}
          />
        </div>
      </div>
    </>
  );
}
