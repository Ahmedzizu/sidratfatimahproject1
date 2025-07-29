import React from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { useTranslation } from 'react-i18next';
import AddCardIcon from '@mui/icons-material/AddCard'; // أيقونة لزر الدفع

const ConfirmDialoge = ({
  open,
  handleClose,
  handleAccept,
  title = "تأكيد العملية",
  message = "هل أنت متأكد؟",
  // ✨ هذه هي الخصائص الجديدة التي تتيح إضافة الزر
  showSecondaryAction = false,
  secondaryActionText = "إجراء إضافي",
  onSecondaryAction,
}) => {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 'bold' }}>
        {t(title)}
      </DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ fontFamily: 'Cairo, sans-serif' }}>
          {t(message)}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ padding: '16px 24px' }}>
        <Button onClick={handleClose} color="secondary" sx={{ fontFamily: 'Cairo, sans-serif' }}>
          {t('cancel', 'إلغاء')}
        </Button>
        
        {/* ✨ هنا يتم عرض الزر الإضافي بناءً على prop */}
        {showSecondaryAction && (
          <Button
            onClick={onSecondaryAction}
            color="info"
            variant="outlined"
            startIcon={<AddCardIcon />}
            sx={{ fontFamily: 'Cairo, sans-serif', mx: 1 }}
          >
            {t(secondaryActionText)}
          </Button>
        )}

        <Button onClick={handleAccept} color="primary" variant="contained" autoFocus sx={{ fontFamily: 'Cairo, sans-serif' }}>
          {t('confirm', 'تأكيد')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialoge;