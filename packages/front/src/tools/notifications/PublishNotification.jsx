import React, { useState, useEffect } from 'react';

import { useRouter } from 'dorothy-dna-react';

import dayjs from 'dayjs';
import { Box } from '@mui/material';
import robot from '../../images/robot.png';

import styles from './PublishNotification.module.scss';

export default function NewUserNotification({ data }) {
    const { changeRoute } = useRouter();

    const [date, _date] = useState('');

    useEffect(() => {
        if (!data) return;

        _date(dayjs(data.createdAt).format('DD/MM/YYYY HH:mm'));
    }, [data]);

    const handleClick = () => {
        changeRoute({ community: data.content.communityId})
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
                            Aviso de Publicação de Iniciativa
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

                <>
                    <p>A iniciativa "<span className={styles.name} onClick={handleClick}>{data.content.name}</span>" publicou seus dados!</p>
                </>
            </Box>
        </Box>
    )
}