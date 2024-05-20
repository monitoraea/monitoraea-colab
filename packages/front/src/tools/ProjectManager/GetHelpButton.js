import { useRouter, useDorothy } from 'dorothy-dna-react';

import { useMutation } from 'react-query';
import axios from 'axios';

import { useSnackbar } from 'notistack';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tooltip,
  TextField,
} from '@mui/material';

import { ReactComponent as Buoy } from '../../components/icons/life-buoy.svg';
import { useEffect, useState } from 'react';

export default function GetHelpButton({ tab }) {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const { server } = useDorothy();
  const { currentCommunity } = useRouter();

  const [open, _open] = useState(false);
  const [text, _text] = useState('');
  const [sending, _sending] = useState(false);
  const [errors, _errors] = useState({});


  useEffect(() => {
    _text('');
    _open(false);
    _errors({});
  }, [])

  const mutations = {
    request: useMutation(
      () => {
        return axios.post(`${server}help/request`, {
          communityId: currentCommunity.id,
          tab,
          text,
        });
      },
    ),
  }

  const requestHelp = () => {
    _open(true);
  }

  const doRequestHelp = async () => {
    let hasErrors = false;
    let newErrors = {};
    
    if (text.trim().length === 0) {
      newErrors.message = true;
      hasErrors = true;
    }

    _errors(newErrors);

    if (hasErrors) return;

    _sending(true);

    const snackKey = enqueueSnackbar('Enviando pedido de ajuda...', {
      /* variant: 'info', */
      /* hideIconVariant: true, */
      persist: true,
      anchorOrigin: {
        vertical: 'top',
        horizontal: 'center',
      },
    });

    try {


      await mutations.request.mutateAsync();

      closeSnackbar(snackKey);

      enqueueSnackbar('Pedido de ajuda enviado com sucesso!', {
        variant: 'success',
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'right',
        },
      });

      _open(false);
    } catch (error) {
      closeSnackbar(snackKey);

      console.error(error);

      enqueueSnackbar('Erro ao enviar pedido de ajuda!', {
        variant: 'error',
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'right',
        },
      });
    } finally {
      _sending(false);
    }
  }

  return (<>
    <div style={{ marginRight: '5px' }}>
      <Tooltip title="Pedir ajuda">
        <button className="button-outline" disabled={sending} onClick={requestHelp}>
          <Buoy></Buoy>
          Pedir ajuda sobre esta aba
        </button>
      </Tooltip >
    </div>

    <Dialog
      open={open}
      onClose={() => _open(false)}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle id="alert-dialog-title">Envio de pedido de ajuda</DialogTitle>
      <DialogContent id="alert-dialog-description">
        <p className="pt-1 px-3 pb-3">
          <TextField
            label="Preencha este campo com sua dúvida"
            className="input-text"
            value={text}
            onChange={e => _text(e.target.value)}
            multiline
            rows={8}
            error={errors.message}
          />
        </p>
      </DialogContent>
      <DialogActions>
        <button className="button-primary" onClick={doRequestHelp}>
          Enviar
        </button>
        <Button onClick={() => _open(false)} autoFocus>
          Cancelar
        </Button>
      </DialogActions>
    </Dialog>
  </>);
}