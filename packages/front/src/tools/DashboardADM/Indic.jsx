import { useQuery } from 'react-query';

import { Chip } from '@mui/material';

import styles from './styles.module.scss';

import Base from './views/Base';
import Int from './views/Int';
import SN from './views/SN';
import SS from './views/SS';
import SSO from './views/SSO';
import SM from './views/SM';
import SMO from './views/SMO';
import { Fragment } from 'react';
// import Unknown from './views/Unknown';

export default function Indic({ lae_id, indic, filters }) {
    const { data } = useQuery(`adm/statistics/indic/se_aplica/${lae_id}/${indic.id}/?${filters}`);

    const prepareFilters = (filters) => {
        let preparedFilters = '';

        for (let filter in filters) {
            if (filters[filter]) preparedFilters = `${preparedFilters}&f_${filter}=${filters[filter]}`;
        }

        return preparedFilters;
    }

    return (<>
        <Chip className={styles.indic} label={indic.name} variant="outlined" />

        <div className={`${styles.visualizations_grid} ${styles.question}`}>

            {/* base */}
            <Base
                lae_id={lae_id}
                indic_id={indic.id}
                title={indic.base_question}
                filters={prepareFilters(filters)}
            />

            {indic.questions.map(q => <Fragment key={`${lae_id}_${indic.id}__${q.id}`}>
                {(q.type === 1) && <Int
                    lae_id={lae_id}
                    indic_id={indic.id}
                    question_id={q.id}
                    title={q.title}
                    filters={prepareFilters(filters)}
                    totalAplica={data}
                />}

                {(q.type === 10) && <SN
                    lae_id={lae_id}
                    indic_id={indic.id}
                    question_id={q.id}
                    title={q.title}
                    filters={prepareFilters(filters)}
                    totalAplica={data}
                />}

                {(q.type === 5) && <SS
                    lae_id={lae_id}
                    indic_id={indic.id}
                    question_id={q.id}
                    options={mapOptions(q.options)}
                    title={q.title}
                    filters={prepareFilters(filters)}
                    totalAplica={data}
                />}

                {(q.type === 7) && <SSO
                    lae_id={lae_id}
                    indic_id={indic.id}
                    question_id={q.id}
                    options={mapOptions(q.options)}
                    title={q.title}
                    filters={prepareFilters(filters)}
                    totalAplica={data}
                />}

                {(q.type === 6) && <SM
                    lae_id={lae_id}
                    indic_id={indic.id}
                    question_id={q.id}
                    options={mapOptions(q.options)}
                    title={q.title}
                    filters={prepareFilters(filters)}
                    totalAplica={data}
                />}

                {(q.type === 8) && <SMO
                    lae_id={lae_id}
                    indic_id={indic.id}
                    question_id={q.id}
                    options={mapOptions(q.options)}
                    title={q.title}
                    filters={prepareFilters(filters)}
                    totalAplica={data}
                />}

                {/* [0].includes(q.type) && <Unknown type={q.type} /> */}
            </Fragment>)}


        </div>
    </>)
}

function mapOptions(options) {
    let mapOptions = {};

    for (let k of options) {
        mapOptions[k.value] = k.title;
    }
    mapOptions['100'] = 'Outro';

    return mapOptions;
}

