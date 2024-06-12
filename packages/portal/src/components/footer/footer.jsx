import React, { useEffect, useState, Fragment } from 'react';
import './style.scss';
import logomonitoraea from './logo-monitoraea.png';
import { Link } from 'react-router-dom';

import axios from 'axios';
import { useQuery, useMutation } from 'react-query';

import Modal from '../Modal';
import styles from './styles.module.scss';

function Footer() {

  const [menu, _menu] = useState(null);
  const [showContactDialog, _showContactDialog] = useState(false);

  const [name, _name] = useState('');
  const [email, _email] = useState('');
  const [message, _message] = useState('');

  const redirectTo = relative_path => {
    window.location = `/${relative_path || ''}`;
  };

  const { data } = useQuery(
    ['menu_tree'],
    {
      queryFn: async () =>
        (
          await axios.get(`${import.meta.env.VITE_SERVER}menu_portal`)
        ).data,
      staleTime: 3600000 /* 1h */
    },
  );

  const mutations = {
    send: useMutation(
      () => axios.post(`${import.meta.env.VITE_SERVER}adm/send_contact`, { email, name, message })
    ),
  };

  const handleSend = async () => {
    if (!name.length || !email.length || !message.length) return;

    await mutations.send.mutateAsync();

    _showContactDialog(false);
    _name('');
    _email('');
    _message('');
  }

  useEffect(() => {
    if (!!data) {
      let menu = []

      // somente dois niveis
      for (let item of data.filter(i => !i.parent_id)) { /* root */
        menu.push({
          ...item,
          children: data.filter(i => i.parent_id === item.id)
        })
      }

      _menu(menu);
    }
  }, [data])

  return (
    <>
      <div className="footer">
        <div className="brand">
          <Link to="/"><img src={logomonitoraea} alt="" /></Link>
        </div>
        {!!menu && <ul className="menu">

          {menu.map(i => <Fragment key={i.id}><MenuItem data={i} />

            {!!i.children.length && i.children.map(c => <MenuItem key={c.id} data={c} />)}

          </Fragment>)}

          <li className="menu-item"><div className="contact" onClick={() => _showContactDialog(true)}>Contato</div></li>

        </ul>}
        <ul className="menu">
          <li className="menu-item">
            <button className="btn-link" onClick={() => redirectTo('colabora')}>
              Área logada
            </button>
          </li>
        </ul>
        <div></div>
      </div>
      <Modal open={showContactDialog} onClose={() => _showContactDialog(false)} title="Enviar mensagem para a Secretaria Executiva" onSend={handleSend}>
        <div className={styles.fields}>
          <div className={styles['field-wrap']}>
            <label>E-mail</label>
            <input type="text" name="email" value={email} onChange={(e) => _email(e.target.value)} />
          </div>
          <div className={styles['field-wrap']}>
            <label>Nome</label>
            <input type="text" name="name" value={name} onChange={(e) => _name(e.target.value)} />
          </div>
          <div className={styles['field-wrap']}>
            <label>Mensagem</label>
            <textarea rows={4} name="message" value={message} onChange={(e) => _message(e.target.value)} />
          </div>
        </div>
      </Modal>
    </>
  );
}

function MenuItem({ data, ...rest }) {
  if (data.type === 'link') return (<li className="menu-item"><Link target={data.blank ? '_blank' : ''} to={data.link} {...rest}>{data.title}</Link></li>)
  if (data.type === 'page') return (<li className="menu-item"><Link to={`/page/${data.content_id}`} {...rest}>{data.title}</Link></li>)
  if (data.type === 'none') return (<></>)

  return (<li className="menu-item"><Link disabled>{data.title}</Link></li>)
}

export default Footer;
