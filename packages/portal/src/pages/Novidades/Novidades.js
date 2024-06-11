import React, { useState } from 'react';
import Slider from '../../components/slider/slider';
import Loop from '../../components/ContentByType/Loop';

import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useQuery } from 'react-query';

import { content_types } from '../../utils';

import './style.scss';

function Novidades({ staleTime=3600000 /* 1h */, limit = 16 }) {

  const { content_type: contentType, portal='main' } = useParams();

  const [page, _page] = useState(1);
  const [currentPortal, _currentPortal] = useState(portal); /* somente para main, onde vc pode filtrar por portal */

  const { data } = useQuery(['new', { currentPortal, contentType, page, limit }], { /* TODO: tudo que pode variar: , offset */
    queryFn: async () => (await axios.get(`${process.env.REACT_APP_SERVER}content/by_type/${contentType}/?portal=${currentPortal}&page=${page}&limit=${limit}`)).data, /* TODO: se nao vou reaproveitar, fixar limit e offset? */
    staleTime,
  });

  const previousPage = () => {
    if(!data.hasPrevious) return;

    _page(page => page - 1);
  }

  const nextPage = () => {
    if(!data.hasNext) return;

    _page(page => page + 1);
  }

  const handlePortalFilter = (portal) => {
    _currentPortal(portal)
    _page(1);
  }

  return (
    <>
      <Slider portal={portal} />
      <section id='novidades'>
        <div className="width-limiter">

          <div className="section-header">
            <div className="section-title">{content_types[contentType][1]}</div>
            {portal === 'main' && <div className='filter'>
              <div className={`filter-item ${currentPortal === 'main' ? 'active' : ''}`} onClick={()=>handlePortalFilter('main')}>Todos</div>
              {data?.totalsByPortal.monitoraea && <div className={`filter-item ${currentPortal === 'monitoraea' ? 'active' : ''}`} onClick={()=>handlePortalFilter('monitoraea')}>MONITORAEA <div className="indicator">{data.totalsByPortal.monitoraea}</div></div>}
              {data?.totalsByPortal.pp && <div className={`filter-item ${currentPortal === 'pp' ? 'active' : ''}`} onClick={()=>handlePortalFilter('pp')}>PPEA <div className="indicator">{data.totalsByPortal.pp}</div></div>}
              {data?.totalsByPortal.pppzcm && <div className={`filter-item ${currentPortal === 'pppzcm' ? 'active' : ''}`} onClick={()=>handlePortalFilter('pppzcm')}>PPPZCM <div className="indicator">{data.totalsByPortal.pppzcm}</div></div>}
            </div>}
          </div>

          {!!data && <Loop data={data.entities} portal={portal} />}
          
          {!!data && !!data.pages && data.pages > 1 && <div className="pagination">
            <div className="indicator">{page} de {data.pages}</div>
            <div className="arrows">
              <div className={`arrow arrow-left ${!data.hasPrevious ? 'disabled' : ''}`} onClick={previousPage}>
                <svg xmlns="http://www.w3.org/2000/svg" width="9" height="15" viewBox="0 0 9 15" fill="none">
                  <path d="M1.5 13.1533L7.5 7.15332L1.5 1.15332" stroke="#599559" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className={`arrow arrow-right ${!data.hasNext ? 'disabled' : ''}`} onClick={nextPage}>
                <svg xmlns="http://www.w3.org/2000/svg" width="9" height="15" viewBox="0 0 9 15" fill="none">
                  <path d="M1.5 13.1533L7.5 7.15332L1.5 1.15332" stroke="#599559" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </div>}

        </div>
      </section>
    </>
  );
}

export default Novidades;
