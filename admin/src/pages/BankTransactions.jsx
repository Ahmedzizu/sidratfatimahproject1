import React, { useEffect, useState } from 'react'
import { TextField, Button } from '@mui/material';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import "../scss/addChalets.scss"
import { useDispatch, useSelector } from 'react-redux';
import Api from './../config/config';
import Permissions from '../modals/Permissions';
import { useTranslation } from 'react-i18next';
import AddBankTransactionModal from '../modals/AddBankTransactionModal';
import { fetchBanckTransaction } from './../redux/reducers/finance';
import { fetchAllReservation_payments, fetchReservation_payments } from '../redux/reducers/reservation_payments';
import { format } from 'date-fns';
import ReactToPrint from 'react-to-print';
import { useRef } from 'react';
import PaymentReset from '../components/PaymentReset';
const BankTransactions = () => {

  const user = useSelector((state) => state.employee.value.user)
  const { t, i18n } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const [id, setId] = useState()
  const [temp, setTemp] = useState()
  const [update, setUpdate] = useState(false)
  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false)
    setUpdate(false)
    setTemp({})
  };
  const [search, setSearch] = useState('')
  const dispatch = useDispatch()
  const data = useSelector((state) => state.finance.value.banktransaction)
  useEffect(() => { dispatch(fetchBanckTransaction()) }, [])

  function handleDelete(id) {
    Api.delete(`/admin/banktransaction/delete/${id}`)
      .then((res) => {
        dispatch(fetchBanckTransaction())
        dispatch(fetchAllReservation_payments())
      })
      .catch((err) => console.log(err.response.data))
  }

  const handeleDeletePayment = async (paymentId) => {
    await Api.delete(`/reservation-payments/${paymentId}`)
      .then(() => dispatch(fetchAllReservation_payments()))
      .catch((err) => {
        console.log(err.message);
      })
  }

  function handleOpenEdit(data) {
    setTemp(data)
    setOpen(true)
    setUpdate(true)
  }

  const AllPaymeyns = useSelector((state) => state.reservation_payments.value.all)
  const [payments, setPayments] = useState([])

  useEffect(() => {
    dispatch(fetchAllReservation_payments())
  }, [])
  useEffect(() => {
    if (AllPaymeyns.length) {
      let temp = AllPaymeyns.filter((ele) => ele.type == "تحويل بنكي")
      temp = temp.map((ele) => {
        return {
          bank: ele?.bank?.name,
          donater: ele?.reservation?.client?.name,
          amount: ele.type == "تأمين" ? ele?.insurance : ele?.paid,
          reciver: "-",
          employee: "-",
          date: ele.date || format(new Date(), "yyyy-MM-dd"),
          employee: ele?.employee?.name,
          reservation: true,
          _id: ele._id
        }
      })
      setPayments(temp)
    }
  }, [AllPaymeyns])

  let filteredData = [...data, ...payments]
  if (search) filteredData = filteredData.filter((ele) => ele.bank.includes(search) || ele.donater.includes(search) || ele.reciver.includes(search))


  const [paymentData, setPaymentData] = useState({ type: "", paid: "", insurance: "", bank: { name: "" } })
  const [paymentLoading, setPaymentLoading] = useState(false)
  const paymentRef = useRef();
  const paymentBtnRef = useRef();

  function handlePaymentPrint(data) {
    setPaymentData({...data,type:"تحويل بنكي"})
    setPaymentLoading(true)
    setTimeout(() => {
      paymentBtnRef.current.click()
    }, 100)
  }

  return (
    <>
      <div id="reservation-reset" style={{ display: paymentLoading ? "block" : "none" }} ref={paymentRef}>
        <PaymentReset   paymentData={paymentData} />
      </div>
      <ReactToPrint
        trigger={() => <button ref={paymentBtnRef} style={{ display: "none" }}>Print this out!</button>}
        content={() => paymentRef.current}
        onAfterPrint={() => setPaymentLoading(false)}
        onBeforePrint={() => setPaymentLoading(true)}
        // pageStyle={{width:"120%"}}
        copyStyles={true}
      />
     {!paymentLoading && <div style={{ direction: i18n.language == 'en' ? "ltr" : "rtl" }}>
        {/* {(user.admin || (user.permissions && user.permissions.bankTransfer)) ? */}
          <div className="cont">
            <h2>{t("finance.bankTransaction")}</h2>
            <div className="search-box">
              <TextField type="text" variant="outlined" value={search} placeholder="بحث" onChange={(e) => setSearch(e.target.value)} sx={{ marginLeft: "20px", borderRadius: "50px" }} />
              <Button onClick={handleOpen} variant='contained' className='btn'>{t("finance.addBankTransaction")}</Button>
            </div>
            <TableContainer component={Paper} className='table-print'>
              <Table aria-label="simple table">
                <TableHead className='tablehead'>
                  <TableRow >
                    <TableCell align='center' className='table-row'>{t("finance.bank")}</TableCell>
                    <TableCell align='center' className='table-row'>{t("finance.donator")}</TableCell>
                    <TableCell align='center' className='table-row'>{t("finance.receiver")}</TableCell>
                    <TableCell align='center' className='table-row'>{t("finance.amount")}</TableCell>
                    <TableCell align='center' className='table-row'>{t("insurance.employee")}</TableCell>
                    <TableCell align='center' className='table-row'>{t("date")}</TableCell>
                    <TableCell align='center' className='table-row'></TableCell>
                    <TableCell align='center' className='table-row'></TableCell>
                    <TableCell align='center' className='table-row'></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredData.map((row, ind) => (
                    <TableRow key={ind} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell align="center" scope="row"> {row.bank}</TableCell>
                      <TableCell align="center" scope="row"> {row.reciver}</TableCell>
                      <TableCell align="center">{row.donater}</TableCell>
                      <TableCell align="center">{row.amount}</TableCell>
                      <TableCell align="center">{row.employee || "-"}</TableCell>
                      <TableCell align="center">{row.date}</TableCell>
                      <TableCell align="center" className='row-hidden-print'><Button variant='contained' size='small' onClick={() => handlePaymentPrint(row)}>{t("finance.print")}</Button></TableCell>
                      <TableCell align="center" className='row-hidden-print'><Button variant='contained' size='small' color='warning' onClick={() => handleOpenEdit(row)}>{t("finance.edit")}</Button></TableCell>
                      <TableCell align="center" className='row-hidden-print'><Button variant='contained' size='small' color='error' onClick={() => row.reservation ? handeleDeletePayment(row._id) : handleDelete(row._id)}>{t("finance.delete")}</Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <AddBankTransactionModal handleClose={handleClose} update={update} data={temp} handleOpen={handleOpen} open={open} />
          </div> 
          {/* : <h3 style={{ textAlign: "center" }}>Sorry, this page not available</h3>} */}
      </div>}
    </>
  )
}

export default BankTransactions;