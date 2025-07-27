import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Api from '../../config/config';

// ✅ تم حذف useNavigate من هنا وإضافة /api
export const fetchEmploees = createAsyncThunk(
  'employee/fetchEmploees',
  async (_, thunkAPI) => {
    try {
      const response = await Api.get('/api/employee/data');
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

// ✅ تم حذف useNavigate من هنا
// src/redux/reducers/employee.js

export const fetchUserData = createAsyncThunk(
  'employee/fetchUserData',
  // نقبل "توكن" اختياري هنا
  async (token = null, thunkAPI) => {
    try {
      // نجهز إعدادات خاصة للطلب
      const config = {};
      if (token) {
        // إذا تم تمرير توكن، نستخدمه في رأس الطلب مباشرة
        config.headers = {
          Authorization: `Bearer ${token}`,
        };
      }
      
      // نرسل الطلب مع الإعدادات الجديدة
      // إذا لم يتم تمرير توكن، سيعتمد الطلب على الـ interceptor كالعادة
      const response = await Api.get('/api/employee/user/data', config);
      return response.data;

    } catch (error) {
      localStorage.removeItem('adminToken');
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

// ✅ تم حذف useNavigate من هنا
export const fetchEmployeeFinance = createAsyncThunk(
  'employee/fetchEmployeeFinance',
  async (_, thunkAPI) => {
    try {
      const response = await Api.get('/api/employee/finance');
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

// ✅ تم حذف useNavigate من هنا
export const fetchEmployeeAbsence = createAsyncThunk(
  'employee/fetchEmployeeAbsence',
  async (_, thunkAPI) => {
    try {
      const response = await Api.get('/api/employee/absence');
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

const employee = createSlice({
  name: "employee",
  initialState: {
    value: {
      data: [],
      logedin: !!localStorage.getItem('adminToken'), // طريقة أفضل للتحقق
      user: {},
      finance: [],
      absence: []
    },
  },
  reducers: {
    setLog: (state, action) => {
      state.value.logedin = true;
      // ✅ تم حذف السطر الذي يدمر التوكن من هنا
      console.log("✅ تسجيل الدخول: logedin =", state.value.logedin);
    },
    setLogout: (state, action) => {
      state.value.logedin = false;
      localStorage.removeItem('adminToken');
      console.log("❌ تسجيل الخروج: logedin =", state.value.logedin);
    }
  },
  extraReducers: (builder) => {
    builder.addCase(fetchEmploees.fulfilled, (state, action) => {
      state.value.data = action.payload;
    });
    builder.addCase(fetchUserData.fulfilled, (state, action) => {
      state.value.logedin = true;
      state.value.user = action.payload;
      console.log("✅ تم جلب بيانات المستخدم، logedin =", state.value.logedin);
    });
    builder.addCase(fetchUserData.rejected, (state, action) => {
      // ✅ عند فشل جلب البيانات، سجل الخروج
      state.value.logedin = false;
      state.value.user = {};
    });
    builder.addCase(fetchEmployeeFinance.fulfilled, (state, action) => {
      state.value.finance = action.payload;
    });
    builder.addCase(fetchEmployeeAbsence.fulfilled, (state, action) => {
      state.value.absence = action.payload;
    });
  },
});

export const { setLog, setLogout } = employee.actions;
export default employee.reducer;