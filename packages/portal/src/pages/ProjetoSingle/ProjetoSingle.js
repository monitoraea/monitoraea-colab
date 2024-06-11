import React, { useEffect, useState } from 'react';
import imgplaceholder from './placeholder.png';
import './style.scss';
/* import { Link } from 'react-router-dom';  */
import axios from 'axios';
import { useQuery, useMutation } from 'react-query';
import { useParams } from 'react-router-dom';

import Modal from '../../components/Modal';
import styles from './styles.module.scss';

function ProjetoSingle({ staleTime = 3600000 /* 1h */ }) {
  const params = useParams();

  const [status, _status] = useState(null);
  const [showParticipateDialog, _showParticipateDialog] = useState(false);

  const [name, _name] = useState('');
  const [email, _email] = useState('');
  const [message, _message] = useState('');

  const { data } = useQuery(['single_proj', { id: params.id }], {
    queryFn: async () => (await axios.get(`${process.env.REACT_APP_SERVER}project/${params.id}`)).data,
    staleTime,
  });

  const { data: verify } = useQuery(['project_indics', { project_id: params.id }], {
    queryFn: async () => (await axios.get(`${process.env.REACT_APP_SERVER}project/${params.id}/verify`)).data,
    enabled: !!params.id,
    staleTime,
  });

  useEffect(()=>{
    _showParticipateDialog(false);
    _name('');
    _email('');
    _message('');
  },[])

  useEffect(() => {
    if (!!verify) {
      let st = 'complete';

      for (let i of Object.values(verify.analysis.indics)) {
        if (!i.ready) {
          st = 'incomplete';
          break;
        }
      }

      _status(st);
    }
  }, [verify])

  const mutations = {
    send: useMutation(
      () => axios.post(`${process.env.REACT_APP_SERVER}project/${params.id}/send_contact`, { email, name, message })
    ),
  };

  if (!data) return <></>;

  const handleSend = async () => {
    if(!name.length || !email.length || !message.length) return;

    await mutations.send.mutateAsync();

    _showParticipateDialog(false);
    _name('');
    _email('');
    _message('');
  }

  return (
    <>
      <div className="banner" id='banner-projeto'>
        <img className="bg" src={imgplaceholder} alt="" />
        <div className="backdrop"></div>
        <div className="content">
          <div className="title">{data.nome}</div>
          {/* <div className="desc">Lorem Ipsum Dolor Sit Amet, consectetur</div> */}
          <div className="line-1">
            <span><b>Modalidade</b> {data.modalidade_nome}</span>
            <span>|</span>
            <span><b>Linha de atuação</b> {data.linhas.join(',')}</span>
          </div>
          <div className="line-2">
            <button className="btn-link" onClick={() => _showParticipateDialog(true)}>
              <div className="icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 17 17" fill="none">
                  <path d="M16.5 11.1667C16.5 11.6382 16.3127 12.0903 15.9793 12.4237C15.6459 12.7571 15.1937 12.9444 14.7222 12.9444H4.05556L0.5 16.5V2.27778C0.5 1.80628 0.687301 1.3541 1.0207 1.0207C1.3541 0.687301 1.80628 0.5 2.27778 0.5H14.7222C15.1937 0.5 15.6459 0.687301 15.9793 1.0207C16.3127 1.3541 16.5 1.80628 16.5 2.27778V11.1667Z" stroke="white" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              Fale com o moderador
            </button>
            <button
              className={`btn-outline`}
              onClick={() => window.location = `${process.env.REACT_APP_PPZCM_URL}colabora/participate/${params.id}`}
            >
              Quero participar
            </button>
          </div>
        </div>
      </div>
      <section>
        <div className="width-limiter">
          <div className="project-body">
            <div className="content">
              <b>Objetivo</b>
              <br />
              <p>
                {breakItems(data.objetivos_txt)}
              </p>
              <br /><br />
              <b>Aspectos Gerais</b>
              <br />

              <p>
                {breakItems(data.aspectos_gerais_txt)}
              </p>
            </div>
            <div className="project-info">
              <div className="row">
                <div className="info-item">
                  <div className="label">
                    <div className="icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="13" viewBox="0 0 15 13" fill="none">
                        <path d="M10.0455 12.2274V10.9546C10.0455 10.2795 9.77727 9.63209 9.29991 9.15473C8.82254 8.67736 8.1751 8.40918 7.5 8.40918H3.04545C2.37036 8.40918 1.72291 8.67736 1.24555 9.15473C0.768181 9.63209 0.5 10.2795 0.5 10.9546V12.2274" stroke="#1D49A7" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M5.27299 5.86386C6.67881 5.86386 7.81845 4.72422 7.81845 3.3184C7.81845 1.91259 6.67881 0.772949 5.27299 0.772949C3.86718 0.772949 2.72754 1.91259 2.72754 3.3184C2.72754 4.72422 3.86718 5.86386 5.27299 5.86386Z" stroke="#1D49A7" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M10.6816 5.86404L11.9544 7.13676L14.4998 4.59131" stroke="#1D49A7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    Autoavaliação
                  </div>
                  <div className="value">
                    {!!status && <>{status === 'incomplete' ? 'Incompleta' : 'Completa'}</>}
                    {!status && <>Verificando...</>}
                  </div>
                </div>
                <div className="info-item">
                  <div className="label">
                    <div className="icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="15" viewBox="0 0 14 15" fill="none">
                        <path d="M0.5 5.4L6.8 0.5L13.1 5.4V13.1C13.1 13.4713 12.9525 13.8274 12.69 14.0899C12.4274 14.3525 12.0713 14.5 11.7 14.5H1.9C1.5287 14.5 1.1726 14.3525 0.91005 14.0899C0.6475 13.8274 0.5 13.4713 0.5 13.1V5.4Z" stroke="#1D49A7" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M4.7002 14.5V7.5H8.9002V14.5" stroke="#1D49A7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    Instituição
                  </div>
                  <div className="value">{data.instituicao_nome}</div>
                </div>
              </div>
              <div className="row">
                <div className="info-item">
                  <div className="label">
                    <div className="icon">
                      <svg width="14" height="15" viewBox="0 0 14 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11.7 1.90039H1.9C1.1268 1.90039 0.5 2.52719 0.5 3.30039V13.1004C0.5 13.8736 1.1268 14.5004 1.9 14.5004H11.7C12.4732 14.5004 13.1 13.8736 13.1 13.1004V3.30039C13.1 2.52719 12.4732 1.90039 11.7 1.90039Z" stroke="#1D49A7" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M9.59961 0.5V3.3" stroke="#1D49A7" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M4 0.5V3.3" stroke="#1D49A7" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M0.5 6.09961H13.1" stroke="#1D49A7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    Período
                  </div>
                  <div className="value">
                    {breakItems(data.periodo_txt)}
                  </div>
                </div>
                <div className="info-item">
                  <div className="label">
                    <div className="icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 15 15" fill="none">
                        <path d="M7.5 14.5C11.366 14.5 14.5 11.366 14.5 7.5C14.5 3.63401 11.366 0.5 7.5 0.5C3.63401 0.5 0.5 3.63401 0.5 7.5C0.5 11.366 3.63401 14.5 7.5 14.5Z" stroke="#1D49A7" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M7.50078 11.6998C9.82038 11.6998 11.7008 9.8194 11.7008 7.4998C11.7008 5.18021 9.82038 3.2998 7.50078 3.2998C5.18119 3.2998 3.30078 5.18021 3.30078 7.4998C3.30078 9.8194 5.18119 11.6998 7.50078 11.6998Z" stroke="#1D49A7" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M7.49961 8.89961C8.27281 8.89961 8.89961 8.27281 8.89961 7.49961C8.89961 6.72641 8.27281 6.09961 7.49961 6.09961C6.72641 6.09961 6.09961 6.72641 6.09961 7.49961C6.09961 8.27281 6.72641 8.89961 7.49961 8.89961Z" stroke="#1D49A7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    Público
                  </div>
                  <div className="value">
                    {breakItems(data.publico_txt)}
                  </div>
                </div>
              </div>
              <div className="row">
                <div className="info-item">
                  <div className="label">
                    <div className="icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="19" height="15" viewBox="0 0 19 15" fill="none">
                        <path d="M12.9444 14.5002V12.9446C12.9444 12.1195 12.6167 11.3282 12.0332 10.7447C11.4498 10.1613 10.6585 9.8335 9.83333 9.8335H3.61111C2.78599 9.8335 1.99467 10.1613 1.41122 10.7447C0.827777 11.3282 0.5 12.1195 0.5 12.9446V14.5002" stroke="#1D49A7" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M6.72244 6.72222C8.44066 6.72222 9.83355 5.32933 9.83355 3.61111C9.83355 1.89289 8.44066 0.5 6.72244 0.5C5.00422 0.5 3.61133 1.89289 3.61133 3.61111C3.61133 5.32933 5.00422 6.72222 6.72244 6.72222Z" stroke="#1D49A7" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M17.6117 14.4996V12.9441C17.6111 12.2548 17.3817 11.5851 16.9594 11.0403C16.5371 10.4955 15.9458 10.1064 15.2783 9.93408" stroke="#1D49A7" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M12.167 0.600586C12.8362 0.771931 13.4294 1.16113 13.8529 1.70683C14.2765 2.25252 14.5064 2.92368 14.5064 3.61447C14.5064 4.30527 14.2765 4.97643 13.8529 5.52212C13.4294 6.06782 12.8362 6.45702 12.167 6.62836" stroke="#1D49A7" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M12.9444 14.5002V12.9446C12.9444 12.1195 12.6167 11.3282 12.0332 10.7447C11.4498 10.1613 10.6585 9.8335 9.83333 9.8335H3.61111C2.78599 9.8335 1.99467 10.1613 1.41122 10.7447C0.827777 11.3282 0.5 12.1195 0.5 12.9446V14.5002" stroke="#1D49A7" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M6.72244 6.72222C8.44066 6.72222 9.83355 5.32933 9.83355 3.61111C9.83355 1.89289 8.44066 0.5 6.72244 0.5C5.00422 0.5 3.61133 1.89289 3.61133 3.61111C3.61133 5.32933 5.00422 6.72222 6.72244 6.72222Z" stroke="#1D49A7" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M17.6117 14.4996V12.9441C17.6111 12.2548 17.3817 11.5851 16.9594 11.0403C16.5371 10.4955 15.9458 10.1064 15.2783 9.93408" stroke="#1D49A7" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M12.167 0.600586C12.8362 0.771931 13.4294 1.16113 13.8529 1.70683C14.2765 2.25252 14.5064 2.92368 14.5064 3.61447C14.5064 4.30527 14.2765 4.97643 13.8529 5.52212C13.4294 6.06782 12.8362 6.45702 12.167 6.62836" stroke="#1D49A7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    Parceiros
                  </div>
                  <div className="value">
                    {breakItems(data.parceiros_txt)}
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>
      <Modal open={showParticipateDialog} onClose={() => _showParticipateDialog(false)} title="Enviar mensagem para o responsável" onSend={handleSend}>
        <div className={styles.fields}>
          <div className={styles['field-wrap']}>
            <label>E-mail</label>
            <input type="text" name="email" value={email} onChange={(e)=>_email(e.target.value)} />
          </div>
          <div className={styles['field-wrap']}>
            <label>Nome</label>
            <input type="text" name="name" value={name} onChange={(e)=>_name(e.target.value)} />
          </div>
          <div className={styles['field-wrap']}>
            <label>Mensagem</label>
            <textarea rows={4} name="message" value={message} onChange={(e)=>_message(e.target.value)} />
          </div>
        </div>
      </Modal>
    </>
  );
}

/* Aux functions */
function breakItems(txt) {
  if (!txt) return '';
  return txt.split('\n').filter(txt => txt.length).join(', ').replace('null', '');
}

export default ProjetoSingle;
