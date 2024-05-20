import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';

export default function ConfirmationDialog({
  open,
  title,
  content,
  cancelButtonText = 'Cancelar',
  confirmButtonText = 'Confirmar',
  onClose,
}) {
  return (
    <div>
      <Dialog
        open={open}
        onClose={onClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        {title && <DialogTitle id="alert-dialog-title">{title}</DialogTitle>}
        <DialogContent>{content}</DialogContent>
        <DialogActions>
          <Button onClick={() => onClose('cancel')} autoFocus>
            {cancelButtonText}
          </Button>
          <Button onClick={() => onClose('confirm')}>{confirmButtonText}</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
