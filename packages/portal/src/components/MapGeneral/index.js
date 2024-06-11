import { createRef } from 'react';
import { Map, TileLayer, WMSTileLayer/* , Popup */, ZoomControl } from 'react-leaflet';

// import L from 'leaflet';

import styles from './styles.module.scss';

const mapRef = createRef();
const position = [-15.559793, -62.58506];
const zoom = 5;

export default function MapZCM() {

    return (<section id="mapa">
        {/* <div className="map-header">
          <div className="title-xl">Mapeamento de Iniciativas Monitoradas</div>
          <div className="map-stats">
            <div className="stat">
              <div className="title">PPEA</div>
              <div className="number">413</div>
            </div>
            <div className="stat">
              <div className="title">PPPZCM</div>
              <div className="number">500</div>
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
                        url={process.env.REACT_APP_GEOSERVER_URL}
                        layers="pppzcm:proj_atuacao"
                        format="image/png"
                        transparent={true}
                        opacity={0.9}
                    />

                    <WMSTileLayer
                        url={process.env.REACT_APP_GEOSERVER_URL}
                        layers="pppzcm:published_ppeas_special"
                        format="image/png"
                        transparent={true}
                        opacity={0.5}
                    />

                    <ZoomControl position="bottomright" />
                </Map>
            </div>
        </div>
    </section>)

}