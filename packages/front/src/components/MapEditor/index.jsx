import React, { useState, useEffect, useRef, Fragment } from "react";

import L from 'leaflet';

import { Map, TileLayer, FeatureGroup } from "react-leaflet";
import Control from 'react-leaflet-control';

import { EditControl } from "react-leaflet-draw"

import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";

import AsyncAutocompleteSuggest from '../../components/AsyncAutocompleteSuggest';

import { useDorothy } from 'dorothy-dna-react';

import axios from 'axios'

import "./mapeditor.css";

import BetterWMS from "./BetterWMS"

import { useSnackbar } from 'notistack';

const position = [-15.559793, -56.58506];
const zoom = 4;

L.drawLocal.draw.toolbar.buttons.polygon = 'Desenhe um polígono';
L.drawLocal.draw.toolbar.buttons.circle = 'Determine uma área circular (raio)';
// L.drawLocal.draw.toolbar.buttons.marker = 'Determine uma área a partir de um marcador';



const templateLayers = [
  {
    name: 'Municipíos',
    url: import.meta.env.VITE_GEOSERVER_URL,
    layers: 'pppzcm:municipios',
    search: true,
    key: 'gid',
    entity: 'municipios',
  },

  {
    name: 'Estados',
    url: import.meta.env.VITE_GEOSERVER_URL,
    layers: 'pppzcm:ufs',
    key: 'id',
    entity: 'ufs',
  },
  {
    name: 'Bacias',
    url: import.meta.env.VITE_GEOSERVER_URL,
    layers: 'pppzcm:bacias',
    options: {
      title: 'Nível',
      field: 'level',
      values: [2,3,4,5],
      default: 2,
    },
    key: 'id',
    entity: 'bacias',
  },
];

export default function MapEditor({ entity, initialGeoms, initialBBOX, onSave, onEdit, isEditing, onCancel }) {

  const mapRef = useRef();
  const editableFG = useRef();
  const inputFileRef = useRef();

  const { server } = useDorothy();

  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const [showTemplate, _showTemplate] = useState(null);
  const [editing, _editing] = useState(false);

  const [cqlFilter, _cqlFilter] = useState(null);
  const [optionValue, _optionValue] = useState(null);  

  const [showMunDialog, _showMunDialog] = useState(false);

  useEffect

  useEffect(() => {
    if (!initialBBOX || !mapRef || !mapRef.current) return;

    mapRef.current.leafletElement.fitBounds(initialBBOX)

  }, [initialBBOX])

  useEffect(() => {
    if (!initialGeoms || !editableFG.current) return;

    editableFG.current.leafletElement.eachLayer(layer => {
      editableFG.current.leafletElement.removeLayer(layer);
    });

    initialGeoms.forEach(geojson => {
      const leafletGeoJSON = new L.GeoJSON(geojson);

      /* console.log(geojson) */

      leafletGeoJSON.eachLayer(layer => {
        if (layer.feature.geometry.type === 'Point') {
          console.log({ layer })
        }
        editableFG.current.leafletElement.addLayer(layer);
      });
    });

  }, [initialGeoms])

  useEffect(() => {
    if (editing) _showTemplate(null);
  }, [editing])

  const handleSave = () => {
    const geojsonData = editableFG.current.leafletElement.toGeoJSON();
    onSave(geojsonData);
  }

  const handleCancel = () => {
    _showTemplate(null);
    onCancel();
  }

  const handleUpload = () => {
    inputFileRef.current.click();
  }

  const doUpload = async (file) => {
    const data = new FormData()
    data.append('file', file);

    const { data: { geojson } } = await axios.post(`${server}${entity}/upload-shp`, data)

    const leafletGeoJSON = new L.GeoJSON(geojson);

    // console.log(geojson)

    leafletGeoJSON.eachLayer(layer => {
      editableFG.current.leafletElement.addLayer(layer);
    });

    mapRef.current.leafletElement.fitBounds(editableFG.current.leafletElement.getBounds())

  }

  const handleFetching = (fetching) => {
    // console.log(fetching);
  }

  const handleGetFeatureInfo = async (data) => {

    if (data && data.features && data.features[0]) {

      const idKey = templateLayers[showTemplate].key;
      const entity = templateLayers[showTemplate].entity;

      if(data.features[0].properties[idKey]) {

        const id = data.features[0].properties[idKey];
  
        // console.log({showTemplate, entity, id})
  
        // recupera geojson via base  
        const {
          data: { geoms },
        } = await axios.get(`${server}geo/${entity}/${idKey}/${id}`);

        // adiciona geojson no mapa
        geoms.forEach(geojson => {
          const leafletGeoJSON = new L.GeoJSON(geojson);
    
          /* console.log(geojson) */
    
          leafletGeoJSON.eachLayer(layer => {
            if (layer.feature.geometry.type === 'Point') {
              console.log({ layer })
            }
            editableFG.current.leafletElement.addLayer(layer);
          });
        });
      }

      /* OLD - bug */
      // for (let poly of data.features[0].geometry.coordinates) {
      //   let transformedGeometry = { ...data.features[0] };

      //   // From MultiPolygon to Polygon
      //   transformedGeometry.geometry.type = 'Polygon';
      //   transformedGeometry.geometry.coordinates = poly;

      //   let leafletGeoJSON = new L.GeoJSON(transformedGeometry);

      //   leafletGeoJSON.eachLayer(layer => {
      //     editableFG.current.leafletElement.addLayer(layer);
      //   });
      // }

    }
  }

  const toogleTemplate = (t) => {
    
    if(templateLayers[t].options) {
      _cqlFilter(`${templateLayers[t].options.field}=${templateLayers[t].options.default}`);
      _optionValue(templateLayers[t].options.default);
    } else {
      _cqlFilter(null);
      _optionValue(null);
    }

    if (showTemplate === t) _showTemplate(null); else _showTemplate(t);
  }

  const handleOptionChange = (t, v) => {
    _cqlFilter(`${templateLayers[t].options.field}=${v}`);
    _optionValue(v)
  }

  const handleAddMun = async (cd_mun) => {
    const snackKey = enqueueSnackbar('Carregando...', {
      persist: true,
      anchorOrigin: {
        vertical: 'top',
        horizontal: 'right',
      },
    });

    const { data: geoms } = await axios.get(`${server}municipio/${cd_mun}/feature`);

    geoms.forEach(geojson => {
      const leafletGeoJSON = new L.GeoJSON(geojson);

      console.log(geojson)

      leafletGeoJSON.eachLayer(layer => {
        editableFG.current.leafletElement.addLayer(layer);
      });
    });


    closeSnackbar(snackKey);

    _cqlFilter(null);

    _showMunDialog(false);
  }

  const handleFindMun = async (cd_mun) => {
    /* cql_filter */
    _cqlFilter(`cd_mun=${cd_mun}`);

    const snackKey = enqueueSnackbar('Carregando...', {
      persist: true,
      anchorOrigin: {
        vertical: 'top',
        horizontal: 'right',
      },
    });

    const { data: bbox } = await axios.get(`${server}municipio/${cd_mun}/bbox`);

    closeSnackbar(snackKey);

    /* zoom */
    const bounds = [[bbox.y1, bbox.x1], [bbox.y2, bbox.x2]];
    mapRef && mapRef.current && mapRef.current.leafletElement.fitBounds(bounds);

    /* End Loading */

    // _showMunDialog(false);
  }

  const handleRemoveMun = () => {
    _cqlFilter(null);

    // _showMunDialog(false);
  }

  // const addCircle = (layer) => {
  //   console.log(layer)
  // }
  // const removeCircle = (layer) => {
  //   console.log(layer)
  // }

  return (<>
    <input type="file" ref={inputFileRef} style={{ display: "none" }} name="file" onChange={(e) => doUpload(e.target.files[0])} />
    <Map
      id="map-container"
      center={position}
      zoom={zoom}
      ref={mapRef}
      maxZoom={18}
      minZoom={3}
    /* onClick={handleMapClick} */
    >
      <FeatureGroup ref={editableFG}>

        {isEditing && <>
          <EditControl
            position='topright'

            /*            
            onCreated={(layer) => layer.layerType === 'circle' && addCircle(layer)}
            onDeleted={lg => console.log(lg)}            
            onEdited={console.log}
            */

            onEditStart={() => _editing(true)}
            onDeleteStart={() => _editing(true)}
            onDrawStart={() => _editing(true)}

            onEditStop={() => _editing(false)}
            onDeleteStop={() => _editing(false)}
            onDrawStop={() => _editing(false)}

            draw={{
              rectangle: false,
              marker: false,
              circle: false,
              circlemarker: false,
              polyline: false,
            }}
          />

          <Control position="topright">
            <button disabled={editing} onClick={handleUpload}>Enviar (shp)</button>
          </Control>
          <Control position="topright">
            <div style={{ display: "flex", flexDirection: "column", alignItems: 'self-end' }}>
              {templateLayers.map((t, idx) => <div key={idx}>
                <button disabled={editing || (showTemplate !== null && showTemplate !== idx)} onClick={() => toogleTemplate(idx)}>
                  {t.name} {t.options && showTemplate === idx && <> - {t.options.title}:</>}
                </button>
                {t.search && showTemplate === idx && <button onClick={() => _showMunDialog(!showMunDialog)}>...</button>}
                {t.options && showTemplate === idx && <select value={optionValue} onChange={(e) => handleOptionChange(idx, e.target.value)}>
                  {t.options.values.map(v => <option key={v}>{v}</option>)}
                </select>}
              </div>)}
            </div>
          </Control>
        </>}

      </FeatureGroup>

      {isEditing && <>
        <Control position="topright">
          <button disabled={editing} className="action save" onClick={handleSave}>Gravar</button>
        </Control>
        <Control position="topright">
          <button disabled={editing} className="action cancel" onClick={handleCancel}>Sair</button>
        </Control>
      </>}

      {!isEditing && <Control position="topright">
        <button className="action" onClick={() => onEdit(true)}>Editar</button>
      </Control>}

      <TileLayer
        attribution='<a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {templateLayers.map((t, idx) => <Fragment key={idx}>
        {showTemplate === idx && <BetterWMS
          url={t.url}
          layers={t.layers}
          format="image/png"
          transparent={true}
          onGetFeatureInfo={handleGetFeatureInfo}
          onFetching={handleFetching}
          cql_filter={cqlFilter}
        />}
      </Fragment>)}
    </Map>

    <MunDialog show={showMunDialog} onClose={() => _showMunDialog(false)} onAdd={handleAddMun} onFind={handleFindMun} onRemove={handleRemoveMun} hasFilter={!!cqlFilter} />
  </>);
}

function MunDialog({ show, onClose, onFind, onAdd, onRemove, hasFilter }) {

  const [munSearchValue, _munSearchValue] = useState(null);

  return (<Dialog
    open={show}
    onClose={onClose}
    aria-labelledby="alert-dialog-title"
    aria-describedby="alert-dialog-description"
    maxWidth="xs"
    fullWidth
  >
    <DialogTitle id="alert-dialog-title">Encontrar municipio</DialogTitle>
    <DialogContent>
      <div className="row">
        <div className="col-xs-6">
          <AsyncAutocompleteSuggest
            label="Municipio"
            url="municipio"
            query="?uf=1"
            onChange={(_, e) => { _munSearchValue(e?.value); if (e?.value) onRemove() }}
            value={munSearchValue}
          />
        </div>
      </div>
      {hasFilter && <div className="row">
        <div className="col-xs-12" style={{ fontWeight: 'bold', color: '#b34747' }}>
          Você deve clicar no municipio para incluí-lo!
        </div>
      </div>}
    </DialogContent>
    <DialogActions>
      {/* munSearchValue && <button className="button-primary" onClick={() => munSearchValue && onAdd(munSearchValue)}>Incluir</button> */}
      {!hasFilter && munSearchValue && <button className="button-outline" onClick={() => munSearchValue && onFind(munSearchValue)}>Filtrar</button>}
      {hasFilter && <button className="button-outline" onClick={() => onRemove()}>Remover filtro</button>}
      <button className="button-outline" onClick={onClose}>Fechar</button>
    </DialogActions>
  </Dialog>)

}