import { useState, useEffect } from 'react';
import { useDorothy, useRouter, useUser } from 'dorothy-dna-react';
import { useQuery, useMutation } from 'react-query';
import ConfirmationDialog from '../../components/ConfirmationDialogAdvanced';
import axios from 'axios';
/* components */
import Tabs from './Tabs';
import InformationsTab from './InformationsTab';
import ConexoesTab from './ConexoesTab';
import TimelineTab from './TimelineTab';
import IndicatorsTab from './Indicators2024Tab';
import OldIndicatorsTab from './IndicatorsTab';
import AtuacaoTab from './ActingTab';

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

import Trash from '../../components/icons/Trash';

/* styles */
import styles from './styles.module.scss';

const Manager = () => {
  const { currentCommunity, changeRoute, params } = useRouter();
  const { server } = useDorothy();
  const { user, updateUser } = useUser();

  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const [toRemove, _toRemove] = useState(null);
  const [removeDialogOpen, _removeDialogOpen] = useState(false);

  /*  */
  const [entityId, _entityId] = useState(null);
  const [tabindex, _tabindex] = useState(null);
  const [showShapeDialog, _showShapeDialog] = useState(false);
  const [showTermDialod, _showTermDialod] = useState(false);
  const [isAdmOrMod, _isAdmOrMod] = useState(false);
  /*  */

  //get entity_id
  const { data: entity } = useQuery(['policy', { currentCommunity: currentCommunity.id }], {
    queryFn: async () => (await axios.get(`${server}ppea/id_from_community/${currentCommunity.id}`)).data,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const { data: analysis } = useQuery(['policy_analysis', { policy_id: entity?.id }], {
    queryFn: async () => (await axios.get(`${server}ppea/${entity?.id}/verify`)).data,
    enabled: !!entity?.id,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const mutation = {
    publish: useMutation(() => axios.put(`${server}ppea/${entityId}/publish`)),
    remove: useMutation(() => {
      return axios.delete(`${server}ppea/${toRemove}`);
    }),
  };

  useEffect(() => {
    _isAdmOrMod(
      user.membership
        .map(membership => {
          return (
            membership.id === 1 || (membership.id === currentCommunity.id && membership.type === 'adm')
          ); /* TODO: analisar aqui e em projetos (depois que criei outros GT ADM) */
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

  const remove = () => {
    _toRemove(currentCommunity.id);
    _removeDialogOpen(true);
  };

  const doRemove = async action => {
    if (action === 'confirm') {
      let result = await mutation.remove.mutateAsync(toRemove);

      enqueueSnackbar('Iniciativa deletada com sucesso!', {
        variant: 'success',
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'right',
        },
      });

      changeRoute({ community: result.data });
      updateUser();
    }

    _toRemove(null);
    _removeDialogOpen(false);
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

        enqueueSnackbar('politica publicada com sucesso!', {
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
              <strong>Esta politica ainda não esta pronta para ser publicada!</strong>
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

      enqueueSnackbar('Erro ao publicar a politica!', {
        variant: 'error',
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'right',
        },
      });
    }
  };

  const handleDownload = () => {
    window.open(`${server}ppea/${entityId}/download`, '_blank');
  };

  return (
    <div className="page">
      <div className="page-header">
        <PageTitle title="Política Pública de Educação Ambiental" />
        <div className="page-header-buttons">
          <button className="button-outline" onClick={handleDownload}>
            <Download></Download>
            Baixar CSV
          </button>

          <button className="button-outline" onClick={() => _showShapeDialog(true)}>
            <Download></Download>
            Baixar GEO (Shapefile)
          </button>

          {isAdmOrMod && isAdmOrMod === true && (
            <button className="button-primary" onClick={handlePublish}>
              <CheckCircle></CheckCircle>
              Publicar
            </button>
          )}

          {isAdmOrMod && isAdmOrMod === true && (
            <button className={styles.button_delete} onClick={remove}>
              <Trash></Trash>
              Excluir
            </button>
          )}
        </div>
      </div>
      {analysis && tabindex && (
        <>
          <Tabs defaultTab={tabindex} onTabChange={idx => changeRoute({ params: [idx] })} analysis={analysis} />
          {entityId && (
            <>
              {tabindex === 'informacao' && (
                <InformationsTab
                  entityId={entityId}
                  problems={Object.keys(analysis.analysis.information).filter(
                    k => analysis.analysis.information[k] === false,
                  )}
                />
              )}
              {tabindex === 'indicadores_novos' && (
                <IndicatorsTab entityId={entityId} analysis={analysis} problems={analysis.analysis.question_problems} />
              )}
              {tabindex === 'conexoes' && <ConexoesTab entityId={entityId} />}
              {tabindex === 'abrangencia' && <AtuacaoTab entityId={entityId} />}
              {tabindex === 'timeline' && <TimelineTab entityId={entityId} />}
            </>
          )}
        </>
      )}

      <Box display="flex" justifyContent="space-between"></Box>
      <ConfirmationDialog
        open={removeDialogOpen}
        content="Confirma a remoção desta iniciativa?"
        confirmButtonText="Remover"
        onClose={doRemove}
      />

      <ShapeDialog open={showShapeDialog} onClose={() => _showShapeDialog(false)} />
      <TermDialog open={showTermDialod} onClose={handleTermConfirmation} />
    </div>
  );
};

function ShapeDialog({ open, onClose }) {
  return (
    <div>
      <Dialog
        open={open}
        onClose={onClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">Aviso</DialogTitle>
        <DialogContent>
          <DialogContent id="alert-dialog-description">Este recurso esta em fase de implementação!</DialogContent>
        </DialogContent>
        <DialogActions>
          <button className="button-primary" onClick={() => onClose('cancel')} autoFocus>
            Fechar
          </button>
        </DialogActions>
      </Dialog>
    </div>
  );
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
              Declaro estar ciente e de acordo com as diretrizes político-pedagógicas do Sistema MonitoraEA e que
              reconheço a Plataforma MonitoraEA como um instrumento de gestão de dados das iniciativas de educação
              ambiental (políticas, projetos, instâncias, entre outros) no Brasil.
            </p>
            <p>
              Neste sentido, declaro a adesão ao Sistema MonitoraEA por meio da inserção da iniciativa ora cadastrada na
              Plataforma MonitoraEA. Declaro que a execução técnica e financeira da referida iniciativa está sob a
              responsabilidade integral da instituição proponente e, eventualmente, seus parceiros.
            </p>
            <p>
              Ainda, declaro concordar com a divulgação pública dos dados da iniciativa ora inserida – por meio da
              Plataforma MonitoraEA - e assumo a inteira responsabilidade pelo teor e veracidade das informações
              cadastradas.
            </p>
            <p>
              Por fim, declaro meu consentimento com a coleta, uso e tratamento de meus dados pessoais pela ANPPEA, que
              atuará como gestora de dados, nos termos da Lei 13.709/2018, e que tenho ciência de que poderei solicitar,
              a qualquer momento, a exclusão de meus dados do banco de dados da Plataforma MonitoraEA, bem como a
              revogação deste consentimento.
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
