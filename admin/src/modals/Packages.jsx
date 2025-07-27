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
import { useTranslation } from 'react-i18next';
import { fetchPackages } from './../redux/reducers/services';

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

function Packages({handleClose,handleOpen,open,data:temp,update}) {    
  const { t, i18n } = useTranslation();
  const [data,setData]=useState({package:'',price:''})
 const dispatch=useDispatch()
 useEffect(()=>{
  if(temp)setData({...temp})
},[temp])

function handleSubmit(e){
  e.preventDefault();
  let url = update? '/admin/package/update':'/admin/package';
  Api.post(url, data)
  .then(() => {
      setData({package:'',price:''})
      handleClose()
      dispatch(fetchPackages())
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
            اضافة باكدج
          </Typography>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
                <Grid item xs={12}>
                    <InputLabel htmlFor="chaletImg">اسم الباكدج</InputLabel>
                    <TextField variant="outlined" fullWidth required type="text"  value={data.package} onChange={(e)=>setData({...data,package:e.target.value})}/>
                </Grid>
                <Grid item xs={12}>
                    <InputLabel htmlFor="chaletImg">السعر</InputLabel>
                    <TextField  variant="outlined" fullWidth required type="number"  value={data.price} onChange={(e)=>setData({...data,price:e.target.value})}/>
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
export default Packages;

