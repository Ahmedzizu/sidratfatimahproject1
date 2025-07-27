import React, { useEffect, useState } from 'react';
import '../scss/signin.scss';
import logo from '../assets/Logo 1.png';
import TextField from '@mui/material/TextField';
import { Button } from '@mui/material';
import Api from './../config/config';
import { useNavigate } from 'react-router-dom';
import { setLog, setLogout } from '../redux/reducers/employee';
import { useDispatch } from 'react-redux';
import { notifyError, notifySuccess } from '../components/Notify';
import { fetchUserData } from '../redux/reducers/employee';
const Signin = () => {

  const dispatch = useDispatch()
  const [data, setData] = useState({ email: '', password: '' });
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()
  
 // src/pages/Signin.jsx

function handleSubmit(e) {
  e.preventDefault();
  
  Api.post('/api/employee/signin', data)
    .then((res) => {
      const { token } = res.data;

      // الخطوة 1: حفظ التوكن
      localStorage.setItem('adminToken', token);
      console.log("✅ 1. تم حفظ التوكن بنجاح.");

   // 1. تحقق أولاً من وجود وردية نشطة
const existingShift = localStorage.getItem('shiftId');

if (!existingShift) {
  // 2. إذا لم توجد وردية، قم بإنشاء واحدة جديدة
  const newShiftId = `Shift-${Date.now()}`;
  const newShiftStartTime = new Date().toISOString();
  localStorage.setItem('shiftId', newShiftId);
  localStorage.setItem('shiftStart', newShiftStartTime);
  console.log("✅ تم بدء وردية جديدة:", newShiftId);
} else {
  // 3. إذا وجدت وردية، لا تفعل شيئاً واتركها كما هي
  console.log("✅ تم استئناف الوردية النشطة:", existingShift);
}

dispatch(fetchUserData(token));
navigate('/');
    })
    .catch((err) => {
      console.error("❌ خطأ في تسجيل الدخول:", err.response?.data || err.message);
      localStorage.removeItem('adminToken');
     
    });

  }
  return (
    <>
      <div className='contain login_admin_page'>
        <div className='cont'>
          <div className='logo'>
            <img src={logo} alt='logo' />
          </div>
          <h2 >سدرة فاطمة للمناسبات و الايجار اليومي</h2>
          <form onSubmit={handleSubmit}>
            <h3>تسجيل الدخول</h3>
            <TextField sx={{ '& .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline': { borderColor: '#B38D46' }, '& .MuiInputLabel-outlined': { color: '#515151' }, }}
              required
              id='outlined-basic'
              placeholder="البريد الالكتروني"
              value={data.email}
              onChange={(e) => setData({ ...data, email: e.target.value })}
              error={email}
              helperText={email}
              variant='outlined'
              type='email'
            />
            <TextField
              sx={{
                '& .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline': { borderColor: '#B38D46' },
                '& .MuiInputLabel-outlined': { color: '#515151' },
              }}
              required
              id='outlined-basic'
              value={data.password}
              onChange={(e) => setData({ ...data, password: e.target.value })}
              placeholder='كلمة السر'
              variant='outlined'
              type='password'
              error={password}
              helperText={password}
            />
            <div className="btns">
              <Button variant='contained' type='submit' className='btn'>الدخول</Button>
            </div>
          </form>
        </div>
      </div>
      <div className="buble1"></div>
      <div className="buble2"></div>
      <div className="buble3"></div>
    </>
  );
};

export default Signin;
