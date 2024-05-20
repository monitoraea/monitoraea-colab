import { useUser, CommunityRouter, useQuery } from 'dorothy-dna-react';
import { Switch, Route, useHistory, Redirect, useLocation } from 'react-router-dom';
import { useSnackbar } from 'notistack';
/* components */
import Navbar from './components/Navbar';
import LoginPanel from './components/Login';
import InvitePanel from './components/Login/InvitePanel';
import SignupPanel from './components/Login/SignupPanel';
import ParticipatePanel from './components/Login/ParticipatePanel';

export default function Body() {
  const history = useHistory();
  const location = useLocation();
  const query = useQuery();

  const { enqueueSnackbar } = useSnackbar();

  const { isLogged, login, doing_login } = useUser();

  const handleLogin = async (email, password, next) => {
    const user = await login(email, password);

    if (!user)
      enqueueSnackbar('E-mail ou senha incorretos!', {
        variant: 'error',
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'center',
        },
      });
    else if(query.get('next')) window.location = query.get('next');
    else if(query.get('portal')) window.location = query.get('portal');
    else history.push('/') 
  };

  return (
    <>

      <Switch>

        <Route path="/cadastro">
          <div className="page-wrapper login">
            <SignupPanel />
          </div>
        </Route>

        <Route path="/convite/:uuid">
          <div className="page-wrapper login">
            <InvitePanel />
          </div>
        </Route>

        <Route path="/login/:screen?/:recover?">
          {!isLogged && (
            <div className="page-wrapper login">
              <LoginPanel onLogin={handleLogin} doing_login={doing_login} />
            </div>
          )}
          {isLogged && <Redirect to="/" />}
        </Route>

        <Route path="/participate/:project_id">
          {isLogged && (
            <div className="page-wrapper login">
              <ParticipatePanel />
            </div>
          )}
          {!isLogged && <Redirect to={`/login/?next=${location.pathname}`} />}
        </Route>

        {!isLogged && (
          <Route>
            <Redirect to={`${location.pathname.length && location.pathname !== '/' ? `/login/?next=${location.pathname}` : 'login' }`} />
          </Route>
        )}

        {isLogged && (
          <Route>
            <Navbar />
            <div className="page-wrapper">
              <CommunityRouter />
            </div>
          </Route>
        )}
      </Switch>

      <div className="device-not-supported"></div>
    </>
  );
}
