import React, { useEffect, useState } from "react";
import {
  TextField,
  Select,
  MenuItem,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  Box,
  Container,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import Api from "../config/config";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import EditIcon from "@mui/icons-material/Edit";
import CancelIcon from "@mui/icons-material/Cancel";
import InfoIcon from "@mui/icons-material/Info";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import HistoryIcon from "@mui/icons-material/History";
import {
  fetchNotification,
  fetchReservations,
} from "../redux/reducers/reservation";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import ReservarionsModal from "../modals/ReservarionsModal";
import DeleteDialoge from "../components/DeleteDialoge";
import ConfirmDialoge from "../components/ConfirmDialoge";
import CompleteDialoge from "../components/CompleteDialoge";
import { motion } from "framer-motion";
import HistoryModal from "../components/HistoryModal";
const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});
// 🎨 --- تعريف لوحة الألوان الأساسية ---
const themeColors = {
  primary: "#B38D46", // اللون الذهبي الأساسي
  secondary: "#6c757d", // اللون الرمادي الثانوي
  background: "#f8f9fa", // لون خلفية ناعم
  text: "#212529", // لون النص الأساسي
  error: "#dc3545", // لون الخطأ
  success: "#198754", // لون النجاح
};

// ✅ 1. تغيير اسم الكومبوننت
const ChaletsReservations = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t, i18n } = useTranslation();

  const user = useSelector((state) => state.employee.value.user);
  const data = useSelector((state) => state.reservation.value.data);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [update, setUpdate] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteID, setDeleteID] = useState();
  const [confirmData, setConfirmData] = useState();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [complete, setComplete] = useState(false);
  const [tempComplete, setTempComplete] = useState();
  const [temp, setTemp] = useState({});
  const [snackOpen, setSnackOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState([]);
  const [entityFilter, setEntityFilter] = useState("all");
  // ✅ أولاً، قم بإنشاء مصفوفة تحتوي على القاعات فقط
  const hallsData = data.filter((item) => item.type === "chalet");

  // ✅ ثانياً، قم بإنشاء قائمة الكيانات من مصفوفة القاعات
  const entities = [
    ...new Map(hallsData.map((item) => [item.entity.id, item.entity])).values(),
  ];
  useEffect(() => {
    dispatch(fetchReservations());
    removeNotification();
  }, [dispatch]);
  useEffect(() => {
    // A helper function to call the API for a single reservation
    const completeReservationAPI = async (reservationId) => {
      try {
        // ⚠️ Note: We will create this API endpoint in the backend in the next step
        await Api.patch(`/admin/reservation/${reservationId}/complete`);
        console.log(
          `✅ Reservation ${reservationId} has been automatically completed.`
        );
      } catch (error) {
        console.error(
          `❌ Failed to auto-complete reservation ${reservationId}:`,
          error
        );
      }
    };

    const today = new Date();

    // 1. Find reservations that are eligible for auto-completion
    const reservationsToComplete = data.filter(
      (res) =>
        !res.completed && // Is not already completed
        res.remainingAmount <= 0 && // Remaining amount is zero or less
        new Date(res.period.endDate) < today // End date has passed
    );

    // 2. If we found any, update them
    if (reservationsToComplete.length > 0) {
      console.log(
        `Found ${reservationsToComplete.length} reservations to auto-complete.`
      );

      // Create an array of update promises
      const updatePromises = reservationsToComplete.map((res) =>
        completeReservationAPI(res._id)
      );

      // 3. After all updates are finished, refresh the data in the UI
      Promise.all(updatePromises).then(() => {
        console.log("🔄 Refreshing reservations list after auto-completion.");
        dispatch(fetchReservations());
      });
    }
  }, [data, dispatch]); // This effect runs whenever 'data' or 'dispatch' changes
  function removeNotification() {
    Api.patch("/admin/notification", { type: "Deferred" }).then(() =>
      dispatch(fetchNotification())
    );
  }

  function handleDeleteOpen(id) {
    setDeleteID(id);
    setDeleteOpen(true);
  }

  function handleConfirmOpen(data) {
    setConfirmData(data);
    setConfirmOpen(true);
  }

  // دالة تأكيد الإلغاء (اسمها الحالي handleDeleteConfirm، وهو مناسب)
  // هذه الدالة تقوم بتغيير الحالة إلى "canceled"
  async function handleDeleteConfirm() {
    if (!deleteID) return;
    try {
      // هذا المسار صحيح لعملية الإلغاء
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/admin/reservation/cancel`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reservationId: deleteID }),
        }
      );
      if (response.ok) {
        setDeleteOpen(false);
        dispatch(fetchReservations()); // تحديث البيانات لعرض الحالة الجديدة
      } else {
        console.error("❌ فشل في إلغاء الحجز:", await response.text());
      }
    } catch (error) {
      console.error("❌ خطأ أثناء الاتصال بالـ API:", error);
    }
  }

  // ✅ جديد: دالة للحذف النهائي (ستحتاج إلى API Endpoint جديد من المبرمج الخلفي)
  // مثال على Endpoint: DELETE /admin/reservation/:id
  async function handlePermanentDeleteConfirm() {
    if (!deleteID) return;
    try {
      // ⚠️ تنبيه: هذا Endpoint افتراضي، يجب التأكد منه مع المبرمج الخلفي
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/admin/reservation/${deleteID}`,
        {
          method: "DELETE",
        }
      );
      if (response.ok) {
        setDeleteOpen(false);
        dispatch(fetchReservations()); // تحديث البيانات لإزالة الحجز
      } else {
        console.error("❌ فشل في حذف الحجز نهائياً:", await response.text());
      }
    } catch (error) {
      console.error("❌ خطأ أثناء الاتصال بالـ API:", error);
    }
  }

  function handleAccept() {
    setConfirmOpen(false);
    Api.patch("/admin/reservation", confirmData)
      .then(() => dispatch(fetchReservations()))
      .catch((err) => {
        if (err.response?.status === 403) setSnackOpen(true);
      });
  }

  function handleOpenEdit(data) {
    setTemp({
      clientName: data.client.name,
      clientPhone: data.client.phone,
      contractNumber: data.contractNumber,
      clientId: data.client?.id,
      startDate: data.period.startDate,
      endDate: data.period.endDate,
      discountPercentage: data.discountPercentage || 0,
      cost: data.cost,
      entityId: data.entity.id,
      dayPeriod: data.period.dayPeriod,
      _id: data._id,
      period: data.period,

      originalCost: data.originalCost || data.cost, // نمرر السعر الأصلي
      // ✅ أضف هذا السطر لتهيئة المبلغ الإضافي
      additionalCharge: 0,
      discountPercentage: 0,
    });
    setUpdate(true);
    setOpen(true);
  }

  function completeOpen(data) {
    setComplete(true);
    setTempComplete(data);
  }

  function handleClose() {
    setOpen(false);
    setTemp({});
    setUpdate(false);
    setComplete(false);
  }

  const handleDeleteClose = () => setDeleteOpen(false);
  const handleConfirmClose = () => setConfirmOpen(false);

  // ✅ الكود الصحيح لدالة الفتح
  const handleOpenHistoryModal = (history) => {
    setSelectedHistory(history);
    // تخزين السجل الذي تم الضغط عليه
    setHistoryModalOpen(true); // فتح المودال
  };

  // ✅ الكود الصحيح لدالة الإغلاق
  const handleCloseHistoryModal = () => {
    setHistoryModalOpen(false);
    setSelectedHistory([]); //
  };
  // ✨ --- تحسينات على الأزرار ---
const renderActions = (row) => {
    const isConfirmedButNotCompleted =
      (row.status === "confirmed" ||
        row.status === "extended" ||
        row.isModified) &&
      !row.completed;
    
    // الأيقونات المشتركة لكل الحالات
    const commonIcons = (
        <>
            <IconButton onClick={() => handleOpenHistoryModal(row.modificationHistory)} color="secondary" title={t("history", "سجل التعديلات")}>
                <HistoryIcon />
            </IconButton>
            <IconButton href={`https://wa.me/${row.client?.phone}`} target="_blank" color="success" title={t("whatsapp", "واتساب")}>
                <WhatsAppIcon />
            </IconButton>
        </>
    );

    if (isConfirmedButNotCompleted) {
      return (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: 'center' }}>
            <IconButton onClick={() => handleOpenEdit(row)} color="primary" title={t("reservation.edit", "تعديل")}>
                <EditIcon />
            </IconButton>
            <IconButton onClick={() => handleDeleteOpen(row._id)} color="error" title={t("reservation.cancel", "إلغاء")}>
                <CancelIcon />
            </IconButton>
            <IconButton onClick={() => navigate(`/reservationDetails/${row._id}`)} color="secondary" title={t("reservation.details", "تفاصيل")}>
                <InfoIcon />
            </IconButton>
            {new Date() > new Date(row.period.endDate) && row.status === "confirmed" && (
                <IconButton disabled={row.completed || row.remainingAmount > 0} onClick={() => completeOpen(row)} color="success" title={t("reservation.complete", "إكمال")}>
                    <CheckCircleIcon />
                </IconButton>
            )}
            {commonIcons}
        </Box>
      );
    }
    if (row.completed) {
      return (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: 'center' }}>
            <IconButton onClick={() => navigate(`/reservationDetails/${row._id}`)} color="secondary" title={t("reservation.details", "تفاصيل")}>
                <InfoIcon />
            </IconButton>
            {commonIcons}
        </Box>
      );
    }
    if (row.status === "canceled") {
      return (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: 'center' }}>
            <IconButton onClick={() => handleDeleteOpen(row._id)} color="error" title={t("reservation.permanentDelete", "حذف نهائي")}>
                <DeleteForeverIcon />
            </IconButton>
            <IconButton onClick={() => navigate(`/reservationDetails/${row._id}`)} color="secondary" title={t("reservation.details", "تفاصيل")}>
                <InfoIcon />
            </IconButton>
            {commonIcons}
        </Box>
      );
    }

    return null;
  };
  const getStatusName = (status, deferred, isModified, completed, t) => {
    let name = "";
    // ✅ أضف هذا الشرط في البداية
    if (completed) {
      return t("status.completed"); // تأكد من إضافة هذه الترجمة
    }
    if (status === "confirmed" || status === "extended") {
      name = t("status.confirmed");

      if (isModified) name += ` + ${t("status.modified")}`;
      if (deferred) name += ` + ${t("status.deferred")}`;
      if (status === "extended") name += ` + ${t("status.extended")}`;

      return name;
    }

    switch (status) {
      case "unConfirmed":
        return t("status.unConfirmed");
      case "canceled":
        return t("status.canceled");
      default:
        return t("status.unknown");
    }
  };
  // ✅ 2. تغيير فلتر البيانات
  let filteredData = data.filter(
    (ele) => ele.type === "chalet" && ele.status !== "unConfirmed"
  );

  if (statusFilter === "notCompleted") {
    filteredData = filteredData.filter((row) => row.completed !== true);
  } else if (statusFilter === "completed") {
    filteredData = filteredData.filter((row) => row.completed === true);
  } else if (statusFilter === "confirmed") {
    filteredData = filteredData.filter(
      (row) => row.status === "confirmed" && !row.deferred && !row.isModified
    );
  } else if (statusFilter === "deferred") {
    filteredData = filteredData.filter(
      (row) => row.status === "confirmed" && row.deferred
    );
  } else if (statusFilter === "canceled") {
    filteredData = filteredData.filter((row) => row.status === "canceled");
  } else if (statusFilter === "starts_today") {
    const todayStr = new Date().toISOString().split("T")[0]; // صيغة التاريخ: YYYY-MM-DD
    filteredData = filteredData.filter(
      (row) => row.period.startDate === todayStr
    );
  } else if (statusFilter === "ends_today") {
    const todayStr = new Date().toISOString().split("T")[0]; // صيغة التاريخ: YYYY-MM-DD
    filteredData = filteredData.filter(
      (row) => row.period.endDate === todayStr
    );
  }
  // ✅ أضف هذا الشرط الجديد
  if (entityFilter !== "all") {
    filteredData = filteredData.filter((row) => row.entity.id === entityFilter);
  }
  if (statusFilter !== "completed") {
    if (search) {
      filteredData = filteredData.filter(
        (ele) =>
          ele.client.name.toLowerCase().includes(search.toLowerCase()) ||
          ele.entity.name.toLowerCase().includes(search.toLowerCase()) ||
          ele.date.includes(search) ||
          ele.contractNumber.toString().includes(search) ||
          ele.client.phone.includes(search)
      );
    }

    if (startDate || endDate) {
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      if (start) start.setHours(0, 0, 0, 0);
      if (end) end.setHours(23, 59, 59, 999);

      filteredData = filteredData.filter((reservation) => {
        const resStartDate = new Date(reservation.period.startDate);
        if (start && end) return resStartDate >= start && resStartDate <= end;
        if (start) return resStartDate >= start;
        if (end) return resStartDate <= end;
        return true;
      });
    }
  }

  const counts = {
    all: data.filter(
      (row) => row.type === "chalet" && row.status !== "unConfirmed"
    ).length,
    confirmed: data.filter(
      (row) =>
        row.type === "chalet" && row.status === "confirmed" && !row.deferred
    ).length,
    deferred: data.filter(
      (row) =>
        row.type === "chalet" && row.status === "confirmed" && row.deferred
    ).length,
    canceled: data.filter(
      (row) => row.type === "chalet" && row.status === "canceled"
    ).length,
    completed: data.filter(
      (row) => row.type === "chalet" && row.completed === true
    ).length,
  };

  // ✅ --- بداية منطق الفرز ---
  const today = new Date();
  today.setHours(0, 0, 0, 0); // لتوحيد التاريخ بدون وقت

  // دالة لتحديد أولوية الفرز
  const getSortPriority = (reservation) => {
    const startDate = new Date(reservation.period.startDate);
    const endDate = new Date(reservation.period.endDate);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    if (endDate.getTime() === today.getTime()) return 1; // الأولوية القصوى: ينتهي اليوم
    if (startDate.getTime() === today.getTime()) return 2; // الأولوية الثانية: يبدأ اليوم
    return 3; // الأولوية الافتراضية
  };

  filteredData.sort((a, b) => {
    const priorityA = getSortPriority(a);
    const priorityB = getSortPriority(b);

    if (priorityA !== priorityB) {
      // الفرز حسب الأولوية
      return priorityA - priorityB;
    }

    // إذا تساوت الأولوية، يتم الفرز حسب تاريخ البدء (الأحدث أولاً)
    return new Date(b.period.startDate) - new Date(a.period.startDate);
  });
  // ✅ أضف هذه الدالة قبل جملة return
  const getRowStyle = (reservation) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // تجاهل الوقت للمقارنة الدقيقة

    const startDate = new Date(reservation.period.startDate);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(reservation.period.endDate);
    endDate.setHours(0, 0, 0, 0);

    // 1. الحالة الأولى: الحجز انتهى ولم يتم دفع المبلغ المتبقي (أحمر فاتح)
    if (endDate < today && reservation.remainingAmount > 0) {
      return { backgroundColor: "#ffebeeff" }; // أحمر خفيف 🔴
    }

    // 2. الحالة الثانية: الحجز ينتهي اليوم (أصفر فاتح)
    if (endDate.getTime() === today.getTime()) {
      return { backgroundColor: "#fff9c4" }; // أصفر خفيف 🟡
    }

    // 3. الحالة الثالثة: الحجز يبدأ اليوم (أخضر فاتح)
    if (startDate.getTime() === today.getTime()) {
      return { backgroundColor: "#e8f5e9" }; // أخضر خفيف 🟢
    }

    // 4. الحالة الافتراضية: أي حجز آخر (أبيض)
    return { backgroundColor: "#f8f7f7ff" }; // أبيض
  };

  return (
    // 🎨 --- استخدام Container لتوسيط المحتوى ---
    <Container
      maxWidth="xl"
      sx={{
        py: 3,
        direction: i18n.language === "en" ? "ltr" : "rtl",
        backgroundColor: themeColors.background,
      }}
    >
      <Typography
        variant="h4"
        component="h2"
        sx={{
          fontFamily: "Cairo, sans-serif",
          textAlign: "center",
          mb: 4,
          color: themeColors.primary,
          fontWeight: "bold",
        }}
      >
        {t("MngChalet")}
      </Typography>

      <Paper elevation={2} sx={{ p: 2, mb: 3, borderRadius: "12px" }}>
        <Box
        
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "1fr 1fr",
              lg: "auto auto auto auto 1fr auto",
            },
            gap: 2,
            alignItems: "center",
          }}
        >
           <TextField
        type="text"
        variant="outlined"
        value={search}
        placeholder={t("search")}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ flex: 1, minWidth: "200px" }}
      />
          <TextField
            type="date"
            label={t("from_date")}
            InputLabelProps={{ shrink: true }}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <TextField
            type="date"
            label={t("to_date")}
            InputLabelProps={{ shrink: true }}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            displayEmpty
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="all">
              {t("dashboard.allBookingsFiltter")} ({counts.all})
            </MenuItem>
            <MenuItem value="confirmed">
              {t("dashboard.confirmedFiltter")} ({counts.confirmed})
            </MenuItem>
            <MenuItem value="deferred">
              {t("dashboard.deferredFiltter")} ({counts.deferred})
            </MenuItem>
            <MenuItem value="canceled">
              {t("dashboard.canceledFiltter")} ({counts.canceled})
            </MenuItem>
            <MenuItem value="completed">
              {t("dashboard.completedFiltter")} ({counts.completed})
            </MenuItem>
            <MenuItem value="starts_today">
              {t("dashboard.startsToday")}
            </MenuItem>
            <MenuItem value="ends_today">{t("dashboard.endsToday")}</MenuItem>
          </Select>
          <Select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            displayEmpty
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="all">{t("all_entities")}</MenuItem>{" "}
            {/* تأكد من إضافة هذه الترجمة في ملفات i18n */}
            {entities.map((entity) => (
              <MenuItem key={entity.id} value={entity.id}>
                {entity.name}
              </MenuItem>
            ))}
          </Select>

          <Button
            variant="outlined"
            color="secondary"
            onClick={() => {
              setStartDate("");
              setEndDate("");
              setSearch("");
              setStatusFilter("all");
              setEntityFilter("all");
            }}
          >
            {/* ✏️ --- تحسين النص --- */}
            {t("reset_filters", "إعادة تعيين")}
          </Button>
              
        </Box>
      </Paper>
 

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ width: "100%", overflowX: "auto" }}>
          <TableContainer
            component={Paper}
            elevation={2}
            sx={{ borderRadius: "12px" }}
          >
            <Table aria-label="simple table">
              <TableHead
                sx={{
                  backgroundColor: themeColors.primary,
                  "& .MuiTableCell-root": {
                    color: "white",
                    fontWeight: "bold",
                    fontFamily: "Cairo, sans-serif",
                  },
                }}
              >
                <TableRow>
                  <TableCell align="center">
                    {t("reservation.contractNumberTable")}
                  </TableCell>
                  <TableCell align="center">
                    {t("reservation.clientTable")}
                  </TableCell>

                  <TableCell align="center">
                    {t("reservation.entityTable")}
                  </TableCell>
                  <TableCell align="center">
                    {t("reservation.dateAndPeriod")}
                  </TableCell>
                  <TableCell align="center">
                    {t("reservation.bookingAmountTable")}
                  </TableCell>
                  <TableCell align="center">
                    {t("reservation.statusTable")}
                  </TableCell>
                  <TableCell align="center">
                    {t("reservation.remainingAmount")}
                  </TableCell>
                  <TableCell align="center">
                    {t("reservation.actionsTable")}
                  </TableCell>
                  {/* ✅ أضف هذا العنوان */}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredData.map((row, ind) => (
                  // 1. أزل النمط من هنا
                  <TableRow key={ind} sx={{ '&:hover': { backgroundColor: '#f1f1f1' }, ...getRowStyle(row) }}>
                    <TableCell
                      style={{ ...getRowStyle(row), fontFamily: "Cairo" }}
                      align="center"
                    >
                      {row.contractNumber}
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        fontFamily: "Cairo",
                        fontSize: { xs: "0.8rem", md: "1rem" }, // خط أصغر على الجوال، وأكبر على الكمبيوتر
                      }}
                    >
                      {row.client.name}
                    </TableCell>

                    <TableCell style={{ fontFamily: "Cairo" }} align="center">
                      {row.entity.name}
                    </TableCell>

                    {/* ✅ تعديل: الخلية الجديدة المدمجة */}
                    <TableCell align="center" sx={{ minWidth: "170px" }}>
                      {/* تاريخ الدخول والخروج */}
                      <div>
                        <span style={{ color: "green", fontWeight: "bold" }}>
                          {row.period.startDate}
                        </span>{" "}
                        -
                        <span style={{ color: "purple", fontWeight: "bold" }}>
                          {row.period.endDate}
                        </span>
                      </div>
                      {/* ✅ جديد: اسم الفترة */}
                      <div
                        style={{
                          fontSize: "0.8rem",
                          fontWeight: "bold",
                          color: "#4a4a4a",
                          backgroundColor: "#e6e6e6",
                          borderRadius: "10px",
                          padding: "2px 10px",
                          display: "inline-block",
                          marginTop: "4px",
                        }}
                      >
                        {/* ✅ يتم الآن عرض فترة الدخول والخروج */}
                        {row.period.checkIn?.name} - {row.period.checkOut?.name}
                      </div>
                      {/* وقت الدخول والخروج */}
                      <div style={{ fontSize: "1rem", color: "#555" }}>
                        {/* ✅ نقرأ الآن من المسار الجديد */}
                        <span style={{ color: "green" }}>
                          {row.period.checkIn?.time}
                        </span>
                        {"       -→--       "}
                        <span style={{ color: "purple" }}>
                          {row.period.checkOut?.time}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell
                      align="center"
                      sx={{ fontWeight: "bold", color: themeColors.success }}
                    >
                      {row.cost.toLocaleString()} 
                    </TableCell>

                    <TableCell style={{ fontFamily: "Cairo" }} align="center">
                      <div
                        style={{
                          backgroundColor:
                            // ✅ أضف هذا السطر للتحقق من حالة الإكمال أولاً
                            row.completed
                              ? "#D3D3D3" // رمادي فاتح للمكتمل
                              : row.status === "canceled"
                              ? "#f48181"
                              : row.status === "confirmed" && row.deferred
                              ? "#ffe5b4"
                              : row.status === "confirmed" && row.isModified
                              ? "#b6bdb9ff"
                              : row.status === "confirmed"
                              ? "#d4edda"
                              : "#ffffff",
                          color:
                            // ✅ أضف هذا السطر للون النص
                            row.completed
                              ? "#000000" // أسود للمكتمل
                              : row.status === "canceled"
                              ? "#721c24"
                              : row.status === "confirmed" && row.deferred
                              ? "#856404"
                              : row.status === "confirmed" && row.isModified
                              ? "#004085"
                              : row.status === "confirmed"
                              ? "#155724"
                              : "#000000",
                          padding: "5px 10px",
                          borderRadius: "15px",
                          display: "inline-block",
                          textAlign: "center",
                          width: "fit-content",
                        }}
                      >
                        {t(
                          getStatusName(
                            row.status,
                            row.deferred,
                            row.isModified,
                            row.completed,
                            t
                          )
                        )}
                      </div>
                    </TableCell>

                    <TableCell
                      align="center"
                      sx={{
                        fontWeight: "bold",
                        color:
                          row.remainingAmount > 0
                            ? themeColors.error
                            : themeColors.text,
                      }}
                    >
                      {/* ✏️ --- إضافة العملة --- */}
                      {row.remainingAmount.toLocaleString()}{" "}
                    </TableCell>

                    <TableCell align="center" sx={{ minWidth: "220px", padding: '8px' }}>
        {renderActions(row)}
    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </motion.div>

      <ReservarionsModal
        update={update}
        handleClose={handleClose}
        data={temp}
        handleOpen={setOpen}
        open={open}
      />
      <DeleteDialoge
        open={deleteOpen}
        handleClose={handleDeleteClose}
        handleDelete={handleDeleteConfirm}
      />
      <ConfirmDialoge
        open={confirmOpen}
        handleAccept={handleAccept}
        handleClose={handleConfirmClose}
      />
      <CompleteDialoge
        handleClose={handleClose}
        data={tempComplete}
        open={complete}
      />
      <Snackbar
        open={snackOpen}
        autoHideDuration={2000}
        onClose={() => setSnackOpen(false)}
      >
        <Alert
          onClose={() => setSnackOpen(false)}
          severity="error"
          sx={{ width: "100%" }}
        >
          {t("reservation.noPermission")}
        </Alert>
      </Snackbar>
      <HistoryModal
        open={historyModalOpen}
        onClose={handleCloseHistoryModal}
        history={selectedHistory}
      />
    </Container>
  );
};

// ✅ 1. تغيير اسم الكومبوننت عند التصدير
export default ChaletsReservations;
