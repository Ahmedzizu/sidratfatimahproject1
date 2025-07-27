// In: redux/reducers/authSlice.js

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,         // سيحتوي على بيانات المستخدم بعد تسجيل الدخول
  token: null,        // لتخزين التوكن (JWT)
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // هذه الـ action سنستدعيها عند نجاح تسجيل الدخول
    loginSuccess: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
    },
    // هذه الـ action سنستدعيها عند تسجيل الخروج
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
    },
  },
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;