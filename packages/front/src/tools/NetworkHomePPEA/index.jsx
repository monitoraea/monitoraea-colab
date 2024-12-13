import { useState, useEffect, useRef } from 'react';
import { TextField } from '@mui/material';

import { useDorothy, useRouter } from 'dorothy-dna-react';

import axios from 'axios';

import { useSnackbar } from 'notistack';
import { useQuery, useQueryClient } from 'react-query';

import { InputBase, TableSortLabel, Box } from '@mui/material';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';

import removeAccents from 'remove-accents';

import styles from './styles.module.scss'

import Search from '../../components/icons/Search';
import { PageTitle } from '../../components/PageTitle/PageTitle';

import { useMutation } from 'react-query';

let timer
export default function NetworkHomeCIEA() {
  const { server } = useDorothy();
  const { changeRoute } = useRouter();
  const queryClient = useQueryClient();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const InputBaseStyled = InputBase;
  const searchInputRef = useRef(null);

  const [searchField, _searchField] = useState('');
  const [searchFieldFilter, _searchFieldFilter] = useState('');

  const [order, _order] = useState('name');
  const [direction, _direction] = useState('asc');
  const [total, _total] = useState(0);

  const [policies, _policies] = useState(null);

  const [showNIDialog, _showNIDialog] = useState(false);

  const { data } = useQuery(
    ['user_policies_list', { order, direction }],
    {
      queryFn: async () => (await axios.get(`${server}ppea/mine?direction=${direction}`)).data,
    }
  );

  useEffect(() => {
    if (!data) return;

    let prepared = [...data.entities];

    if (searchFieldFilter.trim().length) {
      prepared = prepared.filter(po =>
        removeAccents(po.name.toLowerCase()).includes(removeAccents(searchFieldFilter.trim().toLocaleLowerCase())),
      );
    }

    _total(prepared.length);

    // filters
    _policies(prepared);
  }, [data, searchFieldFilter])

  const mutation = {
    create: useMutation(name => axios.post(`${server}ppea`, { nome: name }), {
        onSuccess: () => {
          queryClient.invalidateQueries(`user_policies_list`)
        },
    }),
};

  const orderBy = columnName => {
    if (order === columnName) _direction(direction === 'asc' ? 'desc' : 'asc');
    else {
      _order(columnName);
      _direction('desc');
    }
  };

  const doParticipate = async (isADM, policyId) => {
    const snackKey = enqueueSnackbar('Enviando pedido de participação...', {
      persist: true,
      anchorOrigin: {
        vertical: 'top',
        horizontal: 'right',
      },
    });

    const { data } = await axios.post(
      `${server}ppea/${policyId}/participate`,
      {
        isADM,
      },
    );

    closeSnackbar(snackKey);

    if (data.success) {
      enqueueSnackbar('Seu pedido de participação foi enviado! Uma notificação será enviada, no momento da aprovação', {
        variant: 'success',
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'right',
        },
      });

      queryClient.invalidateQueries(`user_policies_list`);
    } else {
      if (data.error === 'already_member') {
        enqueueSnackbar('Você já é membro deste grupo!', {
          variant: 'error',
          anchorOrigin: {
            vertical: 'top',
            horizontal: 'right',
          },
        });
      } else if (data.error === 'already_in_list') {
        enqueueSnackbar('Você já está na lista de aprovação deste grupo!', {
          variant: 'error',
          anchorOrigin: {
            vertical: 'top',
            horizontal: 'right',
          },
        });
      } else {
        enqueueSnackbar('Erro ao enviar seu pedido de participação! Por favor, entre em contato com a administração', {
          variant: 'error',
          anchorOrigin: {
            vertical: 'top',
            horizontal: 'right',
          },
        });
      }
    }
  };

  const handleSearch = (e) => {
    _searchField(e.target.value)

    if (timer) clearTimeout(timer);
    timer = setTimeout(() => _searchFieldFilter(e.target.value), 500);
  }

  const handleNInitiative = async name => {
    if (!name || !name.length) return;

    const snackKey = enqueueSnackbar('Criando a iniciativa..', {
      persist: true,
      anchorOrigin: {
        vertical: 'top',
        horizontal: 'right',
      },
    });

    /* save */
    try {
      const { data } = await mutation.create.mutateAsync(name);

      closeSnackbar(snackKey);

      enqueueSnackbar('Iniciativa gravada com sucesso!', {
        variant: 'success',
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'right',
        },
      });

      _showNIDialog(false);
      window.location = `/colabora/politica/${data.communityId}`; /* TODO: melhorar */
    } catch (error) {
      closeSnackbar(snackKey);

      console.error(error);

      enqueueSnackbar('Erro ao gravar a iniciativa!', {
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

      <div className="page width-limiter tbox-fixed">
        <div className="page-header">
          <PageTitle title={'Políticas (' + total + ')'} />
          <div className="page-header-buttons">
            <button className="button-primary" onClick={()=>_showNIDialog(true)}>

              Nova política
            </button>
          </div>
        </div>
        <div className="page-content">
          <div className="page-body">
            <div className="tablebox limit-height">
              <div className="tbox-header">
                <InputBaseStyled
                  spellCheck="false"
                  className="tbox-search"
                  startAdornment={<Search onClick={() => searchInputRef.current?.focus()} />}
                  inputRef={searchInputRef}
                  placeholder="Pesquisar..."
                  inputProps={{ 'aria-label': 'pesquisar grupos' }}
                  value={searchField}
                  onChange={handleSearch}
                />
              </div>
              <div className="tbox-body">
                <table className="tbox-table">
                  <thead>
                    <tr>
                      <th>
                        <TableSortColumn
                          text="Políticas"
                          column="name"
                          order={order}
                          direction={direction}
                          onClick={orderBy}
                        />
                      </th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>

                    {policies && policies.map(row => (
                      <tr className="tbox-row" key={row.id}>
                        <td>{row.name}</td>
                        <td className={`tbox-table-actions ${styles.actions}`}>
                          {row.is_requesting && <div className={styles.sent}>Solicitação enviada</div>}
                          {!row.is_requesting && <>
                            {row.is_member && <>
                              <button className={`button-primary ${styles.action}`} onClick={() => changeRoute({ community: row.community_id })}>
                                Acessar
                              </button>
                            </>}
                            {!row.is_member && <>
                              {!row.has_members && <button className={`button-outline ${styles.action}`} onClick={() => doParticipate(true, row.id)}>
                                sou o responsável
                              </button>}
                              <button className={`button-primary ${styles.action}`} onClick={() => doParticipate(false, row.id)}>
                                colaborar
                              </button>
                            </>}
                          </>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        <Box display="flex" justifyContent="space-between"></Box>
      </div>

      <NewInitiativeDialog open={!!showNIDialog} type={showNIDialog} onCreate={handleNInitiative} onClose={() => _showNIDialog(false)} />
    </>
  );
}

function TableSortColumn({ text, column, order, direction, onClick }) {
  return (
    <>
      <TableSortLabel
        className="tbox-table-sortlabel"
        active={order === column}
        direction={direction === 'desc' ? 'asc' : 'desc'}
        onClick={() => onClick(column)}
      >
        {text}
      </TableSortLabel>
    </>
  );
}



function NewInitiativeDialog({ open, type, onCreate, onClose }) {
  const [name, _name] = useState('');

  useEffect(() => {
    if (open) _name('');
  }, [open]);

  return (
    <div>
      <Dialog
        open={open}
        onClose={onClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        maxWidth="md"
        fullWidth
      >
        <DialogTitle id="alert-dialog-title">Nova iniciativa de PPEA</DialogTitle>
        <DialogContent>
          <div className="row">
            <div className="col-xs-12">
              <TextField
                className="input-text"
                label="Nome da nova iniciativa"
                value={name}
                onChange={e => _name(e.target.value)}
              />
            </div>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => onClose()} autoFocus>
            Cancelar
          </Button>
          <button className="button-primary" onClick={() => onCreate(name)}>
            Criar
          </button>
        </DialogActions>
      </Dialog>
    </div>
  );
}