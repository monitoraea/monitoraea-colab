import React, { useState, useEffect } from 'react';

import dayjs from 'dayjs';

import { Box } from '@mui/material';

import robot from '../../images/robot.png';

export default function NewGTADMNotification({ data }) {

    const [date, _date] = useState('');

    useEffect(() => {
        if (!data) return;

        _date(dayjs(data.createdAt).format('DD [de] MMMM [de] YYYY [às] HH:mm'));
    }, [data]);

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
                    src={robot}
                    alt="salve"
                    sx={{ borderRadius: '50%', width: '48px', height: '48px' }}
                />
                <Box sx={{ marginLeft: '8px' }}>
                    <Box sx={{ fontWeight: 'bold', fontSize: '16px' }}>
                        Sua iniciativa agora tem um novo moderador
                    </Box>
                    <Box sx={{ fontSize: '14px' }}>{date}</Box>
                </Box>
            </Box>
            {/* <Box>
          <ArrowRightCircle size="32px" />
        </Box> */}
        </Box>
        <Box sx={{ marginTop: '8px' }}>
            "{data.content.new_adm_name}" é o novo moderador do grupo de trabalho da sua iniciativa
        </Box>
    </Box>)
}