import { useMemo, useRef, useState } from 'react';
import { FormPage, EntityRecordsDataProvider } from '@community-assistant/client';
import { useDorothy } from 'dorothy-dna-react';
import { TreeView } from '@mui/x-tree-view/TreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import ChevronRightIcon from '../../components/icons/chevron-right.svg?react';
import ExpandMoreIcon from '../../components/icons/chevron-down.svg?react';
import { Box } from '@mui/material';
import Button from '@mui/material/Button';
import { useSnackbar } from 'notistack';

// Same 5-dimension/19-indicator structure as ../indics/index.jsx, reused
// here purely as a client-side navigation tree — each leaf points at its
// own CAS FD (form-indic-<dim>-<n>.yml) rather than the legacy indic_*.yml.
const DIMENSIONS = [
  {
    id: '1',
    title: 'Dimensão Diagnóstico, Planejamento e Formação',
    indics: [
      { id: '1_1', title: 'Diagnóstico Participativo do Colegiado' },
      { id: '1_2', title: 'Planejamento Participativo do Colegiado' },
      { id: '1_3', title: 'Processo Formativo do Colegiado' },
    ],
  },
  {
    id: '2',
    title: 'Dimensão da Gestão e Governança',
    indics: [
      { id: '2_1', title: 'Normativas de institucionalização e inclusão do Colegiado' },
      { id: '2_2', title: 'Apoio financeiro e logístico à participação dos membros nas atividades do Colegiado' },
      { id: '2_3', title: 'Transparência' },
      { id: '2_5', title: 'Monitoramento e Avaliação da PPEA em seu âmbito de controle social' },
      { id: '2_6', title: 'Ampliação da participação da sociedade na formulação e implementação das políticas públicas de EA' },
      { id: '2_7', title: 'Deliberações/Tomada de Decisão do Colegiado' },
    ],
  },
  {
    id: '3',
    title: 'Dimensão da Incidência e Enraizamento das Políticas Públicas de EA',
    indics: [
      { id: '3_1', title: 'Ações de Enraizamento e Capilaridade da EA nos territórios' },
      { id: '3_2', title: 'Produção de documentos e recomendações do Colegiado' },
      { id: '3_3', title: 'Articulação e Intersetorialidade' },
      { id: '3_4', title: 'Compromissos firmados entre diferentes setores para implementar ações conjuntas' },
      { id: '3_5', title: 'Comprometimento do poder público com as pautas do Colegiado' },
      { id: '3_6', title: 'Alterações e incrementos em políticas públicas' },
    ],
  },
  {
    id: '4',
    title: 'Dimensão do Diálogo e Pertencimento',
    indics: [
      { id: '4_1', title: 'Acordo de convivência dialógica' },
      { id: '4_2', title: 'Percepções de pertencimento, satisfação, respeito e inclusão como membro do Colegiado' },
      { id: '4_3', title: 'Comprometimento dos Membros' },
    ],
  },
  {
    id: '5',
    title: 'Dimensão da Justiça Socioambiental e Climática e Antirracista',
    indics: [
      { id: '5_1', title: 'Mecanismos e Medidas para combater o racismo ambiental e as injustiças socioambientais e climáticas' },
    ],
  },
];

const ENTITY_TYPE = 'legacy_colegiado';

export default function CasIndicadoresTab({ entityId }) {
  const { server } = useDorothy();
  const apiBaseUrl = `${server}cas_api`;
  const { enqueueSnackbar } = useSnackbar();

  const [selected, setSelected] = useState(DIMENSIONS[0].indics[0].id);
  const formRef = useRef(null);
  const [saving, setSaving] = useState(false);

  const dataProvider = useMemo(
    () => new EntityRecordsDataProvider(apiBaseUrl, ENTITY_TYPE, `indic_${selected}`),
    [apiBaseUrl, selected],
  );

  const handleSelect = (_event, nodeId) => {
    // Only leaf nodes (indicator ids) are selectable forms; dimension nodes
    // just expand/collapse.
    if (DIMENSIONS.some(dim => dim.indics.some(i => i.id === nodeId))) {
      setSelected(nodeId);
    }
  };

  const handleSave = async () => {
    if (!formRef.current) return;
    setSaving(true);
    const result = await formRef.current.save();
    setSaving(false);
    enqueueSnackbar(result.ok ? 'Salvo com sucesso!' : (result.error ?? 'Erro ao salvar'), {
      variant: result.ok ? 'success' : 'error',
      anchorOrigin: { vertical: 'top', horizontal: 'right' },
    });
  };

  const [dim, n] = selected.split('_');

  return (
    <div className="page-content">
      <div className="page-body" style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
        <Box sx={{ minWidth: 320, maxWidth: 380, flexShrink: 0 }}>
          <TreeView
            aria-label="indicadores"
            defaultCollapseIcon={<ExpandMoreIcon />}
            defaultExpandIcon={<ChevronRightIcon />}
            defaultExpanded={DIMENSIONS.map(d => d.id)}
            selected={selected}
            onNodeSelect={handleSelect}
          >
            {DIMENSIONS.map(d => (
              <TreeItem key={d.id} nodeId={d.id} label={`${d.id}. ${d.title}`}>
                {d.indics.map(i => (
                  <TreeItem key={i.id} nodeId={i.id} label={`${i.id.replace('_', '.')} ${i.title}`} />
                ))}
              </TreeItem>
            ))}
          </TreeView>
        </Box>

        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <FormPage
            key={selected}
            ref={formRef}
            entity="colegiado"
            formKey={`form-indic-${dim}-${n}`}
            id={entityId}
            dataProvider={dataProvider}
            defaultValues={{ entity_id: entityId, entity_type: ENTITY_TYPE }}
          />
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            sx={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              zIndex: 1200,
              boxShadow: 4,
              borderRadius: '999px',
              px: 3,
            }}
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </Box>
      </div>
    </div>
  );
}
