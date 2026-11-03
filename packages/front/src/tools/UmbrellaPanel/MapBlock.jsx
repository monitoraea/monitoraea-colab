import { useEffect, useMemo, useRef, useState } from 'react';

import axios from 'axios';
import { Map, TileLayer, WMSTileLayer, GeoJSON, Popup } from 'react-leaflet';
import { useDorothy } from 'dorothy-dna-react';

import 'leaflet/dist/leaflet.css';

import { CATEGORIAS, CATEGORIA_BY_KEY } from './categorias';
import styles from './styles.module.scss';

// acima disso a lista de códigos estoura o tamanho da URL do WMS (GET): mostra todos os municípios, sem filtro
const MAX_MUN_FILTER = 700;

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
export default function MapBlock({ territorialId, panel, reloadKey }) {
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
    if (data?.bbox && mapRef.current) mapRef.current.leafletElement.fitBounds(data.bbox);
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

  const handleClick = e => {
    const { lat, lng } = e.latlng;
    const items = CATEGORIAS.filter(c => visible[c.key])
      .flatMap(c => featuresByCategoria[c.key] || [])
      .filter(f => containsPoint(f.geometry, lng, lat))
      .map(f => names[`${f.properties.categoria}:${f.properties.id}`] || f.properties);

    _popup(items.length ? { latlng: e.latlng, items } : null);
  };

  return (
    <div className={styles.mapBlock}>
      <div className={styles.mapHeader}>
        <b>Recorte no mapa</b>
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
        onClick={handleClick}
      >
        <TileLayer
          attribution='<a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {panel && (
          <WMSTileLayer
            key={munFilter || 'all'}
            url={import.meta.env.VITE_GEOSERVER_URL}
            layers="pppzcm:municipios"
            format="image/png"
            transparent
            {...(munFilter ? { cql_filter: munFilter } : {})}
          />
        )}

        {data?.territorio && (
          <GeoJSON
            key={`t-${reloadKey}-${data.bbox}`}
            data={data.territorio}
            style={{ color: '#333', weight: 2, dashArray: '6 4', fill: false }}
            interactive={false}
          />
        )}

        {CATEGORIAS.filter(c => visible[c.key] && featuresByCategoria[c.key]).map(c => (
          <GeoJSON
            key={`${c.key}-${reloadKey}-${featuresByCategoria[c.key].length}`}
            data={featuresByCategoria[c.key]}
            style={{ color: c.color, weight: 1.5, fillColor: c.color, fillOpacity: 0.35 }}
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

      <div className={styles.legend}>
        <div className={styles.legendTitle}>Camadas — marque as que deseja ver</div>
        {CATEGORIAS.map(c => (
          <label key={c.key}>
            <input
              type="checkbox"
              checked={visible[c.key]}
              onChange={e => _visible(v => ({ ...v, [c.key]: e.target.checked }))}
            />
            <span className={styles.dot} style={{ background: c.color }} />
            {c.label}
            <b>{panel ? panel.porCategoria[c.key] : ''}</b>
          </label>
        ))}
      </div>
    </div>
  );
}
