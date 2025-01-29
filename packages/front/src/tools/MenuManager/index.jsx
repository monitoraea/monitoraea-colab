import React from 'react';

import { useState, useEffect } from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';

import { PageTitle } from '../../components/PageTitle/PageTitle';
import Edit from '../../components/icons/Edit';
import Trash from '../../components/icons/Trash';
import CurvedArraw from '../../components/icons/corner-right-down.svg?react';
import Plus from '../../components/icons/plus.svg?react';
import Down from '../../components/icons/arrow-down.svg?react';
import Up from '../../components/icons/arrow-up.svg?react';
import Out from '../../components/icons/chevrons-left.svg?react';

import { ToolMenuContainer } from 'dorothy-dna-react';
import SubMenuRenderer from '../../components/SubMenuRenderer';

import { useQuery, useMutation, useQueryClient } from 'react-query';

import axios from 'axios';

import { useSnackbar } from 'notistack';

import { useRouter, useDorothy } from 'dorothy-dna-react';

import ConfirmationDialog from '../../components/ConfirmationDialogAdvanced';

import ChevronRightIcon from '../../components/icons/chevron-right.svg?react';
import ExpandMoreIcon from '../../components/icons/chevron-down.svg?react';
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
            
            _menu(data);
            _root_count(data.children.length);
        }
    }, [data])


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
                return axios.put(`${server}menu_portal/${selected.id}/out`);
            },
            { onSuccess: () => queryClient.invalidateQueries('menu_tree') },
        ),
    };

    const getItemById = (id) => {
         function findChildren(current_item, id) {
            let found = null;
            for(let c of current_item.children) {

                if(String(c.id) === id) {
                    found = c;
                    break;
                }

                found = findChildren(c, id);
                if(found) break;
            }
            return found;
         }
         return findChildren(menu, id);
    }

    const handleSelect = (e, id) => {
        const item = getItemById(id);
        _selected(item);
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
                                    <IconButton onClick={handleAdd('child')} disabled={!selected || !selected?.can_children}>
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
                                    <IconButton onClick={handleMove('up')} disabled={!selected || selected.first}>
                                        <Up />
                                    </IconButton>
                                </div>
                            </Tooltip> {/* nao primeiro */}

                            <Tooltip title="Para baixo">
                                <div>
                                    <IconButton onClick={handleMove('down')} disabled={!selected || selected.last}>
                                        <Down />
                                    </IconButton>
                                </div>
                            </Tooltip> {/* nao ultimo */}

                            <Tooltip title="Para o nível superior">
                                <div>
                                    <IconButton onClick={handleMoveOut} disabled={!selected?.parent_id}>
                                        <Out />
                                    </IconButton>
                                </div>
                            </Tooltip> {/* so filho ultimo */}
                        </div>

                        <hr />

                        {menu && (<Box sx={{ minHeight: 180, flexGrow: 1, maxWidth: '80vh' }}>
                            <TreeView /* 2 niveis somente! */
                                aria-label="file system navigator"
                                defaultCollapseIcon={<ExpandMoreIcon />}
                                defaultExpandIcon={<ChevronRightIcon />}
                                selected={selected?.id || ''}
                                onNodeSelect={handleSelect}
                            >
                                <TreeLevel level={menu} />
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

function TreeLevel({ level }) {
    return (<>
        {level.children.map(i => <TreeItem key={i.id} nodeId={String(i.id)} label={i.title}>
            {!!i.children.length && <TreeLevel key={i.id} level={i} />}
        </TreeItem>)}
    </>)
}