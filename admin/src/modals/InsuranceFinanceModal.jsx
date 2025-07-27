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
import { fetchInsurance } from '../redux/reducers/reservation';
import { useTranslation } from 'react-i18next';

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
const InsuranceFinanceModal = ({handleClose,handleOpen,open,data:temp}) => {
  const { t, i18n } = useTranslation();
  const [data,setData]=useState({insurance:'',damage:''})
 const dispatch=useDispatch()
 useEffect(()=>{if(temp)setData({...temp,damage:temp?.finance?.damage,insurance:temp?.finance?.insurance})
},[temp])
function handleSubmit(e){
  e.preventDefault();
  Api.patch('/admin/insurance/finance', data)
  .then(() => {
      dispatch(fetchInsurance())
      setData({})
      handleClose()
  })
  .catch((err)=>{
    console.log(err.message);
  })
}
  return (
    <div>
    <Modal  style={{direction:i18n.language=='en'?'ltr':"rtl"}} open={open} onClose={handleClose} aria-labelledby="modal-modal-title" aria-describedby="modal-modal-description" >
      <Box sx={style} className='model'>
        <Typography id="modal-modal-title" variant="h6" component="h2" sx={{marginBottom:5}}>
          تعديل التأمينات 
        </Typography>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
              <Grid item xs={12}>
                  <TextField variant="outlined" fullWidth required type="number" placeholder="المبلغ" value={data.insurance} onChange={(e)=>setData({...data,insurance:e.target.value})}/>
              </Grid>
              <Grid item xs={12}>
                  <TextField variant="outlined" fullWidth required type="number" placeholder="التلفيات" value={data.damage} onChange={(e)=>setData({...data,damage:e.target.value})}/>
              </Grid>
              <Grid item xs={12}>
                  <Button variant='contained' type='submit' fullWidth style={{backgroundColor:"#B38D46",height:"50px" ,fontSize:"1rem"}}>اضافة</Button>
              </Grid>
          </Grid>
        </form>
      </Box>
    </Modal>
  </div>
  )
}

export default InsuranceFinanceModal
