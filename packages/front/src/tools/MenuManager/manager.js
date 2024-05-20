import { useState, useEffect } from 'react';

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, FormControl, FormControlLabel, Checkbox, Select, MenuItem } from '@mui/material';

import { useQuery, useMutation, useQueryClient } from 'react-query';

import axios from 'axios';

import { useRouter, useDorothy } from 'dorothy-dna-react';

import ConfirmationDialog from '../../components/ConfirmationDialog';
import AsyncAutocomplete from '../../components/AsyncAutocomplete';

import { useSnackbar } from 'notistack';

import _ from 'underscore';

const emptyEntity = {
  type: 'none',
  title: '',
  link: 'null',
  content_id: null,
  order: null,
  blank: false,
  parent_id: null,
};

const types = [
  {
    id: 'none',
    title: 'Nenhum',
  },
  {
    id: 'link',
    title: 'Link',
  },
  {
    id: 'page',
    title: 'Página',
  }
];

export default function Manager({ open, id, onClose, onSave, newParentId, newOrder }) {
  const { server } = useDorothy();

  const { currentCommunity } = useRouter();

  const queryClient = useQueryClient();

  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const [entity, _entity] = useState(emptyEntity);
  const [originalEntity, _originalEntity] = useState(emptyEntity);

  const [editing, _editing] = useState(false);

  const [errors, _errors] = useState({});

  const [confirm, _confirm] = useState(false);

  const { data } = useQuery(`menu_portal/${id}`, { enabled: !!id && id !== 'novo' });

  const mutation = useMutation(
    entity => {
      entity.communityId = currentCommunity.id;

      if (entity.id) {
        /* edit */
        return axios.put(`${server}menu_portal/${entity.id}`, entity);
      } else {
        /* insert */
        return axios.post(`${server}menu_portal`, entity);
      }
    },
    {
      onSuccess: () => queryClient.invalidateQueries('menu_tree'),
    },
  );

  useEffect(() => {
    _editing(false);
    _errors({});


    let newEntity = { ...emptyEntity }
    if(id === 'novo') {
      newEntity.parent_id = newParentId;
      newEntity.order = newOrder;
    }

    _entity(newEntity);
    _originalEntity(newEntity);
  }, [id, newParentId, newOrder]);

  useEffect(() => {
    if (!data) return;

    _entity(data);
    _originalEntity(data);
  }, [data]);

  const handleFieldChange = (field) => value => {
    _editing(true);

    let newEntity = { ...entity, [field]: value };

    console.log(`changing ${field}:`, value, newEntity);
    _entity(newEntity);
  };

  const handleSave = async () => {
    _editing(false);

    let hasErrors = false;
    let newErrors = {};

    if (!entity.title) {
      newErrors.title = true;
      hasErrors = true;
    }

    if (entity.type === 'link' && !entity.link?.length) {
      newErrors.link = true;
      hasErrors = true;
    }

    if (entity.type === 'page' && !entity.content_id) {
      newErrors.content_id = true;
      hasErrors = true;
    }

    if (hasErrors) {
      _errors(newErrors);
      return;
    }

    /* save */
    try {
      const snack = enqueueSnackbar('Gravando...', {
        persist: true,
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'right',
        },
      });

      await mutation.mutateAsync(entity);

      closeSnackbar(snack);

      onSave(!_.isEqual(originalEntity, entity));
    } catch (error) {
      console.error(error);
    }
  };

  const handleClose = () => {
    /* verificar se ha alteracao */
    if (!_.isEqual(originalEntity, entity)) {
      _confirm(true);
      return;
    }

    onClose();
  };

  const handleConfirmation = response => {
    _confirm(false);
    if (response === 'confirm') onClose();
  };

  return (
    <div>
      <Dialog
        id="menu_item"
        className="modal"
        open={open}
        maxWidth="sm"
        scroll="paper"
        aria-labelledby="scroll-dialog-title"
        aria-describedby="scroll-dialog-description"
      >
        <DialogTitle id="scroll-dialog-title">{!id || id === 'novo' ? 'Adicionar' : 'Editar'} item de menu</DialogTitle>
        <DialogContent dividers={true}>

          <div className="row">
            <div className="col-md-5">
              <FormControl fullWidth>
                <Select
                  className="input-select"
                  value={entity.type}
                  onChange={(e) => handleFieldChange('type')(e.target.value)}
                >
                  {types.map(t => <MenuItem key={t.id} value={t.id}> {t.title} </MenuItem>)}
                </Select>
              </FormControl>
            </div>

            <div className="col-md-7">
              <TextField
                className="input-text"
                label="Título"
                placeholder="10"
                shrink="false"
                value={entity.title}
                onChange={e => handleFieldChange('title')(e.target.value)}
                error={!editing && errors.title}
              />
            </div>
          </div>

          <div className="row">
            {entity.type === 'link' && <>
              <div className="col-md-9">
                <TextField
                  className="input-text"
                  label="Link"
                  placeholder="10"
                  shrink="false"
                  value={entity.link || ''}
                  onChange={e => handleFieldChange('link')(e.target.value)}
                  error={!editing && errors.link}
                />
              </div>
              <div className="col-md-3">
                <FormControl fullWidth>
                  <FormControlLabel
                    control={
                      <Checkbox checked={entity.blank} onChange={(e, checked) => handleFieldChange('blank')(checked)} />
                    }
                    label="Nova aba?"
                  />
                </FormControl>
              </div>
            </>}

            {entity.type === 'page' && <div className="col-md-12">
              <AsyncAutocomplete
                label="Conteúdos de página"
                url="content/related"
                urlSingle="content"
                titleField="title"
                query={`?type=page`}
                onChange={value => handleFieldChange('content_id')(value)}
                value={entity.content_id}
                error={!editing && errors.content_id}
              />
            </div>}
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleSave()}>gravar</Button>
          <Button onClick={() => handleClose()}>cancelar</Button>
        </DialogActions>
      </Dialog>

      <ConfirmationDialog
        open={confirm}
        content="Você deseja sair sem gravar as alterações?"
        confirmButtonText="Descartar alterações"
        onClose={handleConfirmation}
      />
    </div>
  );
}
