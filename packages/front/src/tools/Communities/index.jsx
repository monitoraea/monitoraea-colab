import { useRef, useState, useEffect } from 'react';
import { InputBase, TableSortLabel, TextField, Tooltip, IconButton, Box } from '@mui/material';
import ConfirmationDialog from '../../components/ConfirmationDialogAdvanced';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';

import Search from '../../components/icons/Search';
import Eye from '../../components/icons/Eye';
import removeAccents from 'remove-accents';
import { useDorothy, useRouter, useUser } from 'dorothy-dna-react';
import axios from 'axios';
import { PageTitle } from '../../components/PageTitle/PageTitle';
import { useSnackbar } from 'notistack';
import Trash from '../../components/icons/Trash';
/* styles */
import styles from '../../components/FreeMultiple/FreeMultiple.module.scss';
import { useQueryClient, useQuery, useMutation } from 'react-query';

import { perspeciveXentity } from '../../utils/configs';

const WorkingGroups = () => {
  const { server } = useDorothy();
  const { currentCommunity, changeRoute } = useRouter();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const searchInputRef = useRef(null);
  const queryClient = useQueryClient();

  const [workingGroupsList, _workingGroupsList] = useState([]); /* TODO: null, loading */
  const [total, _total] = useState(0); /* TODO: null */

  const [searchField, _searchField] = useState('');

  const [order, _order] = useState('name');
  const [direction, _direction] = useState('asc');
  const [toRemove, _toRemove] = useState(null);
  const [removeDialogOpen, _removeDialogOpen] = useState(false);
  const { user } = useUser();
  const [showNPDialog, _showNPDialog] = useState(false);
  const [isAdmOrMod, _isAdmOrMod] = useState(false);
  const InputBaseStyled = InputBase;

  const { data } = useQuery(['communities_list', { currentCommunity: currentCommunity.id, order, direction }], {
    queryFn: async () =>
      (await axios.get(`${server}gt/${currentCommunity.id}/?alias=${currentCommunity.alias.trim()}&order=${order}&direction=${direction}`)).data,
  });

  const mutation = {
    create: useMutation(name => axios.post(`${server}project/?communityId=${currentCommunity.id}`, { nome: name }), {
      onSuccess: () => {
        queryClient.invalidateQueries('communities_list');
      },
    }),
  };
  const mutations = {
    remove: useMutation(
      id => {
        return axios.delete(`${server}${perspeciveXentity[currentCommunity.perspective]}/${id}`);
      },
      { onSuccess: () => queryClient.invalidateQueries('communities_list') },
    ),
  };
  useEffect(() => {
    if (!data) return;

    _total(data.total);

    let prepared = [...data.entities];

    if (searchField.trim().length) {
      prepared = prepared.filter(wg =>
        removeAccents(wg.name.toLowerCase()).includes(removeAccents(searchField.trim().toLocaleLowerCase())),
      );
    }

    // filters
    _workingGroupsList(prepared);
  }, [data, searchField]);

  useEffect(() => {
    _isAdmOrMod(
      user.membership
        .map(membership => {
          return membership.id === 1 || (membership.id === currentCommunity.id && membership.type === 'adm');
        })
        .reduce((acc, curr) => acc || curr),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmOrMod, user, currentCommunity]);

  const orderBy = columnName => {
    if (order === columnName) _direction(direction === 'asc' ? 'desc' : 'asc');
    else {
      _order(columnName);
      _direction('desc');
    }
  };

  const handleNProject = async name => {
    if (!name || !name.length) return;

    const snackKey = enqueueSnackbar('Criando a Iniciativa..', {
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

      enqueueSnackbar('Iniciativa gravado com sucesso!', {
        variant: 'success',
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'right',
        },
      });

      _showNPDialog(false);
      window.location = `/colabora/projeto/${data.communityId}`; /* TODO: melhorar */
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
  const remove = id => {
    _toRemove(id);
    _removeDialogOpen(true);
  };

  const doRemove = async action => {
    if (action === 'confirm') {
      await mutations.remove.mutateAsync(toRemove);

      enqueueSnackbar('Iniciativa deletada com sucesso!', {
        variant: 'success',
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'right',
        },
      });
    }

    _toRemove(null);
    _removeDialogOpen(false);
  };

  return (
    <>
      <div className="page width-limiter tbox-fixed">
        <div className="page-header">
          <PageTitle title={'Grupos de trabalho (' + total + ')'} />
          <div className="page-header-buttons">
            {currentCommunity.id === 1 && <button className="button-primary" onClick={() => _showNPDialog(true)}>
              {/* <CheckCircle></CheckCircle> */}
              Nova iniciativa
            </button>}

            {currentCommunity.id === 1 && <button className="button-outline" onClick={() =>  window.open(`${server}project/spreadsheet`, '_blank')}>
              Baixar planilha
            </button>}
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
                  onChange={e => _searchField(e.target.value)}
                />
              </div>
              <div className="tbox-body">
                <table className="tbox-table">
                  <thead>
                    <tr>
                      <th>
                        <TableSortColumn
                          text="Grupos de trabalho"
                          column="name"
                          order={order}
                          direction={direction}
                          onClick={orderBy}
                        />
                      </th>
                      {currentCommunity.alias.trim() === 'adm' && <th>
                        <TableSortColumn
                          text="Perspectiva"
                          column="perspectiveName"
                          order={order}
                          direction={direction}
                          onClick={orderBy}
                        />
                      </th>}
                      <th>
                        <TableSortColumn
                          text="Tipo"
                          column="typeName"
                          order={order}
                          direction={direction}
                          onClick={orderBy}
                        />
                      </th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workingGroupsList.map(row => (
                      <tr className="tbox-row" key={row.id}>
                        <td>{row.name}</td>
                        {currentCommunity.alias.trim() === 'adm' && <td>{row.pespectiveName}</td>}
                        <td>{row.typeName}</td>
                        <td className="tbox-table-actions">
                          <div onClick={() => changeRoute({ community: row.id })}>
                            <Eye></Eye>
                          </div>
                          <div className={styles['svg-icon-box']}>
                            {isAdmOrMod && isAdmOrMod === true && (
                              <Tooltip title="Remover">
                                <IconButton onClick={() => remove(row.id)}>
                                  <Trash />
                                </IconButton>
                              </Tooltip>
                            )}
                          </div>
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
        <ConfirmationDialog
          open={removeDialogOpen}
          content="Confirma a remoção desta iniciativa?"
          confirmButtonText="Remover"
          onClose={doRemove}
        />
      </div>

      <NewProjectDialog open={showNPDialog} onCreate={handleNProject} onClose={() => _showNPDialog(false)} />
    </>
  );
};

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

function NewProjectDialog({ open, onCreate, onClose }) {
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
        <DialogTitle id="alert-dialog-title">Nova iniciativa</DialogTitle>
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
          <button className="button-primary" onClick={() => onCreate(name)}>Criar</button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default WorkingGroups;
