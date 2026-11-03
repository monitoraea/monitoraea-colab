import { useEffect, useMemo, useRef, useState } from 'react';

import axios from 'axios';
import L from 'leaflet';
import { Map, TileLayer, WMSTileLayer, GeoJSON, Popup } from 'react-leaflet';
import Control from 'react-leaflet-control';
import { useDorothy } from 'dorothy-dna-react';

import 'leaflet/dist/leaflet.css';

import { CATEGORIAS, CATEGORIA_BY_KEY, TERRITORIO_COLOR } from './categorias';
import Legend from './Legend';
import styles from './styles.module.scss';

// acima disso a lista de códigos estoura o tamanho da URL do WMS (GET): mostra todos os municípios, sem filtro
const MAX_MUN_FILTER = 700;

// Contorno dos municípios: só linha (o estilo padrão da camada preenche de rosa). Cor e espessura aqui.
// (o nome do NamedLayer precisa ser o da camada SEM o prefixo do workspace, senão o GeoServer ignora o SLD)
const MUN_STROKE = '#4b5563';
const MUN_STROKE_WIDTH = 0.5;
const MUN_SLD =
  '<StyledLayerDescriptor version="1.0.0"><NamedLayer><Name>municipios</Name><UserStyle><FeatureTypeStyle><Rule>' +
  `<LineSymbolizer><Stroke><CssParameter name="stroke">${MUN_STROKE}</CssParameter>` +
  `<CssParameter name="stroke-width">${MUN_STROKE_WIDTH}</CssParameter></Stroke></LineSymbolizer>` +
  '</Rule></FeatureTypeStyle></UserStyle></NamedLayer></StyledLayerDescriptor>';

/* ---- ponto dentro de geometria GeoJSON (ray casting, com buracos) ---- */
function inRing(x, y, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function inPolygon(x, y, rings) {
  return inRing(x, y, rings[0]) && !rings.slice(1).some(h => inRing(x, y, h));
}

function containsPoint(geom, x, y) {
  if (!geom) return false;
  switch (geom.type) {
    case 'Polygon':
      return inPolygon(x, y, geom.coordinates);
    case 'MultiPolygon':
      return geom.coordinates.some(p => inPolygon(x, y, p));
    case 'GeometryCollection':
      return geom.geometries.some(g => containsPoint(g, x, y));
    default:
      return false;
  }
}

/*
 * "Recorte no mapa": contorno do território (tracejado), municípios do recorte (WMS), iniciativas recortadas pelo
 * território, coloridas por categoria, com camadas ligáveis. Clique no mapa: popup com TODAS as iniciativas no ponto.
 */
export default function MapBlock({ territorialId, panel, reloadKey, selected, onSelect, zoomRequest }) {
  const { server } = useDorothy();
  const mapRef = useRef();

  const [data, _data] = useState(null);
  const [visible, _visible] = useState(() => Object.fromEntries(CATEGORIAS.map(c => [c.key, true])));
  const [popup, _popup] = useState(null); // { latlng, items }

  useEffect(() => {
    if (!territorialId) return;
    let cancelled = false;
    _data(null);
    axios.get(`${server}territorial/${territorialId}/painel/mapa`).then(({ data }) => {
      if (!cancelled) _data(data);
    });
    return () => {
      cancelled = true;
    };
  }, [territorialId, server, reloadKey]);

  const fitAll = () => {
    if (data?.bbox && mapRef.current) mapRef.current.leafletElement.fitBounds(data.bbox, { padding: [8, 8] });
  };

  useEffect(fitAll, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  // zoom com a roda só com Ctrl pressionado (a página continua rolando normalmente)
  useEffect(() => {
    const map = mapRef.current?.leafletElement;
    if (!map) return;
    const el = map.getContainer();
    const onWheel = e => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      map.setZoom(map.getZoom() + (e.deltaY < 0 ? 1 : -1));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const names = useMemo(() => {
    const m = {};
    (panel?.items || []).forEach(i => (m[`${i.categoria}:${i.id}`] = i));
    return m;
  }, [panel]);

  const featuresByCategoria = useMemo(() => {
    const m = {};
    (data?.features || []).forEach(f => (m[f.properties.categoria] ||= []).push(f));
    return m;
  }, [data]);

  const munFilter = useMemo(() => {
    const list = panel?.municipios || [];
    if (!list.length || list.length > MAX_MUN_FILTER) return null;
    return `cd_mun IN (${list.map(m => m.cd_mun).join(',')})`;
  }, [panel]);

  // react-leaflet 2 liga o onClick só uma vez (na montagem): sem a ref o handler enxergaria dados/estado antigos
  const clickRef = useRef();

  const handleClick = e => {
    const { lat, lng } = e.latlng;
    const items = CATEGORIAS.filter(c => visible[c.key])
      .flatMap(c => featuresByCategoria[c.key] || [])
      .filter(f => containsPoint(f.geometry, lng, lat))
      .map(f => names[`${f.properties.categoria}:${f.properties.id}`] || f.properties);

    _popup(items.length ? { latlng: e.latlng, items } : null);
    // seleciona TODAS as iniciativas sob o clique (clique fora de qualquer uma limpa a seleção)
    onSelect(items.map(i => `${i.categoria}:${i.id}`));
  };

  clickRef.current = handleClick;

  // pedido de zoom vindo da lista: enquadra a geometria da iniciativa escolhida
  useEffect(() => {
    if (!zoomRequest || !mapRef.current) return;
    const [categoria, id] = zoomRequest.key.split(':');
    const f = (featuresByCategoria[categoria] || []).find(f => String(f.properties.id) === id);
    if (!f) return;
    const bounds = L.geoJSON(f).getBounds();
    if (bounds.isValid()) mapRef.current.leafletElement.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 });
    _popup(null);
  }, [zoomRequest]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={styles.mapBlock}>
      <div className={styles.mapHeader}>
        <div>
          <b>Recorte no mapa</b>
          <span className={styles.sub}>cada polígono é a abrangência de um cadastro</span>
        </div>
        <button className="button-outline" onClick={fitAll} disabled={!data?.bbox}>
          Recorte inteiro
        </button>
      </div>

      <Map
        ref={mapRef}
        className={styles.map}
        center={[-15.56, -56.59]}
        zoom={4}
        minZoom={3}
        maxZoom={18}
        scrollWheelZoom={false}
        zoomSnap={0.25}
        onClick={e => clickRef.current(e)}
      >
        {/* botão logo abaixo do +/−: volta o zoom para o enquadramento do território */}
        <Control position="topleft">
          <div className="leaflet-bar">
            <a
              href="#recorte-inteiro"
              role="button"
              title="Recorte inteiro"
              aria-label="Recorte inteiro"
              className={styles.fitBtn}
              onClick={e => {
                e.preventDefault();
                fitAll();
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                <path
                  d="M1 5V1h4M11 1h4v4M15 11v4h-4M5 15H1v-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="square"
                />
              </svg>
            </a>
          </div>
        </Control>

        <TileLayer
          attribution='<a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {panel && (
          <WMSTileLayer
            key={munFilter || 'all'}
            url={import.meta.env.VITE_GEOSERVER_URL}
            layers="pppzcm:municipios"
            sld_body={MUN_SLD}
            format="image/png"
            transparent
            {...(munFilter ? { cql_filter: munFilter } : {})}
          />
        )}

        {data?.territorio && (
          <GeoJSON
            key={`t-${reloadKey}-${data.bbox}`}
            data={data.territorio}
            style={{ color: TERRITORIO_COLOR, weight: 4, dashArray: '10 7', fill: false }}
            interactive={false}
          />
        )}

        {CATEGORIAS.filter(c => visible[c.key] && featuresByCategoria[c.key]).map(c => (
          <GeoJSON
            key={`${c.key}-${reloadKey}-${featuresByCategoria[c.key].length}`}
            data={featuresByCategoria[c.key]}
            style={f => {
              const isSel = selected.includes(`${f.properties.categoria}:${f.properties.id}`);
              return {
                color: isSel ? '#111' : c.color,
                weight: isSel ? 3 : 1.5,
                fillColor: c.color,
                fillOpacity: isSel ? 0.7 : selected.length ? 0.15 : 0.35,
              };
            }}
          />
        ))}

        {popup && (
          <Popup position={popup.latlng} onClose={() => _popup(null)}>
            <div className={styles.popup}>
              {popup.items.map(i => {
                const cat = CATEGORIA_BY_KEY[i.categoria];
                return (
                  <div key={`${i.categoria}:${i.id}`}>
                    <span className={styles.dot} style={{ background: cat.color }} />
                    {i.community_id ? (
                      <a href={`/colabora/${cat.route}/${i.community_id}`} target="_blank" rel="noreferrer">
                        {i.nome || `#${i.id}`}
                      </a>
                    ) : (
                      i.nome || `#${i.id}`
                    )}
                  </div>
                );
              })}
            </div>
          </Popup>
        )}
      </Map>
      <div className={styles.hint}>Ctrl + rolagem para aproximar · arraste para mover</div>

      <Legend visible={visible} counts={panel?.porCategoria} onChange={_visible} />
    </div>
  );
}
