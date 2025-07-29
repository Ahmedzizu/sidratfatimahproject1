
import React, { useEffect, useState } from 'react';
import { TextField, Select, MenuItem, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Box, Container } from '@mui/material';
import { useDispatch } from 'react-redux';
import Api from '../config/config';
import { fetchNotification } from '../redux/reducers/reservation';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

// --- Icons ---
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

// --- Components ---
import ReservarionsModal from '../modals/ReservarionsModal';
import ConfirmDialoge from '../components/ConfirmDialoge'; // سيتم تحديث هذا الملف
import DeleteDialoge from '../components/DeleteDialoge';
import AddPayment from '../modals/AddPayment'; // ✨ ملف المودال الجديد

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

// 🎨 --- تعريف لوحة الألوان الأساسية ---
const themeColors = {
  primary: '#B38D46',
  secondary: '#6c757d',
  background: '#f8f9fa',
  text: '#212529',
  error: '#dc3545',
  success: '#198754',
};
const NewReservations = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t, i18n } = useTranslation();

  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [update, setUpdate] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteID, setDeleteID] = useState();
  const [confirmData, setConfirmData] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [temp, setTemp] = useState({});
  const [snackOpen, setSnackOpen] = useState(false);
  const [entityTypeFilter, setEntityTypeFilter] = useState("all");
   const [paymentModalOpen, setPaymentModalOpen] = useState(false); 

  useEffect(() => {
    fetchNewReservations();
    removeNotification();
  }, []);

  function fetchNewReservations() {
    Api.get(`${process.env.REACT_APP_API_URL}/admin/reservations/new`)
      .then((response) => setData(response.data))
      .catch((error) => console.error("Error fetching reservations:", error));
  }

  function removeNotification() {
    Api.patch("/admin/notification", { type: "Deferred" })
      .then(() => dispatch(fetchNotification()));
  }

   function handleConfirmOpen(rowData) {
    setConfirmData(rowData); // تخزين بيانات الحجز كاملة
    setConfirmOpen(true);
  }
   function handleAccept() {
    if (!confirmData) return;
    const paidAmount = confirmData?.payment?.paidAmount || 0;
    if (paidAmount <= 0) {
      alert(t("no_payment_alert", "⚠️ لا يمكن تأكيد الحجز بدون دفع مبلغ. يرجى إضافة دفعة أولاً."));
      return;
    }
    setConfirmOpen(false);
    Api.patch('/admin/reservation', { _id: confirmData._id, confirmRequest: true })
      .then(() => fetchNewReservations())
      .catch((err) => {
        if (err.response?.status === 403) setSnackOpen(true);
      });
  }
   
  
  function handleOpenEdit(data) {
    setTemp({
      clientName: data.client.name,
      clientId: data.client?.id,
      startDate: data.period.startDate,
      endDate: data.period.endDate,
      cost: data.cost,
      entityId: data.entity.id,
      dayPeriod: data.period.dayPeriod,
      _id: data._id,
    });
    setUpdate(true);
    setOpen(true);
  }

  function handleDeleteOpen(id) {
    setDeleteID(id);
    setDeleteOpen(true);
  }

  const handleDeleteClose = () => setDeleteOpen(false);
  const handleConfirmClose = () => setConfirmOpen(false);
  
  // ✅ نسخ دالة عرض اسم الحالة من الصفحات الأخرى
  const getStatusName = (status, deferred, isModified, t) => {
    if (status === "confirmed" && deferred) return t("status.deferred");
    if (status === "confirmed" && isModified) return t("status.modified");

    switch (status) {
      case "confirmed": return t("status.confirmed");
      case "unConfirmed": return t("status.unConfirmed");
      case "deferred": return t("status.deferred");
      case "canceled": return t("status.canceled");
      default: return t("status.unknown");
    }
  };

  let filteredData = [...data];

  if (search) {
    filteredData = filteredData.filter(
      (ele) =>
        ele.client.name.includes(search) ||
        ele.entity.name.includes(search) ||
        ele.date.includes(search) ||
        ele.contractNumber.toString().includes(search)
    );
  }

  if (entityTypeFilter !== 'all') {
    filteredData = filteredData.filter((row) => row.type === entityTypeFilter);
  }

  filteredData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  async function handleDeleteConfirm() {
    if (!deleteID) return;
  
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/reservation/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservationId: deleteID }),
      });
  
      if (response.ok) {
        setDeleteOpen(false);
        fetchNewReservations();
      } else {
        console.error("❌ فشل في حذف الحجز:", await response.text());
      }
    } catch (error) {
      console.error("❌ خطأ أثناء الاتصال بالـ API:", error);
    }
  }
const renderActions = (row) => (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: 'center' }}>
        <IconButton onClick={() => handleOpenEdit(row)} color="primary" title={t("edit", "تعديل")}>
            <EditIcon />
        </IconButton>
        <IconButton onClick={() => handleDeleteOpen(row._id)} color="error" title={t("delete", "حذف")}>
            <DeleteIcon />
        </IconButton>
        <IconButton onClick={() => navigate(`/unConfermidReservationDetails/${row._id}`)} sx={{color: '#f0ad4e'}} title={t("details", "التفاصيل")}>
            <InfoIcon />
        </IconButton>
        {row.status === "unConfirmed" && (
            <IconButton onClick={() => handleConfirmOpen(row)} color="success" title={t("confirm_reservation", "تأكيد الحجز")}>
                <CheckCircleIcon />
            </IconButton>
        )}
    </Box>
  );
  
  return (
   <Container maxWidth="xl" sx={{ py: 3, direction: i18n.language === 'en' ? 'ltr' : 'rtl', backgroundColor: themeColors.background }}>
      <Typography variant="h4" component="h2" sx={{ textAlign: 'center', mb: 4, color: themeColors.primary, fontWeight: 'bold', fontFamily: 'Cairo, sans-serif' }}>
        {t("new_reservations_management", "إدارة الحجوزات الجديدة")}
      </Typography>

   <Paper elevation={2} sx={{ p: 2, mb: 3, borderRadius: '12px' }}>
    <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1fr auto' }, // عمود واحد على الجوال، عمودان على الكمبيوتر
        gap: 2,
        alignItems: 'center'
    }}>
        <TextField
            type="text"
            variant="outlined"
            value={search}
            placeholder={t("search")}
            onChange={(e) => setSearch(e.target.value)}
        />
        <Select
            value={entityTypeFilter}
            onChange={(e) => setEntityTypeFilter(e.target.value)}
            displayEmpty
            sx={{ minWidth: 200, fontFamily: 'Cairo' }}
        >
            <MenuItem value="all">{t("جميع الجهات")}</MenuItem>
            <MenuItem value="hall">{t("قاعات")}</MenuItem>
            <MenuItem value="chalet">{t("شاليهات")}</MenuItem>
        </Select>
    </Box>
</Paper>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Box sx={{ width: '100%', overflowX: 'auto' }}>
            <TableContainer component={Paper} elevation={2} sx={{ borderRadius: '12px' }}>
              <Table>
                <TableHead sx={{ backgroundColor: themeColors.primary, '& .MuiTableCell-root': { color: 'white', fontWeight: 'bold', fontFamily: 'Cairo, sans-serif' } }}>
              <TableRow>
                {/* ✅ تعديل رؤوس الأعمدة لتطابق التصميم الجديد */}
                <TableCell align="center" style={{fontFamily: 'Cairo'}}>{t("رقم العقد")}</TableCell>
                <TableCell align="center" style={{fontFamily: 'Cairo'}}>{t("reservation.client")}</TableCell>
                <TableCell align="center" style={{fontFamily: 'Cairo'}}>{t("reservation.entity")}</TableCell>
                <TableCell align="center" style={{fontFamily: 'Cairo'}}>{t("reservation.dateAndPeriod")}</TableCell>
                <TableCell align="center" style={{fontFamily: 'Cairo'}}>{t("مبلغ الحجز")}</TableCell>
                {/* <TableCell align="center">{t("reservation.remainingAmount")}</TableCell> */}
                <TableCell align="center" style={{fontFamily: 'Cairo'}}>{t("الحالة")}</TableCell>
                <TableCell align="center">{t("نوع الدفع")}</TableCell>
                <TableCell align="center" style={{fontFamily: 'Cairo'}}>{t("الإجراءات")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredData.map((row, ind) => (
                <TableRow key={ind}>
                  <TableCell align="center" style={{fontFamily: 'Cairo'}}>{row.contractNumber}</TableCell>
                  <TableCell align="center" style={{fontFamily: 'Cairo'}}>{row.client.name}</TableCell>
                  <TableCell align="center" style={{fontFamily: 'Cairo'}}>{row.entity.name}</TableCell>

                  {/* ✅ تطبيق تصميم خلية التاريخ والفترة المدمجة */}
                  <TableCell align="center" style={{ fontFamily: 'Cairo', minWidth: '170px', lineHeight: '1.6' }}>
                  {/* تاريخ الدخول والخروج */}
  <div>
  <span style={{ color: "green", fontWeight: 'bold' }}>
    {row.period.startDate}</span>  -
    <span style={{ color: "purple", fontWeight: 'bold' }}>{row.period.endDate}
  </span>
</div>
                  <div style={{ fontSize: '1rem', color: '#555' }}>
  {/* ✅ نقرأ الآن من المسار الجديد */}
  <span style={{ color: "green" }}>{row.period.checkIn?.time}</span>
  {"       -→--       "}
  <span style={{ color: "purple" }}>{row.period.checkOut?.time}</span>
</div>
                    <div style={{
                      fontSize: '0.8rem', fontWeight: 'bold', color: '#4a4a4a',
                      backgroundColor: '#e6e6e6', borderRadius: '10px',
                      padding: '2px 10px', display: 'inline-block', marginTop: '4px'
                    }}>
                      <span style={{ color: "green" }}>{row.period?.checkIn?.name}</span>
  {"       -→--       "}
  <span style={{ color: "purple" }}>{row.period.checkOut?.name}</span>
                    </div>
                  </TableCell>

                  <TableCell style={{ fontFamily: 'Cairo' }} align="center">
                    <span style={{ color: '#1976d2', fontSize: '18px', fontWeight: 'bold' }}>
                      {row.cost.toLocaleString()}
                    </span>
                  </TableCell>

                  
                  {/* ✅ تطبيق تصميم خلية الحالة الملونة */}
                  <TableCell style={{fontFamily: 'Cairo'}} align="center">
                    <div style={{
                      backgroundColor:
                        row.status === "unConfirmed" ? "#fbe6e8" // وردي لغير المؤكد
                        : row.status === "canceled" ? "#f48181"
                        : row.status === "confirmed" && row.deferred ? "#ffe5b4"
                        : row.status === "confirmed" && row.isModified ? "#bde0fe"
                        : row.status === "confirmed" ? "#11c43aff"
                        : "#ffffff",
                      color:
                        row.status === "unConfirmed" ? "#721c24" // أحمر داكن لغير المؤكد
                        : row.status === "canceled" ? "#721c24"
                        : row.status === "confirmed" && row.deferred ? "#856404"
                        : row.status === "confirmed" && row.isModified ? "#004085"
                        : row.status === "confirmed" ? "#155724"
                        : "#000000",
                      padding: "5px 10px", borderRadius: "15px", display: "inline-block",
                      textAlign: "center", width: "fit-content",
                    }}>
                      {t(getStatusName(row.status, row.deferred, row.isModified, t))}
                    </div>
                  </TableCell>
                  <TableCell align="center"  sx={{ minWidth: "220px" }}>{row.payment?.method || "-"}</TableCell>
                   <TableCell align="center" sx={{ minWidth: "220px" }}>
                        {renderActions(row)}
                      </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
         </Box>
      </motion.div>
      <ReservarionsModal update={update} handleClose={()=>{setOpen(false); setTemp({}); setUpdate(false)}} data={temp} handleOpen={setOpen} open={open} />
     
      <DeleteDialoge open={deleteOpen} handleClose={handleDeleteClose} handleDelete={handleDeleteConfirm} />
      {/* ✨ نافذة التأكيد المعدلة */}
      <ConfirmDialoge
        open={confirmOpen}
        handleClose={() => setConfirmOpen(false)}
        handleAccept={handleAccept}
        title={t("confirm_reservation_title", "تأكيد الحجز")}
        message={t("confirm_reservation_message", "هل أنت متأكد أنك تريد تأكيد هذا الحجز؟")}
        // Props جديدة
        showSecondaryAction={true}
        secondaryActionText={t("add_payment", "إضافة دفعة")}
        onSecondaryAction={() => setPaymentModalOpen(true)}
      />

      {/* ✨ مودال الدفع الجديد */}
      {confirmData && (
          <AddPayment
            open={paymentModalOpen}
            handleClose={() => setPaymentModalOpen(false)}
            reservationData={confirmData}
            onPaymentSuccess={() => {
                setPaymentModalOpen(false);
                fetchNewReservations(); // تحديث البيانات بعد الدفع
            }}
          />
      )}
    </Container>
  );
};
export default NewReservations;