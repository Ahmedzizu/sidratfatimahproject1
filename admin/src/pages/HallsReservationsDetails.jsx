import React, { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux';
import { fetchReservations, shareOff, shareOn } from '../redux/reducers/reservation';
import logo from '../assets/logo2.png';
import "../scss/reservationsDetails.scss";
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { useTranslation } from 'react-i18next';
import { Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { Divider } from '@mui/material';
import AddPayment from '../modals/AddPayment';
import ReservationServices from '../modals/ReservationServices';
import ReservationFreeReservation from '../modals/ReservationFreeReservation';
import Request from '../modals/Request';
import Api from '../config/config';
import LocalPrintshopIcon from '@mui/icons-material/LocalPrintshop';
import Reset from '../components/Reset';
import ReactToPrint from 'react-to-print';
import { fetchReservation_payments } from '../redux/reducers/reservation_payments';
import PaymentReset from '../components/PaymentReset';
import ServicePrint from '../components/ServicePrint';

const UnConfiremdReservationDetails = () => {

  let share = useSelector((state) => state.reservation.value.share)
  const dispatch = useDispatch()
  const { id } = useParams()
  const { t, i18n } = useTranslation();
  const [payment, setPayment] = useState({ open: false, update: false, data: { type: "نقدي" } })
  const [freeServices, setFreeServices] = useState({ open: false, update: false, data: {} })
  const [services, setServices] = useState({ open: false, update: false, data: {} })
  const [request, setRequest] = useState({ open: false, update: false, data: {} })
  const [servicesData, setServicesDate] = useState([])
  const [freeServicesDate, setFreeServicesDate] = useState([])
  const [requestDate, setRequestDate] = useState([])
  const data = useSelector((state) => state.reservation.value.unConfirmed)
  const reservation = data.find((ele) => ele._id == id)
  const reservationPayments = useSelector((state) => state.reservation_payments.value.data)
  const [loading, setLoading] = useState(false)

  let totalInsurance = parseFloat(reservationPayments?.reduce((prev, cur) => { return prev += parseFloat(cur?.insurance) }, 0))
  let totalPaid = parseFloat(reservationPayments?.reduce((prev, cur) => { return prev += parseFloat(cur?.paid) }, 0))
  let totalServices = parseFloat(servicesData?.reduce((prev, cur) => { return prev += parseFloat(cur?.price) }, 0)) + parseFloat(requestDate.reduce((prev, cur) => { return prev += parseFloat(cur?.price) }, 0))

  useEffect(() => {
    dispatch(fetchReservations())
    fetchServices()
    dispatch(fetchReservation_payments(id))
  }, [])

  const fetchServices = async () => {
    await Api.get(`/admin/reservation/service/${id}`)
      .then((res) => {
        let temp = res.data
        let tempServices, tempFree, tempRequest = []
        tempServices = temp.filter((ele) => ele.type == 'service')
        tempFree = temp.filter((ele) => ele.type == 'free')
        tempRequest = temp.filter((ele) => ele.type == 'request')
        setServicesDate(tempServices)
        setFreeServicesDate(tempFree)
        setRequestDate(tempRequest)
      })
      .catch((err) => console.log(err.message))
  }
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
// ... داخل الكومبوننت UnConfiremdReservationDetails

// ✅ دالة جديدة لتنسيق التاريخ والوقت معًا
// ... داخل الكومبوننت UnConfiremdReservationDetails

// ✅ دالة جديدة لتنسيق التاريخ والوقت معًا (بشكل ميلادي)
const formatDateTime = (dateString) => {
  if (!dateString) return "غير محدد";
  
  const options = {
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: 'numeric', 
    minute: '2-digit', 
    hour12: true,
    calendar: 'gregory' // ✅ الأهم: تحديد التقويم الميلادي صراحةً
  };

  // 'ar-EG' (مصر) هو خيار ممتاز وموثوق للتواريخ الميلادية بالعربية
  return new Date(dateString).toLocaleString('ar-EG', options);
};
  function handleClose() {
    setPayment({ open: false, update: false, data: { type: "نقدي" } })
    setFreeServices({ open: false, update: false })
    setServices({ open: false, update: false })
    setRequest({ open: false, update: false })
  }
  const handleDelete = async (id) => {
    await Api.delete(`/admin/reservation/service/${id}`)
      .then(() => fetchServices())
  }
  const handeleDeletePayment = async (paymentId) => {
    await Api.delete(`/reservation-payments/${paymentId}`)
      .then(() => dispatch(fetchReservation_payments(id)))
      .catch((err) => {
        console.log(err.message);
      })
  }

  const componentRef = useRef();
  const tempRef = useRef();
  const [paymentData, setPaymentData] = useState({ type: "", paid: "", insurance: "", bank: { name: "" } })

  function handlePrint() {
    setLoading(true)
    setTimeout(() => {
      tempRef.current.click()
    }, 100)
  }

  const [paymentLoading, setPaymentLoading] = useState(false)
  const paymentRef = useRef();
  const paymentBtnRef = useRef();
  const [serviceLoading, setServiceLoading] = useState(false)
  const serviceRef = useRef();
  const serviceBtnRef = useRef();
  function handlePaymentPrint(data) {
    setPaymentData(data)
    setPaymentLoading(true)
    setTimeout(() => {
      paymentBtnRef.current.click()
    }, 1000)
  }
  function handleservicePrint(data) {
    setServiceLoading(data)
    setServiceLoading(true)
    setTimeout(() => {
      serviceBtnRef.current.click()
    }, 1000)



  }

  return (
    <>
      <div id="reservation-reset" style={{ display: loading ? "block" : "none" }} ref={componentRef}>
        <Reset data={reservation} totalInsurance={totalInsurance || "0"} totalPaid={totalPaid || "0"} totalServices={totalServices || "0"} />
      </div>

      <div id="reservation-reset" style={{ display: paymentLoading ? "block" : "none" }} ref={paymentRef}>
        <PaymentReset data={reservation} totalInsurance={totalInsurance || "0"} totalPaid={totalPaid || "0"} totalServices={totalServices || "0"} paymentData={paymentData} />
      </div>

      <div id="reservation-reset" style={{ display: serviceLoading ? "block" : "none" }} ref={serviceRef}>
        <ServicePrint data={reservation} services={servicesData} totalPaid={totalPaid || "0"} totalServices={totalServices || "0"} paymentData={paymentData} />
      </div>


      <ReactToPrint
        trigger={() => <button ref={tempRef} style={{ display: "none" }}>Print this out!</button>}
        content={() => componentRef.current}
        onAfterPrint={() => setLoading(false)}
        onBeforePrint={() => setLoading(true)}
        // pageStyle={{margin:"auto"}}
        copyStyles={true}
      />

      <ReactToPrint
        trigger={() => <button ref={paymentBtnRef} style={{ display: "none" }}>Print this out!</button>}
        content={() => paymentRef.current}
        onAfterPrint={() => setPaymentLoading(false)}
        onBeforePrint={() => setPaymentLoading(true)}
        // pageStyle={{width:"120%"}}
        copyStyles={true}
      />

      <ReactToPrint
        trigger={() => <button ref={serviceBtnRef} style={{ display: "none" }}>Print this out!</button>}
        content={() => serviceRef.current}
        onAfterPrint={() => setServiceLoading(false)}
        onBeforePrint={() => setServiceLoading(true)}
        // pageStyle={{width:"120%"}}
        copyStyles={true}
      />



      {!loading && !paymentLoading && !serviceLoading && <>
        <header>

          <div className="share-box">
            <LocalPrintshopIcon id="share" className='onshare' onClick={handlePrint} />
            {/* <DownloadIcon id="download" onClick={handleDownload}/> */}
          </div>
          <div className="details shareon">
            <div className='text'>
              <p>تفاصيل الحجز بجميع الخدمات</p>
              <p> اسم العميل : {reservation?.client?.name} </p>
              <p> رقم العميل : {reservation?.client?.phone} </p>
            </div>
            <img src={logo} alt='logo' height="60px" width="60px" />
          </div>
        </header>
        <TableContainer component={Paper} className='table-print'>
          <Table aria-label="simple table">
            <TableRow style={{ border: 0 }} className='shareon hide' sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
              <TableCell align="center" colSpan={2} style={{ border: 0 }} className='table-data'>
                <img src={logo} alt='logo' height="60px" width="60px" />
                <h2>سدرة فاطمة</h2>
                <p>تفاصيل الحجز بجميع الحجوزات</p>
              </TableCell>
            </TableRow>
            <TableBody style={{ border: "1px solid" }}>
 {/* <a
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
                </a> */}

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
        <div className='pay shareoff'>

          <Button variant='contained' className='onshare' id="btn" onClick={() => setPayment({ ...payment, open: true, update: false })}>دفعات <AddIcon /></Button>
          <TableContainer component={Paper} className='table-print'>
            <Table aria-label="simple table">
              <TableHead className='tablehead'>
                <TableRow >
                  <TableCell align='center' className='table-row'>نوع الدفع</TableCell>
                  <TableCell align='center' className='table-row'>المبلغ</TableCell>
                  <TableCell align='center' className='table-row'>مبلغ التأمين</TableCell>
                  <TableCell align='center' className='table-row'>البنك</TableCell>
                  <TableCell align='center' className='table-row'>تاريخ ووقت الدفعة</TableCell> 

                  <TableCell align="center"></TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>

                </TableRow>
              </TableHead>
              <TableBody>
                {reservationPayments?.map((ele, index) => (
                  <TableRow sx={{ '&:last-child td, &:last-child th': { border: 0 } }} key={index}>
                    <TableCell align="center"> {ele?.type}</TableCell>
                    <TableCell align="center"> {ele?.paid}</TableCell>
                    <TableCell align="center"> {ele?.insurance}</TableCell>
                    <TableCell align="center"> {ele?.bank?.name || "-"}</TableCell>
                    <TableCell align="center"> {formatDateTime(ele?.paymentDate)}</TableCell> 
                    <TableCell align="center"><Button variant='contained' color='warning' onClick={() => setPayment({ ...payment, open: true, update: true, data: ele })}>تعديل</Button></TableCell>
                    <TableCell align="center"><Button variant='contained' color='error' onClick={(() => handeleDeletePayment(ele._id))}>حذف</Button></TableCell>
                    <TableCell align="center"><Button sx={{ margin: "0 5px" }} variant='contained' onClick={() => handlePaymentPrint(ele)}>طباعة </Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
        <div className='pay shareoff'>
          <Button variant='contained' className='onshare' id="btn" onClick={() => setFreeServices({ ...freeServices, open: true, update: false })}>الخدمات المجانية <AddIcon /></Button>
          <TableContainer component={Paper} className='table-print'>
            <Table aria-label="simple table">
              <TableHead className='tablehead'>
                <TableRow >
                  <TableCell align='center' className='table-row'>الخدمة المجانية</TableCell>
                  <TableCell align='center' className='table-row'>العدد</TableCell>
                  <TableCell align='center' className='table-row'>الملاحظات</TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {freeServicesDate.map((row) => (
                  <TableRow sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell align="center"> {row.service}</TableCell>
                    <TableCell align="center"> {row.number}</TableCell>
                    <TableCell align="center"> {row.note}</TableCell>
                    <TableCell align="center"><Button variant='contained' color='warning' onClick={() => setFreeServices({ ...freeServices, open: true, update: true })}>تعديل</Button></TableCell>
                    <TableCell align="center"><Button variant='contained' color='error' onClick={() => handleDelete(row._id)}>حذف</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
        <div className='pay shareoff'>
          <Button variant='contained' className='onshare' id="btn" onClick={() => setServices({ ...services, open: true, update: false })}>الخدمات الاضافية <AddIcon /></Button>
          <Button sx={{ margin: "0 5px" }} variant='contained' className='onshare' id="btn" onClick={() => handleservicePrint()}>طباعة ايصال <LocalPrintshopIcon style={{ margin: "0 5px" }} /></Button>
          <TableContainer component={Paper} className='table-print'>
            <Table aria-label="simple table">
              <TableHead className='tablehead'>
                <TableRow >
                  <TableCell align='center' className='table-row'>الخدمة الاضافية</TableCell>
                  <TableCell align='center' className='table-row'>النوع</TableCell>
                  <TableCell align='center' className='table-row'>العدد</TableCell>
                  <TableCell align='center' className='table-row'>المبلغ الكلي</TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {servicesData.map((row) => (
                  <TableRow sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell align="center"> {row.service}</TableCell>
                    <TableCell align="center"> {row.package}</TableCell>
                    <TableCell align="center"> {row.number}</TableCell>
                    <TableCell align="center"> {row.price}</TableCell>
                    <TableCell align="center"><Button variant='contained' color='warning' onClick={() => setServices({ ...services, open: true, update: true, data: row })}>تعديل</Button></TableCell>
                    <TableCell align="center"><Button variant='contained' color='error' onClick={() => handleDelete(row._id)}>حذف</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
        <div className='pay shareoff'>
          <Button variant='contained' className='onshare' id="btn" onClick={() => setRequest({ ...request, open: true, update: false })}> اضافة مطلب <AddIcon /></Button>
          <TableContainer component={Paper} className='table-print'>
            <Table aria-label="simple table">
              <TableHead className='tablehead'>
                <TableRow >
                  <TableCell align='center' className='table-row'>الخدمة الاضافية</TableCell>
                  <TableCell align='center' className='table-row'>البيان</TableCell>
                  <TableCell align='center' className='table-row'>السعر</TableCell>
                  <TableCell align='center' className='table-row'>الملاحظات</TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {requestDate.map((row) => (
                  <TableRow sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell align="center"> {row.service}</TableCell>
                    <TableCell align="center"> {row.statement}</TableCell>
                    <TableCell align="center"> {row.price}</TableCell>
                    <TableCell align="center"> {row.note}</TableCell>
                    <TableCell align="center"><Button variant='contained' color='warning' onClick={() => setRequest({ ...request, open: true, update: true, data: row })}>تعديل</Button></TableCell>
                    <TableCell align="center"><Button variant='contained' color='error' onClick={() => handleDelete(row._id)}>حذف</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      </>}
      <AddPayment handleClose={handleClose} open={payment.open} update={payment.update} data={payment.data} />
      <ReservationFreeReservation fetchData={fetchServices} handleClose={handleClose} open={freeServices.open} update={freeServices.update} tempData={freeServices.data} />
      <ReservationServices fetchData={fetchServices} handleClose={handleClose} open={services.open} update={services.update} tempData={services.data} />
      <Request fetchData={fetchServices} handleClose={handleClose} open={request.open} update={request.update} tempData={request.data} />
    </>
  )
}

export default UnConfiremdReservationDetails


