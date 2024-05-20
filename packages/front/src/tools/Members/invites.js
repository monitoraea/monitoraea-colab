import { useState } from 'react';
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

import { useQuery, useMutation, useQueryClient } from 'react-query';

import axios from 'axios';

import { useRouter, useDorothy } from 'dorothy-dna-react';

import ConfirmationDialog from '../../components/ConfirmationDialogAdvanced';

const Invites = () => {
    const { server } = useDorothy();
    const { currentCommunity } = useRouter();
    const queryClient = useQueryClient();

    const [page, _page] = useState(1);
    const [order, _order] = useState('name');
    const [direction, _direction] = useState('desc');
    const [perPage, _perPage] = useState(10);

    const [toRemove, _toRemove] = useState(null);

    const { data } = useQuery(
        ['invites_list', { community: currentCommunity.id, page, order, direction, perPage }],
        {
            queryFn: async () => (await axios.get(`${server}gt/${currentCommunity.id}/invites/?page=${page}&order=${order}&direction=${direction === 'asc' ? 'desc' : 'asc'}&limit=${perPage}`)).data,
        }
    );

    const mutations = {
        remove: useMutation((entity) => {
            return axios.delete(`${server}gt/${currentCommunity.id}/invites/${entity.id}`);
        }, { onSuccess: () => queryClient.invalidateQueries('invites_list') }),
    }

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

    return (
        <div className="page-content">
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
                                            {/* TODO: da para simplificar? */}
                                            <TableSortColumn text="Nome" column="name" order={order} direction={direction} onClick={orderBy} />
                                        </th>
                                        <th>
                                            <TableSortColumn text="E-mail" column="email" order={order} direction={direction} onClick={orderBy} />
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
                                                {row.name}
                                            </td>
                                            <td>
                                                {row.email}
                                            </td>
                                            <td className='tbox-table-actions'>
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
                    content="Confirma a remoção deste convite?"
                    confirmButtonText="Remover"
                    onClose={handleConfirmation}
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

export default Invites;