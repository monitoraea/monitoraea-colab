import React from 'react';
import bg from './bg.png';
import './style.scss';

import DynamicContent from '../../components/DynamicContent';
import Faq from '../../components/Faq';

function Anppea() {
  return (
    <>
      <div className="banner">
        <img className="bg" src={bg} alt="" />
        <div className="backdrop"></div>
        <div className="content">
          <div className="title">Articulação Nacional de Políticas Públicas de Educação Ambiental</div>
        </div>
      </div>
      <section id="sobre">
        <div className="width-limiter">
          <div className="title-xl">ANPPEA</div>
          <p className="p-xl"><DynamicContent keyRef="anppea.content" /></p>          
        </div>
      </section>
      
      <Faq portal="anppea" />

    </>
  );
}

export default Anppea;
