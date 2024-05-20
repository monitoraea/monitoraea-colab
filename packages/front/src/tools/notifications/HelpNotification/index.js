import React, { useState, useEffect } from 'react';

// import axios from 'axios';
import dayjs from 'dayjs';

import { useRouter, useDorothy } from 'dorothy-dna-react';

import { Box } from '@mui/material';
import styles from './styles.module.scss';

import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';

import { useSnackbar } from 'notistack';

const tabNames = {
    informacao: 'Informações',
    conexoes: 'Conexões',
    indicadores: 'Indicadores',
    atuacao: 'Atuação',
}

export default function HelpNotification({ data }) {
    const { getCommunityData, changeRoute, currentCommunity } = useRouter();
    const { server } = useDorothy();
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();
    const queryClient = useQueryClient();

    const [date, _date] = useState('');
    const [sender, _sender] = useState('');
    const [senderId, _senderId] = useState('');
    const [communityName, _communityName] = useState('...');

    const [closing, _closing] = useState(false);

    const { data: helpStatus } = useQuery([`help_status_${data.content.help_id}`, {
        helpId: data.content.help_id,
    }], {
        queryFn: async () => (await axios.get(`${server}help/${data.content.help_id}`)).data,
        enabled: !!data.content,
    });

    /* recuperar dados da comunidade */
    useEffect(() => {
        async function fetchCompleted() {
            let communityData = await getCommunityData(data.content.communityId);
            _communityName(communityData ? communityData.name : '?')
        }

        if (!data) return;

        _date(dayjs(data.createdAt).format('DD [de] MMMM [de] YYYY [às] HH:mm'));
        _sender(data.user_name);
        _senderId(data.user_id);
        /* _community(data.content.communityId);   */

        fetchCompleted();
    }, [data, server, getCommunityData]);

    useEffect(() => {
        if (!data) return;

        queryClient.invalidateQueries(`help_status_${data.content.help_id}`)
    }, [data, queryClient]);

    /* useEffect(()=>{
        if(!!data && !!helpStatus) 
            console.log(data.content.help_id, {helpStatus})
    },[data, helpStatus]) */

    const mutations = {
        close: useMutation(
            () => {
                return axios.put(`${server}help/${data.content.help_id}/close`, {
                    communityId: data.content.communityId,
                });
            }, {
            onSuccess: () => {
                queryClient.invalidateQueries(`help_status_${data.content.help_id}`);
            },
        },
        ),
    }

    const access = () => {
        changeRoute({ community: data.content.communityId, tool: 'projeto', params: [data.content.tab] })
    }

    const closeHelpRequest = async () => {
        _closing(true);

        const snackKey = enqueueSnackbar('Resolvendo pedido de ajuda...', {
            /* variant: 'info', */
            /* hideIconVariant: true, */
            persist: true,
            anchorOrigin: {
                vertical: 'top',
                horizontal: 'center',
            },
        });

        try {


            await mutations.close.mutateAsync();

            closeSnackbar(snackKey);

            enqueueSnackbar('Pedido de ajuda resolvido com sucesso!', {
                variant: 'success',
                anchorOrigin: {
                    vertical: 'top',
                    horizontal: 'right',
                },
            });
        } catch (error) {
            closeSnackbar(snackKey);


            _closing(false);

            console.error(error);

            enqueueSnackbar('Erro ao resolver pedido de ajuda!', {
                variant: 'error',
                anchorOrigin: {
                    vertical: 'top',
                    horizontal: 'right',
                },
            });
        }
    }

    return (<Box
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
                    src={`${server}user/${senderId}/thumb`}
                    alt="salve"
                    sx={{ borderRadius: '50%', width: '48px', height: '48px' }}
                />
                <Box sx={{ marginLeft: '8px' }}>
                    <Box sx={{ fontWeight: 'bold', fontSize: '16px' }}>
                        <div className={styles.title}>
                            Pedido de Ajuda
                            <HelpStatus status={helpStatus} />
                        </div>
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

            {currentCommunity.alias !== 'projeto' && <div className={styles.mainDiv}>
                <div>
                    {sender} de <span className={styles.community} onClick={access}>"{communityName}"</span>
                    <span> pediu uma ajuda para a aba <span className={styles.field}>"{tabNames[data.content.tab]}"</span></span>
                    , com o seguinte texto: <span className={styles.text}>"{data.content.text}"</span>
                </div>
                {data && <div className={styles.actions}>

                    <button className='button-outline' size="small" onClick={access}>Acessar</button>
                    {helpStatus && !helpStatus.closedAt && <button className='button-primary' disabled={closing} size="small" onClick={closeHelpRequest}>Resolvido</button>}

                </div>}
            </div>}

            {currentCommunity.alias === 'projeto' && <div className={styles.mainDiv}>
                <div>
                    {sender} pediu uma ajuda para a aba <span className={styles.field}>"{tabNames[data.content.tab]}"</span>
                    , com o seguinte texto: <span className={styles.text}>"{data.content.text}"</span>
                </div>
                {data && helpStatus && !helpStatus.closedAt && <div className={styles.actions}>

                    <button className='button-primary' size="small" onClick={access}>Acessar</button>

                </div>}
            </div>}
        </Box>
    </Box>)
}

function HelpStatus({ status }) {
    if(!status) return (<></>);
    return (<div className={`${styles.status} ${!!status.closedAt ? styles.closed  : ''}`}>{!!status.closedAt ? 'resolvido'  : 'aberto'}</div>);
}