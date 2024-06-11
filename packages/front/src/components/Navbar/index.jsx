import { useState, useEffect } from 'react';
import { Menu, MenuItem, TextField, Card } from '@mui/material';
import ChevronDown from '../icons/ChevronDown';
import Logo from './logo-monitoraea.png';
import MenuRenderer from './MenuRenderer';
import NavbarRoleSelector from './NavbarRoleSelector';
import NavbarRoleShow from './NavbarRoleShow';
import { Notifications } from './Notifications';
import './index.scss';

import { useSnackbar } from 'notistack';
import axios from 'axios';

import {
  useHistory,
} from "react-router-dom";

import { useUser, ToolMenuContainer, useDorothy } from 'dorothy-dna-react';

import ConfirmationDialog from '../ConfirmationDialog';

export default function Navbar() {
  let history = useHistory();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const { logout, user } = useUser();
  const { server } = useDorothy();

  const [perspectives, _perspectives] = useState(null);
  const [passwordDialg, _passwordDialg] = useState(false);
  const [password, _password] = useState('');
  const [password_conf, _password_conf] = useState('');

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  useEffect(()=>{
    async function getPerspectives() {
      const { data } = await axios.get(`${server}gt/perspectives`);

      _perspectives(data)
    }

    getPerspectives();
  },[server])

  useEffect(() => {
    if (!passwordDialg) return;

    _password('');
    _password_conf('');
  }, [passwordDialg])

  const handleClick = event => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();

    history.push('/');
  }

  const handleChangePasswwordRequest = () => {
    setAnchorEl(null);
    _passwordDialg(true);
  }

  const handleChangePassword = async (action) => {
    if (action !== 'confirm') {
      _passwordDialg(false);
      return;
    }

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
      const { data: { success } } = await axios.put(`${server}user/change_my_password`, {
        password,
      });

      closeSnackbar(snack);

      if (!success) throw new Error('Password change error!');

      enqueueSnackbar('Sua senha foi alterada com sucesso!', {
        variant: 'success',
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'center',
        },
      });

      _password('');
      _password_conf('');

      _passwordDialg(false);

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
  }

  return (<>
    <div className="navbar">
      <div className="nav-start">
        <a href="/"><img className='nav-logo' src={Logo} alt="logo" /></a>        
        <NavbarRoleSelector perspectives={perspectives} onFilterChange={value => console.log('navbar role selector', value)} />
      </div>
      <div className="nav-center">
        <ToolMenuContainer>
          <MenuRenderer />
        </ToolMenuContainer>
      </div>
      <div className="nav-end">
        <Notifications />
        <div className="nav-profile">
          <div
            className="nav-profile-btn"
            id="profile-btn"
            aria-controls="profile-menu"
            aria-expanded={open ? 'true' : undefined}
            onClick={handleClick}
          >
            <img className="nav-profile-img" src={`${server}user/${user.id}/thumb`} alt="avatar" />
            {user.name}
            <ChevronDown />
          </div>
          <Menu
            className='nav-profile-menu'
            id="profile-menu"
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            MenuListProps={{
              'aria-labelledby': 'profile-btn',
            }}
          >
            <MenuItem onClick={handleClose}>Meu perfil</MenuItem>
            <MenuItem onClick={handleChangePasswwordRequest}>Trocar senha</MenuItem>
            <MenuItem onClick={handleLogout}>Sair</MenuItem>

            <div className="version-number"><small>{import.meta.env.VITE_VERSION}</small></div>
          </Menu>
        </div>
      </div>
    </div>

    <Card><NavbarRoleShow perspectives={perspectives} onFilterChange={value => console.log('navbar role selector', value)} /></Card>


    <ConfirmationDialog
      open={passwordDialg}
      title="Alteração de senha"
      content={<>
        <div className='row mb-3'>
          <TextField className="input-text" type="password" id="text-pass" placeholder="senha" value={password} onChange={(e) => _password(e.target.value)} />
        </div>
        <div className='row mb-3'>
          <TextField className="input-text" type="password" id="text-pass" placeholder="confirmação de senha" value={password_conf} onChange={(e) => _password_conf(e.target.value)} />
        </div>
      </>}
      confirmButtonText="Alterar sua senha"
      onClose={handleChangePassword}
    />
  </>);
}