
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
import { useTranslation } from 'react-i18next';
import Paper from '@mui/material/Paper';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import { fetchBanckTransaction, fetchDraws, fetchOnlinePayments, fetchPaypal } from '../../redux/reducers/finance';
import ReactToPrint from 'react-to-print';
import ReportsPrint from '../../components/ReportsPrint';
import { format } from 'date-fns';
import { fetchAllReservation_payments } from '../../redux/reducers/reservation_payments';
import { fetchBankDetails } from '../../redux/reducers/bank';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 1000,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  height: 600,
  overflow: "scroll",
};

function IncomeReport({ handleClose, handleOpen, open, startDate, endDate }) {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch()

  let paypal = useSelector((state) => state.finance.value.paypal)
  paypal = paypal.map((ele) => ({ ...ele, type: "بايبال" }))

  let onlinePayment = useSelector((state) => state.finance.value.onlinePayment)
  onlinePayment = onlinePayment.map((ele) => ({ ...ele, type: "دفع اونلاين" }))

  let banktransaction = useSelector((state) => state.finance.value.banktransaction)
  banktransaction = banktransaction.map((ele) => ({ ...ele, type: "حوالة بنكية" }))

  const banks = useSelector((state) => state.bank.value.data)

  useEffect(() => {
    dispatch(fetchBanckTransaction())
    dispatch(fetchOnlinePayments())
    dispatch(fetchPaypal())
    dispatch(fetchDraws())
    dispatch(fetchAllReservation_payments())
    dispatch(fetchBankDetails())
  }, [])


  const AllPaymeyns = useSelector((state) => state.reservation_payments.value.all)
  const [payments, setPayments] = useState([])

  useEffect(() => {
    if (AllPaymeyns.length) {
      let temp = AllPaymeyns.map((ele) => {
        return {
          bank: ele?.bank?.name,
          donater: ele?.reservation?.client?.name,
          amount: ele.type == "تأمين" ? 0 : ele?.paid,
          reciver: "-",
          employee: "-",
          date: ele.date,
          type: ele.type,
          employee: ele?.employee?.name || "-"
        }
      })
      setPayments(temp)
    }
  }, [AllPaymeyns])
  let  draws = useSelector((state) => state.finance.value.draws)

  let filteredData = [...paypal, ...onlinePayment, ...banktransaction, ...payments]
  if (startDate) {
    filteredData = filteredData.filter((ele) => (new Date(startDate).getTime()) <= (new Date(ele.date).getTime()))
    draws = draws.filter((ele) => (new Date(startDate).getTime()) <= (new Date(ele.date).getTime()))
  }
  if (endDate) {
    filteredData = filteredData.filter((ele) => (new Date(endDate).getTime()) >= (new Date(ele.date).getTime()))
    draws = draws.filter((ele) => (new Date(endDate).getTime()) >= (new Date(ele.date).getTime()))
  }

  const [loading, setLoading] = useState(false)
  const componentRef = useRef();
  const tempRef = useRef();

  function handlePrint() {
    setLoading(true)
    setTimeout(() => {
      tempRef.current.click()
    }, 100)
  }

  function getTotal(type) {
    let arr = filteredData.filter((ele) => ele.type == type)
    return arr.reduce((prev, cur) => prev += cur.amount, 0)
  }

  function getTotalBank(bank) {
    let arr = filteredData.filter((ele) => (ele.type == "حوالة بنكية" || ele.type == "تحويل بنكي") && ele.bank == bank)
    return arr.reduce((prev, cur) => prev += cur.amount, 0)
  }

  function getTotalDraws(){
    return draws?.reduce((prev,cur)=>prev+=cur.amount ,0)
  }
  let data = [
    { title: "بايبال", sum: getTotal("بايبال") },
    { title: "دفع اونلاين", sum: getTotal("دفع اونلاين") },
    { title: "نقدي", sum: getTotal("نقدي") - getTotalDraws() },
  ]

  function getTotalIncome() {
    let total = getTotal("بايبال") + getTotal("دفع اونلاين") + getTotal("نقدي")
    banks.map((row, ind) => (
      total += getTotalBank(row.name)
    ))
    return total
  }

  return (
    <div>
      <ReactToPrint
        trigger={() => <button ref={tempRef} style={{ display: "none" }}>Print this out!</button>}
        content={() => componentRef.current}
        onAfterPrint={() => setLoading(false)}
        onBeforePrint={() => setLoading(true)}
        // pageStyle={{width:"120%"}}
        copyStyles={true}
      />

      <Modal style={{ direction: i18n.language == 'en' ? 'ltr' : "rtl" }} open={open} onClose={handleClose} aria-labelledby="modal-modal-title" aria-describedby="modal-modal-description" >
        <Box sx={style} className='model'>
          <div style={{ display: 'flex', justifyContent: "space-between" }}>
            <Typography id="modal-modal-title" variant="h6" component="h2" sx={{ marginBottom: 5 }}>
              {t("reports.income")}
            </Typography>
            <HighlightOffIcon style={{ cursor: "pointer", color: "gray" }} onClick={() => handleClose()} />
          </div>
          {!loading && <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label="simple table">
              <TableHead className='tablehead'>
                <TableRow >
                  <TableCell align='center' className='table-row' width={10}></TableCell>
                  {/* <TableCell align='center' className='table-row'>{t("reports.donator")}</TableCell> */}
                  {/* <TableCell align='center' className='table-row'>{t("reports.receiver")}</TableCell> */}
                  {/* <TableCell align='center' className='table-row'>{t("reports.employee")}</TableCell> */}
                  <TableCell align='center' className='table-row'>{t("reports.typeIncome")}</TableCell>
                  <TableCell align='center' className='table-row'>{t("reports.revenue")}</TableCell>
                  {/* <TableCell align='center' className='table-row'>{t("reports.date")}</TableCell> */}
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((row, ind) => (
                  <TableRow key={ind} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell component="th" align="center" scope="row"> {ind + 1}</TableCell>
                    {/* <TableCell component="th" align="center" scope="row"> {row.donater}</TableCell> */}
                    {/* <TableCell component="th" align="center" scope="row"> {row.reciver}</TableCell> */}
                    {/* <TableCell component="th" align="center" scope="row"> {row.employee}</TableCell> */}
                    {/* <TableCell component="th" align="center" scope="row"> {row.type == "حوالة بنكية" || row.type == "تحويل بنكي" ? `تحويل بنكي - (${row.bank})` : row.type}</TableCell> */}
                    <TableCell component="th" align="center" scope="row"> {row.title}</TableCell>
                    <TableCell component="th" align="center" scope="row"> {row.sum}</TableCell>
                    {/* <TableCell component="th" align="center" scope="row"> {row.date}</TableCell> */}
                  </TableRow>
                ))}
                {banks.map((row, ind) => (
                  <TableRow key={ind} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell component="th" align="center" scope="row"> {ind + 1 + data.length}</TableCell>
                    <TableCell component="th" align="center" scope="row"> {`تحويل بنكي ( ${row.name})`}</TableCell>
                    <TableCell component="th" align="center" scope="row"> {getTotalBank(row.name)}</TableCell>
                  </TableRow>
                ))}
                <TableRow sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  {/* <TableCell component="th" align="center" scope="row" > </TableCell> */}
                  {/* <TableCell component="th" align="center" scope="row"> </TableCell> */}
                  {/* <TableCell component="th" align="center" scope="row"> </TableCell> */}
                  <TableCell component="th" align="center" scope="row"> </TableCell>
                  <TableCell component="th" align="center" scope="row"> الاجمالي</TableCell>
                  <TableCell component="th" align="center" scope="row"> {filteredData?.reduce((prev, cur) => prev += cur.amount, 0)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>}

          {loading && <div ref={componentRef}>
            <ReportsPrint start={startDate} end={endDate}>
              <TableContainer component={Paper}>
                <Table sx={{ minWidth: 650 }} aria-label="simple table">
                  <TableHead className='tablehead'>
                    <TableRow >
                      <TableCell align='center' className='table-row' width={10}></TableCell>
                      {/* <TableCell align='center' className='table-row'>{t("reports.donator")}</TableCell> */}
                      {/* <TableCell align='center' className='table-row'>{t("reports.receiver")}</TableCell> */}
                      {/* <TableCell align='center' className='table-row'>{t("reports.employee")}</TableCell> */}
                      <TableCell align='center' className='table-row'>{t("reports.typeIncome")}</TableCell>
                      <TableCell align='center' className='table-row'>{t("reports.revenue")}</TableCell>
                      {/* <TableCell align='center' className='table-row'>{t("reports.date")}</TableCell> */}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.map((row, ind) => (
                      <TableRow key={ind} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        <TableCell component="th" align="center" scope="row"> {ind + 1}</TableCell>
                        {/* <TableCell component="th" align="center" scope="row"> {row.donater}</TableCell> */}
                        {/* <TableCell component="th" align="center" scope="row"> {row.reciver}</TableCell> */}
                        {/* <TableCell component="th" align="center" scope="row"> {row.employee}</TableCell> */}
                        {/* <TableCell component="th" align="center" scope="row"> {row.type == "حوالة بنكية" || row.type == "تحويل بنكي" ? `تحويل بنكي - (${row.bank})` : row.type}</TableCell> */}
                        <TableCell component="th" align="center" scope="row"> {row.title}</TableCell>
                        <TableCell component="th" align="center" scope="row"> {row.sum}</TableCell>
                        {/* <TableCell component="th" align="center" scope="row"> {row.date}</TableCell> */}
                      </TableRow>
                    ))}
                    {banks.map((row, ind) => (
                      <TableRow key={ind} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        <TableCell component="th" align="center" scope="row"> {ind + 1 + data.length}</TableCell>
                        <TableCell component="th" align="center" scope="row"> {`تحويل بنكي ( ${row.name})`}</TableCell>
                        <TableCell component="th" align="center" scope="row"> {getTotalBank(row.name)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      {/* <TableCell component="th" align="center" scope="row" > </TableCell> */}
                      {/* <TableCell component="th" align="center" scope="row"> </TableCell> */}
                      {/* <TableCell component="th" align="center" scope="row"> </TableCell> */}
                      <TableCell component="th" align="center" scope="row"> </TableCell>
                      <TableCell component="th" align="center" scope="row"> الاجمالي</TableCell>
                      <TableCell component="th" align="center" scope="row"> {getTotalIncome()}</TableCell>
                    </TableRow>
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
export default IncomeReport;
