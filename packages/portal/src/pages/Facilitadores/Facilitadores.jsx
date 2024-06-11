import React from 'react';
import Loop from '../../components/LoopFacilitators';
import bg from './bg.png';
import './style.scss';

function Facilitadores({ staleTime = 3600000 /* 1h */ }) {

  return (
    <>
      <div className="banner">
        <img className="bg" src={bg} alt="" />
        <div className="backdrop"></div>
        <div className="content">
          {/* <div className="title">Facilitadores</div> */}
        </div>
      </div>
      <section id='novidades'>
        <div className="width-limiter">
          <div className="section-header">
            <div className="section-title">Facilitadores</div>
          </div>
          <Loop staleTime={staleTime} />
        </div>
      </section>
    </>
  );
}

export default Facilitadores;
