import React, { useState, useEffect } from 'react';

import { useRouter, useDorothy } from 'dorothy-dna-react';

import dayjs from 'dayjs';

import { Box } from '@mui/material';
import Flag from '../../components/icons/Flag';


export default function NewOrganizationNotification({ data }) {

    const { changeRoute } = useRouter();
    const { server } = useDorothy();

    const [date, _date] = useState('');
    const [sender, _sender] = useState('');
    const [senderId, _senderId] = useState('');
    const [org, _org] = useState('');

    useEffect(() => {
        if (!data) return;

        console.log(data)

        _date(dayjs(data.createdAt).format('DD/MM/YYYY HH:mm'));
        _sender(data.user_name);
        _senderId(data.user_id);
        _org(data.content.name)

    }, [data]);

    return (<Box sx={{ marginLeft: '6.1%' }}>
        <Box sx={{ display: 'flex', marginTop: '34px', alignItems: 'center' }}>
            <Box sx={{ height: '30px', borderRadius: '50px', marginLeft: '-14px', backgroundColor: 'white', marginRight: '18px', zIndex: '999' }}>
                <Box
                    sx={{
                        '& svg': {
                            borderRadius: '50%',
                            boxShadow: '0px 0px 8px #0000001A',
                            padding: '4px',
                        },
                    }}
                >
                    <Flag size="30" />
                </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box
                    as="img"
                    sx={{
                        width: '32px',
                        borderRadius: '50%',
                        color: 'primary',
                    }}
                    src={`${server}user/${senderId}/thumb`}
                    alt="avatar"
                />
            </Box>
            <Box sx={{ marginLeft: '6px', fontSize: '16px' }}>
                <Box sx={{ display: 'flex', whiteSpace: 'nowrap', alignItems: 'center' }}>
                    <Box sx={{ fontWeight: 'bold' }}>{sender}</Box>
                    <Box sx={{ marginLeft: '6px'}}><div>criou a organização "{org}"</div></Box>
                    {data && <Box sx={{ marginLeft: '6px'}}><button className='button-outline' size="small" onClick={()=>changeRoute({ tool: 'organizacoes', params: [data.content.id] })}>acessar</button></Box>}
                </Box>
                <Box sx={{ fontSize: '14px' }}>{date}</Box>
            </Box>
        </Box>
    </Box>
    )
}

/*
<div>
    {date}{' '} 
    <><strong>{sender}</strong> enviou um pedido de ajuda na comunidade "[Comunidade]"</> - 
    {completed === null && <>...</>}
    {completed === false && <button disabled={solving} onClick={()=>changeRoute({ community })}>Acessar comunidade</button>}
    {completed === false && <button disabled={solving} onClick={()=>solve()}>Resolver</button>}
    {completed === true && <>[resolvido]</>}
</div>
*/