import React, { useEffect, useRef, useState } from "react";

import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchReservations,
  shareOff,
  shareOn,
} from "./../redux/reducers/reservation";
import logo from "../assets/logo2.png";
import "../scss/reservationsDetails.scss";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import { useTranslation } from "react-i18next";
import whatsappIcon from "../assets/whatsapp.png";
import { Button, Divider } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import AddPayment from "../modals/AddPayment";
import ReservationServices from "../modals/ReservationServices";
import ReservationFreeReservation from "../modals/ReservationFreeReservation";
import Request from "../modals/Request";
import Api from "../config/config";
import LocalPrintshopIcon from "@mui/icons-material/LocalPrintshop";
import Reset from "../components/Reset";
import ReactToPrint from "react-to-print";
import { fetchReservation_payments } from "../redux/reducers/reservation_payments";
import PaymentReset from "../components/PaymentReset";
import ServicePrint from "../components/ServicePrint";
import html2canvas from "html2canvas";
import AllPaymentsReset from "../components/AllPaymentsReset";
import ConfirmEditDialoge from '../components/ConfirmEditDialoge';

const ReservationDetails = () => {
  // ✅ دالة لتنسيق التاريخ والوقت بشكل مناسب للعرض
const formatDateTimeForDisplay = (dateString) => {
  if (!dateString) return "غير محدد";
  
  const options = {
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: 'numeric', 
    minute: '2-digit', 
    hour12: true,
    calendar: 'gregory' // لضمان التقويم الميلادي
  };

  // 'ar-EG' (مصر) هو خيار ممتاز وموثوق للتواريخ الميلادية بالعربية
  return new Date(dateString).toLocaleString('ar-EG', options);
};
  let share = useSelector((state) => state.reservation.value.share);
  const { id } = useParams();
  const dispatch = useDispatch();
  const { t, i18n } = useTranslation();

  const [payment, setPayment] = useState({
    open: false,
    update: false,
    data: { type: "نقدي" },
  });
  const [servicesData, setServicesDate] = useState([]);
  const [freeServices, setFreeServices] = useState({
    open: false,
    update: false,
    data: {},
  });
  const [services, setServices] = useState({
    open: false,
    update: false,
    data: {},
  });
  const [request, setRequest] = useState({
    open: false,
    update: false,
    data: {},
  });
  
  const [freeServicesDate, setFreeServicesDate] = useState([]);
// ✅ متغير للتحقق مما إذا كان الحجز مغلقًا (مكتمل أو ملغي)
  const allReservations = useSelector((state) => state.reservation.value.data) || [];
const reservation = allReservations.find((ele) => ele._id === id);

  const [requestDate, setRequestDate] = useState([]);
  const reservationPayments = useSelector(
    (state) => state.reservation_payments.value.data
  );
  const [loading, setLoading] = useState(false);
 const [confirmOpen, setConfirmOpen] = useState(false);
  // اجمالي الشبكة
  let totalInsurance =
    parseFloat(
      reservationPayments?.reduce(
        (prev, cur) => prev + parseFloat(cur?.insurance),
        0
      )
    ) || 0;

  // اجمالي المدفوع
  let totalPaid =
    parseFloat(
      reservationPayments?.reduce(
        (prev, cur) => prev + parseFloat(cur?.paid),
        0
      )
    ) || 0;
    

  // اجمالي الخدمات
  let totalServices =
    parseFloat(
      servicesData?.reduce((prev, cur) => prev + parseFloat(cur?.price), 0)
    ) +
      parseFloat(
        requestDate.reduce((prev, cur) => prev + parseFloat(cur?.price), 0)
      ) || 0;

      // ✅✅✅  السطر الجديد: حساب المبلغ المتبقي بالمعادلة الصحيحة  ✅✅✅
  const remainingAmount = 
    (
      parseFloat(reservation?.cost || 0) - 
      parseFloat(reservation?.discountAmount || 0) + 
      totalServices
    ) - totalPaid;
  useEffect(() => {
    dispatch(fetchReservations());
    fetchServices();
    dispatch(fetchReservation_payments(id));
  }, [dispatch, id]);

  const fetchServices = async () => {
    await Api.get(`/admin/reservation/service/${id}`)
      .then((res) => {
        let temp = res.data;
        let tempServices = temp.filter((ele) => ele.type === "service");
        let tempFree = temp.filter((ele) => ele.type === "free");
        let tempRequest = temp.filter((ele) => ele.type === "request");
        setServicesDate(tempServices);
        setFreeServicesDate(tempFree);
        setRequestDate(tempRequest);
      })
      .catch((err) => console.log(err.message));
  };

  function handleClose() {
    setPayment({ open: false, update: false, data: { type: "نقدي" } });
    setFreeServices({ open: false, update: false });
    setServices({ open: false, update: false });
    setRequest({ open: false, update: false });
  }

  const handleDelete = async (serviceId) => {
    await Api.delete(`/admin/reservation/service/${serviceId}`).then(() =>
      fetchServices()
    );
  };

  const handeleDeletePayment = async (paymentId) => {
    await Api.delete(`/reservation-payments/${paymentId}`)
      .then(() => dispatch(fetchReservation_payments(id)))
      .catch((err) => {
        console.log(err.message);
      });
  };

  const componentRef = useRef();
  const tempRef = useRef();
  const [paymentData, setPaymentData] = useState({
    type: "",
    paid: "",
    insurance: "",
    bank: { name: "" },
  });

  function handlePrint() {
    setLoading(true);
    setTimeout(() => {
      tempRef.current.click();
    }, 100);
  }

  const [paymentLoading, setPaymentLoading] = useState(false);
  const paymentRef = useRef();
  const paymentBtnRef = useRef();
  function handlePaymentPrint(data) {
    setPaymentData(data);
    setPaymentLoading(true);
    setTimeout(() => {
      paymentBtnRef.current.click();
    }, 100);
  }


  const handleDownloadReceiptImage  = async () => {
    if (!paymentRef.current) return;
    try {
      const element = paymentRef.current;
      const originalDisplay = element.style.display;
      // تأكد أن العنصر ظاهر مؤقتًا
      if (originalDisplay === "none") {
        element.style.display = "block";
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
      const canvas = await html2canvas(element, {
        useCORS: true,
        allowTaint: false,
        logging: true,
      });
      console.log("Canvas dimensions:", canvas.width, canvas.height);
      element.style.display = originalDisplay;
      if (!canvas || canvas.width === 0 || canvas.height === 0) {
        console.error("Canvas is empty");
        return;
      }
      const dataUrl = canvas.toDataURL("image/png");
      if (!dataUrl || dataUrl.length === 0) {
        console.error("Data URL is empty");
        return;
      }
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = "payment-receipt.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading payment receipt:", error);
    }
  };
  
  const isReservationClosed = reservation?.completed || reservation?.status === 'canceled';


  const [serviceLoading, setServiceLoading] = useState(false);
  const serviceRef = useRef();
  const serviceBtnRef = useRef();
  function handleservicePrint() {
    setServiceLoading(true);
    setTimeout(() => {
      serviceBtnRef.current.click();
    }, 100);
  }
  // ✅ الأسطر الجديدة: حالة التحميل والمراجع لطباعة كل الدفعات
  const [allPaymentsLoading, setAllPaymentsLoading] = useState(false);
  const allPaymentsRef = useRef();
  const allPaymentsBtnRef = useRef();

  // ✅ الدالة الجديدة: لتشغيل طباعة كل الدفعات
  function handleAllPaymentsPrint() {
    setAllPaymentsLoading(true);
    setTimeout(() => {
      allPaymentsBtnRef.current.click();
    }, 100);
  }
  // ✅ دالة لتحويل التاريخ لـ "YYYY-MM-DD HH:MM:00"
  const formatCustomDateTime = (dateString) => {
    if (!dateString) return "غير محدد";
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // ✅ تنسيق التاريخ بالعربية (بدون الوقت)
  const formatDate = (dateString) => {
    if (!dateString) return "غير محدد"; // ✅ إذا لم يكن هناك تاريخ
    const months = [
      "يناير",
      "فبراير",
      "مارس",
      "أبريل",
      "مايو",
      "يونيو",
      "يوليو",
      "أغسطس",
      "سبتمبر",
      "أكتوبر",
      "نوفمبر",
      "ديسمبر",
    ];
    const date = new Date(dateString);
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

 // ✅ تحويل حالة الحجز للعربية
  const getStatusInArabic = (status) => {
    switch (status) {
      case "confirmed":
        return t("status.confirmed");
        case "completed":
        return t("status.completed");
      case "unConfirmed":
        return t("status.unConfirmed");
      case "deferred":
        return t("status.deferred");
      case "canceled":
        return t("status.canceled");
      default:
        return t("status.unknown");
    }
  };

  // ✅ تكوين الرسالة الجاهزة للواتساب
   // ✅✅✅  تم تعديل رسالة الواتساب لتستخدم الحساب الصحيح  ✅✅✅
// ✅ دالة مساعدة لتنسيق الوقت بصيغة 12 ساعة
const formatTime12Hour = (timeString) => {
  if (!timeString || !timeString.includes(':')) return ''; // إرجاع نص فارغ إذا كان الوقت غير صالح
  
  const [hour, minute] = timeString.split(':');
  let h = parseInt(hour, 10);
  const ampm = h >= 12 ? 'مساءً' : 'صباحًا';
  
  h = h % 12;
  h = h ? h : 12; // الساعة 0 يجب أن تكون 12
  
  const minuteStr = minute.padStart(2, '0');
  
  return `${h}:${minuteStr} ${ampm}`;
};

const message = `
مجموعة سدرة فاطمة

مضيفنا العزيز: ${reservation?.client?.name || ""}
نبارك لك حجزك المؤكد
يوم ${formatDate(reservation?.period?.startDate)}

--------------
تفاصيل الحجز
--------------
${reservation?.entity?.name || "المكان"}

من تاريخ: ${formatDate(reservation?.period?.startDate)}
وحتى تاريخ: ${formatDate(reservation?.period?.endDate)}
دخول: ${reservation?.period?.checkIn?.name || ''} (${formatTime12Hour(reservation?.period?.checkIn?.time) || ''})
خروج: ${reservation?.period?.checkOut?.name || ''} (${formatTime12Hour(reservation?.period?.checkOut?.time) || ''})

الاجمالي: ${reservation?.cost || 0}
اجمالي الخدمات: ${totalServices.toFixed(2)}
الخصم: ${parseFloat(reservation?.discountAmount || 0).toFixed(2)}
المدفوع: ${totalPaid.toFixed(2)}
المتبقي: ${remainingAmount.toFixed(2)}

نتمنى لك إقامة سعيدة!

--------------
مدير الحجوزات: 0505966297
العامل المسئول: 560225991

اللوكيشن: https://maps.app.goo.gl/bUvZp5cDYiSevgSo6
`.trim();

const encodedMessage = encodeURIComponent(message);
const waLink = `https://wa.me/${reservation?.client?.phone}?text=${encodedMessage}`;

  if(!reservation) return <div>جاري تحميل بيانات الحجز...</div>;

// 3. إنشاء دالة جديدة لتنفيذ الحفظ الفعلي
  function handleConfirmSave() {
    // (هنا نضع نفس كود إرسال البيانات الذي كان في handleSubmit)
    const url = "/admin/reservations/update-advanced";
    const payload = { /* ... بناء الحمولة ... */ };

    Api.post(url, payload)
      .then(() => {
        dispatch(fetchReservations());
        setConfirmOpen(false); // إغلاق نافذة التأكيد
        handleClose();       // إغلاق مودال التعديل
      })
      .catch((err) => {
        console.error("Failed to update:", err);
        setConfirmOpen(false);
      });
  }

  // 4. تعديل دالة handleSubmit لتفتح نافذة التأكيد فقط
  function handleSubmit(e) {
    e.preventDefault();
    // بدلاً من إرسال البيانات، نقوم بفتح نافذة التأكيد
    setConfirmOpen(true);
  }

  return (
    <>
      {/* المكونات المخفية للطباعة */}
      <div
        id="reservation-reset"
        style={{ display: loading ? "block" : "none" }}
        ref={componentRef}
      >
        <Reset
          data={reservation}
          totalInsurance={totalInsurance || "0"}
          totalPaid={totalPaid || "0"}
          totalServices={totalServices || "0"}
        />
      </div>

      <div
        id="reservation-reset"
        style={{ display: paymentLoading ? "block" : "none" }}
        ref={paymentRef}
      >
        <PaymentReset
          data={reservation}
          totalInsurance={totalInsurance || "0"}
          totalPaid={totalPaid || "0"}
          totalServices={totalServices || "0"}
          paymentData={paymentData}
        />
      </div>

      <div
        id="reservation-reset"
        style={{ display: serviceLoading ? "block" : "none" }}
        ref={serviceRef}
      >
        <ServicePrint
          data={reservation}
          services={servicesData}
          totalPaid={totalPaid || "0"}
          totalServices={totalServices || "0"}
          paymentData={paymentData}
        />
      </div>
          {/* ✅ المكون الجديد: حاوية طباعة كل الدفعات */}
 <div style={{ display: allPaymentsLoading ? "block" : "none" }} ref={allPaymentsRef}>
        <AllPaymentsReset data={reservation} payments={reservationPayments} totalPaid={totalPaid || "0"} totalInsurance={totalInsurance || "0"} totalServices={totalServices || "0"} />
      </div>
      {/* أدوات الطباعة (ReactToPrint) */}
      <ReactToPrint
        trigger={() => (
          <button ref={tempRef} style={{ display: "none" }}>
            Print this out!
          </button>
        )}
        content={() => componentRef.current}
        onAfterPrint={() => setLoading(false)}
        onBeforePrint={() => setLoading(true)}
        copyStyles={true}
      />

      <ReactToPrint
        trigger={() => (
          <button ref={paymentBtnRef} style={{ display: "none" }}>
            Print this out!
          </button>
        )}
        content={() => paymentRef.current}
        onAfterPrint={() => setPaymentLoading(false)}
        onBeforePrint={() => setPaymentLoading(true)}
        copyStyles={true}
      />

      <ReactToPrint
        trigger={() => (
          <button ref={serviceBtnRef} style={{ display: "none" }}>
            Print this out!
          </button>
        )}
        content={() => serviceRef.current}
        onAfterPrint={() => setServiceLoading(false)}
        onBeforePrint={() => setServiceLoading(true)}
        copyStyles={true}
      />
 <ReactToPrint trigger={() => (<button ref={allPaymentsBtnRef} style={{ display: "none" }}>Print All Payments</button>)} content={() => allPaymentsRef.current} onAfterPrint={() => setAllPaymentsLoading(false)} onBeforePrint={() => setAllPaymentsLoading(true)} copyStyles={true} />
      {/* المحتوى الفعلي للصفحة (يظهر فقط عندما لا تكون في وضع الطباعة) */}
      {!loading && !paymentLoading && !serviceLoading && (
        <>
          <header>
            <div className="share-box">
              <LocalPrintshopIcon
                id="share"
                className="onshare"
                onClick={handlePrint}
              />
            </div>
            <div className="details shareon">
              <div className="text">
                <p>تفاصيل الحجز بجميع الخدمات</p>
                <p> اسم العميل : {reservation?.client?.name} </p>
                <p> رقم العميل : {reservation?.client?.phone} </p>
              </div>
              <img src={logo} alt="logo" height="60px" width="60px" />
            </div>
          </header>

          <TableContainer component={Paper} className="table-print">
            <Table aria-label="simple table">
              <TableRow
                style={{ border: 0 }}
                className="shareon hide"
                sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
              >
                <TableCell
                  align="center"
                  colSpan={2}
                  style={{ border: 0 }}
                  className="table-data"
                >
                  <img src={logo} alt="logo" height="60px" width="60px" />
                  <h2>سدرة فاطمة</h2>
                  <p>تفاصيل الحجز بجميع الحجوزات</p>
                </TableCell>
              </TableRow>
              <TableBody style={{ border: "1px solid" }}>
                <TableRow
                  className="shareon hide"
                  sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                >
                  <TableCell align="center" className="table-data">
                    اسم العميل
                  </TableCell>
                  <TableCell align="center" className="table-data">
                    {" "}
                    {reservation?.client?.name}
                  </TableCell>
                </TableRow>
                <TableRow
                  className="shareon hide"
                  sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                >
                  <TableCell align="center" className="table-data">
                    رقم العميل
                  </TableCell>
                  <TableCell align="center" className="table-data">
                    {" "}
                    {reservation?.client?.phone}
                  </TableCell>
                </TableRow>

                {/* رابط الواتساب المعدل مع الرسالة الجاهزة */}
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ marginLeft: "10px", display: "inline-block" }}
                >
                  <img
                    src={whatsappIcon}
                    alt="WhatsApp"
                    style={{ width: "40px", height: "40px", cursor: "pointer" }}
                  />
                  واتساب العميل
                </a>

                <TableRow
                  sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                >
                  <TableCell align="center" className="table-data">
                    رقم العقد
                  </TableCell>
                  <TableCell align="center" className="table-data">
                    {" "}
                    {reservation?.contractNumber}
                  </TableCell>
                </TableRow>
                <TableRow
                  sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                >
                  <TableCell align="center" className="table-data">
                    {reservation?.type === "hall"
                      ? "قاعة"
                      : reservation?.type === "chalet"
                      ? "الملتقى"
                      : reservation?.entity.name}
                  </TableCell>
                  <TableCell align="center" className="table-data">
                    {" "}
                    {reservation?.entity.name}
                  </TableCell>
                </TableRow>

     {/* حالة الحجز */}
                   <TableRow>
                     <TableCell align="center" className="table-data">
                       حالة الحجز
                     </TableCell>
                     <TableCell align="center" className="table-data">
                       {getStatusInArabic(reservation?.status)}
                     </TableCell>
                   </TableRow>
                {/* طريقة الدفع */}
                <TableRow>
                  <TableCell align="center" className="table-data">
                    طريقة الدفع
                  </TableCell>
                  <TableCell align="center" className="table-data">
                    {reservation?.payment.method}
                  </TableCell>
                </TableRow>

                {reservation?.payment?.method === "bank" && (
                  <TableRow>
                    <TableCell align="center" className="table-data">
                      البنك
                    </TableCell>
                    <TableCell align="center" className="table-data">
                      {reservation?.payment?.bank?.name ||
                        reservation?.payment?.bankName ||
                        "غير محدد"}
                    </TableCell>
                  </TableRow>
                )}

                {/* مبلغ الخصم */}
                <TableRow>
                  <TableCell align="center" className="table-data">
                    الخصم
                  </TableCell>
                  <TableCell align="center" className="table-data">
                    {reservation?.discountAmount || "0"} ريال
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell align="center" className="table-data">
                    مبلغ الحجز
                  </TableCell>
                  <TableCell align="center" className="table-data">
                    {" "}
                    {reservation?.cost}
                  </TableCell>
                </TableRow>

                  {/* الفترة */}
                {reservation?.period?.type === "days" && ( 
                <TableRow>
                  <TableCell align="center" className="table-data">
                    الفترة
                  </TableCell>
                  <TableCell align="center" className="table-data">
                    {"فترات  متعددة"}
                  </TableCell>
                </TableRow>
              )}
    {reservation?.period?.type === "dayPeriod" && ( 
                <TableRow>
                  <TableCell align="center" className="table-data">
                    الفترة
                  </TableCell>
                  <TableCell align="center" className="table-data">
                    {reservation?.period?.dayPeriod || "فتره "}
                  </TableCell>
                </TableRow>
              )}

                {/* تاريخ الحجز */}
                <TableRow>
                  <TableCell align="center" className="table-data">
                    تاريخ الحجز
                  </TableCell>
                  <TableCell align="center" className="table-data">
                    <strong></strong>{" "}
                    {formatDate(reservation?.period.startDate)}
                    {" ←  "}
                    <strong></strong> {formatDate(reservation?.period.endDate)}
                  </TableCell>
                </TableRow>

              {/* تفاصيل الدخول والخروج إذا كانت الفترة كامل اليوم */}
                {/* {reservation?.period?.dayPeriod === "كامل اليوم" && ( */}
                 <TableRow>
                        <TableCell align="center" className="table-data">
                          تفاصيل الدخول والخروج
                        </TableCell>
                        <TableCell align="center" className="table-data">
                          <strong>دخول:</strong>{" "}
                          {/* ✅ نقرأ الآن من الهيكل الجديد ونجمع الاسم والوقت */}
                          {`${reservation?.period?.checkIn?.name || ''} (${reservation?.period?.checkIn?.time || ''})`}
                          {" ←  "}
                          <strong>خروج:</strong>{" "}
                          {/* ✅ نقرأ الآن من الهيكل الجديد ونجمع الاسم والوقت */}
                          {`${reservation?.period?.checkOut?.name || ''} (${reservation?.period?.checkOut?.time || ''})`}
                        </TableCell>
                      </TableRow>
                {/* )} */}

                <TableRow>
                  <TableCell align="center" className="table-data">
                    الشبكة
                  </TableCell>
                  <TableCell align="center" className="table-data">
                    {totalInsurance || "0"}
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell align="center" className="table-data">
                    المدفوع
                  </TableCell>
                  <TableCell align="center" className="table-data">
                    {totalPaid || "0"}
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell align="center" className="table-data">
                    الخدمات الاضافية
                  </TableCell>
                  <TableCell align="center" className="table-data">
                    {totalServices || "0"}
                  </TableCell>
                </TableRow>

                 {/* ✅✅✅  تم تعديل خلية المبلغ المتبقي لتستخدم الحساب الصحيح  ✅✅✅ */}
                <TableRow>
                  <TableCell align="center" className="table-data" style={{fontWeight: 'bold'}}>
                    المتبقي
                  </TableCell>
                  <TableCell align="center" className="table-data">
                    {reservation?.cost + totalServices - totalPaid || "0"}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          <Divider />

          {/* دفعات */}
<div className="pay shareoff">
    <Button
        variant="contained"
        className="onshare"
        id="btn"
        onClick={() => setPayment({ ...payment, open: true, update: false })}
        disabled={isReservationClosed} // ✅ تعطيل الزر
    >
        دفعات <AddIcon />
    </Button>
            {/* ✅ الزر الجديد لطباعة كل الدفعات */}
            <Button variant="contained" color="secondary" className="onshare" id="btn" style={{ margin: "0 10px" }} onClick={handleAllPaymentsPrint}>
              طباعة كل الدفعات <LocalPrintshopIcon />
            </Button>
            <TableContainer component={Paper} className="table-print">
              <Table aria-label="simple table">
                <TableHead className="tablehead">
                  <TableRow>
                    <TableCell align="center" className="table-row">
                      نوع الدفع
                    </TableCell>
                    <TableCell align="center" className="table-row">
                      المبلغ
                    </TableCell>
                    <TableCell align="center" className="table-row">
                      مبلغ التأمين
                    </TableCell>
                    <TableCell align="center" className="table-row">
                      البنك
                    </TableCell>
                        <TableCell align="center" className="table-row">الموظف</TableCell> 

                    <TableCell align='center' className='table-row'>تاريخ ووقت الدفعة</TableCell>
                    <TableCell align="center"></TableCell>
                    <TableCell></TableCell>
                    <TableCell></TableCell>
                    <TableCell></TableCell>

                  </TableRow>
                </TableHead>
                <TableBody>
                  {reservationPayments?.map((ele, index) => (
                    
                    <TableRow key={index}>
                      <TableCell align="center"> {ele?.type}</TableCell>
                      <TableCell align="center"> {ele?.paid}</TableCell>
                      <TableCell align="center"> {ele?.insurance}</TableCell>
                     <TableCell align="center">
      {ele.type === 'تحويل بنكي' ? (
        ele.bank?.name || 'غير محدد'
      ) : (
        '---'
      )}
    </TableCell>
    <TableCell align="center" style={{ fontWeight: 'bold' }}>
      {ele.employee?.name || 'غير محدد'}
    </TableCell>
                       {/* ✅✅✅ أضف هذه الخلية لعرض التاريخ والوTقت ✅✅✅ */}
      <TableCell align="center">
        {formatDateTimeForDisplay(ele.paymentDate)}
      </TableCell>
                      <TableCell align="center">
                        <Button
                          variant="contained"
                          color="warning"
                          onClick={() =>
                            setPayment({
                              ...payment,
                              open: true,
                              update: true,
                              data: ele,
                            })
                          }
                        >
                          تعديل
                        </Button>
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          variant="contained"
                          color="error"
                          onClick={() => handeleDeletePayment(ele._id)}
                        >
                          حذف
                        </Button>
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          sx={{ margin: "0 5px" }}
                          variant="contained"
                          onClick={() => handlePaymentPrint(ele)}
                        >
                          طباعة
                        </Button>
                      </TableCell>

                      <TableCell align="center">
                        <Button
                          sx={{ margin: "0 5px" }}
                          variant="contained"
                          color="success"
                          onClick={handleDownloadReceiptImage}
                        >
                          تحميل الوصل
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </div>

          {/* الخدمات المجانية */}
          <div className="pay shareoff">
            <Button
              variant="contained"
              className="onshare"
              id="btn"
              onClick={() =>
                setFreeServices({ ...freeServices, open: true, update: false })
              }
            >
              الخدمات المجانية <AddIcon />
            </Button>
            <TableContainer component={Paper} className="table-print">
              <Table aria-label="simple table">
                <TableHead className="tablehead">
                  <TableRow>
                    <TableCell align="center" className="table-row">
                      الخدمة المجانية
                    </TableCell>
                    <TableCell align="center" className="table-row">
                      العدد
                    </TableCell>
                    <TableCell align="center" className="table-row">
                      الملاحظات
                    </TableCell>
                    <TableCell></TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {freeServicesDate.map((row) => (
                    <TableRow key={row._id}>
                      <TableCell align="center"> {row.service}</TableCell>
                      <TableCell align="center"> {row.number}</TableCell>
                      <TableCell align="center"> {row.note}</TableCell>
                      <TableCell align="center">
                        <Button
                          variant="contained"
                          color="warning"
                          onClick={() =>
                            setFreeServices({
                              ...freeServices,
                              open: true,
                              update: true,
                            })
                          }
                        >
                          تعديل
                        </Button>
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          variant="contained"
                          color="error"
                          onClick={() => handleDelete(row._id)}
                        >
                          حذف
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </div>

          {/* الخدمات الاضافية */}
         <div className="pay shareoff">
    <Button
        variant="contained"
        className="onshare"
        id="btn"
        onClick={() => setServices({ ...services, open: true, update: false })}
        disabled={isReservationClosed} // ✅ تعطيل الزر
    >
        الخدمات الاضافية <AddIcon />
    </Button>
            <Button
              sx={{ margin: "0 5px" }}
              variant="contained"
              className="onshare"
              id="btn"
              onClick={() => handleservicePrint()}
            >
              طباعة ايصال <LocalPrintshopIcon style={{ margin: "0 5px" }} />
            </Button>
            <TableContainer component={Paper} className="table-print">
              <Table aria-label="simple table">
                <TableHead className="tablehead">
                  <TableRow>
                    <TableCell align="center" className="table-row">
                      الخدمة الاضافية
                    </TableCell>
                    <TableCell align="center" className="table-row">
                      النوع
                    </TableCell>
                    <TableCell align="center" className="table-row">
                      العدد
                    </TableCell>
                    <TableCell align="center" className="table-row">
                      المبلغ الكلي
                    </TableCell>
                    <TableCell></TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {servicesData.map((row) => (
                    <TableRow key={row._id}>
                      <TableCell align="center"> {row.service}</TableCell>
                      <TableCell align="center"> {row.package}</TableCell>
                      <TableCell align="center"> {row.number}</TableCell>
                      <TableCell align="center"> {row.price}</TableCell>
                      <TableCell align="center">
                        <Button
                          variant="contained"
                          color="warning"
                          onClick={() =>
                            setServices({
                              ...services,
                              open: true,
                              update: true,
                              data: row,
                            })
                          }
                        >
                          تعديل
                        </Button>
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          variant="contained"
                          color="error"
                          onClick={() => handleDelete(row._id)}
                        >
                          حذف
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </div>

          {/* المطالب (Request) */}
          <div className="pay shareoff">
    <Button
        variant="contained"
        className="onshare"
        id="btn"
        onClick={() => setRequest({ ...request, open: true, update: false })}
        disabled={isReservationClosed} // ✅ تعطيل الزر
    >
        اضافة مطلب <AddIcon />
    </Button>
            <TableContainer component={Paper} className="table-print">
              <Table aria-label="simple table">
                <TableHead className="tablehead">
                  <TableRow>
                    <TableCell align="center" className="table-row">
                      الخدمة الاضافية
                    </TableCell>
                    <TableCell align="center" className="table-row">
                      البيان
                    </TableCell>
                    <TableCell align="center" className="table-row">
                      السعر
                    </TableCell>
                    <TableCell align="center" className="table-row">
                      الملاحظات
                    </TableCell>
                    <TableCell></TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {requestDate.map((row) => (
                    <TableRow key={row._id}>
                      <TableCell align="center"> {row.service}</TableCell>
                      <TableCell align="center"> {row.statement}</TableCell>
                      <TableCell align="center"> {row.price}</TableCell>
                      <TableCell align="center"> {row.note}</TableCell>
                      <TableCell align="center">
                        <Button
                          variant="contained"
                          color="warning"
                          onClick={() =>
                            setRequest({
                              ...request,
                              open: true,
                              update: true,
                              data: row,
                            })
                          }
                        >
                          تعديل
                        </Button>
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          variant="contained"
                          color="error"
                          onClick={() => handleDelete(row._id)}
                        >
                          حذف
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </div>
        </>
      )}

      {/* النوافذ المنبثقة (Modals) */}
      <AddPayment
        handleClose={handleClose}
        open={payment.open}
        update={payment.update}
        data={payment.data}
        remainingAmount={remainingAmount}
      />
      <ReservationFreeReservation
        fetchData={fetchServices}
        handleClose={handleClose}
        open={freeServices.open}
        update={freeServices.update}
        tempData={freeServices.data}
      />
      <ReservationServices
        fetchData={fetchServices}
        handleClose={handleClose}
        open={services.open}
        update={services.update}
        tempData={services.data}
      />
      <Request
        fetchData={fetchServices}
        handleClose={handleClose}
        open={request.open}
        update={request.update}
        tempData={request.data}
      />
      
    </>
  );
};

export default ReservationDetails;
