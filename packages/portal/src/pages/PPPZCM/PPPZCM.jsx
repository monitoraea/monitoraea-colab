import React from 'react';
import { Link } from 'react-router-dom';
import imgplaceholder from './placeholder.png';
import bg from './bg.png';
import pppzcm from './pppzcm.png';
import './style.scss';

import DynamicContent from '../../components/DynamicContent';
import ContentByType from '../../components/ContentByType';
import Faq from '../../components/Faq';

import Loop from '../../components/LoopFacilitators';

import { content_types } from '../../utils';

import MapZCM from '../../components/MapZCM';

function PPPZCM() {
  // Adicione 3 slides de preenchimento com conteúdo padrão

  return (
    <>
      <div className="banner">
        <img className="bg" src={bg} alt="" />
        <div className="backdrop"></div>
        <div className="content">
          <div className="title">M&A de Iniciativas Vinculadas ao PPPZCM</div>
        </div>
      </div>
      <section id="sobre">
        <div className="width-limiter">
          <div className="about-pppzcm">
            <img src={pppzcm} alt="" />
            <div className="content">
              <p className="p-xl"><DynamicContent keyRef="pppzcm.intro" /></p>
              <br />
              <a href='https://pppzcm.monitoraea.org.br/static/media/PPPZCM_Atual.c5842d21de933d62e4fd.pdf' target="_blank" rel="noreferrer">
                <button className="btn-primary">
                  <div className="icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 13 13" fill="none">
                      <path d="M12.5 8.5V11.1667C12.5 11.5203 12.3595 11.8594 12.1095 12.1095C11.8594 12.3595 11.5203 12.5 11.1667 12.5H1.83333C1.47971 12.5 1.14057 12.3595 0.890524 12.1095C0.640476 11.8594 0.5 11.5203 0.5 11.1667V8.5" stroke="white" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M3.16602 5.16699L6.49935 8.50033L9.83268 5.16699" stroke="white" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M6.5 8.5V0.5" stroke="white" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  Baixar PDF
                </button>
              </a>
            </div>
          </div>
          <br /><br />
          <div className="como-pppzcm">
            <p className="p-xl">
              <b>Como o PPPZCM foi construído?</b>
              <br /><br />
              <DynamicContent keyRef="pppzcm.how" />
            </p>
          </div>
          <br /><br />
          <p className='p-xl'><DynamicContent keyRef="pppzcm.more" /></p>
        </div>
      </section>

      <MapZCM />

      {['news', 'learning'].map(c => <ContentByType
        key={c}
        id={content_types[c][2]}
        contentType={c}
        title={content_types[c][1]}
        moreText={content_types[c][3]}
        portal="pppzcm"
      />)}

      <section>
        <div className="width-limiter">
          <div className="section-header">
            <div className="section-title">Facilitadores</div>
            <Link to='/facilitadores'>
              <button className="btn-link">
                <div className="icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="11" viewBox="0 0 12 11" fill="none">
                    <path d="M7.05566 9.94455L11.5001 5.50011L7.05566 1.05566" stroke="#599559" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M11.4997 5.5H0.833008" stroke="#599559" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                Ver todas
              </button>
            </Link>
          </div>
          <p><DynamicContent keyRef="pppzcm.facilitators" /></p>
          <Loop staleTime={0} simple={true} />
        </div>
      </section>

      <Faq portal="pppzcm" />

      <ContentByType
        id={content_types['publication'][2]}
        contentType="publication"
        title={content_types['publication'][1]}
        moreText={content_types['publication'][3]}
        portal="pppzcm"
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

export default PPPZCM;
