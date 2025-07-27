import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import "../scss/addChalets.scss";
import { Grid, InputLabel, TextField, MenuItem, Select, Snackbar } from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBankDetails } from '../redux/reducers/bank';
import { fetchReservation_payments } from '../redux/reducers/reservation_payments';
import { useParams } from 'react-router-dom';
import Api from './../config/config';
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

function AddPayment({ handleClose, handleOpen, open, data: temp, update, remainingAmount  }) {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const dispatch = useDispatch();
  const banks = useSelector((state) => state.bank.value.data);
  const [data, setData] = useState({ type: 'نقدي' });
  const [snackOpen, setSnackOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchBankDetails());
  }, [dispatch]);

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

    const paidAmount = +data.paid || 0;
    const insuranceAmount = +data.insurance || 0;
// ✅ هذا هو شرط التحقق الذي سيعمل الآن
  if (data.type !== "تأمين" && paidAmount > remainingAmount) {
    alert(`لا يمكن دفع مبلغ أكبر من المتبقي. المبلغ المتبقي هو: ${remainingAmount.toFixed(2)}`);
    return; // أوقف عملية الحفظ
  }
    if (!paidAmount && !insuranceAmount) {
      setSnackOpen(true);
      return;
    }

    // ✅ منع القيم السالبة أو الصفر
    if ((data.type !== "تأمين" && paidAmount <= 0) || (data.type === "تأمين" && insuranceAmount <= 0)) {
      alert("المبلغ يجب أن يكون أكبر من صفر");
      return;
    }

    setIsSubmitting(true);

    const payload = {
      ...data,
      insurance: insuranceAmount,
      paid: paidAmount,
      reservation: id,
    };

    const url = update ? `/reservation-payments/update` : '/reservation-payments/add-payment';

    try {
      // ✅ تحقق من رقم الدفع لتفادي التكرار (اختياري)
      if (!update && data.paymentContractNumber) {
        const checkRes = await Api.get(`/reservation-payments/check?contract=${data.paymentContractNumber}`);
        if (checkRes.data.exists) {
          alert("رقم الدفع مستخدم من قبل");
          setIsSubmitting(false);
          return;
        }
      }

      await Api.post(url, payload);
      dispatch(fetchReservation_payments(id));
      handleClose();
    } catch (err) {
      console.error("Error saving payment:", err?.response?.data?.message || err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <Modal
        style={{ direction: i18n.language === 'en' ? 'ltr' : 'rtl' }}
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style} className='model'>
          <Typography id="modal-modal-title" variant="h6" component="h2" sx={{ marginBottom: 5 }}>
            اضافة دفعة
          </Typography>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <InputLabel>نوع الدفع</InputLabel>
                <Select
                  fullWidth
                  value={data.type || "نقدي"}
                  onChange={handleChangeType}
                  required
                >
                  <MenuItem value="نقدي">نقدي</MenuItem>
                  <MenuItem value="تحويل بنكي">تحويل بنكي</MenuItem>
                  <MenuItem value="شبكة">شبكة</MenuItem>
                </Select>
              </Grid>

              {data.type === "تحويل بنكي" && (
                <Grid item xs={12}>
                  <InputLabel>اسم البنك</InputLabel>
                  <Select
                    fullWidth
                    value={data.bank || ""}
                    onChange={(e) => setData({ ...data, bank: e.target.value })}
                    required
                  >
                    {banks.map((bank) => (
                      <MenuItem key={bank._id} value={bank._id}>{bank.name}</MenuItem>
                    ))}
                  </Select>
                </Grid>
              )}

              {data.type !== "تأمين" && (
                <Grid item xs={12}>
                  <InputLabel>المبلغ</InputLabel>
                  <TextField
                    variant="outlined"
                    fullWidth
                    type="number"
                    value={data.paid || ""}
                    onChange={(e) => setData({ ...data, paid: e.target.value })}
                  />
                </Grid>
              )}

              {data.type === "تأمين" && (
                <Grid item xs={12}>
                  <InputLabel>مبلغ التأمين</InputLabel>
                  <TextField
                    variant="outlined"
                    fullWidth
                    type="number"
                    value={data.insurance || ""}
                    onChange={(e) => setData({ ...data, insurance: e.target.value })}
                  />
                </Grid>
              )}

              <Grid item xs={12}>
                <Button
                  variant="contained"
                  type="submit"
                  fullWidth
                  style={{ backgroundColor: "#B38D46", height: "50px", fontSize: "1rem" }}
                  disabled={isSubmitting}
                >
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
