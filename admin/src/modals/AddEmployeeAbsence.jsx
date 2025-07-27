import React ,{useEffect , useState ,useRef} from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import "../scss/addChalets.scss"
import { Grid, InputLabel, MenuItem, Select } from '@mui/material';
import { TextField } from '@mui/material';
import Api from './../config/config';
import { useTranslation } from 'react-i18next';
import { fetchChalets } from './../redux/reducers/chalet';
import { useDispatch, useSelector } from 'react-redux';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import { notifyError } from '../components/Notify';
import { fetchEmploees, fetchEmployeeAbsence } from '../redux/reducers/employee';


const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
};

function AddEmployeeAbsence({handleClose,update,data:data2,open}) {    
 const [data,setData]=useState({employee:"",date:""})
 const inputFile=useRef()
 const { t, i18n } = useTranslation();
 const dispatch=useDispatch()
 const [loading,setLoading] =useState(false) 


useEffect(()=>{
  if(update) setData({...data2,employee:data2?.employee._id})
  else setData({employee:"",date:""})
},[update])

useEffect(()=>{
    dispatch(fetchEmployeeAbsence())
    dispatch(fetchEmploees())
},[])



let employees=useSelector((state)=>state.employee.value.data)
function handleSubmit(e){
  e.preventDefault();
  setLoading(true)
  let url = update? '/employee/absence/update':'/employee/absence'
  Api.post(url, data).then(() => {
      dispatch(fetchChalets())
      setData({employee:"",date:""})
      setLoading(false)
      handleClose()
  })
  .catch((err)=>{
    console.log(err?.response);
    setLoading(false)
})
}



function handleChangeType(e){
  let value = e.target.value
  if(value == "delay"){
    setData({...data,type:value})
  }else{
    setData({...data,type:value,delay:""})
  }
}



 return (
    <div>
      <Modal style={{direction:i18n.language=='en'?'ltr':'rtl'}} open={open} onClose={handleClose} aria-labelledby="modal-modal-title" aria-describedby="modal-modal-description" >
        <Box sx={style} className='model'>
          <Typography id="modal-modal-title" variant="h6" component="h2" sx={{marginBottom:5}}>
             اضافة غياب موظف 
          </Typography>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
                <Grid item xs={6}>
                   <InputLabel>{t("employee.name")}</InputLabel>
                  <Select fullWidth value={data.employee} required onChange={(e)=> setData({...data,employee:e.target.value})}>
                    {
                      employees.map((ele,ind)=>(
                          <MenuItem key={ind} value={ele._id}>{ele.name}</MenuItem>
                      ))
                    }
                </Select>
                </Grid>
                <Grid item xs={6}>
                   <InputLabel>{t("employee.type")}</InputLabel>
                   <Select
                        fullWidth
                        value={data.type || ''} // Set the value to data.type or an empty string initially
                        required
                        onChange={handleChangeType}
                    >
                      <MenuItem value={"absence"}>{t("employee.absence")}</MenuItem>
                      <MenuItem value={"delay"}>{t("employee.delay")}</MenuItem>
                  </Select>
                </Grid>
               {data.type=="delay"&& <Grid item xs={6}>
                   <InputLabel>{t("employee.delayTime")}</InputLabel>
                    <TextField variant="outlined" required type="number" value={data.delay} onChange={(e)=>setData({...data,delay:e.target.value})}/>
                </Grid>}
                
                <Grid item xs={6}>
                   <InputLabel>{t("employee.date")}</InputLabel>
                    <TextField fullWidth variant="outlined" required type="date" value={data.date} onChange={(e)=>setData({...data,date:e.target.value})}/>
                </Grid>

                <Grid item xs={12}>
                    {loading? 
                    <Button variant='contained'disabled type='submit' fullWidth style={{backgroundColor:"#B38D46",height:"50px" ,fontSize:"1rem"}}>Loading ...</Button>
                    :<Button variant='contained' type='submit' fullWidth style={{backgroundColor:"#B38D46",height:"50px" ,fontSize:"1rem"}}>اضافة</Button>
                    }
                </Grid>
            </Grid>
          </form>
        </Box>
      </Modal>
    </div>
  );
}
export default AddEmployeeAbsence;
