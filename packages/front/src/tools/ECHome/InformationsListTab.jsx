import { useState, useRef } from 'react';
import { Box, styled, TableBody, TableRow, TableSortLabel, Tooltip, IconButton, TablePagination, InputBase } from '@mui/material';

import { PageTitle } from '../../components/PageTitle/PageTitle';
import Edit from '../../components/icons/Edit';
import Trash from '../../components/icons/Trash';
import Plus from '../../components/icons/Plus';

import { useQuery, useMutation, useQueryClient } from 'react-query';

import axios from 'axios';

import { useRouter, useDorothy } from 'dorothy-dna-react';

import ConfirmationDialog from '../../components/ConfirmationDialogAdvanced';

import Search from '../../components/icons/Search';
import Clean from '../../components/icons/delete.svg?react';

/* components */

// import Card from '../../components/Card';

/* style */
import styles from './information.module.scss';

let timer
export default function ECHomeTab() {
  const { server } = useDorothy();
  const { changeRoute, params } = useRouter();
  const queryClient = useQueryClient();
  const InputBaseStyled = InputBase;
  const searchInputRef = useRef(null);

  const [page, _page] = useState(1);
  const [order, _order] = useState('nome');
  const [direction, _direction] = useState('desc');
  const [perPage, _perPage] = useState(10);

  const [searchField, _searchField] = useState('');
  const [searchFieldFilter, _searchFieldFilter] = useState('');

  const [managing, _managing] = useState(null); /* null, 'novo' or content id */
  const [toRemove, _toRemove] = useState(null);

  const { data } = useQuery(['educom_list', { page, order, direction, perPage, searchFieldFilter }], {
    queryFn: async () =>
      (
        await axios.get(
          `${server}educom_clima/?version=draft&page=${page}&order=${order}&direction=${direction === 'asc' ? 'desc' : 'asc'
          }&limit=${perPage}${searchFieldFilter?.length ? `&name=${searchFieldFilter}` : ''}`,
        )
      ).data,
  });

  const mutations = {
    remove: useMutation(
      id => {
        return axios.delete(`${server}educom_clima/${id}`);
      },
      { onSuccess: () => queryClient.invalidateQueries('educom_list') },
    ),
  };

  const orderBy = columnName => {
    _page(1);
    if (order === columnName) _direction(direction === 'asc' ? 'desc' : 'asc');
    else {
      _order(columnName);
      _direction('desc');
    }
  };

  const remove = entity => {
    _toRemove(entity);
  };

  const handleConfirmation = async action => {
    if (action === 'confirm') await mutations.remove.mutateAsync(toRemove);

    _toRemove(null);
  };

  const handleSearch = (e) => {
    _searchField(e.target.value)

    if (timer) clearTimeout(timer);
    timer = setTimeout(() => _searchFieldFilter(e.target.value), 500);
  }

  return (
    <>
      {!managing && (
        <>
          <div className="page-header">
            <PageTitle title={`Iniciativas ${data ? `(${data.total})` : ''}`} />
            <div className="page-header-buttons">
              <div>
                <button className="button-primary" onClick={() => changeRoute({ params: ['gerenciar', 'novo'] })}>
                  <Plus></Plus>
                  adicionar
                </button>
              </div>
            </div>
          </div>
          <div className="page-content">
            <div className="page-body">
              {data && (
                <>
                  <div className="tablebox"><div className="tbox-header">
                    <InputBaseStyled
                      spellCheck="false"
                      className="tbox-search"
                      startAdornment={<button className={styles.adornment} onClick={() => searchInputRef.current?.focus()}><Search /></button>}
                      endAdornment={<button className={styles.adornment} onClick={() => { _searchField(''); _searchFieldFilter(''); }}><Clean /></button>}
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
                                text="ID"
                                column="id"
                                order={order}
                                direction={direction}
                                onClick={orderBy}
                              />
                            </th>
                            <th>
                              {/* TODO: da para simplificar? */}
                              <TableSortColumn
                                text="Nome"
                                column="nome"
                                order={order}
                                direction={direction}
                                onClick={orderBy}
                              />
                            </th>
                          </tr>
                        </thead>
                        <TableBody>
                          {data.entities.map(row => (
                            <StyledTableRow key={row.id}>
                              <td>#{row.iniciativa_id}</td>
                              <td>{row.nome}</td>
                              <td className="tbox-table-actions">
                                <div>
                                  <Tooltip title="Editar">
                                    <IconButton onClick={() => changeRoute({ params: ['gerenciar', row.iniciativa_id] })}>
                                      <Edit />
                                    </IconButton>
                                  </Tooltip>
                                </div>
                                <div>
                                  <Tooltip title="Remover">
                                    <IconButton onClick={() => remove(row.iniciativa_id)}>
                                      <Trash />
                                    </IconButton>
                                  </Tooltip>
                                </div>
                              </td>
                            </StyledTableRow>
                          ))}
                        </TableBody>
                      </table>
                    </div>
                  </div>
                  <TablePagination
                    className="pagination"
                    component="div"
                    count={data.total}
                    page={page - 1}
                    onPageChange={(...args) => _page(args[1] + 1)}
                    rowsPerPage={perPage}
                    rowsPerPageOptions={[10, 20, 50, 100]}
                    onRowsPerPageChange={e => {
                      _perPage(e.target.value);
                      _page(1);
                    }}
                  />
                </>
              )}
            </div>
          </div>
          <Box display="flex" justifyContent="space-between"></Box>

          <ConfirmationDialog
            open={!!toRemove}
            content="Confirma a remoção desta registro?"
            confirmButtonText="Remover"
            onClose={handleConfirmation}
          />
        </>
      )}
      {!!managing && <>[TODO: MNG]</>}
    </>
  );
}

function TableSortColumn({ text, column, order, direction, enabled = true, onClick }) {
  return (
    <>
      {!enabled && <>{text}</>}
      {enabled && (
        <TableSortLabel
          className="tbox-table-sortlabel"
          active={order === column}
          direction={direction}
          onClick={() => onClick(column)}
        >
          {text}
        </TableSortLabel>
      )}
    </>
  );
}

const StyledTableRow = styled(TableRow)({ '&:last-child td, &:last-child th': { border: 0 } });
