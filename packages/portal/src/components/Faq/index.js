
import axios from 'axios';
import { useQuery } from 'react-query';

import Accordeon from '../../components/accordeon/accordeon';

export default function Faq({ portal='main', staleTime=3600000 /* 1h */ }) {

    const { data } = useQuery(['faq', { portal }], {
        queryFn: async () => (await axios.get(`${process.env.REACT_APP_SERVER}content/faq/?portal=${portal}`)).data,
        staleTime,
    });

    return (<section id="faq">
        <div className="width-limiter">
            <div className="section-header center">
                <div className="section-title">Perguntas frequentes</div>
            </div>
            {!!data && <Accordeon items={data.map(({ title, text }) => ({ title, content: text.replace(/<[^>]*>/g, '') }))} />}
        </div>
    </section>)
}