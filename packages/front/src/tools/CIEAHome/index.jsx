import { useState, useEffect } from 'react';
import { useDorothy, useRouter, useUser } from 'dorothy-dna-react';
import { useQuery, useMutation } from 'react-query';
import axios from 'axios';
/* components */
import Tabs from './Tabs';
import InformationsTab from './InformationsTab';
import TimelineTab from './TimelineTab';

import { PageTitle } from '../../components/PageTitle/PageTitle';
import CheckCircle from '../../components/icons/CheckCircle';
import Download from '../../components/icons/Download';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';
import { Box } from '@mui/material';
import { useSnackbar } from 'notistack';

/* styles */
import styles from './styles.module.scss';

const Manager = () => {
  const { currentCommunity, changeRoute, params } = useRouter();
  const { server } = useDorothy();
  const { user, updateUser } = useUser();

  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  /*  */
  const [entityId, _entityId] = useState(null);
  const [tabindex, _tabindex] = useState(null);
  const [showTermDialod, _showTermDialod] = useState(false);
  const [isAdmOrMod, _isAdmOrMod] = useState(false);
  /*  */

  //get entity_id
  const { data: entity } = useQuery(['commission', { currentCommunity: currentCommunity.id }], {
    queryFn: async () => (await axios.get(`${server}commission/id_from_community/${currentCommunity.id}`)).data,
  });

  /* const { data: analysis } = useQuery(['project_indics', { project_id: project?.id }], {
    queryFn: async () => (await axios.get(`${server}project/${project?.id}/verify`)).data,
    enabled: !!project?.id,
  }); */

  const mutation = {
    publish: useMutation(() => axios.put(`${server}commission/${entityId}/publish`)),
  };

  useEffect(() => {
    _isAdmOrMod(
      user.membership
        .map(membership => {
          return membership.id === 1 || (membership.id === currentCommunity.id && membership.type === 'adm'); /* TODO: analisar aqui e em projetos (depois que criei outros GT ADM) */
        })
        .reduce((acc, curr) => acc || curr),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmOrMod, user, currentCommunity]);

  useEffect(() => {
    if (!entity) return;
    _entityId(entity.id);
  }, [entity]);

  useEffect(() => {
    _tabindex(params && params.length ? params[0] : 'informacao');
  }, [params]);

  const handlePublish = () => {
    _showTermDialod(true);
  };
  const handleTermConfirmation = confirmation => {
    if (confirmation === 'confirm') doPublish();
    _showTermDialod(false);
  };

  const doPublish = async () => {
    const snackKey = enqueueSnackbar('Publicando...', {
      persist: true,
      anchorOrigin: {
        vertical: 'top',
        horizontal: 'right',
      },
    });

    /* save */
    try {
      const { data } = await mutation.publish.mutateAsync();

      closeSnackbar(snackKey);

      if (data.success) {
        window.location = `${window.location}`;

        enqueueSnackbar('Comissão publicada com sucesso!', {
          variant: 'success',
          anchorOrigin: {
            vertical: 'top',
            horizontal: 'right',
          },
        });
      } else if (data.reason.code === 'not_ready') {
        enqueueSnackbar(
          <div>
            <p>
              <strong>Esta comissão ainda não esta pronta para ser publicada!</strong>
            </p>
            <p>Verifique se todos os campos das abas de Informações estão completamente preenchidos.</p>
          </div>,
          {
            variant: 'warning',
            anchorOrigin: {
              vertical: 'top',
              horizontal: 'center',
            },
          },
        );
      } else throw new Error('unknown reason');
    } catch (error) {
      closeSnackbar(snackKey);

      console.error(error);

      enqueueSnackbar('Erro ao publicar a comissão!', {
        variant: 'error',
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'right',
        },
      });
    }
  };

  const handleDownload = () => {
    window.open(`${server}commission/${entityId}/download`, '_blank');
  };

  return (
    <div className="page">
      <div className="page-header">
        <PageTitle title="Comissão" />
        <div className="page-header-buttons">
          <button className="button-outline" onClick={handleDownload}>
            <Download></Download>
            Baixar CSV
          </button>
          
          {isAdmOrMod && isAdmOrMod === true && (
            <button className="button-primary" onClick={handlePublish}>
              <CheckCircle></CheckCircle>
              Publicar
            </button>
          )}
        </div>
      </div>
      {tabindex && (
        <>
          <Tabs defaultTab={tabindex} onTabChange={idx => changeRoute({ params: [idx] })} /* analysis={analysis} */ />
          {entityId && (
            <>
              {tabindex === 'informacao' && <InformationsTab entityId={entityId} />}
              {tabindex === 'linha_tempo' && <TimelineTab entityId={entityId} />}
            </>
          )}
        </>
      )}
      
      <Box display="flex" justifyContent="space-between"></Box>
      
      <TermDialog open={showTermDialod} onClose={handleTermConfirmation} />
    </div>
  );
};

function MockTab({ entityId }) {
  return <div>E.ID {entityId}</div>
}

function TermDialog({ open, onClose }) {
  return (
    <div>
      <Dialog
        open={open}
        onClose={onClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        fullWidth
        maxWidth="md"
      >
        <DialogTitle id="alert-dialog-title">Termo de Adesão ao PPPZCM</DialogTitle>
        <DialogContent>
          <DialogContent id="alert-dialog-description" className={styles.term}>
            <p>
              TODO TODO TODO
            </p>
          </DialogContent>
        </DialogContent>
        <DialogActions>
          <button className="button-primary" onClick={() => onClose('confirm')}>
            Concordo
          </button>
          <Button onClick={() => onClose('cancel')} autoFocus>
            Não concordo
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default Manager;
