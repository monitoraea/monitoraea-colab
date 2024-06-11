import { useState, useEffect } from 'react';

import Card from './../Card';
import { TextField, useMediaQuery } from '@mui/material';

import { useSnackbar } from 'notistack';
import axios from 'axios';

import { useDorothy } from 'dorothy-dna-react';
import { useHistory, useParams } from 'react-router-dom';

import styles from './login.module.scss';

import { layoutTabletMQ } from '../../../utils/configs';

/* commons */
import { Title4 } from '../ui/titles';

const LoginPanel = ({ onLogin, next, doing_login, appLogo, subTitle }) => {
  const { server } = useDorothy();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const history = useHistory();
  let { screen, recover } = useParams();

  const [email, _email] = useState('');
  const [password, _password] = useState('');
  const [password_conf, _password_conf] = useState('');

  const [sent, _sent] = useState(false);
  const [verified, _verified] = useState('no');

  const isLayoutTablet = useMediaQuery(layoutTabletMQ);

  useEffect(() => {
    _sent(false);
    _verified('no');

    async function tryRecover() {
      const {
        data: { success /* , user, reason */ },
      } = await axios.get(`${server}user/verify_recovery_code/${recover}`);
      if (success) _verified('success');
      else _verified('fail');
    }

    if (screen === 'recuperar') tryRecover();
  }, [screen, recover, server]);

  const onRecoverRequest = async () => {
    const snack = enqueueSnackbar('Enviando...', {
      persist: true,
      anchorOrigin: {
        vertical: 'top',
        horizontal: 'center',
      },
    });

    try {
      await axios.get(`${server}user/request_recovery_code/${email}`);

      closeSnackbar(snack);

      _sent(true);
    } catch (e) {
      closeSnackbar(snack);

      enqueueSnackbar('Erro ao requisitar a recuperação de senha', {
        variant: 'error',
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'center',
        },
      });
    }
  };

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
      const {
        data: { success },
      } = await axios.put(`${server}user/change_password/${recover}`, {
        password,
      });

      closeSnackbar(snack);

      if (!success) throw new Error('Recover error!');

      enqueueSnackbar('Sua senha foi alterada com sucesso!', {
        variant: 'success',
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'center',
        },
      });

      _password('');
      _password_conf('');

      history.push('/login');
    } catch (e) {
      closeSnackbar(snack);

      enqueueSnackbar('Erro ao requisitar a recuperação de senha', {
        variant: 'error',
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'center',
        },
      });
    }
  };

  const verifyEnterKey = e => {
    if (e.keyCode === 13) onLogin(email, password, next);
  };

  return (
    <div className={`page width-limiter centered ${styles.login_page}`}>
      <div className={`page-content ${styles['login_page-content']}`}>
        <div className={`${isLayoutTablet ? styles.login_signin : 'row middle-xs'}`}>
          <div className={`col ${styles.login_col}`}>
            <div className={`${styles.login_logo}`}>
              <div className="centered">
                <img className="img-fluid" src={appLogo} alt="logo" />
                <p className="mt-3">{subTitle}</p>
              </div>
            </div>
          </div>

          <div className={`col ${styles.login_col}`}>
            {(!screen || screen === 'entrar') && (
              <Card title="" headerless bottom>
                <div className="p-4">
                  <div className="row mb-3">
                    <Title4>Acesse o sistema</Title4>
                  </div>
                  <div className="row mb-3">
                    <TextField
                      className="input-text"
                      id="text-email"
                      label="e-mail"
                      value={email}
                      onChange={e => _email(e.target.value)}
                      onKeyDown={verifyEnterKey}
                    />
                  </div>
                  <div className="row mb-3">
                    <TextField
                      className="input-text"
                      type="password"
                      id="text-pass"
                      label="senha"
                      value={password}
                      onChange={e => _password(e.target.value)}
                      onKeyDown={verifyEnterKey}
                    />
                  </div>
                  <div className={`row mb-3 middle-xs ${isLayoutTablet ? 'center-xs' : 'end-xs'}`}>
                    <span className="mr-3" style={{ cursor: 'pointer' }} onClick={() => history.push('/login/esqueci')}>
                      esqueci a senha
                    </span>
                    <button
                      className="button-primary"
                      disabled={doing_login}
                      onClick={() => onLogin(email, password, next)}
                    >
                      acessar
                    </button>
                  </div>
                </div>
              </Card>
            )}

            {screen === 'esqueci' && (
              <Card title="" headerless bottom>
                <div className="p-4">
                  <div className="row mb-3">
                    <Title4>Recuperação de senha</Title4>
                  </div>
                  <div className="row mb-3">
                    {!sent && (
                      <TextField
                        className="input-text"
                        id="text-email"
                        label="e-mail"
                        value={email}
                        onChange={e => _email(e.target.value)}
                      />
                    )}
                    {sent && <>Uma mensagem com instruções foi enviada para seu email!</>}
                  </div>
                  <div className={`row mb-3 middle-xs ${isLayoutTablet ? 'center-xs' : 'end-xs'}`}>
                    <span className="mr-3" style={{ cursor: 'pointer' }} onClick={() => history.push('/login/entrar')}>
                      lembrei da senha
                    </span>
                    {!sent && (
                      <button
                        className="button-primary"
                        onClick={() => {
                          if (email.length) onRecoverRequest(email, password, next);
                        }}
                      >
                        recuperar
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {screen === 'recuperar' && (
              <Card title="" headerless bottom>
                <div className="p-4">
                  <div className="row mb-3">
                    <Title4>{verified === 'success' ? 'Digite a nova senha' : 'Recuperação de senha'}</Title4>
                  </div>

                  {verified === 'no' && <div className="row mb-3">Verificando...</div>}
                  {verified === 'fail' && (
                    <div className="row mb-3">Este código de recuperação não existe ou está expirado!</div>
                  )}

                  {verified === 'success' && (
                    <>
                      <div className="row mb-3">
                        <TextField
                          className="input-text"
                          type="password"
                          id="text-pass"
                          label="senha"
                          value={password}
                          onChange={e => _password(e.target.value)}
                        />
                      </div>
                      <div className="row mb-3">
                        <TextField
                          className="input-text"
                          type="password"
                          id="text-pass"
                          label="confirmação de senha"
                          value={password_conf}
                          onChange={e => _password_conf(e.target.value)}
                        />
                      </div>
                    </>
                  )}

                  <div className={`row mb-3 middle-xs ${isLayoutTablet ? 'center-xs' : 'end-xs'}`}>
                    <span className="mr-3" style={{ cursor: 'pointer' }} onClick={() => history.push('/login/entrar')}>
                      lembrei da senha
                    </span>
                    {verified === 'success' && (
                      <button className="button-primary" onClick={changePassword}>
                        alterar a senha
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPanel;
