import React from 'react';
import imgplaceholder from './placeholder.png';
import bg from './bg.png';

import DynamicContent from '../../components/DynamicContent';
import ContentByType from '../../components/ContentByType';
import Faq from '../../components/Faq';

import { content_types } from '../../utils';

import MapPPEA from '../../components/MapPP';

import './style.scss';

function PPEA() {

  return (
    <>
        <div className="banner">
          <img className="bg" src={bg} alt="" />
          <div className="backdrop"></div>
          <div className="content">
            <div className="title">M&A de Políticas Públicas de Educação Ambiental</div>
          </div>
        </div>
        <section id="sobre">
        <div className="width-limiter">
          <p className="p-xl"><DynamicContent keyRef="pp.intro" /></p>
        </div>
      </section>
      
      <MapPPEA />

      
      {['news','learning'].map(c => <ContentByType
        key={c}
        id={content_types[c][2]}
        contentType={c}
        title={content_types[c][1]}
        moreText={content_types[c][3]}
        portal="pp"
      />)}

      <Faq portal="pp" />      
      
      <ContentByType
        id={content_types['publication'][2]}
        contentType="publication"
        title={content_types['publication'][1]}
        moreText={content_types['publication'][3]}
        portal="pp"
      />

      <section id="conselho">
        <div className="width-limiter">
          <div className="section-header">
            <div className="section-title">Conselho Institucional</div>
          </div>
          <div className="logos">
            <img src={imgplaceholder} alt="" className="logo" />
            <img src={imgplaceholder} alt="" className="logo" />
            <img src={imgplaceholder} alt="" className="logo" />
            <img src={imgplaceholder} alt="" className="logo" />
          </div>
        </div>
      </section>

    </>
  );
}

export default PPEA;
