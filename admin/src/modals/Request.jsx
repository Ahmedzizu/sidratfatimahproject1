import React ,{useEffect , useState ,useRef} from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import "../scss/addChalets.scss"
import { Grid, InputLabel } from '@mui/material';
import { TextField } from '@mui/material';
import Api from './../config/config';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { useSelector } from 'react-redux';

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

function Request({handleClose,handleOpen,open,tempData:temp,update,fetchData}) {    
  const {id}=useParams()
  const services=useSelector((state)=>state.services.value.servies)
  const { t, i18n } = useTranslation();
  const [data,setData]=useState({service:'',statement:'',price:'',note:''})
 useEffect(()=>{if(temp)setData(temp)
},[temp])
function handleSubmit(e){
  e.preventDefault();
  let url = update? '/admin/reservation/service/update':'/admin/reservation/service';
  Api.post(url, {...data,reservationId:id,type:"request"})
  .then(() => {
      fetchData()
      setData({service:'',statement:'',price:'',note:''})
      handleClose()
  })
  .catch((err)=>{
    console.log(err?.respone?.message);
})
}
 return (
    <div>
      <Modal style={{direction:i18n.language=='en'?'ltr':'rtl'}} open={open} onClose={handleClose} aria-labelledby="modal-modal-title" aria-describedby="modal-modal-description" >
        <Box sx={style} className='model'>
          <Typography id="modal-modal-title" variant="h6" component="h2" sx={{marginBottom:5}}>
            اضافة مطلب
          </Typography>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
                <Grid item xs={12}>
                    <InputLabel htmlFor="chaletImg">الخدمة الأضافية</InputLabel>
                    <Select labelId="demo-simple-select-label" onChange={(e)=>setData({...data,service:e.target.value})} fullWidth id="demo-simple-select" value={data.type} label="Age">
                      {
                        services.map((ele)=>(
                          <MenuItem value={ele.service}>{ele.service}</MenuItem>
                        ))
                      }
                       <MenuItem value={"تلفيات"}>تلفيات</MenuItem>
                       <MenuItem value={"تلفيات"}>ضريبة</MenuItem>
                    </Select>                </Grid>
                <Grid item xs={12}>
                    <InputLabel htmlFor="chaletImg">البيان</InputLabel>
                    <TextField  variant="outlined" fullWidth required type="text"  value={data.statement} onChange={(e)=>setData({...data,statement:e.target.value})}/>
                </Grid>
                <Grid item xs={12}>
                    <InputLabel htmlFor="chaletImg">السعر</InputLabel>
                    <TextField variant="outlined" fullWidth required type="number"  value={data.price} onChange={(e)=>setData({...data,price:e.target.value})}/>
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
export default Request;