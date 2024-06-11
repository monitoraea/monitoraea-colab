import React from 'react';
import './style.scss';

export default function Login() {
  return (
    <>
      <section id="sobre">
        <div className="width-limiter">
          
          <div className="portals">
            <div className="portal" onClick={()=>window.open(import.meta.env.VITE_PP_URL,'_blank')}>M&A de Políticas Públicas de Educação Ambiental</div>
            <div className="portal" onClick={()=>window.open(`${import.meta.env.VITE_PPZCM_URL}colabora`,'_blank')}>M&A de iniciativas vinculadas ao PPPZCM</div>
          </div>
          
        </div>
      </section>
    </>
  );
}