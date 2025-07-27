import { useEffect, useRef, useState } from 'react'
import * as React from 'react';
import { DateRange ,DateRangePicker  ,Calendar} from 'react-date-range'
import format from 'date-fns/format'
import { differenceInDays } from 'date-fns'
import 'react-date-range/dist/styles.css'
import 'react-date-range/dist/theme/default.css'
import {  Grid, TextField } from '@mui/material';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import paypal from "../assets/paypal.webp"
import Footer from './Footer';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import "../scss/calender.scss"
import Api from '../config/config';
import { useSelector ,useDispatch } from 'react-redux'
import Dialoge from './Dialoge'
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import Backdrop from '@mui/material/Backdrop';
import "../scss/chaletCard.scss"
import { useTranslation } from 'react-i18next';
import MapLocation from './MapLocation';
import { useNavigate } from 'react-router-dom';
import { Button } from 'react-bootstrap';

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

function ReservationCalendar({data:data2}) {

  const dispatch =useDispatch()
  const { t, i18n } = useTranslation();
  let reservations=useSelector((state)=>state.user.value.reservations)
  const login=useSelector((state)=>state.user.value.logedin)
  const user=useSelector((state)=>state.user.value.data)
  const [data,setData]=useState({type:"resort",startDate:new Date(),endDate:new Date(),periodType:'days',dayPeriod:'كامل اليوم',cost:data2? data2?.price?.wholeDay : 0})
  const [open, setOpen] = useState(true)
  const refOne = useRef(null)
  const [loading,setLoading]=useState(false)
  const [prices,setPrices]=useState({wholeDay:"",morning:"",night:""})
  const navigate=useNavigate()
  const [snackOpen,setSnackOpen]=useState(false)
  const [errMsg , setErrMsg] = useState()
  const [snackOpen2,setSnackOpen2]=useState(false)
  const [period,setPeriod]=useState(0)
  const [dialogeMsg,setDialogeMsg]=useState(false)
  const handelClose=()=>setDialogeMsg(false)
  const handleButtonClick = (index) =>setData({...data,dayPeriod:index});
  const [range, setRange] = useState([{
      startDate:data.startDate,
      endDate:data.endDate,
      key: 'selection'
    }]
  )
  useEffect(()=>{
    setPrices(data2?.price)
  },[data2])

  function handleSelect(date){
    setRange([date])
    const numDays = differenceInDays(date.endDate, date.startDate); 
    const pricePerDay = data2?.price?.wholeDay; 
    const total = numDays * pricePerDay; 
    setData({...data,startDate: date.startDate,endDate:date.endDate,cost: total+ pricePerDay})
  }
  function handleSelectCalender(e){
    setData({...data,startDate:e,endDate:e,cost:data2.price?.wholeDay})
  }
  const buttonGroup = [
    { label: 'صباحية', value: 'صباحية',enLabel:"Morning",startType:"dayStartHour",endType:"dayEndHour" },
    { label: 'مسائية', value: 'مسائية',enLabel:"Night",startType:"nightStartHour",endType:"nightEndHour" },
    { label: 'كامل اليوم', value: 'كامل اليوم',enLabel:"Whole Day",startType:"dayStartHour",endType:"nightEndHour"},
  ];
  const disabledPeriods = [
    {
      start: new Date(2023, 4, 15),
      end: new Date(2023, 4, 20)
    },
    {
      start: new Date(2023, 4, 1),
      end: new Date(2023, 4, 7)
    }
  ];
  const disabledDates = [
    new Date('2023-04-21'),
    new Date('2023-04-20')
  ];
  function CircularProgressWithLabel(props) {
    return (
      <Box sx={{ position: 'relative', display: 'inline-flex' }}>
        <CircularProgress variant="determinate" {...props} />
        <Box sx={{ top: 0, left: 0, bottom: 0, right: 0, position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center',}}>
          <Typography variant="caption" style={{fontWeight:"700",fontSize:"1.2rem"}} color="text.secondary">
             {props.label}
          </Typography>
        </Box>
      </Box>
    );
  }

  function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
  
    if (!login) {
      setDialogeMsg(true);
      return;
    }
  
    // ✅ التحقق من المدخلات المطلوبة
    if (!user.name || !user.phone || !user.idNumber || !user.nationality) {
      setErrMsg("⚠️ يرجى ملء جميع الحقول المطلوبة قبل المتابعة!");
      setSnackOpen2(true);
      setLoading(false);
      return;
    }
  
    Api.post("/user/reservation", {
      ...data,
      image: data2.images[0],
      clientId: user._id,
      phone: user.phone,
      clientName: user.name,
      idNumber: user.idNumber,
      nationality: user.nationality,
      entityId: data2._id,
      entityName: data2.name,
      startDate: format(data.startDate, "yyyy-MM-dd"),
      endDate: format(data.endDate, "yyyy-MM-dd"),
    })
      .then((res) => {
        setTimeout(() => {
          setLoading(false);
          setSnackOpen(true);
          navigate("/reservations");
        }, 1000);
      })
      .catch((error) => {
        let errStatus = error?.response?.status;
        let errMsg =
          errStatus == 405
            ? "⚠️ يوجد حجز في هذه الفترة!"
            : "⚠️ لقد تم الحجز بالفعل!";
        setErrMsg(errMsg);
        setTimeout(() => {
          setSnackOpen2(true);
          setLoading(false);
        }, 1000);
      });
  }
  

    const DayPeriodPrice=(period)=>{
      if(period == 'صباحية') setData({...data,dayPeriod:period,cost:prices.morning})
      if(period == 'مسائية') setData({...data,dayPeriod:period,cost:prices.night})
      if(period == 'كامل اليوم') setData({...data,dayPeriod:period,cost:prices.wholeDay})
    }
    const handleChange= (e)=>{
      setData({...data,periodType:e.target.value,startDate:new Date(),endDate:new Date(),cost:data2?.price?.wholeDay,dayPeriod:"كامل اليوم"})
      setRange([{
        startDate:new Date(),
        endDate:new Date(),
        key: 'selection'
      }])
    }
    return (
    <>{
      data2 &&
      <>
    <div className="reservation" >
      <form className="left-side" onSubmit={handleSubmit}>
      {i18n.language=='ar'? <h3 style={{direction:i18n.language=='ar'?'ltr':"rtl"}}> <span>{data2?.price?.wholeDay}</span> {t("details.price")}</h3>
        :<h3 style={{direction:i18n.language=='ar'?'ltr':"rtl"}}>{t("details.price")} <span>{data2?.price?.wholeDay}</span></h3>}
        <div className="box">
          <div className="arrive">
          <p>{t("details.arrive")}</p>
            <p>{`${format(data.startDate,'dd/MM/yyyy') }`}</p>
          </div>
          <div className="leave">
            <p>{t("details.left")}</p>
            {data.periodType=='days'? <p>{`${format(data.endDate,'dd/MM/yyyy') }`}</p>:<p>{`${format(data.startDate,'MM/dd/yyyy') }`}</p>}
          </div>
        </div>
        <div className="total">
        {i18n.language=='ar' &&<> <p >{t("details.total")}</p><span>{data.cost}</span></>}
         {i18n.language=='en' &&<><span>{data.cost}</span> <p >{t("details.total")}</p></>}
        </div>
        <Button
  variant="contained"
  className="choose"
  type="submit"
  disabled={data?.maintenance}
  onClick={(e) => {
    e.preventDefault();

    if (data?.maintenance) {
      alert(`⚠️ القاعة "${data2.name}" تحت الصيانة. يرجى اختيار قاعة أخرى.`);
      return;
    }

    if (!user.name || !user.phone || !user.idNumber || !user.nationality) {
      setErrMsg("⚠️ يرجى ملء جميع الحقول المطلوبة قبل المتابعة!");
      setSnackOpen2(true);
      return;
    }

    handleSubmit(e);
  }}
>
  {t("details.choose")}
</Button>
      <p className='subtitle' style={{textAlign:"center"}}>{t("details.pill")}</p>
        <Grid container spacing={2} width={'80%'} margin='auto'>
          <Grid item xs={4} className='spinner'>
              <CircularProgressWithLabel style={{color:"var(--primary)"}} variant="determinate" value={100} label={3} />
              {/* <p className='date'>date</p> */}
              <p className='price'>{Math.round(data.cost/3)}</p>
          </Grid> 
          <Grid item xs={4} className='spinner'>
             <CircularProgressWithLabel style={{color:"var(--primary)"}}  variant="determinate" value={66} label={2} />
             {/* <p className='date'>date</p> */}
             <p className='price'>{Math.round(data.cost/3)}</p>
          </Grid> 
          <Grid item xs={4} className='spinner'>
             <CircularProgressWithLabel style={{color:"var(--primary)"}}  variant="determinate" value={33} label={1} />
             {/* <p className='date'>date</p> */}
             <p className='price'>{Math.round(data.cost/3)}</p>
          </Grid> 
        </Grid> 
      </form>
 
    {open &&      
    <div className="calendar">
     <div ref={refOne} className='calendar-box'>
      <div>
        <RadioGroup row aria-labelledby="demo-radio-buttons-group-label" defaultValue="days" name="radio-buttons-group" onChange={handleChange}>
          <FormControlLabel value="dayPeriod"  control={<Radio />} label={t("details.periodOfDay")} />
          <FormControlLabel value="days" control={<Radio />} label={t("details.days")} />
        </RadioGroup>
        {data.periodType=='dayPeriod' &&<TextField fullWidth  value={`${format(data.startDate,'MM/dd/yyyy')}`} InputProps={{readOnly: true}} className="inputBox" />}
        {data.periodType=='days'&& <TextField fullWidth  value={`${format(data.startDate,'MM/dd/yyyy') } to ${format(data.endDate,'MM/dd/yyyy') }`} InputProps={{readOnly: true}} className="inputBox" />}
      </div>
           {data.periodType=='days'? <DateRange onChange={(item)=>handleSelect(item.selection)} editableDateInputs={true} moveRangeOnFirstSelection={false} ranges={range} minDate={new Date()} months={1} direction="horizontal" className="calendarElement" disabledDates={disabledPeriods} />
            :<Calendar className='calendarElement' onChange={handleSelectCalender} minDate={new Date()} disabledDates={disabledDates} date={data.startDate}/>}
      </div> 
     {data.periodType=='dayPeriod'&& <div className="period">
        <h3 >{t("details.period")}</h3>
        <div className="btns-box">
          {buttonGroup.map((button,index) => (
            <Button key={index} type='button' className={data.dayPeriod === button.label ? 'active btns' : 'btns'} onClick={() => DayPeriodPrice(button.label)}>
              {i18n.language=='en'? button.enLabel:button.label}
              {data2[button.startType] && data2[button.endType]&& <span className='period-box'>{`from ${data2[button.startType]} / to ${data2[button.endType] } `}</span>}
            </Button>
          ))}
        </div>
        </div>}
      </div> }
      {/* <FormLabel id="demo-radio-buttons-group-label" className='payment-label'>اختار طريقة الدفع</FormLabel>
        <RadioGroup row aria-labelledby="demo-radio-buttons-group-label" defaultValue="offline" name="radio-buttons-group">
          <FormControlLabel value="offline" control={<Radio />} label="الدفع عند الوصول" />
          <FormControlLabel value="paypal" control={<Radio />} label={<img src={paypal} alt='Paypal' width="120px" height="60px"/>} />
        </RadioGroup>
        <Button type='submit' variant='contained'>اتمام الحجز</Button>  */}
    </div>
    <MapLocation/>
    </>
    }
    <Footer/>

    <Dialoge open={dialogeMsg} handleClose={handelClose}/>

    <Snackbar open={snackOpen} autoHideDuration={6000} onClose={()=>setSnackOpen(false)}>
      <Alert onClose={()=>setSnackOpen(false)} severity="success" sx={{ width: '100%' }}>
     !! تم الحجز بنجاح 
      </Alert>
    </Snackbar>

    <Snackbar open={snackOpen2} autoHideDuration={6000} onClose={()=>setSnackOpen2(false)}>
      <Alert onClose={()=>setSnackOpen2(false)} severity="warning" sx={{ width: '100%' }}>
        {errMsg}
      </Alert>
    </Snackbar>

    <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </>
  );
}

export default ReservationCalendar;
