import { useState, useEffect } from 'react';
import { useDorothy, useRouter, useUser } from 'dorothy-dna-react';
import { useQuery, useMutation } from 'react-query';
import ConfirmationDialog from '../../components/ConfirmationDialogAdvanced';
import axios from 'axios';
/* components */
import ProjectsTabs from './Tabs';
import InformationsTab from './InformationsTab';
import ConectionsTab from './ConectionsTab';
import TimelineTab from './TimelineTab';
import IndicatorsTab from './IndicatorsTab';
import ActingTab from './ActingTab';
import { PageTitle } from '../../components/PageTitle/PageTitle';
import CheckCircle from '../../components/icons/CheckCircle';
import Trash from '../../components/icons/Trash';
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

const ProjectManager = () => {
  const { currentCommunity, changeRoute, params } = useRouter();
  const { server } = useDorothy();
  const { user, updateUser } = useUser();

  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const [toRemove, _toRemove] = useState(null);
  const [removeDialogOpen, _removeDialogOpen] = useState(false);
  /*  */
  const [projectId, _projectId] = useState(null);
  const [tabindex, _tabindex] = useState(null);
  const [showShapeDialog, _showShapeDialog] = useState(false);
  const [showTermDialod, _showTermDialod] = useState(false);
  const [isAdmOrMod, _isAdmOrMod] = useState(false);
  /*  */

  //get project_id
  const { data: project } = useQuery(['project', { currentCommunity: currentCommunity.id }], {
    queryFn: async () => (await axios.get(`${server}project/id_from_community/${currentCommunity.id}`)).data,
  });

  const { data: analysis } = useQuery(['project_indics', { project_id: project?.id }], {
    queryFn: async () => (await axios.get(`${server}project/${project?.id}/verify`)).data,
    enabled: !!project?.id,
  });

  const mutation = {
    publish: useMutation(() => axios.put(`${server}project/${projectId}/publish`)),
    remove: useMutation(() => {
      return axios.delete(`${server}project/${toRemove}`);
    }),
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

  useEffect(() => {
    _isAdmOrMod(
      user.membership
        .map(membership => {
          return membership.id === 1 || (membership.id === currentCommunity.id && membership.type === 'adm');
        })
        .reduce((acc, curr) => acc || curr),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmOrMod, user, currentCommunity]);

  useEffect(() => {
    if (!project) return;
    _projectId(project.id);
  }, [project]);

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

        enqueueSnackbar('Iniciativa publicada com sucesso!', {
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
              <strong>Esta iniciativa ainda não está pronta para ser publicada!</strong>
            </p>
            <p>Verifique se todos os campos das abas de Informações e Indicadores estão completamente preenchidos.</p>
          </div>,
          {
            autoHideDuration: 10000,
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

      enqueueSnackbar('Erro ao publicar a iniciativa!', {
        variant: 'error',
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'right',
        },
      });
    }
  };

  const handleDownload = () => {
    window.open(`${server}project/${projectId}/download`, '_blank');
  };

  return (
    <div className="page">
      <div className="page-header">
        <PageTitle title="Iniciativa" />
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
      {tabindex && (
        <>
          <ProjectsTabs defaultTab={tabindex} onTabChange={idx => changeRoute({ params: [idx] })} analysis={analysis} />
          {projectId && (
            <>
              {tabindex === 'informacao' && <InformationsTab
                projectId={projectId}
                problems={analysis && Object.keys(analysis.analysis.information).filter(
                  k => analysis.analysis.information[k] === false,
                ) || []}
              />}
              {tabindex === 'conexoes' && <ConectionsTab entityId={projectId} />}
              {tabindex === 'indicadores' && <IndicatorsTab analysis={analysis} />}
              {tabindex === 'abrangencia' && <ActingTab projectId={projectId} />}
              {tabindex === 'timeline' && <TimelineTab projectId={projectId} />}
            </>
          )}
        </>
      )}
      {/* Dialog usado para deleção, justificando a necessidade: segurança para o usuário não deletar de imediato sem querer*/}
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
              Declaro estar ciente e de acordo com as diretrizes político-pedagógicas do PPPZCM e que reconheço o PPPZCM
              como um instrumento político-pedagógico de gestão de processos educativos estruturantes e continuados com
              o foco na contribuição da conservação da biodiversidade e uso sustentável da zona costeira e marinha do
              Brasil.
            </p>
            <p>
              Neste sentido, declaro a adesão ao PPPZCM por meio da inserção da ação/projeto ora cadastrada na
              plataforma MonitoraEA PPPZCM. Declaro que a execução técnica e financeira da referida ação/projeto está
              sob a responsabilidade integral da instituição proponente. A ação/projeto indicada comporá o eixo
              operacional do PPPZCM.
            </p>
            <p>
              Ainda, declaro concordar com a divulgação pública dos dados da ação/projetos ora inseridos – por meio da
              plataforma MonitoraEA PPPZCM - e assumo a inteira responsabilidade pelo teor e veracidade das informações
              cadastradas.
            </p>
            <p>
              Por fim, declaro meu consentimento com a coleta, uso e tratamento de meus dados pessoais pela ANPPEA, que
              atuará como controlador de dados, nos termos da Lei 13.709/2018, e que tenho ciência de que poderei
              solicitar, a qualquer momento, a exclusão de meus dados do banco de dados da plataforma MonitoraEA PPPZCM,
              bem como a revogação deste consentimento.
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

export default ProjectManager;
