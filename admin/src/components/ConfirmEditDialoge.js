import React from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';

const ConfirmEditDialoge = ({ open, handleClose, handleConfirm }) => {
  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="confirm-edit-dialog-title"
    >
      <DialogTitle id="confirm-edit-dialog-title">
        {"تأكيد التعديلات"}
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          هل أنت متأكد أنك تريد حفظ التغييرات التي أجريتها على هذا الحجز؟
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="primary">
          إلغاء
        </Button>
        <Button onClick={handleConfirm} color="primary" autoFocus>
          تأكيد الحفظ
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmEditDialoge;