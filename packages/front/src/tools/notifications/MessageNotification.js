import React, { useState, useEffect } from 'react';

import dayjs from 'dayjs';

import { Box } from '@mui/material';

import { useDorothy } from 'dorothy-dna-react';

export default function MessageNotification({ data }) {

    const { server } = useDorothy();

    const [date, _date] = useState('');
    const [sender, _sender] = useState('');
    const [senderId, _senderId] = useState('');
    const [text, _text] = useState('');
    const [optimistic, _optimistic] = useState('');

    useEffect(() => {
        if (!data) return;

        _date(dayjs(data.createdAt).format('DD [de] MMMM [de] YYYY [às] HH:mm'));
        _sender(data.user_name);
        _senderId(data.user_id);
        _text(data.content.text);
        _optimistic(data.optimistic)
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
                <Box as="img" src={`${server}user/${senderId}/thumb`} alt="salve" sx={{ borderRadius: '50%', width: '48px', height: '48px' }} />
                <Box sx={{ marginLeft: '8px' }}>
                    <Box sx={{ fontWeight: 'bold', fontSize: '16px' }}>{sender}{optimistic && <>*</>}</Box>
                    <Box sx={{ fontSize: '14px' }}>{date}</Box>
                </Box>
            </Box>
            {/* <Box>
          <ArrowRightCircle size="32px" />
        </Box> */}
        </Box>
        <Box sx={{ marginTop: '8px' }}>
            {text}
        </Box>
    </Box>)
}