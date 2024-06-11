import React, { useState, useEffect } from 'react';

import dayjs from 'dayjs';
import { Box } from '@mui/material';
import robot from '../../../images/robot.png';

import styles from './styles.module.scss';

import { useMutation } from 'react-query';
import axios from 'axios';

import { useDorothy } from 'dorothy-dna-react';

import { useSnackbar } from 'notistack';

import {
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
} from '@mui/material';

export default function NewIndicatedProjectNotification({ data }) {
    const { server } = useDorothy();
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    const [date, _date] = useState('');
    const [open, _open] = useState(false);

    const [contact_name, _contact_name] = useState('');
    const [contact_email, _contact_email] = useState('');
    const [contact_phone, _contact_phone] = useState('');
    const [website, _website] = useState('');

    const mutations = {
        sendData: useMutation(
            (withData) => {
                return axios.post(`${server}project/indication/${data.content.indicationId}`, { 
                    // ...data.content, 
                    withData,
                    notificationId: data.id,
                    contact_name,
                    contact_email,
                    contact_phone,
                    website,
                });
            },
        ),
    }

    useEffect(() => {
        if (!data) return;

        _date(dayjs(data.createdAt).format('DD/MM/YYYY HH:mm'));

        _contact_name('');
        _contact_email('');
        _contact_phone('');
        _website('');
    }, [data]);

    const handleSave = async (withData) => {

        const snackKey = enqueueSnackbar('Enviando resposta...', {
            /* variant: 'info', */
            /* hideIconVariant: true, */
            persist: true,
            anchorOrigin: {
                vertical: 'top',
                horizontal: 'center',
            },
        });

        try {
            await mutations.sendData.mutateAsync(withData);

            closeSnackbar(snackKey);

            enqueueSnackbar('Resposta enviada com sucesso!', {
                variant: 'success',
                anchorOrigin: {
                    vertical: 'top',
                    horizontal: 'right',
                },
            });

            _open(false);
        } catch (error) {
            closeSnackbar(snackKey);

            console.error(error);

            enqueueSnackbar('Erro ao enviar a resposta!', {
                variant: 'error',
                anchorOrigin: {
                    vertical: 'top',
                    horizontal: 'right',
                },
            });
        }
    }

    return (<>
        <Box
            sx={{
                padding: '24px',
                marginTop: '48px',
                backgroundColor: 'white',
                position: 'relative',
                zIndex: '1',
                minHeight: '100px',
                width: '100%',
                boxShadow: '0px 0px 8px #0000001A',
                borderRadius: '8px',
            }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex' }}>
                    <Box
                        as="img"
                        src={robot}
                        alt="salve"
                        sx={{ borderRadius: '50%', width: '48px', height: '48px' }}
                    />
                    <Box sx={{ marginLeft: '8px' }}>
                        <Box sx={{ fontWeight: 'bold', fontSize: '16px' }}>
                            Sua iniciativa foi indicada
                        </Box>
                        <Box sx={{ fontSize: '14px' }}>{date}</Box>
                    </Box>
                </Box>
                {/* <Box>
            <ArrowRightCircle size="32px" />
          </Box> */}
            </Box>
            <Box sx={{ marginTop: '8px' }}>
                {/* {JSON.stringify(data)} */}

                <div className={styles.mainDiv}>
                    <div>
                        <div>
                            Alguém da comunidade da sua iniciativa indicou a iniciativa "{data.content.indicationName}"
                            {data.content.type === 'apoia' && <span> como uma de suas apoiadoras.</span>}
                            {data.content.type === 'apoiada' && <span> como uma de suas iniciativas apoiadas.</span>} 
                            {' '}Precisamos de algumas informações sobre essa iniciativa. Vocês poderiam dar mais detalhes sobre esta iniciativa?
                        </div>
                    </div>
                    {data && !data.content.answered && <div className={styles.actions}>

                        <button className='button-primary' size="small" onClick={() => _open(true)}>Sim</button>
                        <button className='button-outline' size="small" onClick={() => handleSave(false)}>Não</button>

                    </div>}
                </div>
            </Box>
        </Box>

        <Dialog
            open={open}
            onClose={() => _open(false)}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
            fullWidth
            maxWidth="sm"
        >
            <DialogTitle id="alert-dialog-title">Mais informações sobre a iniciativa</DialogTitle>
            <DialogContent id="alert-dialog-description">
                <div className='row'>
                    <div className="col-md-12">
                        <TextField
                            label="Nome do contato"
                            className="input-text"
                            value={contact_name}
                            onChange={e => _contact_name(e.target.value)}
                        />
                    </div>
                </div>
                <div className='row'>
                    <div className="col-md-12">
                        <TextField
                            label="E-mail do contato"
                            className="input-text"
                            value={contact_email}
                            onChange={e => _contact_email(e.target.value)}
                        />
                    </div>
                </div>
                <div className='row'>
                    <div className="col-md-12">
                        <TextField
                            label="Telefone do contato"
                            className="input-text"
                            value={contact_phone}
                            onChange={e => _contact_phone(e.target.value)}
                        />
                    </div>
                </div>
                <div className='row'>
                    <div className="col-md-12">
                        <TextField
                            label="Website"
                            className="input-text"
                            value={website}
                            onChange={e => _website(e.target.value)}
                        />
                    </div>
                </div>
            </DialogContent>
            <DialogActions>
                <button className="button-primary" onClick={() => handleSave(true)}>
                    Enviar
                </button>
                <Button onClick={() => _open(false)} autoFocus>
                    Cancelar
                </Button>
            </DialogActions>
        </Dialog>
    </>)
}