import { useState, useEffect } from 'react';
import { TextField } from '@mui/material';

import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';

import { useDorothy, useRouter } from 'dorothy-dna-react';
import axios from 'axios';
import { PageTitle } from '../../components/PageTitle/PageTitle';
import { useSnackbar } from 'notistack';

import { useMutation } from 'react-query';

export default function NetworkHome() {
  const { server } = useDorothy();
  const { currentCommunity } = useRouter();

  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const [showNPDialog, _showNPDialog] = useState(false);

  const mutation = {
    create: useMutation(name => axios.post(`${server}project/?communityId=${currentCommunity.id}`, { nome: name }), {
      onSuccess: () => {
        // queryClient.invalidateQueries('project_indics');
      },
    }),
  };

  const handleNProject = async name => {
    if (!name || !name.length) return;

    const snackKey = enqueueSnackbar('Criando a iniciativa..', {
      persist: true,
      anchorOrigin: {
        vertical: 'top',
        horizontal: 'right',
      },
    });

    /* save */
    try {
      const { data } = await mutation.create.mutateAsync(name);

      closeSnackbar(snackKey);

      enqueueSnackbar('Iniciativa gravada com sucesso!', {
        variant: 'success',
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'right',
        },
      });

      _showNPDialog(false);
      window.location = `/colabora/projeto/${data.communityId}`; /* TODO: melhorar */
    } catch (error) {
      closeSnackbar(snackKey);

      console.error(error);

      enqueueSnackbar('Erro ao gravar a iniciativa!', {
        variant: 'error',
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'right',
        },
      });
    }
  };

  return (
    <>
      <div className="page width-limiter">
        <div className="page-header">
          <PageTitle title={''} />
          <div className="page-header-buttons">
            <button className="button-primary" onClick={() => _showNPDialog(true)}>
              {/* <CheckCircle></CheckCircle> */}
              Nova iniciativa
            </button>
          </div>
        </div>
        <div className="page-content">
          <div className="page-body">
            <div className="tablebox" style={{ padding: '20px' }}>
              <h4>
                Esta é a página de entrada da área de colaboração da Rede de Comunidades de Aprendizagens do PPPZCM.
              </h4>
              <p>Para criar a sua iniciativa, clique no botão "Nova iniciativa" (acima)</p>
            </div>
          </div>
        </div>
      </div>

      <NewProjectDialog open={showNPDialog} onCreate={handleNProject} onClose={() => _showNPDialog(false)} />
    </>
  );
}

function NewProjectDialog({ open, onCreate, onClose }) {
  const [name, _name] = useState('');

  useEffect(() => {
    if (open) _name('');
  }, [open]);

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
        <DialogTitle id="alert-dialog-title">Nova iniciativa</DialogTitle>
        <DialogContent>
          <div className="row">
            <div className="col-xs-12">
              <TextField
                className="input-text"
                label="Nome da nova iniciativa"
                value={name}
                onChange={e => _name(e.target.value)}
              />
            </div>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => onClose()} autoFocus>
            Cancelar
          </Button>
          <button className="button-primary" onClick={() => onCreate(name)}>
            Criar
          </button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
