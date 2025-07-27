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
import AddCutomerModal from '../modals/AddCustomer';
import { fetchCustomer } from './../redux/reducers/customer';
import { useTranslation } from 'react-i18next';
import UserReservationsDetails from '../modals/UserReservationsDetails';
import AddIcon from '@mui/icons-material/Add';
import Packages from '../modals/Packages';
import AddServices from '../modals/AddServices';
import { fetchFreeServices, fetchPackages, fetchServices } from '../redux/reducers/services';
import AddFreeServices from '../modals/AddFreeServices';

const Services = () => {
  const user=useSelector((state)=>state.employee.value.user)
  const { t, i18n } = useTranslation();
  const [packages,setPackage]=useState({open:false,data:{},update:false})
  const [openServices,setOpenServices]=useState({open:false,data:{},update:false})
  const [openFreeServices,setOpenFreeServices]=useState({open:false,data:{},update:false})
  let packagesData=useSelector((state)=>state.services.value.packages)
  let servicessData=useSelector((state)=>state.services.value.servies)
  let freeServicessData=useSelector((state)=>state.services.value.freeServices)

  const dispatch=useDispatch()
  useEffect(()=>{
    dispatch(fetchPackages())
    dispatch(fetchServices())
  },[])
  const handleClose = () =>{
    setPackage({open:false,data:{},update:false})
    setOpenServices({open:false,data:{},update:false})
    setOpenFreeServices({open:false,data:{},update:false})
  }
  function handleDelete(id,url){
    Api.delete(`${url}/${id}`)
    .then((res)=>{
      dispatch(fetchPackages())
      dispatch(fetchServices())
      dispatch(fetchFreeServices())
    })
    .catch((err)=>console.log(err.response.data))
  }

  return (
    <div  style={{direction:i18n.language=='en'?'ltr':'rtl'}}>

    <div className="cont">
      <h2 >البكدجات</h2>
      <div className="search-box">  
        <Button onClick={()=>setPackage({open:true,update:false,data:{}})} variant='contained' className='btn'>اضافة باكدج<AddIcon/></Button>
      </div>
      <TableContainer component={Paper}>
        <Table  aria-label="simple table">
          <TableHead className='tablehead'>
            <TableRow >
              <TableCell align='center' className='table-row'>الباكدج</TableCell>
              <TableCell align='center' className='table-row'>السعر</TableCell>
              <TableCell align='center' className='table-row'></TableCell>
              <TableCell align='center' className='table-row'></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {packagesData.map((row,ind) => (
              <TableRow key={ind} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                <TableCell align="center"> {row.package}</TableCell>
                <TableCell align="center"> {row.price}</TableCell>
                <TableCell align="center"><Button variant='contained' size='small' color='warning' onClick={()=>setPackage({open:true,update:true,data:row})}>{t("client.edit")}</Button></TableCell> 
                <TableCell align="center"><Button variant='contained' size='small' color='error' onClick={()=>handleDelete(row._id,"/admin/package")}>{t("client.delete")}</Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
    <div className="cont">
      <h2 >الخدمات</h2>
      <div className="search-box">  
        <Button onClick={()=>setOpenServices({open:true,update:false,data:{}})} variant='contained' className='btn'>اضافة خدمة اضافية<AddIcon/></Button>
      </div>
      <TableContainer component={Paper}>
        <Table  aria-label="simple table">
          <TableHead className='tablehead'>
            <TableRow >
              <TableCell align='center' className='table-row'>الخدمة</TableCell>
              <TableCell align='center' className='table-row'></TableCell>
              <TableCell align='center' className='table-row'></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {servicessData.map((row,ind) => (
              <TableRow key={ind} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                <TableCell align="center"> {row.service}</TableCell>
                <TableCell align="center"><Button variant='contained' size='small' color='warning' onClick={()=>setOpenServices({open:true,update:true,data:row})}>{t("client.edit")}</Button></TableCell> 
                <TableCell align="center"><Button variant='contained' size='small' color='error' onClick={()=>handleDelete(row._id,"/admin/services")}>{t("client.delete")}</Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
            <Packages update={packages.update} handleClose={handleClose} data={packages.data} open={packages.open}/>
            <AddServices update={openServices.update} handleClose={handleClose} data={openServices.data} open={openServices.open} />
    </div>
    <div className="cont">
      <h2 >الخدمات المجانية</h2>
      <div className="search-box">  
        <Button onClick={()=>setOpenFreeServices({open:true,update:false,data:{}})} variant='contained' className='btn'>اضافة خدمة مجانية<AddIcon/></Button>
      </div>
      <TableContainer component={Paper}>
        <Table  aria-label="simple table">
          <TableHead className='tablehead'>
            <TableRow >
              <TableCell align='center' className='table-row'>الخدمة</TableCell>
              <TableCell align='center' className='table-row'></TableCell>
              <TableCell align='center' className='table-row'></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {freeServicessData.map((row,ind) => (
              <TableRow key={ind} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                <TableCell align="center"> {row.service}</TableCell>
                <TableCell align="center"><Button variant='contained' size='small' color='warning' onClick={()=>setOpenFreeServices({open:true,update:true,data:row})}>{t("client.edit")}</Button></TableCell> 
                <TableCell align="center"><Button variant='contained' size='small' color='error' onClick={()=>handleDelete(row._id,"/admin/freeServices")}>{t("client.delete")}</Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
            <Packages update={packages.update} handleClose={handleClose} data={packages.data} open={packages.open}/>
            <AddServices update={openServices.update} handleClose={handleClose} data={openServices.data} open={openServices.open} />
            <AddFreeServices update={openFreeServices.update} handleClose={handleClose} data={openFreeServices.data} open={openFreeServices.open} />
    </div>
    </div>
  )
}
export default Services;

 