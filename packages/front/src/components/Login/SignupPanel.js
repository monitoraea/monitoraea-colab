import { useState } from 'react';
import LoginAbout from './LoginAbout';
import Card from '../Card';
import { TextField } from '@mui/material';

import { useSnackbar } from 'notistack';
import axios from 'axios';

import { useDorothy, useQuery } from 'dorothy-dna-react';
import {
  useHistory,
  Link
} from 'react-router-dom';

import { useMutation } from 'react-query';

const SignupPanel = ({ next }) => {

  const query = useQuery();
  const { server } = useDorothy();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const history = useHistory();

  const [name, _name] = useState('');
  const [email, _email] = useState('');
  const [password, _password] = useState('');
  const [password_conf, _password_conf] = useState('');

  const [status, _status] = useState('signup');

  const mutations = {
    signup: useMutation((entity) => {
      return axios.post(`${server}user/signup`, entity);
    }),
  }

  const handleSignup = async () => {
    if (!password.length || !name.length || !email.length) {
      enqueueSnackbar('Todos os campos devem ser preenchidos!', {
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

    const snack = enqueueSnackbar('Criando o seu cadastro...', {
      persist: true,
      anchorOrigin: {
        vertical: 'top',
        horizontal: 'center',
      },
    });

    try {
      const { data } = await mutations.signup.mutateAsync({ email, name, password });

      closeSnackbar(snack);

      if (!data.success) throw new Error('Registration error!');

      enqueueSnackbar('Seu cadastro foi criado com sucesso!', {
        variant: 'success',
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'center',
        },
      });

      _email('');
      _name('');
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
                  <h4>Formulário de cadastro</h4>
                </div>

                {status === 'signup' && <>
                  <div className='row mb-3'>
                    <TextField className="input-text" id="text" label="E-mail" value={email} onChange={(e) => _email(e.target.value)} />
                  </div>
                  <div className='row mb-3'>
                    <TextField className="input-text" id="text" label="Nome" value={name} onChange={(e) => _name(e.target.value)} />
                  </div>
                  <div className='row mb-3'>
                    <TextField className="input-text" type="password" id="text-pass" label="Senha" value={password} onChange={(e) => _password(e.target.value)} />
                  </div>
                  <div className='row mb-3'>
                    <TextField className="input-text" type="password" id="text-pass" label="Confirmação de senha" value={password_conf} onChange={(e) => _password_conf(e.target.value)} />
                  </div>
                </>}

                {status === 'signed' && <div className='row mb-3' style={{ display: 'flex', flexDirection: 'column' }}>
                  <div>Cadastro efetuado!</div>
                  <div>Agora, basta <Link to="/login" style={{ color: 'inherit', fontWeight: '600' }}>acessar a area de colaboração</Link></div>
                </div>}

                <div className='row mb-3 end-xs middle-xs'>
                  {!['signed'].includes(status) && <button className='button-outline' onClick={() => history.push(`/login${!!query ? `?${query}` : ''}`)}>voltar ao login</button>}
                  <button style={{ marginLeft: '10px' }} className='button-primary' onClick={handleSignup}>cadastrar</button>
                </div>
              </div>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPanel;