import React from 'react';

import axios from 'axios';
import { useQuery } from 'react-query';

import './style.scss';

function Loop({ simple, staleTime = 3600000 /* 1h */ }) {

  const { data } = useQuery(['facilitators', { simple }], {
    queryFn: async () => (await axios.get(
      !simple
      ? `${import.meta.env.VITE_SERVER}facilitator`
      : `${import.meta.env.VITE_SERVER}facilitator/some_random`
      )).data,
    staleTime,
  });

  if (!data) return <></>

  return (
    <>
      <div className={`loop-facilitadores ${simple ? 'simple' : ''}`}>
        {data.entities.map((item, index) => (
          <div className="loop-item" key={item.id}>
            <div className="header">
              <div className="profile-pic">
                <img src={item.photo} alt="" />
              </div>
            </div>
            <div className="content">
              <div className="name">{item.name}</div>
              <div className="desc">{item.intro}</div>
              <ul className='list'>
                <li className='list-item'>
                  <div className="icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="9" height="8" viewBox="0 0 9 8" fill="none">
                      <path d="M1.3 0.799805H7.7C8.14 0.799805 8.5 1.1598 8.5 1.5998V6.3998C8.5 6.8398 8.14 7.1998 7.7 7.1998H1.3C0.86 7.1998 0.5 6.8398 0.5 6.3998V1.5998C0.5 1.1598 0.86 0.799805 1.3 0.799805Z" stroke="#4D8E48" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M8.5 1.59961L4.5 4.39961L0.5 1.59961" stroke="#4D8E48" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div className="value">{item.email}</div>
                </li>
                <li className='list-item'>
                  <div className="icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="9" height="10" viewBox="0 0 9 10" fill="none">
                      <path d="M0.5 3.66678L4.5 0.555664L8.5 3.66678V8.55566C8.5 8.79141 8.40635 9.0175 8.23965 9.1842C8.07295 9.3509 7.84686 9.44455 7.61111 9.44455H1.38889C1.15314 9.44455 0.927048 9.3509 0.760349 9.1842C0.59365 9.0175 0.5 8.79141 0.5 8.55566V3.66678Z" stroke="#599559" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M3.16699 9.44444V5H5.83366V9.44444" stroke="#599559" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div className="value">{item.institution}</div>
                </li>
                <li className='list-item'>
                  <div className="icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="9" height="12" viewBox="0 0 9 12" fill="none">
                      <path d="M8.5 5.11133C8.5 8.22244 4.5 10.8891 4.5 10.8891C4.5 10.8891 0.5 8.22244 0.5 5.11133C0.5 4.05046 0.921427 3.03305 1.67157 2.2829C2.42172 1.53276 3.43913 1.11133 4.5 1.11133C5.56087 1.11133 6.57828 1.53276 7.32843 2.2829C8.07857 3.03305 8.5 4.05046 8.5 5.11133Z" stroke="#599559" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M4.49935 6.44499C5.23573 6.44499 5.83268 5.84803 5.83268 5.11165C5.83268 4.37527 5.23573 3.77832 4.49935 3.77832C3.76297 3.77832 3.16602 4.37527 3.16602 5.11165C3.16602 5.84803 3.76297 6.44499 4.49935 6.44499Z" stroke="#599559" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div className="value">{item.territory_group}</div>
                </li>
                <li className='list-item'>
                  <div className="icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="9" height="12" viewBox="0 0 9 12" fill="none">
                      <g opacity="0.9">
                        <path d="M0.5 7.5C0.5 7.5 1 7 2.5 7C4 7 5 8 6.5 8C8 8 8.5 7.5 8.5 7.5V1.5C8.5 1.5 8 2 6.5 2C5 2 4 1 2.5 1C1 1 0.5 1.5 0.5 1.5V7.5Z" stroke="#599559" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M0.5 11V7.5" stroke="#599559" strokeLinecap="round" strokeLinejoin="round" />
                      </g>
                    </svg>
                  </div>
                  <div className="value">{item.state}</div>
                </li>
              </ul>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default Loop;
