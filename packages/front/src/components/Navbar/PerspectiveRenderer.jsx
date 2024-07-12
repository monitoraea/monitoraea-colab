import monitoraea from '../../images/perspectives/monitoraea.png';
import zcm from '../../images/perspectives/zcm.png';
import ciea from '../../images/perspectives/ciea.png';
import ppea from '../../images/perspectives/ppea.png';

const logos = {
    'monitoraea': monitoraea,
    'zcm': zcm,
    'ciea': ciea,
    'ppea': ppea,
}

export default function perspectiveRenderer({ perspectives, community }) {
    if(!perspectives || !community?.perspective) return '';
    const p = perspectives.find(p => p.id === community.perspective);
    if(!p) return '';
    const i = p.config?.key ? logos[p.config?.key] : null;

    if(!!i) return (<span style={{ paddingRight: '5px' }}><img src={logos[p.config?.key]} alt={p.config.key} /></span>)
    return (<span>{p.name}:</span>)
}