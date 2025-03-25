import { useState, useEffect } from 'react';

import { useRouter, useUser } from 'dorothy-dna-react';

import styles from './styles.module.scss'

const mapPerspective = {
    1: ['MonitoraEA'],
    2: ['PPPZCM'],
    3: ['CIEA'],
    4: ['PPEA'],
    5: ['Centros'],
}

export default function Home() {

    const { user } = useUser();
    const { currentCommunity, changeRoute } = useRouter();

    const [membership, _membership] = useState(null);

    useEffect(() => {
        _membership(user.membership.sort((a, b) => a.descriptor_json.perspective > b.descriptor_json.perspective ? 1 : -1));
    }, [user])

    const handleCommunityChange = (community) => {
        changeRoute({ community });

        // closeMenu();
    }


    return (<div className={styles['home']}>

        <div className={styles['width-limiter']}>
            <div className={styles.page_title}>Meus Grupos de Trabalho</div>

            {!!membership && membership.map(c =>
                <div className={styles.cada} key={c.id} onClick={()=>handleCommunityChange(c.id)}>

                    <div className={`${styles.ball} ${styles[`color_${c.descriptor_json.perspective}`]}`}></div>

                    <div className={`${styles.tag} ${styles[`color_${c.descriptor_json.perspective}`]}`}>{mapPerspective[c.descriptor_json.perspective][0]}</div>

                    <div className={styles.title}>{c.descriptor_json.title}</div>

                </div>
            )}
        </div>

    </div>)
}