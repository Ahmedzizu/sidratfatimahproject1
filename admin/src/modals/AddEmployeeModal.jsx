
import React ,{useEffect , useState ,useRef} from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import "../scss/addChalets.scss"
import { Grid, InputLabel } from '@mui/material';
import { TextField } from '@mui/material';
import Api from './../config/config';
import { useDispatch } from 'react-redux';
import { fetchEmploees } from './../redux/reducers/employee';
const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 700,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
};

function AddEmployeeModal({handleClose,handleOpen,open,data:temp,update}) {    
 const [data,setData]=useState({name:'',nationalId:'',phone:"",email:"",password:"",confirmPassword:'',salary:'',position:""})
 const [errors,setErrors]=useState({email:"",password:"",confirmPassword:'',phone:''})
 const inputFile=useRef()
 const dispatch=useDispatch()
 useEffect(()=>{
  if(temp){
  setData({...temp,password:''})
}else{
  setData({name:'',nationalId:'',phone:"",email:"",password:"",confirmPassword:'',salary:'',position:""})

}
},[temp])

function handleSubmit(e){
  e.preventDefault();
  setErrors({email:"",password:"",confirmPassword:''})
  if(data.password != data.confirmPassword) return setErrors({...errors,confirmPassword:"Password must be same"})
  if(data.password.length<8) return setErrors({...errors,password:"Password must be more than 8 characters"})
  let url = update? '/employee/data/update':'/employee/data';
  Api.post(url, data)
  .then(() => {
      dispatch(fetchEmploees())
      setData({name:'',nationalId:'',phone:"",email:"",password:"",confirmPassword:'',salary:'',position:""})
      handleClose()
  })
  .catch((err)=>{
    let errMsg=err.response.data 
    if(errMsg.email) return setErrors({email:errMsg.email})
    if(errMsg.phone) return setErrors({phone:errMsg.phone})
  })
}
 return (
    <div>
      <Modal open={open} onClose={handleClose} aria-labelledby="modal-modal-title" aria-describedby="modal-modal-description" >
        <Box sx={style} className='model'>
          <Typography id="modal-modal-title" variant="h6" component="h2" sx={{marginBottom:5}}>
            اضافة موظف 
          </Typography>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
                <Grid item xs={6}>
                    <TextField variant="outlined" fullWidth required type="text" placeholder="الأسم" value={data.name} onChange={(e)=>setData({...data,name:e.target.value})}/>
                </Grid>
                <Grid item xs={6}>
                    <TextField variant="outlined" fullWidth required type="number" placeholder="رقم الهوية" value={data.nationalId} onChange={(e)=>setData({...data,nationalId:e.target.value})}/>
                </Grid>
                <Grid item xs={6}>
                    <TextField variant="outlined" error={errors.phone} helperText={errors.phone} fullWidth required type="number" placeholder="رقم الهاتف" value={data.phone} onChange={(e)=>setData({...data,phone:e.target.value})}/>
                </Grid>
                <Grid item xs={6}>
                    <TextField variant="outlined" fullWidth required type="number" placeholder="الراتب" value={data.salary} onChange={(e)=>setData({...data,salary:e.target.value})}/>
                </Grid>
                <Grid item xs={6}>
                    <TextField variant="outlined" fullWidth required type="email" error={errors.email} helperText={errors.email} placeholder="البريد الالكتروني" value={data.email} onChange={(e)=>setData({...data,email:e.target.value})}/>
                </Grid>
                <Grid item xs={6}>
                    <TextField variant="outlined" fullWidth required type="text"   placeholder="الوظيفة" value={data.position} onChange={(e)=>setData({...data,position:e.target.value})}/>
                </Grid>
                <Grid item xs={6}>
                    <TextField variant="outlined" fullWidth required type="password" error={errors.password} helperText={errors.password} placeholder="كلمة المرور" value={data.password} onChange={(e)=>setData({...data,password:e.target.value})}/>
                </Grid>
                <Grid item xs={6}>
                    <TextField variant="outlined" fullWidth required type="password" error={errors.confirmPassword} helperText={errors.confirmPassword} placeholder="تأكيد كلمة المرور" value={data.confirmPassword} onChange={(e)=>setData({...data,confirmPassword:e.target.value})}/>
                </Grid>
                <Grid item xs={12}>
                    <Button variant='contained' type='submit' fullWidth style={{backgroundColor:"#B38D46",height:"50px" ,fontSize:"1rem"}}>اضافة</Button>
                </Grid>
            </Grid>
          </form>
        </Box>
      </Modal>
    </div>
  );
}
export default AddEmployeeModal;