import React from 'react';
import { Modal, Box, Typography, Paper, Button, Divider } from '@mui/material';
import { useTranslation } from 'react-i18next';

const HistoryModal = ({ open, onClose, history }) => {
  const { i18n } = useTranslation();

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="history-modal-title"
    >
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: { xs: '90%', sm: 600 },
        bgcolor: 'background.paper',
        boxShadow: 24,
        p: 4,
        direction: i18n.language === 'en' ? 'ltr' : 'rtl',
        fontFamily: 'Cairo'
      }}>
        <Typography id="history-modal-title" variant="h6" component="h2" sx={{ mb: 2 }}>
          سجل تعديلات الحجز
        </Typography>
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {history && history.length > 0 ? (
            history.slice(0).reverse().map((mod, index) => (
              <Paper key={index} variant="outlined" sx={{ p: 2, mb: 2 }}>

<Typography variant="body2">
  <span style={{ fontWeight: 'bold' }}>👤 بواسطة:</span>
  {/* هذا الكود سيعمل الآن بشكل صحيح */}
  {mod.modifiedBy?.name || 'موظف غير معروف'}
</Typography>

                <Typography variant="body2">
                  <span style={{ fontWeight: 'bold' }}>🗓️ في:</span> {new Date(mod.modifiedAt).toLocaleString('ar-EG')}
                </Typography>
                <Typography variant="body1" sx={{ mt: 1, color: 'primary.main', fontWeight: 'bold' }}>
                  📝 {mod.changes}
                </Typography>
              </Paper>
            ))
          ) : (
            <Typography>لا توجد تعديلات.</Typography>
          )}
        </div>
        <Button onClick={onClose} sx={{ mt: 3 }}>إغلاق</Button>
      </Box>
    </Modal>
  );
};

export default HistoryModal;