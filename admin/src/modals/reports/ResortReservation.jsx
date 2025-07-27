
import React, { useEffect, useState, useRef } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import "../../scss/addChalets.scss"
import { useDispatch, useSelector } from 'react-redux';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { fetchReservations, fetchReservationsServices } from '../../redux/reducers/reservation';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import "../../scss/report.scss"
import { fetchResort } from './../../redux/reducers/resort';
import { useTranslation } from 'react-i18next';
import ReactToPrint from 'react-to-print';
import ReportsPrint from '../../components/ReportsPrint';
import { fetchAllReservation_payments } from '../../redux/reducers/reservation_payments';

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

function ResortReservation({ handleClose, handleOpen, open, startDate, endDate }) {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch()
  let reservations = useSelector((state) => state.reservation.value.confirmed)
  let reservationServices = useSelector((state) => state.reservation.value.reservationServices)
  let allResravationPayments = useSelector((state) => state.reservation_payments.value.all)
  let data = reservations.filter((ele) => ele.type == 'resort')



  useEffect(() => {
    dispatch(fetchAllReservation_payments())
    dispatch(fetchReservations())
    dispatch(fetchReservationsServices())
  }, [])
  let filteredData = data
  if (startDate) filteredData = filteredData.filter((ele) => (new Date(startDate).getTime()) <= (new Date(ele?.period?.startDate).getTime()))
  if (endDate) filteredData = filteredData.filter((ele) => (new Date(endDate).getTime()) >= (new Date(ele?.period?.startDate).getTime()))


  const [loading, setLoading] = useState(false)
  const componentRef = useRef();
  const tempRef = useRef();

  function handlePrint() {
    setLoading(true)
    setTimeout(() => {
      tempRef.current.click()
    }, 100)
  }

  const getTotalRevenue = (id, paid) => {
    let reservationPayments = allResravationPayments.filter((ele) => ele?.reservation?._id == id)
    let totalPaid = reservationPayments?.reduce((prev, cur) => prev += cur.paid, 0)
    let services = reservationServices.filter((ele) => ele.reservationId == id)
    let totalServices = services?.reduce((prev, cur) => prev += cur.price, 0)
    return totalPaid + totalServices
  }

  const getTotalService = (id) => {
    let services = reservationServices.filter((ele) => ele.reservationId == id)
    let totalServices = services?.reduce((prev, cur) => prev += cur.price, 0)
    return totalServices
  }

  const totalAllServices = () => {
    let totalServices = 0
    filteredData.map((ele) => {
      totalServices = getTotalService(ele._id)
    })
    return totalServices
  };

  const AllTotalRevenue = () => {
    let totalRevenue = 0
    filteredData.map((ele) => {
      totalRevenue = getTotalRevenue(ele._id)
    })
    return totalRevenue
  };

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
        <Box sx={style} className='model' id="printReport">
          <div style={{ display: 'flex', justifyContent: "space-between" }}>
            <Typography id="modal-modal-title" variant="h6" component="h2" sx={{ marginBottom: 5 }}>
              {t("reports.resortReserv")}
            </Typography>
            <HighlightOffIcon id="icon" style={{ cursor: "pointer", color: "gray" }} onClick={() => handleClose()} />
          </div>
          {!loading && <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label="simple table">
              <TableHead className='tablehead'>
                <TableRow >
                  <TableCell align='center' className='table-row'>{t("reports.contract")}</TableCell>
                  <TableCell align='center' className='table-row'>{t("reports.client")}</TableCell>
                  <TableCell align='center' className='table-row'>{t("reports.entity")}</TableCell>
                  <TableCell align='center' className='table-row'>{t("reports.service")}</TableCell>
                  <TableCell align='center' className='table-row'>{t("reports.revenue")}</TableCell>
                  <TableCell align='center' className='table-row'>{t("reports.date")}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredData.map((row, ind) => (
                  <TableRow key={ind} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell component="th" align="center" scope="row"> {row.contractNumber}</TableCell>
                    <TableCell component="th" align="center" scope="row"> {row.client.name}</TableCell>
                    <TableCell component="th" align="center" scope="row"> {row.entity.name}</TableCell>
                    <TableCell component="th" align="center" scope="row"> {getTotalService(row?._id, row?.payment) || 0}</TableCell>
                    <TableCell component="th" align="center" scope="row"> {getTotalRevenue(row?._id, row?.payment) || 0}</TableCell>
                    <TableCell component="th" align="center" scope="row"> {row.date}</TableCell>
                  </TableRow>
                ))}
                <TableRow sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell component="th" align="center" scope="row"> </TableCell>
                  <TableCell component="th" align="center" scope="row"> </TableCell>
                  <TableCell component="th" align="center" scope="row">الاجمالي </TableCell>
                  <TableCell component="th" align="center" scope="row">{totalAllServices()}</TableCell>
                  <TableCell component="th" align="center" scope="row">{AllTotalRevenue()}</TableCell>
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
                      <TableCell align='center' className='table-row'>{t("reports.contract")}</TableCell>
                      <TableCell align='center' className='table-row'>{t("reports.client")}</TableCell>
                      <TableCell align='center' className='table-row'>{t("reports.entity")}</TableCell>
                      <TableCell align='center' className='table-row'>{t("reports.revenue")}</TableCell>
                      <TableCell align='center' className='table-row'>{t("reports.service")}</TableCell>
                      <TableCell align='center' className='table-row'>{t("reports.date")}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredData.map((row, ind) => (
                      <TableRow key={ind} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        <TableCell component="th" align="center" scope="row"> {row.contractNumber}</TableCell>
                        <TableCell component="th" align="center" scope="row"> {row.client.name}</TableCell>
                        <TableCell component="th" align="center" scope="row"> {row.entity.name}</TableCell>
                        <TableCell component="th" align="center" scope="row"> {getTotalRevenue(row?._id, row?.payment)}</TableCell>
                        <TableCell component="th" align="center" scope="row"> {getTotalService(row?._id,)}</TableCell>
                        <TableCell component="th" align="center" scope="row"> {row?.period?.startDate}</TableCell>
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
export default ResortReservation;

