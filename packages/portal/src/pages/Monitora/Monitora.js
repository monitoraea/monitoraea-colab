import React from 'react';
import bg from './bg.png';
import { Link } from 'react-router-dom';
import logoanppea from './logo-anppea.png';
import './style.scss';

import DynamicContent from '../../components/DynamicContent';
import Faq from '../../components/Faq';

function Monitora() {
  return (
    <>
      <div className="banner">
        <img className="bg" src={bg} alt="" />
        <div className="backdrop"></div>
        <div className="content">
          <div className="title">Sistema Brasileiro de Monitoramento e Avaliação de Políticas Públicas e Projetos de Educação Ambiental</div>
        </div>
      </div>
      <section id="sobre">
        <div className="width-limiter">
          <div className="title-xl">MonitoraEA</div>
          <p className="p-xl"><DynamicContent keyRef="monitoraea.intro" /></p>          
        </div>
      </section>
      
      <section id="anppea">
        <div className="width-limiter">
          <div className="about-anppea">
              <img src={logoanppea} alt="" />
              <div className="content">
              <div className='p-xl'><DynamicContent keyRef="monitoraea.anppea" /></div><br />

              <Link to='/sobre/anppea'>
                  <button className="btn-link">
                    <div className="icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="11" viewBox="0 0 12 11" fill="none">
                        <path d="M7.05566 9.94455L11.5001 5.50011L7.05566 1.05566" stroke="#599559" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M11.4997 5.5H0.833008" stroke="#599559" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    Saiba mais
                  </button>
                </Link>
              </div>
          </div>
        </div>
      </section>
      
      <Faq portal="monitoraea" />

    </>
  );
}

export default Monitora;
