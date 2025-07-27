import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import "../scss/addResorts.scss"; // استبدل بمسار ملف CSS المناسب
import { Grid, InputLabel, Select, MenuItem, TextField } from '@mui/material';
import Api from '../config/config';
import { useDispatch, useSelector } from 'react-redux';
import { fetchReservations } from '../redux/reducers/reservation';
import { fetchResort } from '../redux/reducers/resort';
import MuiAlert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import { useTranslation } from 'react-i18next';

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 600,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
};

const NewReservationsModal = ({ handleClose, open, data: temp, update }) => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();

  const resorts = useSelector((state) => state.resort.value.data);
  const user = useSelector((state) => state.employee.value.user);

  const today = new Date();
  const dateString = `${today.getFullYear()}-${('0' + (today.getMonth() + 1)).slice(-2)}-${('0' + today.getDate()).slice(-2)}`;

  const [data, setData] = useState({
    contractNumber: '',
    clientName: '',
    clientPhone: '',
    startDate: '',
    endDate: '',
    cost: '',
    entity: {},
    period: { type: 'days', dayPeriod: '' },
  });

  const [snackOpen, setSnackOpen] = useState(false);
  const [timeError, setTimeError] = useState('');

  useEffect(() => {
    dispatch(fetchResort());
    if (temp) {
      setData({
        ...temp,
        period: temp.period || { type: 'days', dayPeriod: '' },
      });
    }
  }, [temp, dispatch]);

  function handleEntitySelect(id) {
    const selectedResort = resorts.find((resort) => resort._id === id);
    setData({ ...data, entity: { name: selectedResort.name, id: selectedResort._id } });
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (new Date(data.startDate).getTime() > new Date(data.endDate).getTime()) {
      return setTimeError('يجب أن يكون تاريخ الوصول قبل تاريخ الانتهاء');
    }

    const url = update ? '/admin/reservation/resort/update' : '/admin/reservation/resort';
    Api.post(url, data)
      .then(() => {
        dispatch(fetchReservations());
        setData({
          contractNumber: '',
          clientName: '',
          clientPhone: '',
          startDate: '',
          endDate: '',
          cost: '',
          entity: {},
          period: { type: 'days', dayPeriod: '' },
        });
        handleClose();
        setTimeError('');
      })
      .catch(() => {
        setSnackOpen(true);
      });
  }

  return (
    <div>
      <Modal
        style={{ direction: i18n.language === 'en' ? 'ltr' : 'rtl' }}
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Typography id="modal-modal-title" variant="h6" component="h2" sx={{ marginBottom: 5 }}>
            {update ? t('reservation.editReservation') : t('reservation.addReservation')}
          </Typography>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <InputLabel>{t('reservation.contractNumber')}</InputLabel>
                <TextField
                  variant="outlined"
                  fullWidth
                  type="number"
                  value={data.contractNumber}
                  onChange={(e) => setData({ ...data, contractNumber: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <InputLabel>{t('reservation.client')}</InputLabel>
                <TextField
                  variant="outlined"
                  fullWidth
                  required
                  type="text"
                  value={data.clientName}
                  onChange={(e) => setData({ ...data, clientName: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <InputLabel>{t('reservation.phone')}</InputLabel>
                <TextField
                  variant="outlined"
                  fullWidth
                  required
                  type="text"
                  value={data.clientPhone}
                  onChange={(e) => setData({ ...data, clientPhone: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <InputLabel>{t('reservation.entity')}</InputLabel>
                <Select
                  fullWidth
                  value={data.entity?.id || ''}
                  onChange={(e) => handleEntitySelect(e.target.value)}
                  required
                >
                  {resorts.map((resort) => (
                    <MenuItem key={resort._id} value={resort._id}>
                      {resort.name}
                    </MenuItem>
                  ))}
                </Select>
              </Grid>
              <Grid item xs={6}>
                <InputLabel>{t('reservation.arrive')}</InputLabel>
                <TextField
                  variant="outlined"
                  fullWidth
                  required
                  type="date"
                  InputProps={{ inputProps: { min: dateString } }}
                  value={data.startDate}
                  onChange={(e) => setData({ ...data, startDate: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <InputLabel>{t('reservation.leave')}</InputLabel>
                <TextField
                  variant="outlined"
                  fullWidth
                  required
                  type="date"
                  InputProps={{ inputProps: { min: data.startDate } }}
                  value={data.endDate}
                  onChange={(e) => setData({ ...data, endDate: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <InputLabel>{t('reservation.amount')}</InputLabel>
                <TextField
                  variant="outlined"
                  fullWidth
                  required
                  type="number"
                  value={data.cost}
                  onChange={(e) => setData({ ...data, cost: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  type="submit"
                  fullWidth
                  style={{ backgroundColor: '#B38D46', height: '50px', fontSize: '1rem' }}
                >
                  {update ? t('reservation.edit') : t('reservation.add')}
                </Button>
              </Grid>
            </Grid>
          </form>
        </Box>
      </Modal>
      <Snackbar open={snackOpen} autoHideDuration={6000} onClose={() => setSnackOpen(false)}>
        <Alert onClose={() => setSnackOpen(false)} severity="warning" sx={{ width: '100%' }}>
          {t('reservation.duplicateError')}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default NewReservationsModal;
