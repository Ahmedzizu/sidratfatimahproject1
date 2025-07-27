import React ,{useEffect , useState ,useRef} from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import "../scss/addChalets.scss"
import { Grid, InputLabel } from '@mui/material';
import { TextField } from '@mui/material';
import Api from './../config/config';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { FormControl, Select, MenuItem } from '@mui/material';
import { useParams } from 'react-router-dom';
import { fetchFreeServices } from '../redux/reducers/services';
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

function ReservationFreeReservation({handleClose,handleOpen,open,tempData:temp,update,fetchData}) {    
  const { t, i18n } = useTranslation();
  const [data,setData]=useState({service:'',number:'',note:'',type:"free"})
  let freeServicessData=useSelector((state)=>state.services.value.freeServices)
  const {id}=useParams()
 const dispatch=useDispatch()
 useEffect(()=>{if(temp)setData({...temp,confirmPassword:temp.password})
},[temp])
function handleSubmit(e){
  e.preventDefault();
  let url = update? '/admin/reservation/service/update':'/admin/reservation/service';
  Api.post(url, {...data,reservationId:id,type:"free"})
  .then(() => {
      fetchData()
      setData({service:'',number:'',note:'',type:"free"})
      handleClose()
  })
  .catch((err)=>{
    console.log(err.message);
})
}
 return (
    <div>
      <Modal style={{direction:i18n.language=='en'?'ltr':'rtl'}} open={open} onClose={handleClose} aria-labelledby="modal-modal-title" aria-describedby="modal-modal-description" >
        <Box sx={style} className='model'>
          <Typography id="modal-modal-title" variant="h6" component="h2" sx={{marginBottom:5}}>
            اضافة خدمة مجانية
          </Typography>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
                <Grid item xs={12}>
                    <InputLabel id="select-label">الخدمة المجانية</InputLabel>
                <Select labelId="select-label" id="select" required value={data.service} onChange={(e)=>setData({...data,service:e.target.value})} fullWidth>
                    {
                      freeServicessData.map((ele)=>(
                        <MenuItem value={ele.service}>{ele.service}</MenuItem>
                      ))
                      }
                </Select>
                </Grid>
                <Grid item xs={12}>
                    <InputLabel htmlFor="chaletImg">العدد</InputLabel>
                    <TextField  variant="outlined" fullWidth required type="number"  value={data.number} onChange={(e)=>setData({...data,number:e.target.value})}/>
                </Grid>
                <Grid item xs={12}>
                    <InputLabel htmlFor="chaletImg">الملاحظات</InputLabel>
                    <TextField variant="outlined" fullWidth multiline type="text"  value={data.note} onChange={(e)=>setData({...data,note:e.target.value})}/>
                </Grid>
                <Grid item xs={12}>
                    <Button variant='contained' type='submit' fullWidth style={{backgroundColor:"#B38D46",height:"50px" ,fontSize:"1rem"}}>{t("client.add")}</Button>
                </Grid>
            </Grid>
          </form>
        </Box>
      </Modal>
    </div>
  );
}
export default ReservationFreeReservation;