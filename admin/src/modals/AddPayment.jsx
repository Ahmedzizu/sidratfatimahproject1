import React, { useEffect, useState } from 'react';
import { Box, Button, Typography, Modal, Grid, InputLabel, TextField, Select, MenuItem, Snackbar, Autocomplete } from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import "../scss/addChalets.scss";
import Api from '../config/config';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBankDetails } from '../redux/reducers/bank';
import { fetchReservation_payments } from '../redux/reducers/reservation_payments';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
};

function AddPayment({ handleClose, open, data: temp, update, remainingAmount, onPaymentSuccess, reservationData }) {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const dispatch = useDispatch();
  const banks = useSelector((state) => state.bank.value.data);
  const [data, setData] = useState({ type: 'نقدي', source: '' });
  const [snackOpen, setSnackOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // ✨ حالة جديدة لتخزين قائمة المصادر
  const [sources, setSources] = useState([]);

  // ✨ useEffect لجلب المصادر عند فتح النافذة
  useEffect(() => {
    dispatch(fetchBankDetails());
    if (open) {
       Api.get('/reservation-payments/sources/all') 
        .then((res) => {
          setSources(res.data);
        })
        .catch(err => console.error("Failed to fetch sources:", err));
    }
  }, [dispatch, open]);

  useEffect(() => {
    if (temp) setData(temp);
  }, [temp]);

  const handleChangeType = (e) => {
    const value = e.target.value;
    if (value === "تأمين") {
      setData({ ...data, type: value, paid: 0 });
    } else {
      setData({ ...data, type: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    const reservationId = reservationData?._id || id;
    if (!reservationId) {
      console.error("Reservation ID is missing.");
      alert("لم يتم العثور على معرّف الحجز المطلوب.");
      return;
    }
    const paidAmount = +data.paid || 0;
    const insuranceAmount = +data.insurance || 0;
    if (data.type !== "تأمين" && paidAmount > remainingAmount) {
      alert(`لا يمكن دفع مبلغ أكبر من المتبقي. المبلغ المتبقي هو: ${remainingAmount.toFixed(2)}`);
      return;
    }
    if (!paidAmount && !insuranceAmount) {
      setSnackOpen(true);
      return;
    }
    if ((data.type !== "تأمين" && paidAmount <= 0) || (data.type === "تأمين" && insuranceAmount <= 0)) {
      alert("المبلغ يجب أن يكون أكبر من صفر");
      return;
    }

    setIsSubmitting(true);
    const payload = {
      ...data,
      insurance: insuranceAmount,
      paid: paidAmount,
      reservation: reservationId,
    };
    const url = update ? `/reservation-payments/update` : '/reservation-payments/add-payment';

    try {
      await Api.post(url, payload);
      if (reservationId) {
        dispatch(fetchReservation_payments(reservationId));
      }
      if (onPaymentSuccess) onPaymentSuccess();
      else handleClose();
    } catch (err) {
      console.error("Error saving payment:", err?.response?.data?.message || err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <Modal open={open} onClose={handleClose}>
        <Box sx={style} className='model'>
          <Typography variant="h6" component="h2" sx={{ mb: 5 }}>
            اضافة دفعة
          </Typography>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <InputLabel>نوع الدفع</InputLabel>
                <Select fullWidth value={data.type || "نقدي"} onChange={handleChangeType} required>
                  <MenuItem value="نقدي">نقدي</MenuItem>
                  <MenuItem value="تحويل بنكي">تحويل بنكي</MenuItem>
                  <MenuItem value="شبكة">شبكة</MenuItem>
                </Select>
              </Grid>

              {/* ✨✨ هنا تم إضافة الحقل الجديد ✨✨ */}
              <Grid item xs={12}>
                <InputLabel>المصدر</InputLabel>
                <Autocomplete
                  freeSolo
                  options={sources}
                  value={data.source || ''}
                  onChange={(event, newValue) => {
                    setData({ ...data, source: newValue });
                  }}
                  onInputChange={(event, newInputValue) => {
                     setData({ ...data, source: newInputValue });
                  }}
                  renderInput={(params) => (
                    <TextField {...params} variant="outlined" fullWidth />
                  )}
                />
              </Grid>

              {data.type === "تحويل بنكي" && (
                <Grid item xs={12}>
                  <InputLabel>اسم البنك</InputLabel>
                  <Select fullWidth value={data.bank || ""} onChange={(e) => setData({ ...data, bank: e.target.value })} required>
                    {banks.map((bank) => (
                      <MenuItem key={bank._id} value={bank._id}>{bank.name}</MenuItem>
                    ))}
                  </Select>
                </Grid>
              )}

              <Grid item xs={12}>
                <InputLabel>المبلغ</InputLabel>
                <TextField variant="outlined" fullWidth type="number" value={data.paid || ""} onChange={(e) => setData({ ...data, paid: e.target.value })}/>
              </Grid>

              <Grid item xs={12}>
                <Button variant="contained" type="submit" fullWidth style={{ backgroundColor: "#B38D46", height: "50px", fontSize: "1rem" }} disabled={isSubmitting}>
                  {isSubmitting ? "جاري الحفظ..." : t("client.add")}
                </Button>
              </Grid>
            </Grid>
          </form>
        </Box>
      </Modal>
      <Snackbar open={snackOpen} autoHideDuration={6000} onClose={() => setSnackOpen(false)}>
        <Alert onClose={() => setSnackOpen(false)} severity="warning" sx={{ width: '100%' }}>
          يجب اضافة مبلغ !!
        </Alert>
      </Snackbar>
    </div>
  );
}

export default AddPayment;