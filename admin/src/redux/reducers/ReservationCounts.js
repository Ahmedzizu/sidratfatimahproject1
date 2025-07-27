import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const fetchReservationCounts = createAsyncThunk(
  'reservation/fetchReservationCounts',
  async (_, thunkAPI) => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/admin/reservations/getReservationCountsByType`);
      console.log('API Response:', response.data); // Debugging the API response
      return response.data;
    } catch (error) {
      console.error('API Error:', error); // Log any errors from the API call
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

const initialState = {
  hallsCount: 0,
  chaletsCount: 0,
  resortsCount: 0,
  unpaidClientsCount: 0,
  hallsStartingToday: 0,
    hallsEndingToday: 0,
    chaletsStartingToday: 0,
    chaletsEndingToday: 0,
    loading: false,
    error: null,
  
};

const reservationSlice = createSlice({
  name: 'reservationCounts',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchReservationCounts.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchReservationCounts.fulfilled, (state, action) => {
        console.log('Payload in fulfilled:', action.payload); // تحقق من الـ Payload
      
        const { reservationCounts, unpaidClientsCount ,unconfirmedReservationsCount } = action.payload || {};
        if (reservationCounts) {
          reservationCounts.forEach((item) => {
            if (item.type === 'hall') state.hallsCount = item.count;
            if (item.type === 'chalet') state.chaletsCount = item.count;
            if (item.type === 'resort') state.resortsCount = item.count;
          });
        }
      state.hallsCount = action.payload.reservationCounts.find(c => c.type === 'hall')?.count || 0;
        state.chaletsCount = action.payload.reservationCounts.find(c => c.type === 'chalet')?.count || 0;
        state.unconfirmedReservationsCount = action.payload.unconfirmedReservationsCount;
        state.unpaidClientsCount = action.payload.unpaidClientsCount;
        state.unpaidClientsCount = unpaidClientsCount || 0;
        state.unconfirmedReservationsCount = unconfirmedReservationsCount || 0; // السطر المحدث
        console.log('Updated state after fulfilled:', JSON.stringify(state)); // تحقق من القيم بعد التحديث
             
        state.hallsStartingToday = action.payload.hallsStartingToday;
        state.hallsEndingToday = action.payload.hallsEndingToday;
        state.chaletsStartingToday = action.payload.chaletsStartingToday;
        state.chaletsEndingToday = action.payload.chaletsEndingToday;
      })
      .addCase(fetchReservationCounts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default reservationSlice.reducer;
