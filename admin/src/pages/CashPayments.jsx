import React, { useEffect, useRef, useState } from 'react'
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
import AddDrawsModel from '../modals/AddDrawsModel';
import { fetchDraws } from '../redux/reducers/finance';
import { useTranslation } from 'react-i18next';
import { fetchAllReservation_payments, fetchReservation_payments } from '../redux/reducers/reservation_payments';
import PaymentReset from '../components/PaymentReset';
import ReactToPrint from 'react-to-print';
import AddPayment from '../modals/AddPayment';

const CashPayments = () => {
    const { t, i18n } = useTranslation();
    const [open, setOpen] = React.useState(false);
    const [id, setId] = useState()
    const [temp, setTemp] = useState()
    const handleOpen = () => setOpen(true);
    const [update, setUpdate] = useState(false)
    const user = useSelector((state) => state.employee.value.user)
    const handleClose = () => {
        setOpen(false)
        setTemp({})
        setPayment({ open: false, update: false, data: { type: "نقدي" } })
        setUpdate(false)
    };
    const [search, setSearch] = useState('')
    const dispatch = useDispatch()

    const [data, setData] = useState([])
    const payments = useSelector((state) => state.reservation_payments.value.all)

    useEffect(() => {
        dispatch(fetchAllReservation_payments())
    }, [])

    useEffect(() => {
        if (payments.length) {
            let tempArr = payments.filter((ele) => ele.type == "نقدي")
            setData(tempArr)
        }
    }, [payments])

    //   function handleDelete(id){
    //     Api.delete(`/admin/draws/delete/${id}`)
    //     .then((res)=>dispatch(fetchDraws()))
    //     .catch((err)=>console.log(err.response.data))
    //   }
    //   function handleOpenEdit(data){
    //     setTemp(data)
    //     setOpen(true)
    //     setUpdate(true)
    //   }
    let filteredData = data
    if (search) filteredData = filteredData.filter((ele) => ele.date.includes(search) || ele.note.includes(search) || ele.employee.includes(search))

    const handeleDeletePayment = async (paymentId) => {
        await Api.delete(`/reservation-payments/${paymentId}`)
            .then(() => dispatch(fetchAllReservation_payments()))
            .catch((err) => {
                console.log(err.message);
            })
    }


    const [paymentData, setPaymentData] = useState({ type: "", paid: "", insurance: "", bank: { name: "" } })
    const [paymentLoading, setPaymentLoading] = useState(false)
    const paymentRef = useRef();
    const paymentBtnRef = useRef();
    const [payment, setPayment] = useState({ open: false, update: false, data: { type: "نقدي" } })

    function handlePaymentPrint(data) {
        setPaymentData(data)
        setPaymentLoading(true)
        setTimeout(() => {
            paymentBtnRef.current.click()
        }, 100)
    }



    return (
        <>
            <div id="reservation-reset" style={{ display: paymentLoading ? "block" : "none" }} ref={paymentRef}>
                <PaymentReset paymentData={paymentData} />
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
                {/* {(user.admin || (user.permissions && user.permissions.withdraw)) ? <div className="cont"> */}
                    <h2>الدفعات النقدية</h2>
                    <div className="search-box">
                        <TextField type="text" variant="outlined" value={search} placeholder={t("search")} onChange={(e) => setSearch(e.target.value)} sx={{ marginLeft: "20px", borderRadius: "50px" }} />
                        {/* <Button onClick={handleOpen} variant='contained' className='btn'>{t("finance.addDraw")}</Button> */}
                    </div>
                    <TableContainer component={Paper} className='table-print'>
                        <Table aria-label="simple table">
                            <TableHead className='tablehead'>
                                <TableRow >
                                    <TableCell align='center' className='table-row'>المستأجر</TableCell>
                                    <TableCell align='center' className='table-row'>{t("finance.amount")}</TableCell>
                                    <TableCell align='center' className='table-row'>التامين</TableCell>
                                    <TableCell align='center' className='table-row'>{t("date")}</TableCell>
                                    <TableCell align='center' className='table-row'></TableCell>
                                    <TableCell align='center' className='table-row'></TableCell>
                                    <TableCell align='center' className='table-row'></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredData.map((row, ind) => (
                                    <TableRow key={ind} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                        <TableCell align="center"> {row?.reservation?.client?.name}</TableCell>
                                        <TableCell align="center">{row?.paid}</TableCell>
                                        <TableCell align="center"> {row?.insurance}</TableCell>
                                        <TableCell align="center">{row?.reservation?.date}</TableCell>
                                        <TableCell align="center" className='row-hidden-print'><Button variant='contained' size='small' onClick={() => handlePaymentPrint(row)}>{t("finance.print")}</Button></TableCell>
                                        {/* <TableCell align="center">{row.note}</TableCell> */}
                                        <TableCell align="center"><Button variant='contained' color='warning' onClick={() => setPayment({ ...payment, open: true, update: true, data: row })}>تعديل</Button></TableCell>
                                        <TableCell align="center" className='row-hidden-print'><Button variant='contained' size='small' color='error' onClick={() => handeleDeletePayment(row._id)}>{t("finance.delete")}</Button></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <AddPayment handleClose={handleClose} open={payment.open} update={payment.update} data={payment.data} />
                    <AddDrawsModel handleClose={handleClose} data={temp} handleOpen={handleOpen} update={update} open={open} />
                </div>
                //  : <h3 style={{ textAlign: "center" }}>Sorry, this page not available</h3>
                // }
            // </div>
            }
        </>
    )
}
export default CashPayments