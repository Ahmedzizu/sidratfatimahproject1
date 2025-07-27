import React ,{useEffect , useState} from 'react'
import { TextField, Button } from '@mui/material';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import "../scss/addChalets.scss";
import { useDispatch, useSelector } from 'react-redux';
import Api from './../config/config';
import { useTranslation } from 'react-i18next';
import AddBankDetails from '../modals/AddBankDetails';
import { fetchBankDetails } from '../redux/reducers/bank';

const BankDetails = () => {
  let data=useSelector((state)=>state.bank.value.data)
  const user=useSelector((state)=>state.employee.value.user)
  const { t, i18n } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const [temp,setTemp]=useState()
  const dispatch=useDispatch()
  const [update,setUpdate]=useState(false)
  const [details,setDetails]=useState({open:false,id:'',name:''})
  useEffect(()=>{dispatch(fetchBankDetails())},[])
  const handleOpen = () => setOpen(true);
  const handleClose = () =>{
    setUpdate(false)
    setOpen(false)
    setDetails({open:false,id:''})
  }
  const [search,setSearch]=useState('')

  function handleDelete(id){
    Api.delete(`/bank-details/${id}`)
    .then((res)=>dispatch(fetchBankDetails()))
    .catch((err)=>console.log(err.response.data))
  }
  function handleOpenEdit(data){
    setTemp(data)
    setOpen(true)
    setUpdate(true)
  }
  let filteredData=data
  if(search) filteredData=filteredData.filter((ele)=>ele.name.includes(search))
  
  return (
    <div  style={{direction:i18n.language=='en'?'ltr':'rtl'}}>
    {/* {(user.admin || (user.permissions&&user.permissions.addClient))?<div className="cont"> */}
      <h2 >{t("Bank.title")}</h2>
      <div className="search-box">  
        <TextField type="text" variant="outlined" value={search} placeholder={t("dashboard.search")} onChange={(e)=>setSearch(e.target.value)} sx={{marginLeft:"20px",borderRadius:"50px"}}/>
        <Button onClick={handleOpen} variant='contained' className='btn'>{t("Bank.add")}</Button>
      </div>
      <TableContainer component={Paper}>
        <Table  aria-label="simple table">
          <TableHead className='tablehead'>
            <TableRow >
              <TableCell align='center' className='table-row'>{t("Bank.name")}</TableCell>
              <TableCell align='center' className='table-row'>{t("Bank.id")}</TableCell>
              <TableCell align='center' className='table-row'>{t("Bank.accountNo")}</TableCell>
              <TableCell align='center' className='table-row'></TableCell>
              <TableCell align='center' className='table-row'></TableCell>
              <TableCell align='center' className='table-row'></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredData.map((row,ind) => (
              <TableRow key={ind} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                <TableCell align="center"> {row.name}</TableCell>
                <TableCell align="center"> {row.id}</TableCell>
                <TableCell align="center"> {row.account}</TableCell>
                <TableCell align="center"><Button variant='contained' size='small' color='warning' onClick={()=>handleOpenEdit(row)}>{t("client.edit")}</Button></TableCell> 
                <TableCell align="center"><Button variant='contained' size='small' color='error' onClick={()=>handleDelete(row._id)}>{t("client.delete")}</Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
            <AddBankDetails update={update} handleClose={handleClose} data={temp} handleOpen={handleOpen} open={open}/>
    </div>
    // :<h3 style={{textAlign:"center"}}>Sorry, this page not available</h3>}
    // </div>
  )
}

export default BankDetails;

 