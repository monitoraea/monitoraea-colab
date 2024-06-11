import React from 'react';
import imgplaceholder from './placeholder.png';
import axios from 'axios';
import { useQuery } from 'react-query';
import { useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { portals, content_types } from '../../utils';
import ContentRenderer from '../../components/DynamicContent/ContentRenderer';
import ContentByType from '../../components/ContentByType';

import './style.scss';

function NovidadeSingle({ staleTime = 3600000 /* 1h */ }) {

  const params = useParams();

  const { data } = useQuery(['single_news', { id: params.id }], {
    queryFn: async () => (await axios.get(`${process.env.REACT_APP_SERVER}content/${params.id}`)).data,
    staleTime,
  });

  if (!data) return <></>;

  return (
    <>
      <div className="banner">
        <img className="bg" src={data.featured_images || imgplaceholder} alt="" />
        <div className="backdrop"></div>
        <div className="content">
          <div className="title">{data.title}</div>
          {data.type !== 'page' && <div className="date">{dayjs(data.publishedAt).format('DD/MM/YYYY')} às {dayjs(data.publishedAt).format('HH:mm')}</div>}
        </div>
      </div>
      <section>
        <div className="width-limiter">
          <div className="info">
            <div className="info-item">
              <div className="label">Projeto</div>
              <div className="value"><div className={data.portal}>{portals[data.portal][0]}</div></div>
            </div>
            {!!data.categories.length && <div className="info-item">
              <div className="label">Categorias</div>
              <div className="value categories">
                {data.categories.map(c => <div key={c.id}>{c.name}</div>)}
              </div>
            </div>}
          </div>
        </div>
      </section>
      <section id='post-body'>
        <div className="width-limiter">
          <div className="body">
            <ContentRenderer text={data.text} />
          </div>
        </div>
      </section>

      {data.type !== 'page' && <ContentByType
        key={data.type}
        /* id={content_types[data.type][2]} */
        contentType={data.type}
        title={content_types[data.type][1]}
        moreText={content_types[data.type][3]}
      />}

    </>
  );
}

export default NovidadeSingle;
