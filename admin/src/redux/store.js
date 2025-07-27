import { configureStore } from '@reduxjs/toolkit';
import chalet from './reducers/chalet';
import resort from './reducers/resort';
import hall from './reducers/hall';
import employee from './reducers/employee';
import finance from './reducers/finance';
import customer from './reducers/customer';
import reservation from './reducers/reservation';
import rates from './reducers/rates';
import services from './reducers/services';
import bank from './reducers/bank';
import reservation_payments from './reducers/reservation_payments';
import authReducer from './reducers/authSlice';
import reservationReducer from './reducers/ReservationCounts'; // تأكد من الاستيراد الصحيح
import treasuryReducer from './reducers/treasury';
export const store = configureStore({
    reducer: {
    // ✅ الخطوة 2: إضافة الـ reducer إلى القائمة
    auth: authReducer,
    reservationCounts: reservationReducer, // قم بتغيير الاسم هنا
    chalet,
    hall,
    resort,
    employee,
    finance,
    customer,
    reservation,
    rates,
    services,
    bank ,
    treasury: treasuryReducer, 
    reservation_payments
  },
});
