import React, { useState, useEffect } from 'react';

import dayjs from 'dayjs';
import { Box } from '@mui/material';
import robot from '../../images/robot.png';

import styles from './IndicationNotification.module.scss';

import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';

import { useDorothy } from 'dorothy-dna-react';

import { useSnackbar } from 'notistack';

export default function NewUserNotification({ data }) {
    const { server } = useDorothy();
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();
    const queryClient = useQueryClient();

    const [date, _date] = useState('');
    const [answered, _answered] = useState(null);
    const [answering, _answering] = useState(false);

    const { data: answerData } = useQuery(['indic_notif', { 
        sourceProjectId: data.content.sourceProjectId,
        type: data.content.type,
        sourceDraftId: data.content.sourceDraftId,
        indicationId: data.content.indicationId,
     }], {
        queryFn: async () => (await axios.get(`${server}project/${data.content.sourceProjectId}/relation/agreement/${data.content.type}/${data.content.sourceDraftId}/${data.content.indicationId}`)).data,
        enabled: !!data.content,
    });

    const mutations = {
        sendAgreement: useMutation(
            (agreement) => {
                return axios.put(`${server}project/${data.content.sourceProjectId}/relation/agreement`, { ...data.content, agreement });
            },
        ),
    }

    useEffect(() => {
        if (!data) return;

        queryClient.invalidateQueries('indic_notif')

        _date(dayjs(data.createdAt).format('DD/MM/YYYY HH:mm'));
    }, [data, queryClient]);

    useEffect(() => {
        if (!!answerData) _answered(answerData.agreement)
    }, [answerData])

    const answer = async (agree) => {
        _answering(true);
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
            await mutations.sendAgreement.mutateAsync(agree);

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

            enqueueSnackbar('Erro ao enviar a resposta!', {
                variant: 'error',
                anchorOrigin: {
                    vertical: 'top',
                    horizontal: 'right',
                },
            });
        } finally {

            _answering(false);
        }
    }

    return (
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
                        A iniciativa "{data.content.sourceProjectName}" indicou que sua iniciativa
                        {data.content.type === 'apoia' && <span> é uma de suas apoiadoras.</span>}
                        {data.content.type === 'apoiada' && <span> é apoiada por ela.</span>}
                    </div>
                    {answered === null && <div className={styles.actions}>

                        <button className='button-primary' size="small" disabled={answering} onClick={() => answer(true)}>Sim, reconheço</button>
                        <button className='button-outline' size="small" disabled={answering} onClick={() => answer(false)}>Não reconheço</button>

                    </div>}
                </div>
            </Box>
        </Box>
    )
}