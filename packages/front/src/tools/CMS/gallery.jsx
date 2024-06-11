/* libs */
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useEffect, useState, useRef } from 'react';
import axios from 'axios';

/* dorothy */
import { /* useRouter */ useDorothy } from 'dorothy-dna-react';

/* mui */
import { Button, Dialog, DialogContent, DialogTitle, DialogActions, Tooltip } from '@mui/material';

/* styles */
import styles from './cms.module.scss';

/* icons */
/* import Favorite from '../../commons/components/ui/icons/Favorite'; */
import Trash from '../../commons/components/ui/icons/Trash';

import { useSnackbar } from 'notistack';

export default function Gallery({ open, onSelected, onClose }) {
  const { server } = useDorothy();
  const queryClient = useQueryClient();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const fileInput = useRef();

  const [images, _images] = useState([]);

  const { data } = useQuery(['image_gallery'], {
    queryFn: async () => (await axios.get(`${server}gallery/images`)).data,
  });

  const mutations = {
    deleteImage: useMutation(
      id => {
        return axios.delete(`${server}gallery/image/${id}`);
      },
      { onSuccess: () => queryClient.invalidateQueries('image_gallery') },
    ),
  };

  useEffect(() => {
    if (!data) return;

    _images(data.images);
  }, [data]);

  const selectImage = async image => {
    if (image && image.fileUrl) onSelected(image.fileUrl);
  };

  const deleteImage = async imageId => {
    await mutations.deleteImage.mutateAsync(imageId);
  };

  const handleSave = async (entity, file) => {
    /* save */
    let data = new FormData();

    if (file) data.append('file', file);

    const snackKey = enqueueSnackbar('Enviando a imagem..', {
      persist: true,
      anchorOrigin: {
        vertical: 'top',
        horizontal: 'right',
      },
    });

    try {
      let method = 'post';
      let url = `${server}gallery/image`;

      data.set('entity', JSON.stringify(entity));

      await axios({
        method,
        url,
        data,
        config: { headers: { 'Content-Type': entity.type } },
      });

      closeSnackbar(snackKey);

      enqueueSnackbar('Imagem gravada com sucesso!', {
        variant: 'success',
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'right',
        },
      });

      queryClient.invalidateQueries('image_gallery');
    } catch (error) {
      enqueueSnackbar('Erro ao gravar a imagem!', {
        variant: 'error',
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'right',
        },
      });

      console.error(error);
    }
  };

  const handleFile = file => {
    const url = URL.createObjectURL(file);

    console.log('handleFile', { url, file: file.name, type: file.type });

    handleSave(
      {
        // ...entity,
        file: url,
        file_name: file,
        type: file.type,
      },
      file,
    );
  };

  return (
    <>
      <input
        type="file"
        accept={'image/*'}
        ref={fileInput}
        hidden
        onChange={e => {
          if (e.target.files.length) handleFile(e.target.files[0]);
        }}
      />

      <Dialog
        id="gallery_modal"
        className="modal"
        open={open}
        maxWidth="md"
        scroll="paper"
        aria-labelledby="scroll-dialog-title"
        aria-describedby="scroll-dialog-description"
      >
        <DialogTitle id="scroll-dialog-title">Galeria de imagem</DialogTitle>
        <DialogContent dividers={true}>
          <div className={styles.image_uploader}>
            <Button onClick={() => fileInput.current.click()}>Adicionar nova imagem</Button>
          </div>

          <div className={``}>
            <span>Todas as imagens</span>
            {images && (
              <div className={styles.images_box}>
                {images.map(image => (
                  <div className={styles.image_container} key={`${image.imageId}`}>
                    <div className={styles.image_content} onClick={() => selectImage(image)}>
                      <img
                        className={`${styles.image} ${image.favorite_image ? styles.selected : ''}`}
                        src={image.fileUrl}
                        alt="added by user"
                      />
                    </div>
                    <div className={styles.actions}>
                      <Tooltip title="remover imagem da galeria" placement="top">
                        <Button onClick={() => deleteImage(image.imageId)} className={styles.action_icons}>
                          <Trash />
                        </Button>
                      </Tooltip>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>sair</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
