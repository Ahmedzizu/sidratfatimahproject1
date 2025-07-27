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
import AddPaypal from '../modals/AddPaypal';
import { fetchPaypal } from './../redux/reducers/finance';
import { useTranslation } from 'react-i18next';

const Paypal = () => {
  const [open, setOpen] = React.useState(false);
  const [id,setId]=useState()
  const [temp,setTemp]=useState()
  const { t, i18n } = useTranslation();
  const user=useSelector((state)=>state.employee.value.user)
  const [update,setUpdate]=useState(false)
  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false)
    setTemp({})
    setUpdate(false)
  };
  const [search,setSearch]=useState('')
  const dispatch=useDispatch()
  const data=useSelector((state)=>state.finance.value.paypal)
  useEffect(()=>{dispatch(fetchPaypal())},[])

  function handleDelete(id){
    Api.delete(`/admin/paypal/delete/${id}`)
    .then((res)=>dispatch(fetchPaypal()))
    .catch((err)=>console.log(err.response.data))
  }
  function handleOpenEdit(data){
    setTemp(data)
    setUpdate(true)
    setOpen(true)
  }
  let filteredData=data
  if(search) filteredData=filteredData.filter((ele)=>ele.bank.includes(search) || ele.employee.includes(search) || ele.donater.includes(search))
  return (
    // <>{(user.admin || (user.permissions&&user.permissions.paypal))?
    <div className="cont"  style={{direction:i18n.language=='en'?"ltr":"rtl"}}>
    <h2>{t("finance.paypal")}</h2>
    <div className="search-box">  
      <TextField type="text" variant="outlined" value={search} placeholder={t("search")} onChange={(e)=>setSearch(e.target.value)} sx={{marginLeft:"20px",borderRadius:"50px"}}/>
      <Button onClick={handleOpen} variant='contained' className='btn'>{t("finance.addPaypal")}</Button>
    </div>
    <TableContainer component={Paper} className='table-print'>
      <Table  aria-label="simple table">
        <TableHead className='tablehead'>
          <TableRow >
            <TableCell align='center' className='table-row'>{t("finance.bank")} </TableCell>
            <TableCell align='center' className='table-row'>{t("finance.receiver")}</TableCell>
            <TableCell align='center' className='table-row'>{t("finance.donator")}</TableCell>
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
          <AddPaypal handleClose={handleClose} data={temp} handleOpen={handleOpen} update={update} open={open}/>
    </div>
    // :<h3 style={{textAlign:"center"}}>Sorry, this page not available</h3>}
    // </>
  )
}

export default Paypal