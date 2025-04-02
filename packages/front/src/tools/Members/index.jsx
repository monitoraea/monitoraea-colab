import { useState, useEffect } from 'react';
import { useRouter, useDorothy } from 'dorothy-dna-react';
import axios from 'axios';

import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';
import { TextField } from '@mui/material';

/* components */
import Tabs from './Tabs';
import Members from './members';
import Invites from './invites';
import Participations from './participations';

import { useSnackbar } from 'notistack';

import { useMutation, useQueryClient } from 'react-query';

import Plus from '../../components/icons/Plus';

import { PageTitle } from '../../components/PageTitle/PageTitle';

export default function MembersHome() {
  const { changeRoute, params, currentCommunity } = useRouter();
  const { server } = useDorothy();

  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const queryClient = useQueryClient();

  /*  */
  const [tabindex, _tabindex] = useState(null);
  const [showNIDialog, _showNIDialog] = useState(false);
  /*  */

  const mutations = {
    invite: useMutation(
      entity => {
        return axios.post(`${server}gt/${currentCommunity.id}/membership`, entity);
      },
      { onSuccess: () => queryClient.invalidateQueries('invites_list') },
    ),
  };

  useEffect(() => {
    _tabindex(params && params.length ? params[0] : 'lista');
  }, [params]);

  const handleNInvite = async (name, email) => {
    if (!name || !name.length || !email || !email.length) return;

    const snackKey = enqueueSnackbar('Enviando o convite..', {
      persist: true,
      anchorOrigin: {
        vertical: 'top',
        horizontal: 'right',
      },
    });

    /* save */
    try {
      await mutations.invite.mutateAsync({ name, email });

      closeSnackbar(snackKey);

      enqueueSnackbar('Convite enviado com sucesso!', {
        variant: 'success',
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'right',
        },
      });

      _showNIDialog(false);
      changeRoute({ params: ['convites'] });
    } catch (error) {
      closeSnackbar(snackKey);

      console.error(error);

      enqueueSnackbar('Erro ao enviar o convite!', {
        variant: 'error',
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'right',
        },
      });
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <PageTitle title="Membros" />
        <div className="page-header-buttons">
          <button className="button-primary" onClick={() => _showNIDialog(true)}>
            <Plus></Plus>
            Convidar
          </button>
        </div>
      </div>
      {tabindex && (
        <>
          <Tabs defaultTab={tabindex} onTabChange={idx => changeRoute({ params: [idx] })} />

              {tabindex === 'lista' && <Members />}
              {tabindex === 'convites' && <Invites />}
              {tabindex === 'solicitacoes' && <Participations />}

        </>
      )}

      <NewInviteDialog open={showNIDialog} onCreate={handleNInvite} onClose={() => _showNIDialog(false)} />
    </div>
  );
}

function NewInviteDialog({ open, onCreate, onClose }) {
  const [name, _name] = useState('');
  const [email, _email] = useState('');

  useEffect(() => {
    if (open) {
      _name('');
      _email('');
    }
  }, [open]);

  const handleEmail = e => {
    _email(e.target.value.trim().toLowerCase())
  }

  return (
    <div>
      <Dialog
        open={open}
        onClose={onClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        maxWidth="md"
        fullWidth
      >
        <DialogTitle id="alert-dialog-title">Enviar um convite</DialogTitle>
        <DialogContent>
          <div className="row">
            <div className="col-xs-12">
              <TextField className="input-text" label="Nome" value={name} onChange={e => _name(e.target.value)} />
            </div>
          </div>
          <div className="row">
            <div className="col-xs-12">
              <TextField className="input-text" label="E-mail" value={email} onChange={handleEmail} />
            </div>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => onClose()} autoFocus>
            Cancelar
          </Button>
          <button className="button-primary" onClick={() => onCreate(name, email)}>
            Criar
          </button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
