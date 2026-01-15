import { useState, useEffect, useRef } from 'react';

import {
  Menu,
  MenuItem,
  TextField,
  Card,
  useMediaQuery,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Slider,
} from '@mui/material';

import ChevronDown from '../icons/ChevronDown';
import Logo from './logo-monitoraea_2.png';
import MenuRenderer from './MenuRenderer';
import NavbarRoleSelector from './NavbarRoleSelector';
import NavbarRoleShow from './NavbarRoleShow';
import { Notifications } from './Notifications';
import styles from './navbar.module.scss';
import './index.scss';

import { useSnackbar } from 'notistack';
import axios from 'axios';

import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  // convertToPixelCrop,
} from 'react-image-crop';

import { useDebounceEffect } from './useDebounceEffect';
import { canvasPreview } from './canvasPreview';

import { useQuery, useMutation, useQueryClient } from 'react-query';

import 'react-image-crop/dist/ReactCrop.css';

import { useHistory } from 'react-router-dom';

import { useUser, ToolMenuContainer, useDorothy, useRouter } from 'dorothy-dna-react';

import ConfirmationDialog from '../ConfirmationDialog';

function centerAspectCrop(mediaWidth, mediaHeight, aspect) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  );
}

export default function Navbar() {
  let history = useHistory();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const { logout, user } = useUser();
  const { server } = useDorothy();

  const [perspectives, _perspectives] = useState(null);
  const [passwordDialg, _passwordDialg] = useState(false);
  const [password, _password] = useState('');
  const [password_conf, _password_conf] = useState('');

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const [showProfile, _showProfile] = useState(false);

  const [showProfileImage, _showProfileImage] = useState(false);
  const [showPerspectives, _showPerspectives] = useState(false);
  const [imgSrc, _imgSrc] = useState('');
  const previewCanvasRef = useRef(null);
  const imgRef = useRef(null);
  const fileInput = useRef(null);
  const [crop, _crop] = useState();
  const [completedCrop, _completedCrop] = useState();
  const [scale, _scale] = useState(1);
  const [rotate, _rotate] = useState(0);
  const [thumbstamp, _thumbstamp] = useState(Date.now());

  const [name, _name] = useState('');
  const [about, _about] = useState('');
  const [name_error, _name_error] = useState(false);

  const { data: hasThumb } = useQuery(['has-thumb', { user: user.id }], {
    queryFn: async () => (await axios.get(`${server}user/has_thumb`)).data,
  });

  const { data: userInfo } = useQuery(['user-info', { user: user.id }], {
    queryFn: async () => (await axios.get(`${server}user/info`)).data,
  });

  useEffect(() => {
    async function getPerspectives() {
      const { data } = await axios.get(`${server}gt/perspectives`);

      _perspectives(data);
    }

    getPerspectives();
  }, [server]);

  useEffect(() => {
    if (!passwordDialg) return;

    _password('');
    _password_conf('');
  }, [passwordDialg]);

  useEffect(() => {
    if (!!userInfo) {
      _name(userInfo.name);
      _about(userInfo.about);
    }
  }, [userInfo]);

  const mutations = {
    removeProfilePhoto: useMutation(() => axios.delete(`${server}user/thumb`), {
      onSuccess: () => queryClient.invalidateQueries(`has-thumb`),
    }),
    saveProfile: useMutation(
      () =>
        axios.put(`${server}user/info`, {
          name,
          about,
        }),
      {
        onSuccess: () => queryClient.invalidateQueries(`user-info`),
      },
    ),
  };

  const handleClick = event => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();

    history.push('/');
  };

  const openProfile = () => {
    _name(userInfo.name);
    _about(userInfo.about);
    _name_error(false);
    setAnchorEl(null);
    _showProfile(true);
  };

  const openProfileImage = () => {
    setAnchorEl(null);
    _showProfileImage(true);
  };

  /* const openPerspectives = () => {
    setAnchorEl(null);
    _showPerspectives(true);
  } */

  const handleChangePasswwordRequest = () => {
    setAnchorEl(null);
    _passwordDialg(true);
  };

  const handleChangePassword = async action => {
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
      const {
        data: { success },
      } = await axios.put(`${server}user/change_my_password`, {
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
  };

  const onSelectFile = e => {
    if (e.target.files && e.target.files.length > 0) {
      _crop(undefined); // Makes crop preview update between images.
      _scale(1);
      _rotate(0);

      const reader = new FileReader();
      reader.addEventListener('load', () => _imgSrc(reader.result?.toString() || ''));
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const onImageLoad = e => {
    const { width, height } = e.currentTarget;
    _crop(centerAspectCrop(width, height, 1));
  };

  const handleProfileImageSave = async () => {
    if (!previewCanvasRef.current) {
      throw new Error('Crop canvas does not exist');
    }

    const blob = await new Promise(resolve => previewCanvasRef.current.toBlob(blob => resolve(blob)));

    if (!blob) {
      throw new Error('Failed to create blob');
    }

    _showProfileImage(false);
    _imgSrc('');

    const snack = enqueueSnackbar('Alterando a imagem do perfil...', {
      persist: true,
      anchorOrigin: {
        vertical: 'top',
        horizontal: 'center',
      },
    });

    const thumbFile = new File([blob], 'image.jpeg', {
      type: blob.type,
    });

    let data = new FormData();
    data.append('thumb', thumbFile);

    await axios({
      method: 'post',
      url: `${server}user/thumb`,
      data,
      config: { headers: { 'Content-Type': 'multipart/form-data' } },
    });

    _thumbstamp(Date.now());

    queryClient.invalidateQueries(`has-thumb`);

    closeSnackbar(snack);
  };

  const removeProfileImage = async () => {
    setAnchorEl(null);
    _showProfileImage(false);
    _imgSrc('');

    const snack = enqueueSnackbar('Removendo a imagem do perfil...', {
      persist: true,
      anchorOrigin: {
        vertical: 'top',
        horizontal: 'center',
      },
    });

    await mutations.removeProfilePhoto.mutateAsync();

    _thumbstamp(Date.now());

    closeSnackbar(snack);
  };

  const handleCloseProfileImage = () => {
    _showProfileImage(false);
    _imgSrc('');
  };

  const handleSaveProfile = async () => {
    if (name.trim().length === 0) {
      _name_error(true);
      return;
    }

    const snack = enqueueSnackbar('Gravando informações de perfil...', {
      persist: true,
      anchorOrigin: {
        vertical: 'top',
        horizontal: 'center',
      },
    });

    await mutations.saveProfile.mutateAsync();

    _showProfile(false);

    closeSnackbar(snack);
  };

  useDebounceEffect(
    async () => {
      if (completedCrop?.width && completedCrop?.height && imgRef.current && previewCanvasRef.current) {
        // We use canvasPreview as it's much faster than imgPreview.
        canvasPreview(imgRef.current, previewCanvasRef.current, completedCrop, scale, rotate);
      }
    },
    100,
    [completedCrop, scale, rotate],
  );

  return (
    <>
      <div className="navbar">
        <div className="nav-start">
          <a href="/">
            <img className="nav-logo" src={Logo} alt="logo" />
          </a>
          <NavbarRoleSelector
            perspectives={perspectives}
            onFilterChange={value => console.log('navbar role selector', value)}
          />
        </div>
        <div className="nav-center-new">
          <ToolMenuContainer>
            <MenuRenderer />
          </ToolMenuContainer>
        </div>
        <div className="nav-end">
          <Notifications />
          <div className={`${styles.nav_profile}`}>
            <div
              className={`${styles.nav_profile_btn}`}
              id="profile-btn"
              aria-controls="profile-menu"
              aria-expanded={open ? 'true' : undefined}
              onClick={handleClick}
            >
              {thumbstamp && (
                <img
                  className={`${styles.nav_profile_img}`}
                  src={`${server}user/${user.id}/thumb/?ts=${thumbstamp}`}
                  alt="avatar"
                />
              )}
              {userInfo?.name}
              <ChevronDown />
            </div>
            <Menu
              className={`${styles.nav_profile_menu}`}
              id="profile-menu"
              anchorEl={anchorEl}
              open={open}
              onClose={handleClose}
              MenuListProps={{
                'aria-labelledby': 'profile-btn',
              }}
            >
              <MenuItem onClick={() => history.push('/perfil')}>Meu perfil</MenuItem>
              <MenuItem onClick={() => history.push('/minha_area')}>Minha área</MenuItem>
              <MenuItem onClick={openProfile}>Informações de perfil</MenuItem>
              <MenuItem onClick={openProfileImage}>{hasThumb ? <>Alterar a</> : <>Enviar</>} foto do perfil</MenuItem>
              <MenuItem onClick={handleChangePasswwordRequest}>Trocar senha</MenuItem>
              {/* <MenuItem onClick={openPerspectives}>Perspectivas</MenuItem> */}
              <MenuItem onClick={handleLogout}>Sair</MenuItem>

              <div className={`${styles.version_number}`}>
                <small>{import.meta.env.VITE_VERSION}</small>
              </div>
            </Menu>
          </div>
        </div>
      </div>

      <NavbarRoleShow
        perspectives={perspectives}
        onFilterChange={value => console.log('navbar role selector', value)}
      />

      <ConfirmationDialog
        open={passwordDialg}
        title="Alteração de senha"
        content={
          <>
            <div className="row mb-3">
              <TextField
                className="input-text"
                type="password"
                id="text-pass"
                placeholder="senha"
                value={password}
                onChange={e => _password(e.target.value)}
              />
            </div>
            <div className="row mb-3">
              <TextField
                className="input-text"
                type="password"
                id="text-pass"
                placeholder="confirmação de senha"
                value={password_conf}
                onChange={e => _password_conf(e.target.value)}
              />
            </div>
          </>
        }
        confirmButtonText="Alterar sua senha"
        onClose={handleChangePassword}
      />

      <Dialog
        className="modal"
        open={showProfile}
        onClose={() => _showProfile(false)}
        maxWidth="sm"
        scroll="paper"
        aria-labelledby="scroll-dialog-title"
        aria-describedby="scroll-dialog-description"
      >
        <DialogTitle id="scroll-dialog-title">Editar informações de perfil</DialogTitle>
        <DialogContent dividers={true}>
          {!!userInfo && (
            <>
              <div className="row">
                <div className="col-md-12">
                  <TextField
                    className="input-text"
                    label="Nome completo"
                    shrink="false"
                    value={name}
                    onChange={e => _name(e.target.value)}
                    error={name_error}
                  />
                </div>
                <div className="col-md-12">
                  <TextField
                    className="input-text"
                    label="Sobre você"
                    shrink="false"
                    value={about}
                    multiline
                    rows={5}
                    onChange={e => _about(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSaveProfile}>gravar</Button>
          <Button onClick={() => _showProfile(false)}>cancelar</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        className="modal"
        open={showProfileImage}
        onClose={handleCloseProfileImage}
        maxWidth="md"
        scroll="paper"
        aria-labelledby="scroll-dialog-title"
        aria-describedby="scroll-dialog-description"
      >
        <DialogTitle id="scroll-dialog-title">Editar imagem de perfil</DialogTitle>
        <DialogContent dividers={true}>
          {!!imgSrc && (
            <div className={`row ${styles['thumb-edition']}`}>
              <div className="col-xs-6">
                <ReactCrop
                  crop={crop}
                  onChange={(_, percentCrop) => _crop(percentCrop)}
                  onComplete={c => _completedCrop(c)}
                  minHeight={100}
                  circularCrop={true}
                  aspect={1}
                >
                  <img
                    ref={imgRef}
                    alt="Crop me"
                    src={imgSrc}
                    style={{ transform: `scale(${scale}) rotate(${rotate}deg)` }}
                    onLoad={onImageLoad}
                  />
                </ReactCrop>
              </div>
              <div className={`col-xs-6 ${styles.preview}`}>
                {!!imgSrc && !!completedCrop && (
                  <>
                    <div>
                      <canvas
                        ref={previewCanvasRef}
                        style={{
                          border: '1px solid black',
                          objectFit: 'contain',
                          width: completedCrop.width,
                          height: completedCrop.height,
                          borderRadius: '50%',
                        }}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          <div className={`row ${styles.controls}`}>
            <div className="col-xs-4">
              <input type="file" accept="image/*" onChange={onSelectFile} hidden ref={fileInput} />
              <button className="button-primary" onClick={() => fileInput.current.click()}>
                {!imgSrc ? <>escolher uma imagem</> : <>trocar a imagem</>}
              </button>
            </div>
            {!!imgSrc && (
              <>
                <div className="col-xs-4">
                  <label htmlFor="scale-input">Escala: </label>
                  <Slider min={0.5} max={2.5} step={0.1} value={scale} onChange={e => _scale(e.target.value)} />
                </div>
                <div className="col-xs-4">
                  <label htmlFor="rotate-input">Rotação: </label>
                  <Slider min={-180} max={180} value={rotate} onChange={e => _rotate(e.target.value)} />
                </div>
              </>
            )}
          </div>
        </DialogContent>
        <DialogActions>
          {hasThumb && <Button onClick={removeProfileImage}>remover imagem de perfil</Button>}
          <Button onClick={handleProfileImageSave}>gravar</Button>
          <Button onClick={handleCloseProfileImage}>cancelar</Button>
        </DialogActions>
      </Dialog>

      {/* <PerspectivesDialog
      show={showPerspectives}
      onClose={() => _showPerspectives(false)}
    /> */}
    </>
  );
}

/* function PerspectivesDialog({ show, onClose }) {
  const { server } = useDorothy();
  const { changeRoute } = useRouter();
  const queryClient = useQueryClient();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const [updated, _updated] = useState(false);

  const { data } = useQuery(
    ['my-perspective'],
    { queryFn: async () => (await axios.get(`${server}gt/perspectives/user`)).data },
  );

  const mutations = {
    participate: useMutation(
      (communityId) => axios.post(`${server}gt/add_user_perspective/${communityId}`),
      {
        onSuccess: () => queryClient.invalidateQueries(`my-perspective`),
      },
    ),
  };

  const doParticipate = async (communityId) => {
    const snack = enqueueSnackbar('Removendo a imagem do perfil...', {
      persist: true,
      anchorOrigin: {
        vertical: 'top',
        horizontal: 'center',
      },
    });

    await mutations.participate.mutateAsync(communityId);

    _updated(true);

    closeSnackbar(snack);
  }

  const handleAccess = (community) => {
    // TODO: temp
    changeRoute({ community });
    if (updated) {
      setTimeout(()=>window.location.href = window.location.href,500);

      _updated(false)
    }

    onClose();
  }

  const handleClose = () => {
    // TODO: temp
    if (updated) {
      window.location.href = window.location.href;
      _updated(false)
    } onClose();
  }

  return <Dialog
    className="modal"
    open={show}
    onClose={handleClose}
    maxWidth="md"
    scroll="paper"
    aria-labelledby="scroll-dialog-title"
    aria-describedby="scroll-dialog-description"
  >
    <DialogTitle id="scroll-dialog-title">Perspectivas</DialogTitle>
    <DialogContent dividers={true}>
      <ul className={styles['perspective_list']}>
        {!data && <>Carregando...</>}
        {data && data.map(p => <li key={p.id} className={styles['perspective']}>
          <div className={styles.name}>{p.name}</div>
          <div className={styles.actions}>
            {p.participate && <>
              <button className="button-primary" onClick={() => handleAccess(p.network_community_id)}>
                Acessar
              </button>
            </>}
            {!p.participate && <>
              <button className="button-primary" onClick={() => doParticipate(p.network_community_id)}>
                Participar
              </button>
            </>}
          </div>
        </li>)}
      </ul>
    </DialogContent>
    <DialogActions>
      <Button onClick={handleClose}>fechar</Button>
    </DialogActions>
  </Dialog>
} */
