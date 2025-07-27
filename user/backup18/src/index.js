// F:\ractprojects\New folder (2)\ggg\user\src\index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './i18n'; 
import { store } from './redux/store';
import { Provider } from 'react-redux';
import "./scss/app.scss";
// ✨ استخدام BrowserRouter هنا
import { BrowserRouter, Route, Routes } from "react-router-dom"; 
import Signin from './pages/Signin';
import Signup from "./pages/Signup";
// ❌ تم إزالة استيراد PhoneVirefy بناءً على طلبك بعدم وجود تحقق للهاتف
// import PhoneVirefy from './pages/PhoneVirefy'; 

import 'bootstrap/dist/css/bootstrap.min.css'; 

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <Provider store={store}>
    <React.StrictMode>
      {/* ✨ استخدام BrowserRouter */}
      <BrowserRouter> 
        <Routes>
          {/* المسارات الأساسية اللي هتظهر مباشرةً */}
          <Route path='/user/signin' element={<Signin />} />
          <Route path='/user/signup' element={<Signup />} />
          {/* ❌ تم إزالة مسار PhoneVirefy بناءً على طلبك */}
          {/* <Route path='/user/phoneVirefy' element={<PhoneVirefy />} /> */} 
          
          {/* باقي المسارات هيتم التعامل معاها في App.js */}
          <Route path='*' element={<App />} /> 
        </Routes>
      </BrowserRouter>
    </React.StrictMode>
  </Provider>
);
