import React from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useQuery } from 'react-query';

import Loop from './Loop';

export default function ContentByType({ id, title, portal = "main", contentType, moreText = 'Ver todos', staleTime=3600000 /* 1h */ }) {

    const { data } = useQuery(['news', { portal, contentType }], { /* TODO: tudo que pode variar: limit, offset */
        queryFn: async () => (await axios.get(`${process.env.REACT_APP_SERVER}content/by_type/${contentType}?portal=${portal}&limit=4&offset=0`)).data, /* TODO: se nao vou reaproveitar, fixar limit e offset? */
        staleTime,
    });

    return (<section id={id}>
        <div className="width-limiter">
            <div className="section-header">
                <div className="section-title">{title}</div>
                {!!contentType && <Link to={`/novidades/${contentType}${portal!=='main' ? `/${portal}` : ''}`}>
                    <button className="btn-link">
                        <div className="icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="11" viewBox="0 0 12 11" fill="none">
                                <path d="M7.05566 9.94455L11.5001 5.50011L7.05566 1.05566" stroke="#599559" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M11.4997 5.5H0.833008" stroke="#599559" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        {moreText}
                    </button>
                </Link>}
            </div>
            {!!data && <Loop data={data.entities} portal={portal} />}
        </div>
    </section>)
}