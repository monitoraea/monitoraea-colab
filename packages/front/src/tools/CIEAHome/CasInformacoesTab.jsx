import { useMemo, useRef, useState } from 'react';
import { FormPage, ByEntityDataProvider } from '@community-assistant/client';
import { useDorothy } from 'dorothy-dna-react';
import Button from '@mui/material/Button';
import { useSnackbar } from 'notistack';

// entity_id/entity_type ties this CAS-managed `colegiado` row back to the
// legacy ciea.comissoes record it belongs to (see Part B plan, B.1). Passing
// entityId as FormPage's `id` prop routes the initial load through
// ByEntityDataProvider's by-entity GET (finds-or-tells-FormPage-to-create
// the one true row per legacy colegiado); FormPage then resets its own
// internal savedId from the fetched row's real CAS-internal PK, so every
// subsequent save is a PUT against that same row, never a duplicate POST.
const ENTITY_TYPE = 'legacy_colegiado';

export default function CasInformacoesTab({ entityId }) {
  const { server } = useDorothy();
  const apiBaseUrl = `${server}cas_api`;
  const dataProvider = useMemo(() => new ByEntityDataProvider(apiBaseUrl, ENTITY_TYPE), [apiBaseUrl]);

  const formRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

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

  return (
    <div className="page-content">
      <div className="page-body">
        <FormPage
          ref={formRef}
          entity="colegiado"
          formKey="informacao"
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
      </div>
    </div>
  );
}
