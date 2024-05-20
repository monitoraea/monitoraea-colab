import { useState, useEffect } from 'react';
import {
    Box,
    styled,
    TableBody,
    TableRow,
    TableSortLabel,
    Tooltip,
    IconButton,
    TablePagination,
} from '@mui/material';

import Trash from '../../components/icons/Trash';

import { ReactComponent as Approve } from '../../components/icons/user-check.svg';

import { useQuery, useMutation, useQueryClient } from 'react-query';

import axios from 'axios';

import { useRouter, useDorothy } from 'dorothy-dna-react';

import ConfirmationDialog from '../../components/ConfirmationDialogAdvanced';

import { useSnackbar } from 'notistack';

import dayjs from 'dayjs';

import Filters from '../../components/Filters';
import { filtersToURL } from '../../components/Filters/utils';
import ChooseParticipationType from '../../components/Filters/ChooseParticipationType';

const filterOptions = [
    {
        title: "por responsab.",
        type: "participation_type",
        chooser: ChooseParticipationType,
        incompatibleWith: []
    },
];

const Participations = () => {
    const { server } = useDorothy();
    const { currentCommunity } = useRouter();
    const queryClient = useQueryClient();
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    const [page, _page] = useState(1);
    const [order, _order] = useState('createdAt');
    const [direction, _direction] = useState('asc');
    const [perPage, _perPage] = useState(10);

    const [toApprove, _toApprove] = useState(null);
    const [toRemove, _toRemove] = useState(null);

    const [filters, _filters] = useState([]);
    const [urlFilters, _urlFilters] = useState('');

    const { data } = useQuery(
        ['participation_list', { community: currentCommunity.id, page, order, direction, perPage, urlFilters }],
        {
            queryFn: async () => (await axios.get(`${server}gt/${currentCommunity.id}/participation/?page=${page}&order=${order}&direction=${direction === 'asc' ? 'desc' : 'asc'}&limit=${perPage}${urlFilters}`)).data,
        }
    );

    const mutations = {
        remove: useMutation((entity) => {
            return axios.delete(`${server}gt/${currentCommunity.id}/participation/${entity.id}`);
        }, { onSuccess: () => queryClient.invalidateQueries('participation_list') }),
        approve: useMutation((entity) => {
            return axios.put(`${server}gt/${currentCommunity.id}/participation/${entity.id}`);
        }, { onSuccess: () => queryClient.invalidateQueries('participation_list') }),
    }

    useEffect(() => {
        if (!filters) return;

        _urlFilters(filtersToURL(filters));
        _page(1);
        _order('createdAt');
        _direction('asc');
    }, [filters]);

    const orderBy = (columnName) => {
        _page(1);
        if (order === columnName) _direction(direction === 'asc' ? 'desc' : 'asc')
        else {
            _order(columnName);
            _direction('desc');
        }
    }

    const remove = (entity) => {
        _toRemove(entity);
    }

    const handleConfirmation = async (action) => {
        if (action === 'confirm') await mutations.remove.mutateAsync(toRemove);

        _toRemove(null);
    }

    const approve = (entity) => {
        _toApprove(entity);
    }

    const handleConfirmationApprove = async (action) => {
        if (action === 'confirm') {

            const snackKey = enqueueSnackbar('Aprovando a solicitação...', {
                persist: true,
                anchorOrigin: {
                    vertical: 'top',
                    horizontal: 'right',
                },
            });

            try {
                await mutations.approve.mutateAsync(toApprove);

                closeSnackbar(snackKey);

                enqueueSnackbar('Solicitação aprovada com sucesso!', {
                    variant: 'success',
                    anchorOrigin: {
                        vertical: 'top',
                        horizontal: 'right',
                    },
                });

            } catch (error) {
                closeSnackbar(snackKey);

                console.error(error);

                enqueueSnackbar('Erro ao aprovar a solicitação!', {
                    variant: 'error',
                    anchorOrigin: {
                        vertical: 'top',
                        horizontal: 'right',
                    },
                });
            }
        }

        _toApprove(null);
    }

    return (
        <div className="page-content mb-5">
            <div className="page-sidebar sticky">
                <div className="sidebar-body">
                    <Filters filters={filters} options={filterOptions} onChange={_filters} />
                </div>
            </div>
            <div className="page-body">

                {data && <>
                    <div className="tablebox">
                        <div className="tbox-body">
                            <table className='tbox-table'>
                                <thead>
                                    <tr>
                                        <th>
                                            <TableSortColumn text="ID" column="id" order={order} direction={direction} onClick={orderBy} />
                                        </th>
                                        <th>
                                            <TableSortColumn text="Data de solicitação" column="createdAt" order={order} direction={direction} onClick={orderBy} />
                                        </th>
                                        <th>
                                            <TableSortColumn text="Nome" column="name" order={order} direction={direction} onClick={orderBy} />
                                        </th>
                                        {currentCommunity.alias === 'adm' && <th>
                                            <TableSortColumn text="Grupo de trabalho" column="community_name" order={order} direction={direction} onClick={orderBy} />
                                        </th>}
                                        <th>
                                            <TableSortColumn text="Responsável" column="adm" order={order} direction={direction} onClick={orderBy} />
                                        </th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <TableBody>
                                    {data.entities.map(row => (
                                        <StyledTableRow key={row.id}>
                                            <td>
                                                #{row.id}
                                            </td>
                                            <td>
                                                {dayjs(row.createdAt).format('DD/MM/YYYY')}
                                            </td>
                                            <td>
                                                {row.name}
                                            </td>
                                            {currentCommunity.alias === 'adm' && <td>
                                                {row.community_name}
                                            </td>}
                                            <td>
                                                {row.adm ? 'sim' : 'não'}
                                            </td>
                                            <td className='tbox-table-actions'>
                                                <div>
                                                    <Tooltip title="Aprovar"><IconButton onClick={() => approve(row)}><Approve /></IconButton></Tooltip>
                                                </div>
                                                <div>
                                                    <Tooltip title="Remover"><IconButton onClick={() => remove(row)}><Trash /></IconButton></Tooltip>
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
                        onRowsPerPageChange={(e) => { _perPage(e.target.value); _page(1); }}
                    />
                </>}
                <Box display="flex" justifyContent="space-between">
                </Box>

                <ConfirmationDialog
                    open={!!toRemove}
                    content="Confirma a remoção desta solicitação?"
                    confirmButtonText="Remover"
                    onClose={handleConfirmation}
                />

                <ConfirmationDialog
                    open={!!toApprove}
                    content="Confirma a aprovação desta solicitação?"
                    confirmButtonText="Aprovar"
                    onClose={handleConfirmationApprove}
                />

            </div>
        </div>
    );
};

function TableSortColumn({ text, column, order, direction, enabled = true, onClick }) {
    return (<>
        {!enabled && <>{text}</>}
        {enabled && <TableSortLabel
            className='tbox-table-sortlabel'
            active={order === column}
            direction={direction}
            onClick={() => onClick(column)}
        >
            {text}
        </TableSortLabel>}
    </>)
}

const StyledTableRow = styled(TableRow)({ '&:last-child td, &:last-child th': { border: 0 } });

export default Participations;