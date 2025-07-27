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
import { fetchEmploees ,fetchEmployeeFinance } from '../redux/reducers/employee';


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

function AddEmployeeFinance({ handleClose, update, data: data2, open, onFinish }) {
 const [data,setData]=useState({employee:"",date:"",type:"bonus",bonusHours:0,amount:""})
 const inputFile=useRef()
 const { t, i18n } = useTranslation();
 const dispatch=useDispatch()
 const [loading,setLoading] =useState(false) 

useEffect(()=>{
    dispatch(fetchEmployeeFinance())
    dispatch(fetchEmploees())
},[])


let employees=useSelector((state)=>state.employee.value.data)

function handleSubmit(e) {
  e.preventDefault();
  setLoading(true);
  Api.post("/employee/finance", data)
  .then(() => {
    setData({
      employee: "",
      date: "",
      type: "bonus",
      bonusHours: 0,
      amount: "",
    });
    setLoading(false);

   if (onFinish) {
  onFinish(); // هو اللي بيحتوي على handleClose و Snackbar
} else {
  handleClose(); // fallback
}
  })
    .catch((err) => {
      console.log(err?.response);
      setLoading(false);
    });
}





 return (
    <div>
      <Modal style={{direction:i18n.language=='en'?'ltr':'rtl'}} open={open} onClose={handleClose} aria-labelledby="modal-modal-title" aria-describedby="modal-modal-description" >
        <Box sx={style} className='model'>
          <Typography id="modal-modal-title" variant="h6" component="h2" sx={{marginBottom:5}}>
             أضافة او خصم  
          </Typography>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
                <Grid item xs={6}>
                   <InputLabel htmlFor="chaletImg">{t("employee.name")}</InputLabel>
                  <Select fullWidth value={data.employee} required onChange={(e)=> setData({...data,employee:e.target.value})}>
                    {
                     employees.map((ele) => (
  <MenuItem key={ele._id} value={ele._id}>{ele.name}</MenuItem>
))

                    }
                </Select>
                </Grid>
                <Grid item xs={6}>
                   <InputLabel >النوع</InputLabel>
                    <Select fullWidth value={data.type} required onChange={(e)=> setData({...data,type:e.target.value})}>
                        <MenuItem value="bonus">اضافة</MenuItem>
                        <MenuItem value="discount">خصم</MenuItem>
                    </Select>
                </Grid>
                <Grid item xs={6}>
                   <InputLabel >المبلغ</InputLabel>
                    <TextField variant="outlined" required type="number" value={data.amount} onChange={(e)=>setData({...data,amount:e.target.value})}/>
                </Grid>
                {
                    data.type=="bonus" &&
                    <Grid item xs={6}>
                    <InputLabel >ساعات اضافية</InputLabel>
                     <TextField variant="outlined" required type="number" value={data.bonusHours} onChange={(e)=>setData({...data,bonusHours:e.target.value})}/>
                 </Grid>
                }
                <Grid item xs={6}>
                   <InputLabel >{t("employee.date")}</InputLabel>
                    <TextField variant="outlined" fullWidth required type="date" value={data.date} onChange={(e)=>setData({...data,date:e.target.value})}/>
                </Grid>
                <Grid item xs={6}>
                   <InputLabel >{t("employee.note")}</InputLabel>
                    <TextField variant="outlined" fullWidth type="text" value={data.notes} onChange={(e)=>setData({...data,notes:e.target.value})}/>
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
export default AddEmployeeFinance;

 