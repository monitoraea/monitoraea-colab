import { useCallback, useEffect, useState } from 'react';

import axios from 'axios';
import { useRouter, useDorothy, useUser } from 'dorothy-dna-react';
import { useSnackbar } from 'notistack';

import { PageTitle } from '../../components/PageTitle/PageTitle';

import MapBlock from './MapBlock';
import InitiativesList from './InitiativesList';
import PerspectiveBlock from './PerspectiveBlock';
import NetworkBlock from './NetworkBlock';
import styles from './styles.module.scss';

/* Painel guarda-chuva: cruza a atuação territorial do GT com as iniciativas cadastradas. */
const Tool = () => {
  const { server } = useDorothy();
  const { currentCommunity } = useRouter();
  const { user } = useUser();
  const { enqueueSnackbar } = useSnackbar();

  const [id, _id] = useState(null);
  const [panel, _panel] = useState(null);
  const [loading, _loading] = useState(false);
  const [selected, _selected] = useState([]); // chaves "categoria:id" selecionadas (mapa e lista)
  const [zoomRequest, _zoomRequest] = useState(null);
  const [reloadKey, _reloadKey] = useState(0); // muda a cada "Recarregar": os blocos refazem suas buscas

  // administradores da plataforma (comunidade 1) podem recarregar o cache
  const isAdmin = !!user?.membership?.some(m => m.id === 1);

  useEffect(() => {
    async function init() {
      const { data } = await axios.get(`${server}territorial/id_from_community/${currentCommunity.id}`);
      _id(data?.id || null);
    }
    init();
  }, [currentCommunity.id, server]);

  const load = useCallback(
    async (reload = false) => {
      if (!id) return;
      _loading(true);
      try {
        const url = `${server}territorial/${id}/painel`;
        const { data } = reload ? await axios.post(`${url}/reload`) : await axios.get(url);
        _panel(data);
        if (reload) {
          _reloadKey(k => k + 1);
          _selected([]);
        }
      } catch (e) {
        enqueueSnackbar('Erro ao carregar o painel territorial.', {
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'right' },
        });
      } finally {
        _loading(false);
      }
    },
    [id, server, enqueueSnackbar],
  );

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="page">
      <div className="page-header">
        <PageTitle title="Painel Territorial" />
        {isAdmin && (
          <div className="page-header-buttons">
            <button className="button-outline" disabled={loading || !id} onClick={() => load(true)}>
              {loading ? 'Carregando...' : 'Recarregar'}
            </button>
          </div>
        )}
      </div>
      <div className="page-content">
        <div className={`page-body ${styles.body}`}>
          <div className={styles.kpi}>
            <div className={styles.label}>Iniciativas</div>
            <div className={styles.value}>{panel ? panel.total : '–'}</div>
          </div>
          <div className={styles.kpi}>
            <div className={styles.label}>Municípios</div>
            <div className={styles.value}>{panel ? panel.municipios.length : '–'}</div>
          </div>
          <div className={styles.columns}>
            <MapBlock
              territorialId={id}
              panel={panel}
              reloadKey={reloadKey}
              selected={selected}
              onSelect={_selected}
              zoomRequest={zoomRequest}
            />
            <InitiativesList
              panel={panel}
              selected={selected}
              onSelect={_selected}
              onZoom={key => _zoomRequest({ key, n: Date.now() })}
            />
          </div>
          <div className={styles.columns}>
            <PerspectiveBlock panel={panel} />
            <NetworkBlock />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tool;
