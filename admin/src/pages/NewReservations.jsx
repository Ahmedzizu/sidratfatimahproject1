import React, { useEffect, useState } from 'react';
import { TextField, Button, Select, MenuItem, Typography } from '@mui/material';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import "../scss/addChalets.scss";
import { useDispatch } from 'react-redux';
import Api from '../config/config';
import { fetchNotification } from '../redux/reducers/reservation';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import ConfirmDialoge from '../components/ConfirmDialoge';
import DeleteDialoge from '../components/DeleteDialoge';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ReservarionsModal from '../modals/ReservarionsModal';

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

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
  const [confirmData, setConfirmData] = useState();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [temp, setTemp] = useState({});
  const [snackOpen, setSnackOpen] = useState(false);
  const [entityTypeFilter, setEntityTypeFilter] = useState("all");

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

  function handleConfirmOpen(data) {
    if (!data.payment?.paidAmount || data.payment.paidAmount <= 0) {
      alert("⚠️ لا يمكن تأكيد الحجز بدون دفع مبلغ.");
      return;
    }
    setConfirmData(data);
    setConfirmOpen(true);
  }

  function handleAccept() {
    if (!confirmData) return;

    const paidAmount = confirmData?.payment?.paidAmount || 0;
    if (paidAmount <= 0) {
      alert("⚠️ لا يمكن تأكيد الحجز بدون دفع مبلغ.");
      return;
    }

    setConfirmOpen(false);

    Api.patch('/admin/reservation', {
      _id: confirmData._id,
      confirmRequest: true,
    })
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

  return (
    <div className="cont" style={{ direction: i18n.language === 'en' ? 'ltr' : 'rtl' }}>
      <Typography variant="h4" component="h2" sx={{ textAlign: 'center', marginBottom: '20px', color: '#B38D46', fontWeight: 'bold' ,fontFamily: 'Cairo', }}>
        {t("إدارة الحجوزات الجديدة")}
      </Typography>

      <div className="search-box" style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
        <TextField
          type="text"
          variant="outlined"
          value={search}
          placeholder={t("search")}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ borderRadius: "50px", flex: 1 }}
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
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <TableContainer component={Paper} className="table-print">
          <Table aria-label="simple table">
            <TableHead className="tablehead">
              <TableRow>
                {/* ✅ تعديل رؤوس الأعمدة لتطابق التصميم الجديد */}
                <TableCell align="center" style={{fontFamily: 'Cairo'}}>{t("رقم العقد")}</TableCell>
                <TableCell align="center" style={{fontFamily: 'Cairo'}}>{t("reservation.client")}</TableCell>
                <TableCell align="center" style={{fontFamily: 'Cairo'}}>{t("reservation.entity")}</TableCell>
                <TableCell align="center" style={{fontFamily: 'Cairo'}}>{t("reservation.dateAndPeriod")}</TableCell>
                <TableCell align="center" style={{fontFamily: 'Cairo'}}>{t("مبلغ الحجز")}</TableCell>
                <TableCell align="center">{t("reservation.remainingAmount")}</TableCell>
                <TableCell align="center" style={{fontFamily: 'Cairo'}}>{t("الحالة")}</TableCell>
                <TableCell align="center">{t("واتساب")}</TableCell>
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
                  
                  {/* ✅ إضافة خلية المبلغ المتبقي */}
                  <TableCell align="center">
                    <span style={{ color: 'red', fontSize: '18px', fontWeight: 'bold', fontFamily: 'Cairo' }}>
                      {(row.cost - (row.payment?.paidAmount || 0)).toLocaleString()}
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

                   <TableCell align="center" style={{ fontFamily: 'Cairo' }}>
                                      <a href={`https://wa.me/${row.client?.phone}`} target="_blank" rel="noopener noreferrer" style={{ color: '#25D366', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                                        <span>{row.client?.phone}</span>
                                        <span style={{ fontSize: '20px' }}>🟢</span>
                                      </a>
                                    </TableCell>
                  <TableCell align="center">{row.payment?.method || "-"}</TableCell>

                  <TableCell align="center" style={{fontFamily: 'Cairo', minWidth: '300px'}}>
                    <Button variant="contained" size="small" onClick={() => handleOpenEdit(row)}
                      sx={{ margin: "0 5px", backgroundColor: "#1178a0", color: "#FFFFFF" }}>
                      {t("تعديل")}
                    </Button>
                    <Button variant="contained" size="small" color="error" onClick={() => handleDeleteOpen(row._id)}
                      sx={{ margin: "0 5px", backgroundColor: "#d9534f" }}>
                      {t("حذف")}
                    </Button>
                    <Button variant="contained" size="small"
                      onClick={() => navigate(`/unConfermidReservationDetails/${row._id}`)}
                      sx={{ margin: "0 5px", backgroundColor: "#f0ad4e", color: "#FFFFFF" }}>
                      {t("تفاصيل الحجز")}
                    </Button>
                    {row.status === "unConfirmed" && (
                      <Button variant="contained" size="small" color="success" onClick={() => handleConfirmOpen(row)}
                        sx={{ margin: "0 5px", backgroundColor: "#5cb85c" }}>
                        {t("تأكيد الحجز")}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </motion.div>
      <ReservarionsModal update={update} handleClose={()=>{setOpen(false); setTemp({}); setUpdate(false)}} data={temp} handleOpen={setOpen} open={open} />
      <ConfirmDialoge open={confirmOpen} handleAccept={handleAccept} handleClose={handleConfirmClose} />
      <DeleteDialoge open={deleteOpen} handleClose={handleDeleteClose} handleDelete={handleDeleteConfirm} />
    </div>
  );
};

export default NewReservations;