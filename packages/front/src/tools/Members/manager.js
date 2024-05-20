import { useState, useEffect, useRef } from 'react';

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';

import { useMutation, useQueryClient } from 'react-query';

import axios from 'axios';

import { useRouter, useDorothy } from 'dorothy-dna-react';

import { useSnackbar } from 'notistack';

const emptyMember = {
  email: '',
  name: '',
};

export default function Manager({ open, id, onClose, onSave }) {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const { server } = useDorothy();

  const { currentCommunity } = useRouter();

  const queryClient = useQueryClient();

  const [member, _member] = useState(emptyMember);

  const [editing, _editing] = useState(false);

  const [errors, _errors] = useState({});

  const mutation = useMutation(
    entity => {
      return axios.post(`${server}user/membership/?communityId=${currentCommunity.id}`, entity);
    },
    {
      onSuccess: () => queryClient.invalidateQueries('members_list'),
    },
  );

  const descriptionElementRef = useRef(null);
  useEffect(() => {
    if (open) {
      const { current: descriptionElement } = descriptionElementRef;
      if (descriptionElement !== null) {
        descriptionElement.focus();
      }

      _member(emptyMember);
    }
  }, [open]);

  const handleFieldChange = field => value => {
    _editing(true);

    let newMember = { ...member, [field]: value };

    console.log(`changing ${field}:`, value, newMember);
    _member(newMember);
  };

  const handleSave = async () => {
    _editing(false);

    let hasErrors = false;
    let newErrors = {};

    if (member.email.trim().length === 0) {
      newErrors.email = true;
      hasErrors = true;
    }

    if (member.name.trim().length === 0) {
      newErrors.name = true;
      hasErrors = true;
    }

    if (hasErrors) {
      _errors(newErrors);
      return;
    }

    /* save */
    const snackKey = enqueueSnackbar('Gravando...', {
      /* variant: 'info', */
      /* hideIconVariant: true, */
      persist: true,
      anchorOrigin: {
        vertical: 'top',
        horizontal: 'center',
      },
    });

    try {
      await mutation.mutateAsync(member);

      closeSnackbar(snackKey);

      enqueueSnackbar('Registro gravado com sucesso!', {
        variant: 'success',
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'center',
        },
      });

      onSave(true);
    } catch (error) {
      closeSnackbar(snackKey);

      console.error(error);

      enqueueSnackbar('Erro ao gravao o registro!', {
        variant: 'error',
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'center',
        },
      });
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <div>
      <Dialog
        className="modal"
        open={open}
        onClose={() => onClose()}
        maxWidth="md"
        scroll="paper"
        aria-labelledby="scroll-dialog-title"
        aria-describedby="scroll-dialog-description"
      >
        <DialogTitle id="scroll-dialog-title">Adicionar membro</DialogTitle>
        <DialogContent dividers={true}>
          <div className="row">
            <div className="col-xs-12">
              <TextField
                className="input-text"
                label="E-mail"
                value={member.email}
                onChange={e => handleFieldChange('email')(e.target.value)}
                error={!editing && errors.email}
              />
            </div>
          </div>
          <div className="row">
            <div className="col-xs-12">
              <TextField
                className="input-text"
                label="Nome"
                value={member.name}
                onChange={e => handleFieldChange('name')(e.target.value)}
                error={!editing && errors.name}
              />
            </div>
          </div>
        </DialogContent>
        <DialogActions>
          <button className="button-primary" onClick={() => handleSave()}>
            gravar
          </button>
          <Button onClick={() => handleClose()}>
            cancelar
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
