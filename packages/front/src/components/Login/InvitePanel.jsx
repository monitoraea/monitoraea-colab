import { useState, useEffect } from 'react';
import LoginAbout from './LoginAbout';
import Card from '../Card';
import { TextField } from '@mui/material';

import { useSnackbar } from 'notistack';
import axios from 'axios';

import { useDorothy, useUser } from 'dorothy-dna-react';
import {
  useHistory,
  useParams,
  Link
} from 'react-router-dom';

import { useMutation } from 'react-query';

const InvitePanel = () => {

  const { server } = useDorothy();
  const { logout } = useUser();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const history = useHistory();

  const [password, _password] = useState('');
  const [password_conf, _password_conf] = useState('');

  let { uuid } = useParams();

  const [status, _status] = useState('no');

  const mutations = {
    verify: useMutation((uuid) => {
      return axios.put(`${server}gt/invitation/${uuid}`,);
    }),
    signup: useMutation((entity) => {
      return axios.post(`${server}gt/signup`, entity);
    }),
  }

  useEffect(() => {
    async function verify() {
      const { data } = await mutations.verify.mutateAsync(uuid);

      // console.log('data', data);
      if (data.logout) logout();

      _status(data.result);
    }

    if (uuid) verify();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uuid])

  const changePassword = async () => {
    if (!password.length) {
      enqueueSnackbar('Você deve fornecer uma nova senha!', {
        variant: 'error',
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'center',
        },
      });

      return;
    }

    if (password !== password_conf) {
      enqueueSnackbar('As senhas devem ser idênticas!', {
        variant: 'error',
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'center',
        },
      });

      return;
    }

    const snack = enqueueSnackbar('Alterando a senha...', {
      persist: true,
      anchorOrigin: {
        vertical: 'top',
        horizontal: 'center',
      },
    });

    try {
      const { data } = await mutations.signup.mutateAsync({ password, uuid });

      closeSnackbar(snack);

      if (!data.success) throw new Error('Confirmation error!');

      enqueueSnackbar('Seu cadastro foi criado com sucesso!', {
        variant: 'success',
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'center',
        },
      });

      _password('');
      _password_conf('');

      _status('signed');

    } catch (e) {
      closeSnackbar(snack);

      enqueueSnackbar('Erro ao efetuar o cadastro', {
        variant: 'error',
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'center',
        },
      });
    }
  }

  return (
    <div className='page width-limiter centered'>
      <div className='page-content'>
        <div className='row middle-xs'>
          <div className="col" style={{ padding: '0 50px' }}>
            <LoginAbout />
          </div>
          <div className="col">

            <Card title="" headerless>
              <div className='p-4'>
                <div className='row mb-3'>
                  <h4>{status === 'new-user' ? 'Escolha uma senha' : 'Confirmação de convite'}</h4>
                </div>

                {status === 'no' && <div className='row mb-3'>Verificando o convite...</div>}
                {status === 'unknow-invitation' && <div className='row mb-3'>Este código de convite não existe ou está expirado!</div>}

                {status === 'new-user' && <>
                  <div className='row mb-3'>
                    <TextField className="input-text" type="password" id="text-pass" label="Senha" value={password} onChange={(e) => _password(e.target.value)} />
                  </div>
                  <div className='row mb-3'>
                    <TextField className="input-text" type="password" id="text-pass" label="Confirmação de senha" value={password_conf} onChange={(e) => _password_conf(e.target.value)} />
                  </div>
                </>}

                {status === 'already-user' && <div className='row mb-3' style={{ display: 'flex', flexDirection: 'column' }}>
                  <div>Convite confirmado!</div>
                  <div>Como você já tem um cadastro nesta plafaforma, basta <Link to="/login" style={{ color: 'inherit', fontWeight: '600' }}>acessar a area de colaboração</Link></div>
                </div>}

                {status === 'signed' && <div className='row mb-3' style={{ display: 'flex', flexDirection: 'column' }}>
                  <div>Convite confirmado!</div>
                  <div>Agora, basta <Link to="/login" style={{ color: 'inherit', fontWeight: '600' }}>acessar a area de colaboração</Link></div>
                </div>}

                <div className='row mb-3 end-xs middle-xs'>
                  {!['signed', 'already-user'].includes(status) && <button className='button-outline' onClick={() => history.push('/login')}>voltar ao login</button>}
                  {status === 'new-user' && <button style={{ marginLeft: '10px' }} className='button-primary' onClick={changePassword}>alterar a senha</button>}
                </div>
              </div>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
};

export default InvitePanel;