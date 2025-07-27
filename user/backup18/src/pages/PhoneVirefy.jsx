import React, { useState ,useEffect} from 'react';
import '../scss/signup.scss';
import logo from '../assets/Logo 1.png';
import TextField from '@mui/material/TextField';
import { Button } from '@mui/material';
import Api from '../config/config';
const PhoneVirefy = () => {
  const [data, setData] = useState({  otb: ''});
  const [otb,setOtb]=useState('')

  useEffect(()=>sendOtb(),[])

  function handleSubmit(e){
    e.preventDefault()
    Api.post('/users/phoneVirefy',data)
    .then((res)=>{
      setData({otb: ''})
      setOtb("")
    })
    .catch((err)=>{
      console.log(err);
      let otbMsg =err.response.data.otp
      if(otbMsg) setOtb(otbMsg) 
      else setOtb("")
    })
  }
  function sendOtb(){
    Api.get('/users/sendOtb')
    .catch((err)=>console.log(err))
  }
  return (
    <div className='contain'>
      <div className='cont'>
        <div className='logo'>
          <img src={logo} alt='log' />
        </div>
        <h2>سدرة فاطمة للمناسبات و الايجار اليومي</h2>
        <form onSubmit={handleSubmit}>
          <h3 className='subtitle'>تأكيد رقم  الهاتف</h3>
          <p> تم ارسال كود التفعيل عن طريق sms</p>
          <TextField sx={{'& .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline': { borderColor: '#B38D46' },'& .MuiInputLabel-outlined': { color: '#515151' },}}
            required
            id='outlined-basic'
            label='رمز otp'
            value={data.otb}
            onChange={(e)=>setData({otb:e.target.value})}
            error={otb}
            helperText={otb}
            variant='outlined'
            type='number'
          />
          <a onClick={sendOtb}>اعادة ارسال رمز otp ؟</a>
          <div className="btns">
            <Button variant='contained' type='submit' className='btn'>استمرار</Button>
          </div>
        </form>
        <div className="buble1"></div>
        <div className="buble2"></div>
        <div className="buble3"></div>
      </div>
    </div>
  );
};

export default PhoneVirefy;
