import React from 'react';
import Slider from '../../components/slider/slider';
import { Link } from 'react-router-dom';
import imgplaceholder from './placeholder.png';
import logoanppea from './logo-anppea.png';
import pp from './pp.png';
import pppzcm from './pppzcm.png';
import './style.scss';

import DynamicContent from '../../components/DynamicContent';
import ContentByType from '../../components/ContentByType';
import Faq from '../../components/Faq';

import MapGeneral from '../../components/MapGeneral';

import { content_types } from '../../utils';

function Home() {
  return (
    <>
      <Slider />
      <section id="sobre">
        <div className="width-limiter">
          <div className="section-header">
            <div className="section-title">Sobre</div>
            <Link to='/sobre'>
              <button className="btn-link">
                <div className="icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="11" viewBox="0 0 12 11" fill="none">
                    <path d="M7.05566 9.94455L11.5001 5.50011L7.05566 1.05566" stroke="#599559" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M11.4997 5.5H0.833008" stroke="#599559" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                Saiba mais
              </button>
            </Link>
          </div>
          <div className="title-xl">MonitoraEA</div>
          <p className="p-xl">O <b>MonitoraEA</b> é o sistema brasileiro de monitoramento e avaliação de políticas públicas e projetos de Educação Ambiental, concebido, desenvolvido, mantido e operado pela <b>ANPPEA – Articulação Nacional de Políticas Públicas de Educação Ambiental</b>.
            <br />
            <br />O Sistema MonitoraEA é composto por 4 pilares: </p>
          <br />
          <div className="pillars">
            <div className="pillar">Conjuntos de indicadores construídos participativamente</div>
            <div className="pillar">Ferramentas tecnológicas de suporte à ação coletiva e articulada</div>
            <div className="pillar">Métodos de análise de redes</div>
            <div className="pillar">Processos formativos</div>
          </div>
          <hr className="divider" />
          <div className="about-anppea">
            <img src={logoanppea} alt="" />
            <div className="content">

              <div className='p-xl'><DynamicContent keyRef="monitoraea.anppea" /></div><br />

              <Link to='/sobre/anppea'>
                <button className="btn-link">
                  <div className="icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="11" viewBox="0 0 12 11" fill="none">
                      <path d="M7.05566 9.94455L11.5001 5.50011L7.05566 1.05566" stroke="#599559" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M11.4997 5.5H0.833008" stroke="#599559" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  Saiba mais
                </button>
              </Link>
            </div>
          </div>
          <hr className="divider" />
          <div className="title-xl">Diferentes Perspectivas do Sistema MonitoraEA</div>
          <div className="systems">
            <Link to='sobre/ppea'>
              <div className="system">
                <img src={pp} alt="" />
                <div className="backdrop"></div>
                <div className="content">
                  <div className="title">
                    Sistema de M&A de Políticas Públicas de Educação Ambiental
                    <div className="icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="18" viewBox="0 0 22 18" fill="none">
                        <path d="M12.5 17L20.5 9L12.5 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M20.4988 9H1.29883" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>

                  </div>
                  <div className="subtitle"><DynamicContent keyRef="pp.box" /></div>
                </div>
              </div>
            </Link>
            <Link to='sobre/pppzcm'>
              <div className="system">
                <img src={pppzcm} alt="" />
                <div className="backdrop"></div>
                <div className="content">
                  <div className="title">
                    Sistema de M&A de iniciativas vinculadas ao PPPZCM
                    <div className="icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="18" viewBox="0 0 22 18" fill="none">
                        <path d="M12.5 17L20.5 9L12.5 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M20.4988 9H1.29883" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                  <div className="subtitle"><DynamicContent keyRef="pppzcm.box" /></div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <MapGeneral />

      {['news','learning'].map(c => <ContentByType
        key={c}
        id={content_types[c][2]}
        contentType={c}
        title={content_types[c][1]}
        moreText={content_types[c][3]}
      />)}

      <Faq />

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

export default Home;