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
import { fetchNotification, fetchReservations } from '../redux/reducers/reservation';
import DeleteDialoge from './../components/DeleteDialoge';
import { useTranslation } from 'react-i18next';
import Api from '../config/config';
import PermissionsControl from '../components/PermissionsControl';

const CancelRequest = () => {
  const user = useSelector((state) => state.employee.value.user)
  const dispatch = useDispatch()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const data = useSelector((state) => state.reservation.value.cancelRequest)
  const handleDeleteClose = () => setDeleteOpen(false)
  const { t, i18n } = useTranslation();
  const [deleteID, setDeleteID] = useState()
  useEffect(() => {
    dispatch(fetchReservations())
    removeNotification()
  }, [])

  const [search, setSearch] = useState('')
  function handleDeleteOpen(id) {
    setDeleteID(id)
    setDeleteOpen(true)
  }
  function removeNotification() {
    Api.patch("/admin/notification", { type: "cancel" })
      .then(() => dispatch(fetchNotification()))
  }

  let filteredData = data
  if (search) filteredData = filteredData.filter((ele) => ele.client.name.includes(search) || ele.date.includes(search) || ele.entity.name.includes(search) || ele.period.dayPeriod.includes(search))
  return (
    <>
      <PermissionsControl role="cancelReaquest">
        <div style={{ direction: i18n.language == 'en' ? "ltr" : "rtl" }}>
          {
          // (user.admin || (user.permissions && user.permissions.cancelReaquest)) ?
           <div className="cont">
            <h2>{t("reservation.cancelRequest")}</h2>
            <div className="search-box">
              <TextField type="text" variant="outlined" value={search} placeholder={t("search")} onChange={(e) => setSearch(e.target.value)} sx={{ marginLeft: "20px", borderRadius: "50px" }} />
            </div>
            <TableContainer component={Paper} className='table-print'>
              <Table aria-label="simple table">
                <TableHead className='tablehead'>
                  <TableRow >
                    <TableCell align='center' className='table-row'>{t("reservation.client")}</TableCell>
                    <TableCell align='center' className='table-row'>{t("reservation.entity")}</TableCell>
                    <TableCell align='center' className='table-row'>{t("reservation.period")}</TableCell>
                    <TableCell align='center' className='table-row'>{t("reservation.period")}</TableCell>
                    <TableCell align='center' className='table-row'>{t("reservation.amount")}</TableCell>
                    <TableCell align='center' className='table-row'>{t("date")}</TableCell>
                    <TableCell align='center' className='table-row'></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredData.map((row, ind) => (
                    <TableRow key={ind} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell align="center"> {row.client.name}</TableCell>
                      <TableCell align="center">{row.entity.name}</TableCell>
                      <TableCell align="center">{row.period.dayPeriod}</TableCell>
                      <TableCell align="center">{` ${row.period.startDate}/ ${row.period.endDate}`}</TableCell>
     <TableCell align="center">
  {row.cost.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
</TableCell>                      <TableCell align="center">{row.date}</TableCell>
                      <TableCell align="center" className='row-hidden-print'><Button variant='contained' size='small' style={{ backgroundColor: 'var(--fc-now-indicator-color)' }} onClick={() => handleDeleteOpen(row._id)}>{t("reservation.delete")}</Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <DeleteDialoge open={deleteOpen} handleClose={handleDeleteClose} url={"/admin/reservation/delete/"} id={deleteID} />
          </div> 
          // : <h3 style={{ textAlign: "center" }}>Sorry, this page not available</h3>
          }
        </div>
      </PermissionsControl>
    </>
  )
}

export default CancelRequest