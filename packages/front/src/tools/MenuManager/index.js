import React from 'react';

import { useState, useEffect } from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';

import { PageTitle } from '../../components/PageTitle/PageTitle';
import Edit from '../../components/icons/Edit';
import Trash from '../../components/icons/Trash';
import { ReactComponent as CurvedArraw } from '../../components/icons/corner-right-down.svg';
import { ReactComponent as Plus } from '../../components/icons/plus.svg';
import { ReactComponent as Down } from '../../components/icons/arrow-down.svg';
import { ReactComponent as Up } from '../../components/icons/arrow-up.svg';
import { ReactComponent as Out } from '../../components/icons/chevrons-left.svg';

import { ToolMenuContainer } from 'dorothy-dna-react';
import SubMenuRenderer from '../../components/SubMenuRenderer';

import { useQuery, useMutation, useQueryClient } from 'react-query';

import axios from 'axios';

import { useSnackbar } from 'notistack';

import { useRouter, useDorothy } from 'dorothy-dna-react';

import ConfirmationDialog from '../../components/ConfirmationDialogAdvanced';

import { ReactComponent as ChevronRightIcon } from '../../components/icons/chevron-right.svg';
import { ReactComponent as ExpandMoreIcon } from '../../components/icons/chevron-down.svg';
import { TreeView } from '@mui/x-tree-view/TreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';

import Manager from './manager';

import styles from './styles.module.scss';

export default function MenuManager() {
    const { server } = useDorothy();
    const { changeRoute, params } = useRouter();
    const queryClient = useQueryClient();
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    const [managing, _managing] = useState(null); /* null, 'novo' or content id */

    const [menu, _menu] = useState(null);
    const [root_count, _root_count] = useState(0);

    const [toRemove, _toRemove] = useState(null);

    const [selected, _selected] = useState(null);
    const [isFirst, _isFirst] = useState(false);
    const [isLast, _isLast] = useState(false);

    const [newParentId, _newParentId] = useState(null);
    const [newOrder, _newOrder] = useState(null);

    const { data } = useQuery(
        ['menu_tree'],
        {
            queryFn: async () =>
                (
                    await axios.get(`${server}menu_portal`)
                ).data,
        },
    );

    useEffect(() => {
        if (!params) return;
        if (params.length) _managing(params[0]);
        else _managing(null);
    }, [params]);

    useEffect(() => {
        if (!!data) {
            let menu = []

            let rc = 0;
            // somente dois niveis
            for (let item of data.filter(i => !i.parent_id)) { /* root */
                rc++;
                menu.push({
                    ...item,
                    children: data.filter(i => i.parent_id === item.id)
                })
            }

            _menu(menu);
            _root_count(rc);
        }
    }, [data])

    /* useEffect(() => {
        if (!!data && !!root_count) {
            console.log({ data, root_count })
        }
    }, [data, root_count]) */

    useEffect(() => {
        if (!!selected) {
            if (!selected.parent_id) {
                const idx = menu.findIndex(i => i.id === selected.id);
                _isFirst(idx === 0);
                _isLast(idx === (root_count - 1));
                _isFirst(idx === 0);
            } else {
                const parent = menu.find(i => i.id === selected.parent_id);
                const idx = parent.children.findIndex(i => i.id === selected.id);
                _isFirst(idx === 0);
                _isLast(idx === (parent.total_children - 1));
            }
        }
    }, [selected, menu, root_count]);

    const mutations = {
        remove: useMutation(
            () => {
                return axios.delete(`${server}menu_portal/${selected.id}`);
            },
            { onSuccess: () => queryClient.invalidateQueries('menu_tree') },
        ),
        move: useMutation(
            (movement) => {
                return axios.put(`${server}menu_portal/${selected.id}/${movement}`);
            },
            { onSuccess: () => queryClient.invalidateQueries('menu_tree') },
        ),
        moveOut: useMutation(
            (root_count) => {
                return axios.put(`${server}menu_portal/${selected.id}/out`, { order: root_count });
            },
            { onSuccess: () => queryClient.invalidateQueries('menu_tree') },
        ),
    };

    const handleSelect = (e, id) => {
        const item = data.find(i => String(i.id) === id);
        _selected(item)
    }

    const handleAdd = (relation) => () => {
        if (relation === 'sibling') {
            _newParentId(selected.parent_id);
            _newOrder(selected.order + 1);
        } else {
            _newParentId(selected.id);
            _newOrder(selected.total_children);
        }

        changeRoute({ params: ['novo'] })
    }

    const handleRemove = () => {
        _toRemove(selected.id);
    }

    const handleConfirmation = async action => {
        if (action === 'confirm') {
            try {
                const snack = enqueueSnackbar('Removendo...', {
                    persist: true,
                    anchorOrigin: {
                        vertical: 'top',
                        horizontal: 'right',
                    },
                });

                await mutations.remove.mutateAsync();

                closeSnackbar(snack);
            } catch (error) {
                console.error(error);
            }
        }

        _toRemove(null);
    };

    const handleMove = (movement) => async () => {
        await mutations.move.mutateAsync(movement);
    }

    const handleMoveOut = async () => {
        await mutations.moveOut.mutateAsync(root_count);
    }

    return (
        <>
            <div className="page tbox-fixed">
                <div className="page-header">
                    <PageTitle title="Gestão de Menu" />
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
                        <div className={styles.controls}>
                            <Tooltip title="Criar item irmão">
                                <div>
                                    <IconButton onClick={handleAdd('sibling')} disabled={!selected}>
                                        <Plus />
                                    </IconButton>
                                </div>
                            </Tooltip>

                            <Tooltip title="Criar filho">
                                <div>
                                    <IconButton onClick={handleAdd('child')} disabled={!selected || !!selected?.parent_id}>
                                        <Plus />
                                        <CurvedArraw />
                                    </IconButton>
                                </div>
                            </Tooltip>  {/* so raiz */}

                            <Tooltip title="Editar">
                                <div>
                                    <IconButton onClick={() => changeRoute({ params: [selected.id] })} disabled={!selected}>
                                        <Edit />
                                    </IconButton>
                                </div>
                            </Tooltip>

                            <Tooltip title="Remover">
                                <div>
                                    <IconButton onClick={handleRemove} disabled={!selected || selected?.total_children !== 0}>
                                        <Trash />
                                    </IconButton>
                                </div>
                            </Tooltip> {/* sem filhos */}

                            <Tooltip title="Para cima">
                                <div>
                                    <IconButton onClick={handleMove('up')} disabled={!selected || isFirst}>
                                        <Up />
                                    </IconButton>
                                </div>
                            </Tooltip> {/* nao primeiro */}

                            <Tooltip title="Para baixo">
                                <div>
                                    <IconButton onClick={handleMove('down')} disabled={!selected || isLast}>
                                        <Down />
                                    </IconButton>
                                </div>
                            </Tooltip> {/* nao ultimo */}

                            <Tooltip title="Para raiz">
                                <div>
                                    <IconButton onClick={handleMoveOut} disabled={!selected?.parent_id}>
                                        <Out />
                                    </IconButton>
                                </div>
                            </Tooltip> {/* so filho ultimo */}
                        </div>

                        <hr />

                        {menu && (<Box sx={{ minHeight: 180, flexGrow: 1, maxWidth: 300 }}>
                            <TreeView /* 2 niveis somente! */
                                aria-label="file system navigator"
                                defaultCollapseIcon={<ExpandMoreIcon />}
                                defaultExpandIcon={<ChevronRightIcon />}
                                selected={selected?.id || ''}
                                onNodeSelect={handleSelect}
                            >
                                {menu.map(i => <TreeItem key={i.id} nodeId={String(i.id)} label={i.title}>
                                    {!!i.children.length && i.children.map(c => <TreeItem key={c.id} nodeId={String(c.id)} label={c.title} />)}
                                </TreeItem>)}
                            </TreeView>
                        </Box>)}
                    </div>
                </div>

                <ConfirmationDialog
                    open={!!toRemove}
                    content="Confirma a remoção desta item?"
                    confirmButtonText="Remover"
                    onClose={handleConfirmation}
                />
            </div>

            <Manager
                open={!!managing}
                id={managing}
                onClose={() => changeRoute({ params: [] })}
                onSave={() => changeRoute({ params: [] })}
                newParentId={newParentId}
                newOrder={newOrder}
            />
        </>
    );
};