import { useEffect, useState } from 'react';

import axios from 'axios';
import { useRouter, useDorothy } from 'dorothy-dna-react';
import { useSnackbar } from 'notistack';

import MapEditor from '../../components/MapEditor';
import Card from '../../components/Card';

const snackPosition = { vertical: 'top', horizontal: 'right' };

async function retrieveGeoms(server, id) {
  const {
    data: { geoms, bbox },
  } = await axios.get(`${server}territorial/${id}/geo-draw`);

  return { geoms, bbox };
}

/*
 * Território de atuação de uma iniciativa guarda-chuva. Sempre geográfico (não há a pergunta
 * "é possível representar geograficamente?" nem justificativa).
 */
const Tool = () => {
  const { server } = useDorothy();
  const { currentCommunity } = useRouter();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const [id, _id] = useState(null);
  const [geoms, _geoms] = useState(null);
  const [bbox, _bbox] = useState(null);
  const [isEditing, _isEditing] = useState(false);

  const load = async iniciativaId => {
    const { geoms, bbox } = await retrieveGeoms(server, iniciativaId);
    _geoms(geoms);
    if (bbox[0][0] !== null) _bbox(bbox);
  };

  useEffect(() => {
    async function init() {
      const { data } = await axios.get(`${server}territorial/id_from_community/${currentCommunity.id}`);
      if (!data?.id) return;
      _id(data.id);
      await load(data.id);
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCommunity.id, server]);

  const handleCancel = async () => {
    const snackKey = enqueueSnackbar('Voltando...', { persist: true, anchorOrigin: snackPosition });
    await load(id);
    closeSnackbar(snackKey);
    _isEditing(false);
  };

  const handleSave = async geojson => {
    const geomsToSave = geojson.features.map(({ geometry }) => geometry);

    const snackKey = enqueueSnackbar('Gravando...', { persist: true, anchorOrigin: snackPosition });

    try {
      await axios.post(`${server}territorial/${id}/geo-draw`, { geoms: geomsToSave });
      closeSnackbar(snackKey);
      enqueueSnackbar('Atuação gravada com sucesso!', { variant: 'success', anchorOrigin: snackPosition });
    } catch (e) {
      closeSnackbar(snackKey);
      enqueueSnackbar('Erro ao gravar a atuação.', { variant: 'error', anchorOrigin: snackPosition });
    }
  };

  return (
    <div className="page-content">
      <div className="page-body">
        <Card middle headerless>
          <div className="p-3">
            {id && (
              <MapEditor
                entity="territorial"
                initialGeoms={geoms}
                initialBBOX={bbox}
                isEditing={isEditing}
                onEdit={editing => _isEditing(editing)}
                onSave={handleSave}
                onCancel={handleCancel}
              />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Tool;
