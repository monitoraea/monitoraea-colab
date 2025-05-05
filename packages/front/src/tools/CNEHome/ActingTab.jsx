import React, { useEffect, useState } from 'react';

import axios from 'axios';

import { useRouter, useDorothy } from 'dorothy-dna-react';

import { TextField, FormControl, Select, MenuItem } from '@mui/material';

import { useQueryClient } from 'react-query';

import styled from 'styled-components';

import MapEditor from '../../components/MapEditor';

import { useSnackbar } from 'notistack';

import Card from '../../components/Card';

import FilePlus from '../../components/icons/FilePlus';

import GetHelpButton from './GetHelpButton';

async function retrieveGeoms(server, id) {
  const {
    data: { geoms, bbox },
  } = await axios.get(`${server}cne/${id}/geo-draw`);

  console.log({ geoms, bbox });

  return { geoms, bbox };
}

export default function ActingTab() {
  const queryClient = useQueryClient();
  const { server } = useDorothy();
  const { currentCommunity } = useRouter();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const [id, _id] = useState(null);

  const [hasGeo, _hasGeo] = useState(null);

  const [justification, _justification] = useState('');

  const [isEditing, _isEditing] = useState(false);

  useEffect(() => {
    async function fetchID() {
      const {
        data: { id },
      } = await axios.get(`${server}cne/id_from_community/${currentCommunity.id}`);
      _id(id);
    }
    fetchID();
  }, [currentCommunity.id, server]);

  const [geoms, _geoms] = useState(null);
  const [bbox, _bbox] = useState(null);

  useEffect(() => {
    async function hasGeo() {
      const {
        data: { atuacao_aplica, atuacao_naplica_just },
      } = await axios.get(`${server}cne/${id}/geo-draw/has-geo`);

      _hasGeo(atuacao_aplica);
      _justification(atuacao_naplica_just ? atuacao_naplica_just : '');
    }

    if (id) hasGeo();
  }, [id, server]);

  useEffect(() => {
    async function getGeoms() {
      const { geoms, bbox } = await retrieveGeoms(server, id);
      _geoms(geoms);
      if (bbox[0][0]) _bbox(bbox);
    }

    if (hasGeo) getGeoms();
  }, [hasGeo, id, server]);

  const handleCancel = async () => {
    const snackKey = enqueueSnackbar('Voltando...', {
      persist: true,
      anchorOrigin: {
        vertical: 'top',
        horizontal: 'right',
      },
    });

    const { geoms, bbox } = await retrieveGeoms(server, id);
    _geoms(geoms);
    if (bbox[0][0]) _bbox(bbox);
    closeSnackbar(snackKey);

    _isEditing(false);
  };

  const handleSave = async geoms => {
    const geomsToSave = geoms.features.map(({ geometry }) => geometry);

    const snackKey = enqueueSnackbar('Gravando...', {
      persist: true,
      anchorOrigin: {
        vertical: 'top',
        horizontal: 'right',
      },
    });

    /* const { data } =  */ await axios.post(`${server}cne/${id}/geo-draw`, {
      geoms: geomsToSave,
    });

    queryClient.invalidateQueries('policy_analysis')

    closeSnackbar(snackKey);

    enqueueSnackbar('Atuação gravado com sucesso!', {
      variant: 'success',
      anchorOrigin: {
        vertical: 'top',
        horizontal: 'right',
      },
    });
  };

  const changeGeo = async checked => {
    console.log({ checked });

    const snackKey = enqueueSnackbar('Gravando...', {
      persist: true,
      anchorOrigin: {
        vertical: 'top',
        horizontal: 'right',
      },
    });

    await axios.put(`${server}cne/${id}/geo-draw/${checked ? (checked === 'none' ? 'none' : '1') : '0'}`);
    

    queryClient.invalidateQueries('policy_analysis')


    closeSnackbar(snackKey);

    _hasGeo(checked);
  };

  const handleSaveJust = async () => {
    const snackKey = enqueueSnackbar('Gravando...', {
      persist: true,
      anchorOrigin: {
        vertical: 'top',
        horizontal: 'right',
      },
    });

    await axios.put(`${server}cne/${id}/draft/justification`, { value: justification });    

    queryClient.invalidateQueries('policy_analysis')

    closeSnackbar(snackKey);

    return true;
  };

  return (
    <div className="page-content">
      <div className="page-body">
        <Card middle /*  sx={{ button: { color: 'inherit' } }} */ headerless>
          <div className="p-3">

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <NAplica>
                <div>É possivel representar este projeto de geograficamente?</div>
                <FormControl>
                  <Select
                    className="input-select"
                    value={hasGeo === null ? 'none' : hasGeo}
                    onChange={e => changeGeo(e.target.value)}
                  >
                    <MenuItem value="none"> -- selecione -- </MenuItem>
                    <MenuItem value={true}>Sim</MenuItem>
                    <MenuItem value={false}>Não</MenuItem>
                  </Select>
                </FormControl>
              </NAplica>

              <GetHelpButton tab="atuacao" />
            </div>

            {hasGeo === true && (
              <MapEditor
                entity='cne'
                initialGeoms={geoms}
                initialBBOX={bbox}
                isEditing={isEditing}
                onEdit={editing => _isEditing(editing)}
                onSave={handleSave}
                onCancel={handleCancel}
              />
            )}

            {hasGeo === false && (
              <section id="details">
                <div className="section-header">
                  <div className="section-title">Justificativa</div>
                  <div className="section-actions">
                    <button className="button-primary" onClick={() => handleSaveJust()}>
                      <FilePlus></FilePlus>
                      Gravar
                    </button>
                  </div>
                </div>
                <div className="row">
                  <div className="col-xs-12">
                    <TextField
                      className="input-text" /* 
                    label="Justificativa" */
                      value={justification || ''}
                      onChange={e => _justification(e.target.value)}
                      multiline
                      rows={4}
                    />
                  </div>
                </div>
              </section>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* Styles */
const NAplica = styled.div`
  display: flex;
  margin-bottom: 20px;
  justify-content: end;
  align-items: center;
  div {
    margin-right: 10px;
  }
`;
