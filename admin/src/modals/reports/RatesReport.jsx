
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
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import "../../scss/report.scss"
import { fetchRates } from '../../redux/reducers/rates';
import { useTranslation } from 'react-i18next';
import ReactToPrint from 'react-to-print';
import ReportsPrint from '../../components/ReportsPrint';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 1000,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  height:600,
  overflow:"scroll",
};

function RatesReport({ handleClose, open, startDate, endDate }) {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch()
  let data = useSelector((state) => state.rates.value.data)
  useEffect(() => {
    dispatch(fetchRates())
  }, [])
  let filteredData = data
  if (startDate) filteredData = filteredData.filter((ele) => (new Date(startDate).getTime()) <= (new Date(ele.date).getTime()))
  if (endDate) filteredData = filteredData.filter((ele) => (new Date(endDate).getTime()) >= (new Date(ele.date).getTime()))

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
              {t("reports.rates")}
            </Typography>
            <HighlightOffIcon id="icon" style={{ cursor: "pointer", color: "gray" }} onClick={() => handleClose()} />
          </div>
          {!loading && <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label="simple table">
              <TableHead className='tablehead'>
                <TableRow >
                  <TableCell align='center' className='table-row' width={10}></TableCell>
                  <TableCell align='center' className='table-row'>{t("reports.clientName")}</TableCell>
                  <TableCell align='center' className='table-row'>{t("reports.entity")}</TableCell>
                  <TableCell align='center' className='table-row'>{t("reports.rate")}</TableCell>
                  <TableCell align='center' className='table-row'>{t("reports.note")}</TableCell>
                  <TableCell align='center' className='table-row'>{t("reports.date")}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredData.map((row, ind) => (
                  <TableRow key={ind} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell component="th" align="center" scope="row"> {ind + 1}</TableCell>
                    <TableCell component="th" align="center" scope="row"> {row.clientName}</TableCell>
                    <TableCell component="th" align="center" scope="row"> {row.entityName}</TableCell>
                    <TableCell component="th" align="center" scope="row"> {row.rate}</TableCell>
                    <TableCell component="th" align="center" scope="row"> {row.note}</TableCell>
                    <TableCell component="th" align="center" scope="row"> {row.date}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          }

          {loading && <div ref={componentRef}>
          <ReportsPrint start={startDate} end={endDate}>
              <TableContainer component={Paper}>
                <Table sx={{ minWidth: 650 }} aria-label="simple table">
                  <TableHead className='tablehead'>
                    <TableRow >
                      <TableCell align='center' className='table-row' width={10}></TableCell>
                      <TableCell align='center' className='table-row'>{t("reports.clientName")}</TableCell>
                      <TableCell align='center' className='table-row'>{t("reports.entity")}</TableCell>
                      <TableCell align='center' className='table-row'>{t("reports.rate")}</TableCell>
                      <TableCell align='center' className='table-row'>{t("reports.note")}</TableCell>
                      <TableCell align='center' className='table-row'>{t("reports.date")}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredData.map((row, ind) => (
                      <TableRow key={ind} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        <TableCell component="th" align="center" scope="row"> {ind + 1}</TableCell>
                        <TableCell component="th" align="center" scope="row"> {row.clientName}</TableCell>
                        <TableCell component="th" align="center" scope="row"> {row.entityName}</TableCell>
                        <TableCell component="th" align="center" scope="row"> {row.rate}</TableCell>
                        <TableCell component="th" align="center" scope="row"> {row.note}</TableCell>
                        <TableCell component="th" align="center" scope="row"> {row.date}</TableCell>
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
export default RatesReport;



