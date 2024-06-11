import React from 'react';

import { useState, useEffect } from 'react';
import { Box, styled, TableBody, TableRow, TableSortLabel, Tooltip, IconButton, TablePagination } from '@mui/material';

import Plus from '../../components/icons/Plus';
import { PageTitle } from '../../components/PageTitle/PageTitle';
import Edit from '../../components/icons/Edit';
import Trash from '../../components/icons/Trash';

import { ToolMenuContainer } from 'dorothy-dna-react';
import SubMenuRenderer from '../../components/SubMenuRenderer';

import { useQuery, useMutation, useQueryClient } from 'react-query';

import axios from 'axios';

import { useRouter, useDorothy } from 'dorothy-dna-react';

import Manager from './manager';

import ConfirmationDialog from '../../components/ConfirmationDialogAdvanced';

import { types as helpbox_types } from './formFields';
import { portals } from './dynamicContents';

// const filterOptions = [];

function types(type) {
  switch (type) {
    case 'page':
      return 'Página';
    case 'helpbox':
      return 'Conteúdo auxiliar';
    case 'learning':
      return 'Processo formativo';
    case 'publication':
      return 'Publicação';
    case 'faq':
      return 'Pergunta frequente';
    default:
      return 'Novidade';
  }
}

const Contents = () => {
  const { server } = useDorothy();
  const { currentCommunity, changeRoute, params } = useRouter();
  const queryClient = useQueryClient();

  const [page, _page] = useState(1);
  const [order, _order] = useState('title');
  const [direction, _direction] = useState('desc');
  const [perPage, _perPage] = useState(10);

  // const [filters, _filters] = useState([]);
  // const [urlFilters, _urlFilters] = useState('');
  // const [isLastAFilter, _isLastAFilter] = useState(false);

  const [managing, _managing] = useState(null); /* null, 'novo' or content id */

  const [toRemove, _toRemove] = useState(null);

  const { data } = useQuery(
    ['contents_list', { community: currentCommunity.id, page, order, direction, perPage }],
    {
      queryFn: async () =>
        (
          await axios.get(
            `${server}content/?communityId=${currentCommunity.id}&page=${page}&order=${order}&direction=${direction === 'asc' ? 'desc' : 'asc'
            }&limit=${perPage}`,
          )
        ).data,
    },
  );

  const mutations = {
    remove: useMutation(
      entity => {
        return axios.delete(`${server}content/${entity.id}`);
      },
      { onSuccess: () => queryClient.invalidateQueries('contents_list') },
    ),
  };

  useEffect(() => {
    if (!params) return;
    if (params.length) _managing(params[0]);
    else _managing(null);
  }, [params]);

  /*   useEffect(() => {
      if (!filters) return;
  
      _isLastAFilter(filters.find(f => f.type === 'last'));
      _urlFilters(filtersToURL(filters));
      _page(1);
      _order('title');
      _direction('desc');
    }, [filters]); */

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

  return (
    <>
      {!managing && (
        <>
          <div className="page tbox-fixed">
            <div className="page-header">
              <PageTitle title={`Conteúdos ${data ? `(${data.total})` : ''}`} />
              <div className="page-header-buttons">
                <div>
                  <button className="button-primary" onClick={() => changeRoute({ params: ['novo'] })}>
                    <Plus></Plus>
                    adicionar
                  </button>
                </div>
              </div>
            </div>
            <div className="page-content">
              <div className="page-sidebar">
                <div className="sidebar-body">
                  <ToolMenuContainer submenu>
                    <SubMenuRenderer />
                  </ToolMenuContainer>
                </div>
              </div>
              <div className="page-body">
                {data && (
                  <>
                    <div className="tablebox">
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
                                  text="Título"
                                  column="title"
                                  order={order}
                                  direction={direction}
                                  onClick={orderBy}
                                />
                              </th>
                              <th>
                                <TableSortColumn
                                  text="Portal"
                                  column="portal"
                                  order={order}
                                  direction={direction}
                                  onClick={orderBy}
                                />
                              </th>
                              <th>
                                <TableSortColumn
                                  text="Tipo"
                                  column="type"
                                  order={order}
                                  direction={direction}
                                  onClick={orderBy}
                                />
                              </th>
                              <th>
                                <TableSortColumn
                                  text="Publicado"
                                  column="published"
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
                                <td>#{row.id}</td>
                                <td>{row.title}</td>
                                <td>{portals[row.portal]}</td>
                                {row.type !== 'helpbox' && <td>
                                  {types(row.type)}
                                  {['page','news'].includes(row.type) && row.level === 1 && <> (em destaque)</>}
                                </td>}
                                {row.type === 'helpbox' && <td>{types(row.type)} ({!!row.hb_type ? helpbox_types[row.hb_type] : portals[row.portal]})</td>}
                                <td>{row.published ? 'Sim' : 'Não'}</td>
                                <td className="tbox-table-actions">
                                  <div>
                                    <Tooltip title="Editar">
                                      <IconButton onClick={() => changeRoute({ params: [row.id] })}>
                                        <Edit />
                                      </IconButton>
                                    </Tooltip>
                                  </div>
                                  <div>
                                    <Tooltip title="Remover">
                                      <IconButton onClick={() => remove(row)}>
                                        <Trash />
                                      </IconButton>
                                    </Tooltip>
                                  </div>
                                </td>
                              </StyledTableRow>
                            ))}
                          </TableBody>
                        </table>
                        {/* <Manager
                    open={!!managing}
                    id={managing}
                    onClose={() => changeRoute({ params: [] })}
                    onSave={() => changeRoute({ params: [] })}
                  /> */}
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
          </div>
        </>
      )}
      {!!managing && (
        <Manager id={managing} onClose={() => changeRoute({ params: [] })} onSave={() => changeRoute({ params: [] })} />
      )}
    </>
  );
};

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

export default Contents;
