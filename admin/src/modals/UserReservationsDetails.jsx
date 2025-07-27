import React ,{useEffect , useState ,useRef} from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import "../scss/addChalets.scss"
import { Grid, InputLabel } from '@mui/material';
import { TextField } from '@mui/material';
import { useTranslation } from 'react-i18next';
import Api from './../config/config';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBanckTransaction } from '../redux/reducers/finance';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { fetchReservations } from '../redux/reducers/reservation';
const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 800,
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
  };
const UserReservationsDetails = ({handleClose,open,id, name}) => {
    const dispatch=useDispatch()
    useEffect(()=>{dispatch(fetchReservations())},[])
    const data =useSelector((state)=>state.reservation.value.data)
    const { t, i18n } = useTranslation();
    let filtedData=data.filter((ele)=>ele.client.id==id)
    console.log(filtedData);
  return (
    <div >
    <Modal style={{direction:i18n.language=='en'?"ltr":"rtl"}} open={open} onClose={handleClose} aria-labelledby="modal-modal-title" aria-describedby="modal-modal-description" >
      <Box sx={style} className='model'>
        <Typography id="modal-modal-title" variant="h6" component="h2" sx={{marginBottom:5}}>
          {t("reservation.details") + name} 
        </Typography>
        {filtedData.length==0?<h2 style={{textAlign:"center"}}>{t("client.noReservations")}</h2> : <TableContainer component={Paper}>
        <Table  aria-label="simple table">
          <TableHead className='tablehead'>
            <TableRow >
              <TableCell align='center' className='table-row'>{t("client.name")}</TableCell>
              <TableCell align='center' className='table-row'>{t("reservation.entity")}</TableCell>
              <TableCell align='center' className='table-row'>{t("reservation.amount")}</TableCell>
              {/* <TableCell align='center' className='table-row'>{t("reservation.paid")}</TableCell> */}
              {/* <TableCell align='center' className='table-row'>{t("reservation.tax")}</TableCell> */}
              {/* <TableCell align='center' className='table-row'>{t("reservation.insurance")}</TableCell> */}
              <TableCell align='center' className='table-row'>{t("date")}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtedData.map((row,ind) => (
              <TableRow key={ind} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                <TableCell align="center"> {row.client?.name}</TableCell>
                <TableCell align="center"> {row.entity?.name}</TableCell>
                <TableCell align="center">{row?.cost}</TableCell>
                {/* <TableCell align="center">{row.finance?.paid}</TableCell> */}
                {/* <TableCell align="center">{row.finance?.tax}</TableCell> */}
                {/* <TableCell align="center">{row.finance?.insurance?.amount}</TableCell> */}
                <TableCell align="center"> {row.date}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
       </TableContainer>}
      </Box>
    </Modal>
  </div>
  )
}

export default UserReservationsDetails
