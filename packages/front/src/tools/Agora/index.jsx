import React, { useEffect, useState } from "react";
import Card from '../../components/Card';
import { PageTitle } from '../../components/PageTitle/PageTitle';

import { Flow, useRouter, useDorothy, useUser } from 'dorothy-dna-react';
import FlowRenderer from "../../components/FlowRenderer";

import {
    FormControl,
    Select,
    MenuItem,
    InputLabel,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    FormGroup,
    FormControlLabel,
    Switch,
} from '@mui/material';

import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';

import { useSnackbar } from 'notistack';

export default function Agora() {
    /* hooks */
    const { server } = useDorothy();
    const { user } = useUser();
    const { currentCommunity } = useRouter();
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();
    const queryClient = useQueryClient();

    const { data } = useQuery(['following_status'], {
        queryFn: async () => (await axios.get(`${server}user/${user.id}/following/room_c${currentCommunity.id}_t1`)).data,
        enabled: !!user && !!currentCommunity,
    });

    /* state */
    const [type, _type] = useState(null);
    const [message, _message] = useState('');
    const [errors, _errors] = useState({});
    const [confirming, _confirming] = useState(false);
    const [following, _following] = useState(null);    

    useEffect(() => {
        if (!!data) {
            _following(data?.following);
        }
    }, [data])

    const mutations = {
        sendBroadcast: useMutation(
            () => {
                return axios.post(`${server}gt/broadcasting`, {
                    type,
                    message,
                });
            },
        ),
        changeFollowing: useMutation(
            (following) => {
                return axios.put(`${server}user/${user.id}/follow`, {
                    room: `room_c${currentCommunity.id}_t1`,
                    following: following ? 1 : 0,
                    communityId: currentCommunity.id,
                });
            },
            {
              onSuccess: () => {
                queryClient.invalidateQueries('following_status');
              },
            },
        ),
    }

    const handleSendBroadcast = () => {

        let hasErrors = false;
        let newErrors = {};

        if (!type) {
            newErrors.type = true;
            hasErrors = true;
        }
        if (message.trim().length === 0) {
            newErrors.message = true;
            hasErrors = true;
        }

        _errors(newErrors);

        if (hasErrors) return;

        _confirming(true);
    }

    const handleConfirmSendBroadcast = async () => {
        _confirming(false);

        const snackKey = enqueueSnackbar('Enviando...', {
            /* variant: 'info', */
            /* hideIconVariant: true, */
            persist: true,
            anchorOrigin: {
                vertical: 'top',
                horizontal: 'center',
            },
        });

        try {


            await mutations.sendBroadcast.mutateAsync();

            _type(null);
            _message('');

            closeSnackbar(snackKey);

            enqueueSnackbar('Envio efetuado com sucesso!', {
                variant: 'success',
                anchorOrigin: {
                    vertical: 'top',
                    horizontal: 'right',
                },
            });
        } catch (error) {
            closeSnackbar(snackKey);

            console.error(error);

            enqueueSnackbar('Erro ao enviar notificações!', {
                variant: 'error',
                anchorOrigin: {
                    vertical: 'top',
                    horizontal: 'right',
                },
            });
        }
    }

    const changeFollowing = async (e) => {
        _following(e.target.checked);
        await mutations.changeFollowing.mutateAsync(e.target.checked);
    }

    return (<>
        {/* flow geral de comunidade especifica */}
        <div className="page width-limiter">
            <div className="page-header">
                <PageTitle title="Fluxo" />
            </div>
            <div className="page-content">
                <div className="page-body">
                    <Flow isCommunity={true}>
                        <FlowRenderer />
                    </Flow>
                </div>
                <div className="page-sidebar">
                    <Card title="sobre o fluxo">
                        <p className="pt-1 px-3 pb-3">
                            Este é o fluxo do grupo de trabalho de {currentCommunity ? currentCommunity.name : '...'}.
                            {following !== null && <div>
                                <FormGroup>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={!!following}
                                                onChange={changeFollowing}
                                            />
                                        }
                                        label="Seguindo"
                                    />
                                </FormGroup>
                            </div>}
                        </p>
                    </Card>

                    {currentCommunity.id === 1 && <Card title="Envio de notificação em massa">
                        <p className="pt-1 px-3 pb-3">
                            <FormControl fullWidth>
                                <InputLabel>
                                    Para quem?
                                </InputLabel>
                                <Select
                                    label="Para quem?"
                                    className="input-select"
                                    value={type || 'none'}
                                    onChange={(e) => _type(e.target.value)}
                                    error={errors.type}
                                >
                                    <MenuItem value="none"> -- selecione -- </MenuItem>
                                    <MenuItem value="all">Todos os grupos</MenuItem>
                                    <MenuItem value="projects">Iniciativas</MenuItem>
                                    <MenuItem value="supporters">Facilitadores</MenuItem>
                                </Select>
                            </FormControl>
                        </p>
                        <p className="pt-1 px-3 pb-3">
                            <TextField
                                label="mensagem"
                                className="input-text"
                                value={message}
                                onChange={e => _message(e.target.value)}
                                multiline
                                rows={8}
                                error={errors.message}
                            />
                        </p>
                        <p className="pt-1 px-3 pb-3">
                            <button className="button-primary" onClick={handleSendBroadcast}>
                                Enviar
                            </button>
                        </p>
                    </Card>}
                </div>
            </div>
        </div>

        <Dialog
            open={confirming}
            onClose={() => _confirming(false)}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
            fullWidth
            maxWidth="sm"
        >
            <DialogTitle id="alert-dialog-title">Confirmação de envio de notificação em massa</DialogTitle>
            <DialogContent id="alert-dialog-description">
                O envio de noticações em massa é irreversível!
            </DialogContent>
            <DialogActions>
                <button className="button-primary" onClick={handleConfirmSendBroadcast}>
                    Enviar
                </button>
                <Button onClick={() => _confirming(false)} autoFocus>
                    Cancelar
                </Button>
            </DialogActions>
        </Dialog>
    </>)
}