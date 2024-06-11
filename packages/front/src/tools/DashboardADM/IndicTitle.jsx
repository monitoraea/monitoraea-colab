import { useQuery } from 'react-query';

import { Chip } from '@mui/material';

import styles from './styles.module.scss';

export default function IndicTitle({ lae_id, indic_id, title, filters = '' }) {
    const { data } = useQuery(`adm/statistics/indic/se_aplica/${lae_id}/${indic_id}/?${filters}`);

    return (<>
        <Chip className={styles.indic} label={`${title} ${data !== undefined ? `(${data})` : ''}`} variant="outlined" />
    </>)
}

