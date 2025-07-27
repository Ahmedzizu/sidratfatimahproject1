import React, { useEffect, useState, useRef } from "react";
import { Box, Button, Typography, Modal, Grid, InputLabel, TextField, Select, MenuItem, Divider, Snackbar, CircularProgress } from "@mui/material"; 
import MuiAlert from "@mui/material/Alert";
import "../scss/addChalets.scss";
import Api from "../config/config";
import { useDispatch, useSelector } from "react-redux";
import { fetchReservations } from "../redux/reducers/reservation";
import { fetchHall } from "../redux/reducers/hall";
import { fetchResort } from "../redux/reducers/resort";
import { fetchChalets } from "../redux/reducers/chalet";
import { useTranslation } from "react-i18next";
import ConfirmEditDialoge from '../components/ConfirmEditDialoge';

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 600,
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
  maxHeight: '90vh',
  overflowY: 'auto'
};

const ReservarionsModal = ({ handleClose, open, data: temp, update }) => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.employee.value.user);
  const halls = useSelector((state) => state.hall.value.data);
  const resorts = useSelector((state) => state.resort.value.data);
  const chalets = useSelector((state) => state.chalet.value.data);

  const [data, setData] = useState({});
  const [entity, setEntity] = useState(null);
  const [entitys, setEntitys] = useState([]);
  const [snackOpen, setSnackOpen] = useState(false);
  
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [postponeDate, setPostponeDate] = useState('');
  const [postponePeriod, setPostponePeriod] = useState('صباحية');
  const [priceDifference, setPriceDifference] = useState(0); 
  const [extendDate, setExtendDate] = useState('');
  const [extendPeriod, setExtendPeriod] = useState('مسائية');
  const [additionalCost, setAdditionalCost] = useState(0);
  const [priceChangeInfo, setPriceChangeInfo] = useState({ difference: 0, newTotal: 0 });

  useEffect(() => {
    const allEntities = [
      ...halls.map(e => ({ ...e, type: "hall" })),
      ...resorts.map(e => ({ ...e, type: "resort" })),
      ...chalets.map(e => ({ ...e, type: "chalet" }))
    ];
    setEntitys(allEntities);
  }, [halls, resorts, chalets]);

  useEffect(() => {
    if (open && temp) {
      setData(temp);
      const currentEntity = entitys.find(e => e._id === temp.entityId);
      setEntity(currentEntity);
      setPostponeDate('');
      setPostponePeriod('صباحية');
      setExtendDate('');
      setExtendPeriod('مسائية');
    }
  }, [open, temp, entitys]);

  // ✅✅✅ useEffect الشامل والمصحح لحساب السعر وفرق السعر ✅✅✅
  useEffect(() => {
    // التأكد من وجود كل البيانات اللازمة
    if (!update || !open || !data.entityId || !entitys.length || !data.period || !temp?.cost) {
      return;
    }

    const entity = entitys.find(e => e._id === data.entityId);
    if (!entity?.price) return;

    // --- بداية منطق حساب السعر الأصلي الجديد بالكامل والدقة ---
    let newOriginalCost = 0;
    const start = new Date(data.period.startDate);
    const end = new Date(data.period.endDate);
    start.setUTCHours(0, 0, 0, 0);
    end.setUTCHours(0, 0, 0, 0);

    const checkInSelection = data.period.checkIn.name;
    const checkOutSelection = data.period.checkOut.name;
    const isSingleDayBooking = start.getTime() === end.getTime();

    if (isSingleDayBooking) {
        if (checkInSelection === 'صباحية' && checkOutSelection === 'مسائية') {
            newOriginalCost = entity.price.wholeDay;
        } else if (checkInSelection === 'صباحية' && checkOutSelection === 'صباحية') {
            newOriginalCost = entity.price.morning;
        } else if (checkInSelection === 'مسائية' && checkOutSelection === 'مسائية') {
            newOriginalCost = entity.price.night;
        } else {
            newOriginalCost = entity.price.wholeDay;
        }
    } else {
        let currentDate = new Date(start);
        while (currentDate <= end) {
            let dayCost = 0;
            if (currentDate.getTime() === start.getTime()) {
                dayCost = (checkInSelection === 'صباحية') ? entity.price.wholeDay : entity.price.night;
            } else if (currentDate.getTime() === end.getTime()) {
                dayCost = (checkOutSelection === 'صباحية') ? entity.price.morning : entity.price.wholeDay;
            } else {
                dayCost = entity.price.wholeDay;
            }
            newOriginalCost += dayCost;
            currentDate.setDate(currentDate.getDate() + 1);
        }
    }
    // --- نهاية منطق الحساب الدقيق ---

    // حساب التكلفة النهائية الجديدة بناءً على التعديلات (خصم، إضافة)
    const numericDiscountPercentage = parseFloat(data.discountPercentage || 0);
    const numericAdditionalCharge = parseFloat(data.additionalCharge || 0);
    const newDiscountAmount = newOriginalCost * (numericDiscountPercentage / 100);
    const finalCost = (newOriginalCost - newDiscountAmount) + numericAdditionalCharge;

    // حساب الفرق بين التكلفة النهائية الجديدة والتكلفة الأصلية للحجز
    const difference = finalCost - temp.cost;

    // تحديث الحالات المطلوبة: السعر الأصلي في data وفرق السعر في priceChangeInfo
    setData(prevData => ({ ...prevData, originalCost: newOriginalCost }));
    setPriceChangeInfo({ difference: difference, newTotal: finalCost });

  }, [data.entityId, data.discountPercentage, data.additionalCharge, data.period, entitys, open, update, temp]);

  useEffect(() => {
    if (!temp?.period || !postponeDate || !postponePeriod || !entitys.length) {
      setPriceDifference(0);
      return;
    }
    const entity = entitys.find(e => e._id === temp.entityId);
    if (!entity?.price) {
      setPriceDifference(0);
      return;
    }
    const originalStartDate = new Date(temp.period.startDate);
    const originalEndDate = new Date(temp.period.endDate);
    const durationMs = originalEndDate.getTime() - originalStartDate.getTime();
    const start = new Date(postponeDate);
    const end = new Date(start.getTime() + durationMs);
    start.setUTCHours(0, 0, 0, 0);
    end.setUTCHours(0, 0, 0, 0);
    const checkInSelection = postponePeriod;
    const checkOutSelection = temp.period.checkOut.name;
    let newTotalCost = 0;
    const isSingleDayBooking = start.getTime() === end.getTime();
    if (isSingleDayBooking) {
      if (checkInSelection === 'صباحية' && checkOutSelection === 'مسائية') {
        newTotalCost = entity.price.wholeDay;
      } else if (checkInSelection === 'صباحية' && checkOutSelection === 'صباحية') {
        newTotalCost = entity.price.morning;
      } else if (checkInSelection === 'مسائية' && checkOutSelection === 'مسائية') {
        newTotalCost = entity.price.night;
      } else {
        newTotalCost = entity.price.wholeDay;
      }
    } else {
      let currentDate = new Date(start);
      while (currentDate <= end) {
        let dayCost = 0;
        if (currentDate.getTime() === start.getTime()) {
          dayCost = (checkInSelection === 'صباحية') ? entity.price.wholeDay : entity.price.night;
        } else if (currentDate.getTime() === end.getTime()) {
          dayCost = (checkOutSelection === 'صباحية') ? entity.price.morning : entity.price.wholeDay;
        } else {
          dayCost = entity.price.wholeDay;
        }
        newTotalCost += dayCost;
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }
    const difference = newTotalCost - temp.cost;
    setPriceDifference(difference);
  }, [postponeDate, postponePeriod, temp, entitys]);

  useEffect(() => {
    if (!temp?.period || !extendDate || !extendPeriod || !entitys.length) {
      setAdditionalCost(0);
      return;
    }
    const entity = entitys.find(e => e._id === temp.entityId);
    if (!entity?.price) {
      setAdditionalCost(0);
      return;
    }
    const start = new Date(temp.period.startDate);
    const end = new Date(extendDate);
    start.setUTCHours(0, 0, 0, 0);
    end.setUTCHours(0, 0, 0, 0);
    const checkInSelection = temp.period.checkIn.name;
    const checkOutSelection = extendPeriod;
    let newTotalCost = 0;
    const isSingleDayBooking = start.getTime() === end.getTime();
    if (isSingleDayBooking) {
      if (checkInSelection === 'صباحية' && checkOutSelection === 'مسائية') {
        newTotalCost = entity.price.wholeDay;
      } else if (checkInSelection === 'صباحية' && checkOutSelection === 'صباحية') {
        newTotalCost = entity.price.morning;
      } else if (checkInSelection === 'مسائية' && checkOutSelection === 'مسائية') {
        newTotalCost = entity.price.night;
      } else {
        newTotalCost = entity.price.wholeDay;
      }
    } else {
      let currentDate = new Date(start);
      while (currentDate <= end) {
        let dayCost = 0;
        if (currentDate.getTime() === start.getTime()) {
          dayCost = (checkInSelection === 'صباحية') ? entity.price.wholeDay : entity.price.night;
        } else if (currentDate.getTime() === end.getTime()) {
          dayCost = (checkOutSelection === 'صباحية') ? entity.price.morning : entity.price.wholeDay;
        } else {
          dayCost = entity.price.wholeDay;
        }
        newTotalCost += dayCost;
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }
    const costDifference = newTotalCost - temp.cost;
    setAdditionalCost(costDifference);
  }, [extendDate, extendPeriod, temp, entitys]);

  useEffect(() => {
    dispatch(fetchChalets());
    dispatch(fetchHall());
    dispatch(fetchResort());
  }, [dispatch]);

  function handleConfirmSave() {
    const payload = {
      _id: data._id,
      clientName: data.clientName,
      clientPhone: data.clientPhone,
      entityId: data.entityId,
      discountPercentage: data.discountPercentage || 0,
      modifiedBy: user._id,
      additionalCharge: data.additionalCharge || 0, 
    };
    const url = "/admin/reservations/update-advanced";
    Api.post(url, payload)
      .then(() => {
        dispatch(fetchReservations());
        setConfirmOpen(false);
        handleClose();
      })
      .catch((err) => {
        console.error("Failed to update:", err);
        setSnackOpen(true);
        setConfirmOpen(false);
      });
  }
  
  function handleSubmit(e) {
    e.preventDefault();
    if (update) {
      setConfirmOpen(true);
    }
  }

  function handleEntitySelect(id) {
    const selected = entitys.find((ele) => ele._id === id);
    if (selected) {
      setEntity(selected);
      setData((prev) => ({
        ...prev,
        entityId: id,
      }));
    }
  }

  if (update && (!temp?._id || entitys.length === 0)) {
    return (
      <Modal open={open} onClose={handleClose}>
        <Box sx={style}><CircularProgress /></Box>
      </Modal>
    );
  }
  
  return (
    <div>
      <Modal open={open} onClose={handleClose}>
        <Box sx={style} className="model">
          <Typography variant="h6" component="h2" sx={{ mb: 3 }}>
            {update ? "تعديل حجز" : "إضافة حجز"}
          </Typography>

          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <InputLabel>اسم العميل</InputLabel>
                <TextField fullWidth value={data.clientName || ''} onChange={(e) => setData({ ...data, clientName: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <InputLabel>رقم الهاتف</InputLabel>
                <TextField fullWidth value={data.clientPhone || ''} onChange={(e) => setData({ ...data, clientPhone: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <InputLabel>الجهة</InputLabel>
                <Select fullWidth value={data.entityId || ''} onChange={(e) => handleEntitySelect(e.target.value)}>
                  {entitys.map((ele) => (<MenuItem key={ele._id} value={ele._id}>{ele.name}</MenuItem>))}
                </Select>
              </Grid>
              <Grid item xs={12} sm={6}>
                <InputLabel>رقم العقد</InputLabel>
                <TextField fullWidth value={data.contractNumber || ''} InputProps={{ readOnly: true, style:{backgroundColor: '#f1f1f1'} }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <InputLabel>نسبة الخصم (%)</InputLabel>
                <TextField
                  fullWidth type="number"
                  value={data.discountPercentage || 0}
                  onChange={(e) => setData({ ...data, discountPercentage: e.target.value })}
                  InputProps={{ inputProps: { min: 0, max: 100 } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <InputLabel>مبلغ إضافي</InputLabel>
                <TextField
                  fullWidth type="number"
                  value={data.additionalCharge || 0}
                  onChange={(e) => setData({ ...data, additionalCharge: e.target.value })}
                  InputProps={{ inputProps: { min: 0 } }}
                />
              </Grid>
              <Grid item xs={12}><Divider sx={{ my: 1 }} /></Grid>
              <Grid item xs={12} sm={6}>
                <InputLabel>مبلغ الخصم</InputLabel>
                <TextField
                  fullWidth
                  value={((data.originalCost || 0) * (data.discountPercentage || 0) / 100).toFixed(2)}
                  InputProps={{ readOnly: true, style:{backgroundColor: '#f1f1f1'} }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <InputLabel>مبلغ الحجز النهائي</InputLabel>
                <TextField
                  fullWidth
                  value={(((data.originalCost || 0) - ((data.originalCost || 0) * (data.discountPercentage || 0) / 100)) + parseFloat(data.additionalCharge || 0)).toFixed(2)}
                  InputProps={{ readOnly: true, style:{backgroundColor: '#f1f1f1', color:'green', fontWeight:'bold'} }}
                />
              </Grid>
            </Grid>
            
            {/* ✅✅ هذا الجزء سيعمل الآن بشكل صحيح ✅✅ */}
            {priceChangeInfo.difference !== 0 && (
              <Typography sx={{ mt: 2, p: 1, borderRadius: 1, 
                  backgroundColor: priceChangeInfo.difference > 0 ? '#d4edda' : '#f8d7da',
                  color: priceChangeInfo.difference > 0 ? '#155724' : '#721c24'
                }}>
                فرق السعر: {priceChangeInfo.difference.toFixed(2)} ريال 
                ({priceChangeInfo.difference > 0 ? "مبلغ إضافي على العميل" : "مبلغ سيتم إرجاعه للعميل"})
              </Typography>
            )}
            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{ mt: 3, backgroundColor: "#B38D46", height: "50px" }}
            >
              {update ? "حفظ التعديلات" : "إضافة الحجز"}
            </Button>
          </form>

    
{/* ========================================================== */}
{/* ✅ نموذج تأخير بدء الحجز المطور */}
{/* ========================================================== */}
<Typography variant="h6" component="h2" sx={{ mb: 2 }}>
  تأخير بدء الحجز
</Typography>
<form onSubmit={(e) => {
  e.preventDefault();
  const payload = {
   _id: data._id,
  newStartDate: postponeDate,
  newCheckInName: postponePeriod, // ✅ الاسم الصحيح المتوافق مع الباك اند
  modifiedBy: user._id,
  };
  Api.post('/admin/reservations/postpone-start', payload)
    .then(() => {
      dispatch(fetchReservations());
      alert("تم تأخير الحجز بنجاح ✅");
      handleClose();
    })
    .catch(err => {
      alert(err.response?.data?.error || "حدث خطأ");
    });
}}>
  <Grid container spacing={2}>
    <Grid item xs={12} sm={6}>
      <InputLabel>تاريخ البدء الجديد</InputLabel>
      <TextField
        fullWidth required type="date"
        value={postponeDate}
        onChange={(e) => setPostponeDate(e.target.value)}
        InputProps={{ inputProps: { min: new Date().toISOString().split('T')[0] } }}
      />
    </Grid>
    <Grid item xs={12} sm={6}>
      <InputLabel>فترة البدء الجديدة</InputLabel>
      <Select
        fullWidth
        value={postponePeriod}
        onChange={(e) => setPostponePeriod(e.target.value)}
      >
        <MenuItem value="صباحية">صباحية</MenuItem>
        <MenuItem value="مسائية">مسائية</MenuItem>
      </Select>
    </Grid>
  </Grid>
   {/* ✅✅ أضف هذا الجزء لعرض فرق السعر ✅✅ */}
  {priceDifference !== 0 && (
    <Typography sx={{ mt: 2, p: 1, borderRadius: 1, 
        backgroundColor: priceDifference > 0 ? '#d4edda' : '#f8d7da',
        color: priceDifference > 0 ? '#155724' : '#721c24'
      }}>
      فرق السعر: {priceDifference.toFixed(2)} ريال 
      ({priceDifference > 0 ? "مبلغ إضافي" : "سيتم إرجاع"})
    </Typography>
  )}
  <Button
    type="submit"
    variant="contained"
    fullWidth
    color="secondary"
    sx={{ mt: 2 }}
  >
    تأكيد التأخير
  </Button>
</form>

{/* ========================================================== */}
{/* ✅ نموذج تمديد الحجز */}
{/* ========================================================== */}
<Typography variant="h6" component="h2" sx={{ mb: 2 }}>
  تمديد الحجز
</Typography>
<form onSubmit={(e) => {
  e.preventDefault();
  const payload = {
    _id: data._id,
    newEndDate: extendDate,
    newCheckOutName: extendPeriod,
    modifiedBy: user._id,
  };
  Api.post('/admin/reservations/extend', payload)
    .then(() => {
      dispatch(fetchReservations());
      handleClose();
    })
    .catch(err => {
      alert(err.response?.data?.error || "حدث خطأ");
    });
}}>
  <Grid container spacing={2}>
    <Grid item xs={12} sm={6}>
      <InputLabel>تاريخ المغادرة الجديد</InputLabel>
      <TextField
        fullWidth required type="date"
        value={extendDate}
        onChange={(e) => setExtendDate(e.target.value)}
        InputProps={{ inputProps: { min: temp?.period?.endDate } }} // لا يمكن اختيار تاريخ قبل النهاية الحالية
      />
    </Grid>
    <Grid item xs={12} sm={6}>
      <InputLabel>فترة المغادرة الجديدة</InputLabel>
      <Select
        fullWidth
        value={extendPeriod}
        onChange={(e) => setExtendPeriod(e.target.value)}
      >
        <MenuItem value="صباحية">صباحية</MenuItem>
        <MenuItem value="مسائية">مسائية</MenuItem>
      </Select>
    </Grid>
  </Grid>

   {/* ✅✅ الحل الثاني: إضافة عرض فرق السعر هنا ✅✅ */}
            {additionalCost > 0 && (
              <Typography sx={{ mt: 2, p: 1, fontWeight: 'bold', color: '#155724', backgroundColor: '#d4edda', borderRadius: 1 }}>
                التكلفة الإضافية: {additionalCost.toFixed(2)} ريال
              </Typography>
            )}

  <Button type="submit" variant="contained" fullWidth color="success" sx={{ mt: 2 }}>
    تأكيد التمديد
  </Button>
</form>

        </Box>
      </Modal>
    

  <Snackbar open={snackOpen} autoHideDuration={6000} onClose={() => setSnackOpen(false)}>
        <Alert onClose={() => setSnackOpen(false)} severity="error" sx={{ width: "100%" }}>
          فشل في تحديث الحجز!
        </Alert>
      </Snackbar>

      <ConfirmEditDialoge
        open={confirmOpen}
        handleClose={() => setConfirmOpen(false)}
        handleConfirm={handleConfirmSave}
      />
    </div>
  );
};

export default ReservarionsModal;
