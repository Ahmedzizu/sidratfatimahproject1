import React ,{useEffect , useState ,useRef} from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import "../scss/addChalets.scss"
import { Grid, InputLabel } from '@mui/material';
import { TextField } from '@mui/material';
import Api from '../config/config';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { fetchPaypal } from './../redux/reducers/finance';
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
const AddPaypal = ({handleClose,handleOpen,open,data:temp, update}) => {
const [data,setData]=useState({name:"",reciver:"",donater:"",amount:'',employee:""})
 const dispatch=useDispatch()
  const { t, i18n } = useTranslation();
  useEffect(()=>{if(temp)setData(temp)
},[temp])

function handleSubmit(e){
  e.preventDefault();
  let url = update? '/admin/paypal/update':'/admin/paypal';
  Api.post(url, data)
  .then(() => {
      dispatch(fetchPaypal())
      handleClose()
  })
  .catch((err)=>{
    console.log(err.message);
  })
}
  return (
    <div>
    <Modal  style={{direction:i18n.language=='en'?"ltr":"rtl"}} open={open} onClose={handleClose} aria-labelledby="modal-modal-title" aria-describedby="modal-modal-description" >
      <Box sx={style} className='model'>
        <Typography id="modal-modal-title" variant="h6" component="h2" sx={{marginBottom:5}}>
          {t("finance.addPaypal")}
        </Typography>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
              <Grid item xs={12}>
                  <TextField variant="outlined" fullWidth required type="text" placeholder={t("finance.bank")} value={data.bank} onChange={(e)=>setData({...data,bank:e.target.value})}/>
              </Grid>
              <Grid item xs={12}>
                  <TextField variant="outlined" fullWidth required type="text" placeholder={t("finance.donator")}  value={data.reciver} onChange={(e)=>setData({...data,reciver:e.target.value})}/>
              </Grid>
              <Grid item xs={12}>
                  <TextField variant="outlined" fullWidth required type="text" placeholder={t("finance.receiver")} value={data.donater} onChange={(e)=>setData({...data,donater:e.target.value})}/>
              </Grid>
              <Grid item xs={12}>
                  <TextField variant="outlined" fullWidth required type="number" placeholder={t("finance.amount")} value={data.amount} onChange={(e)=>setData({...data,amount:e.target.value})}/>
              </Grid>
              <Grid item xs={12}>
                  <Button variant='contained' type='submit' fullWidth style={{backgroundColor:"#B38D46",height:"50px" ,fontSize:"1rem"}}>{t("finance.add")}</Button>
              </Grid>
          </Grid>
        </form>
      </Box>
    </Modal>
  </div>
  )
}

export default AddPaypal