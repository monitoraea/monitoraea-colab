import { useState, createRef } from 'react';
import { Map, TileLayer, WMSTileLayer/* , Popup */, ZoomControl } from 'react-leaflet';

// import L from 'leaflet';

import ToggleOn from '../../components/icons/check-circle.svg?react';
import ToggleOff from '../../components/icons/slash.svg?react';

import styles from './styles.module.scss';

const mapRef = createRef();
const position = [-15.559793, -62.58506];
const zoom = 5;

export default function MapPP() {
    const [recortes, _recortes] = useState([
        'uf',
        'municipio',
        'bairro',
        'u_conservacao',
        'p_urbano',
        'bacia',
    ])

    const doToggle = (id) => {
        if(recortes.includes(id)) _recortes(r => r.filter(r => r !== id));
        else _recortes([...recortes, id]);
    }

    return (<section id="mapa">
        {/* <div className="map-header">
            <div className="title-xl">Mapeamento de Iniciativas Monitoradas</div>
            <div className="map-stats">
                <div className="stat">
                    <div className="title">Políticas</div>
                    <div className="number">413</div>
                </div>
            </div>
        </div> */}
        <div className={styles.container}>
            <div className={styles['map-container']}>
                <Map center={position} zoomControl={false} zoom={zoom} ref={mapRef} maxZoom={18} minZoom={3} scrollWheelZoom={false} /*  onClick={handleMapClick} */>
                    <TileLayer
                        attribution='<a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    <WMSTileLayer
                        url={import.meta.env.VITE_GEOSERVER_URL}
                        layers="pppzcm:published_ppeas_special"
                        format="image/png"
                        transparent={true}
                        opacity={0.8}
                        cql_filter={recortes ? `recorte in (${recortes.map(r => `'${r}'`).join(',')})` : ''}
                    />

                    <ZoomControl position="bottomright" />
                </Map>
            </div>

            <div className={`p-4 ${styles.filter_panel}`}>

                <div className="row">
                    <div className={`col-md-4 ${styles.chooser}`}>
                        {[
                            ['uf','Unidades Federativas'],
                            ['municipio','Municípios'],
                            ['p_urbano','Perímetros Urbanos'],
                            ['bairro','Bairros'],
                            ['u_conservacao','Unidades de Conservação'],
                            ['bacia','Outros recortes'],
                        ].map(r=><Toggler key={r[0]} title={r[1]} on={recortes.includes(r[0])} onToggle={()=>doToggle(r[0])}/>)}
                    </div>
                </div>

            </div>
        </div>
    </section>)

}

function Toggler({ title, on, onToggle }) {
    return (<div onClick={()=>onToggle()}>
        <div>{title}</div>
        {on && <ToggleOn />}
        {!on && <ToggleOff />}
    </div>)
}