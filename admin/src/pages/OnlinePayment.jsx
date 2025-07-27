import React ,{useEffect , useState} from 'react'
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
import AddBankTransactionModal from '../modals/AddBankTransactionModal';
import { fetchOnlinePayments } from '../redux/reducers/finance';
import OnlinePaymentModal from '../modals/OnlinePaymentModal';
import { useTranslation } from 'react-i18next';

const OnlinePayment = () => {

  const { t, i18n } = useTranslation();
  const user=useSelector((state)=>state.employee.value.user)
  const [open, setOpen] = React.useState(false);
  const [id,setId]=useState()
  const [update,setUpdate]=useState(false)
  const [temp,setTemp]=useState()
  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false)
    setTemp({})
    setUpdate(false)
  };
  const [search,setSearch]=useState('')
  const dispatch=useDispatch()
  useEffect(()=>{dispatch(fetchOnlinePayments())},[])
  const data=useSelector((state)=>state.finance.value.onlinePayment)
  function handleDelete(id){
    Api.delete(`/admin/onlinepayment/delete/${id}`)
    .then((res)=>dispatch(fetchOnlinePayments()))
    .catch((err)=>console.log(err.response.data))
  }
  function handleOpenEdit(data){
    setTemp(data)
    setOpen(true)
    setUpdate(true)
  }
  let filteredData=data
  if(search) filteredData=filteredData.filter((ele)=>ele.bank.includes(search) || ele.reciver.includes(search) || ele.donater.includes(search)|| ele.employee.includes(search))

  return (
    <div style={{direction:i18n.language=='en'?"ltr":"rtl"}}>
    {/* {(user.admin || (user.permissions&&user.permissions.onlinePayment))? */}
    <div className="cont">
    <h2>{t("finance.online")}</h2>
    <div className="search-box">  
      <TextField type="text" variant="outlined" value={search} placeholder="بحث" onChange={(e)=>setSearch(e.target.value)} sx={{marginLeft:"20px",borderRadius:"50px"}}/>
      <Button onClick={handleOpen} variant='contained' className='btn'> اضافة دفع اونلاين</Button>
    </div>
    <TableContainer component={Paper} className='table-print'>
      <Table  aria-label="simple table">
        <TableHead className='tablehead'>
          <TableRow >
            <TableCell align='center' className='table-row'>{t("finance.bank")} </TableCell>
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
          {filteredData.map((row,ind) => (
            <TableRow key={ind} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
              <TableCell align="center" scope="row"> {row.bank}</TableCell>
              <TableCell align="center" scope="row"> {row.reciver}</TableCell>
              <TableCell align="center">{row.donater}</TableCell>
              <TableCell align="center">{row.amount}</TableCell>
              <TableCell align="center">{row.employee}</TableCell>
              <TableCell align="center">{row.date}</TableCell>
              <TableCell align="center" className='row-hidden-print'><Button variant='contained'  size='small' onClick={()=>window.print()}>{t("finance.print")}</Button></TableCell>
              <TableCell align="center" className='row-hidden-print'><Button variant='contained' size='small' color='warning' onClick={()=>handleOpenEdit(row)}>{t("finance.edit")}</Button></TableCell> 
              <TableCell align="center" className='row-hidden-print'><Button variant='contained' size='small' color='error' onClick={()=>handleDelete(row._id)}>{t("finance.delete")}</Button></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
          <OnlinePaymentModal handleClose={handleClose} update={update} data={temp} handleOpen={handleOpen} open={open}/>
    </div>
    {/* :<h3 style={{textAlign:"center"}}>Sorry, this page not available</h3>} */}
    </div>
  )
}

export default OnlinePayment