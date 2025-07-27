import React, { useEffect, useState, useRef } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import "../..//scss/addChalets.scss"
import { useDispatch, useSelector } from 'react-redux';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import { fetchBanckTransaction, fetchExpenses, fetchOnlinePayments, fetchPaypal } from '../../redux/reducers/finance';
import { useTranslation } from 'react-i18next';
import { fetchReservations } from '../../redux/reducers/reservation';
import ReactToPrint from 'react-to-print';
import ReportsPrint from '../../components/ReportsPrint';
import reservation_payments, { fetchAllReservation_payments } from '../../redux/reducers/reservation_payments';

const style = {
  position: 'absolute',
  top: '0',
  left: '50%',
  transform: 'translate(-50%, 0)',
  width: 1000,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  height: 600,
  overflow: "scroll",
};

function GeneralReport({ handleClose, open, startDate, endDate }) {

  const { t, i18n } = useTranslation();
  const dispatch = useDispatch()
  let allResravationPayments = useSelector((state) => state.reservation_payments.value.all)
  let paypal = useSelector((state) => state.finance.value.paypal)
  let onlinePayment = useSelector((state) => state.finance.value.onlinePayment)
  let banktransaction = useSelector((state) => state.finance.value.banktransaction)
  let expenses = useSelector((state) => state.finance.value.expenses)
  let reservations = useSelector((state) => state.reservation.value.confirmed)
  let reservationServices = useSelector((state) => state.reservation.value.reservationServices)
  let draws = useSelector((state) => state.finance.value.draws)

  useEffect(() => {
    dispatch(fetchBanckTransaction())
    dispatch(fetchOnlinePayments())
    dispatch(fetchPaypal())
    dispatch(fetchAllReservation_payments())
    dispatch(fetchExpenses())
  }, [])
  if (startDate) {
    paypal = paypal.filter((ele) => (new Date(startDate).getTime()) <= (new Date(ele.date).getTime()))
    onlinePayment = onlinePayment.filter((ele) => (new Date(startDate).getTime()) <= (new Date(ele.date).getTime()))
    banktransaction = banktransaction.filter((ele) => (new Date(startDate).getTime()) <= (new Date(ele.date).getTime()))
    expenses = expenses.filter((ele) => (new Date(startDate).getTime()) <= (new Date(ele.date).getTime()))
    reservations = reservations.filter((ele) => (new Date(startDate).getTime()) <= (new Date(ele.date).getTime()))
    allResravationPayments = allResravationPayments.filter((ele) => (new Date(startDate).getTime()) <= (new Date(ele?.reservation?.period?.startDate).getTime()))
    draws = draws.filter((ele) => (new Date(startDate).getTime()) <= (new Date(ele?.date).getTime()))
    reservationServices = reservationServices.filter((ele) => (new Date(startDate).getTime()) <= (new Date(ele?.date || new Date().getTime()).getTime()))
  }
  if (endDate) {
    paypal = paypal.filter((ele) => (new Date(endDate).getTime()) >= (new Date(ele.date).getTime()))
    draws = draws.filter((ele) => (new Date(endDate).getTime()) >= (new Date(ele.date).getTime()))
    onlinePayment = onlinePayment.filter((ele) => (new Date(endDate).getTime()) >= (new Date(ele.date).getTime()))
    banktransaction = banktransaction.filter((ele) => (new Date(endDate).getTime()) >= (new Date(ele.date).getTime()))
    expenses = expenses.filter((ele) => (new Date(endDate).getTime()) >= (new Date(ele.date).getTime()))
    reservationServices = reservationServices.filter((ele) => (new Date(endDate).getTime()) >= (new Date(ele.date).getTime() || new Date().getTime()))
    reservations = reservations.filter((ele) => (new Date(endDate).getTime()) >= (new Date(ele.date).getTime()))
    allResravationPayments = allResravationPayments.filter((ele) => (new Date(endDate).getTime()) >= (new Date(ele?.reservation?.period?.endDate).getTime()))
  }
  console.log(allResravationPayments);
  function getSum(type) {
    switch (type) {
      case 'hall':
        let halls = allResravationPayments.filter((ele) => ele?.reservation?.type == 'hall')
        let hallsum = halls?.reduce((prev, cur) => prev += cur?.paid, 0)
        return hallsum
        break;
      case "resort":
        let resorts = allResravationPayments.filter((ele) => ele?.reservation?.type == 'resort')
        let resortsum = resorts?.reduce((prev, cur) => prev += cur?.paid, 0)
        return resortsum
        break;
      case "chalet":
        let chalet = allResravationPayments.filter((ele) => ele?.reservation?.type == 'chalet')
        let chaletum = chalet?.reduce((prev, cur) => prev += cur?.paid, 0)
        return chaletum
        break;
      default:
        let reservationSum = allResravationPayments?.reduce((prev, cur) => prev += cur?.paid, 0)
        return reservationSum
    }
  }

  function getTotal(arr) {
    return arr.reduce((prev, curr) => prev += curr?.amount, 0)
  }
  const paypalSum = paypal?.reduce((prev, curr) => prev += parseInt(curr.amount), 0)
  const onlinePaymentSum = onlinePayment?.reduce((prev, curr) => prev += parseInt(curr.amount), 0)
  const banktransactionSum = banktransaction?.reduce((prev, curr) => prev += parseInt(curr.amount), 0)
  const expensesSum = expenses?.reduce((prev, curr) => prev += parseInt(curr.amount), 0)

  const getTotalService = (id) => {
    let services = reservationServices?.reduce((prev, cur) => prev += cur.price, 0)
    return services
  }

  let data = [
    { sum: getSum("chalet"), label: "ايرادات الشاليهات" },
    { sum: getSum("resort"), label: "ايرادات المنتجعات" },
    { sum: getSum("hall"), label: "ايرادات القاعات" },
    { sum: getTotalService(), label: " الخدمات " },
    { sum: getSum("all") + getTotalService(), label: " ايرادات الحجوزات مجمعة" },
    // { sum: getTotal(draws), label: " السحوبات " },
    { sum: getTotal(banktransaction), label: " الحوالات البنكية " },
    { sum: onlinePaymentSum, label: "الدفع اونلاين" },
    { sum: paypalSum, label: "باي بال" },
    { sum: expensesSum, label: "المصروفات" },
    { sum: getSum("all") + getTotalService() + paypalSum + onlinePaymentSum + getTotal(banktransaction) - expensesSum, label: "اجمالي الايرادات" },
  ]

  const [loading, setLoading] = useState(false)
  const componentRef = useRef();
  const tempRef = useRef();

  function handlePrint() {
    setLoading(true)
    setTimeout(() => {
      tempRef.current.click()
    }, 100)
  }

  return (
    <div >

      <ReactToPrint
        trigger={() => <button ref={tempRef} style={{ display: "none" }}>Print this out!</button>}
        content={() => componentRef.current}
        onAfterPrint={() => setLoading(false)}
        onBeforePrint={() => setLoading(true)}
        // pageStyle={{width:"120%"}}
        copyStyles={true}
      />

      <Modal open={open} onClose={handleClose} style={{ direction: i18n.language == 'en' ? 'ltr' : "rtl", overflow: "scroll" }} aria-labelledby="modal-modal-title" aria-describedby="modal-modal-description" >
        <Box sx={style} className='model'>
          <div style={{ display: 'flex', justifyContent: "space-between" }}>
            <Typography id="modal-modal-title" variant="h6" component="h2" sx={{ marginBottom: 5 }}>
              {t("reports.general")}
            </Typography>
            <HighlightOffIcon style={{ cursor: "pointer", color: "gray" }} onClick={() => handleClose()} />
          </div>
          {!loading && <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label="simple table">
              <TableHead className='tablehead'>
                <TableRow >
                  <TableCell align='center' className='table-row' width={10}></TableCell>
                  <TableCell align='center' className='table-row'>{t("reports.entity")}</TableCell>
                  <TableCell align='center' className='table-row'>{t("reports.amount")}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((row, ind) => (
                  <TableRow key={ind} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell component="th" align="center" scope="row"> {ind + 1}</TableCell>
                    <TableCell component="th" align="center" scope="row"> {row.label}</TableCell>
                    <TableCell component="th" align="center" scope="row"> {row.sum || "0"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>}


          {loading && <div ref={componentRef}>
          <ReportsPrint start={startDate} end={endDate}>
              <TableContainer component={Paper}>
                <Table sx={{ minWidth: 650, marginTop: "24px" }} aria-label="simple table">
                  <TableHead className='tablehead'>
                    <TableRow >
                      <TableCell align='center' className='table-row' width={10}></TableCell>
                      <TableCell align='center' className='table-row'>{t("reports.entity")}</TableCell>
                      <TableCell align='center' className='table-row'>{t("reports.amount")}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.map((row, ind) => (
                      <TableRow key={ind} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        <TableCell component="th" align="center" scope="row"> {ind + 1}</TableCell>
                        <TableCell component="th" align="center" scope="row"> {row.label}</TableCell>
                        <TableCell component="th" align="center" scope="row"> {row.sum || "0"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </ReportsPrint>
          </div>}

          <Button variant='contained' color='primary' id='printBtn' style={{ margin: '20px auto 0', display: "block" }} onClick={() => handlePrint()}>{t("reports.print")}</Button>
        </Box>
      </Modal>
    </div>
  );
}
export default GeneralReport;

