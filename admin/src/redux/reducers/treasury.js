// src/redux/reducers/treasury.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import Api from '../../config/config';

// إنشاء Thunk لجلب البيانات من الـ API
export const fetchTreasuryTransactions = createAsyncThunk(
    'treasury/fetchTransactions',
    async () => {
        // تأكد من وجود /api في البداية
const response = await Api.get('/api/treasury/transactions');
        return response.data;
    }
);
// ✅ الخطوة 1: أضف الإجراء الجديد هنا
export const clearEmployeeShift = createAsyncThunk(
  'treasury/clearEmployeeShift',
  async (transactionIds) => {
    // هذا الإجراء لا يتصل بالخادم، بل يعيد فقط IDs الحركات لتصفيتها
    return transactionIds;
  }
);
const treasurySlice = createSlice({
    name: 'treasury',
    initialState: {
        transactions: [],
        currentBalance: 0,
          grandTotalBalance: 0,
           unclaimedCarryover: 0, // <-- أضف هذا السطر

        loading: false,
        error: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
      .addCase(fetchTreasuryTransactions.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchTreasuryTransactions.fulfilled, (state, action) => {
                state.loading = false;
                state.transactions = action.payload.transactions;
                state.currentBalance = action.payload.currentBalance;
                state.grandTotalBalance = action.payload.grandTotalBalance;
                state.unclaimedCarryover = action.payload.unclaimedCarryover;
            })
            .addCase(fetchTreasuryTransactions.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
             // ✅ الخطوة 2: أضف الحالة الجديدة لتصفير الوردية
         .addCase(clearEmployeeShift.fulfilled, (state, action) => {
        // action.payload يحتوي على مصفوفة IDs الحركات التي تم إغلاقها
        const closedTransactionIds = action.payload;
        
        // نقوم بتصفية قائمة الحركات في الحالة
        // نحتفظ فقط بالحركات التي لا يتطابق الـ ID الخاص بها مع ما تم إغلاقه
        state.transactions = state.transactions.filter(
          (t) => !closedTransactionIds.includes(t._id)
        );
      });
  },
});

export default treasurySlice.reducer;