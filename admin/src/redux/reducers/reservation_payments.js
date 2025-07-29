import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { useNavigate } from "react-router-dom";
import Api from "../../config/config";

export const fetchReservation_payments = createAsyncThunk(
  "reservation_payments/fetchReservation_payments",
  async (id, { rejectWithValue }) => {
    // ✨ This check prevents the error
    if (!id) {
      console.error("fetchReservation_payments called with an undefined ID.");
      return rejectWithValue("An ID is required to fetch payments.");
    }
    try {
      const response = await Api.get(`/reservation-payments/get-payment/${id}`);
      return response.data;
    } catch (error) {
      // Return the actual error message from the server if available
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchAllReservation_payments = createAsyncThunk(
  "reservation_payments/fetchAllReservation_payments",
  async (_, thunkAPI) => {
    try {
      const response = await Api.get(`/reservation-payments/get-all-payment`);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);



const reservation_payments = createSlice({
  name: "reservation_payments",
  initialState: {
    value: { data: [] , all:[]},
  },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchReservation_payments.fulfilled, (state, action) => {
      state.value.data = action.payload;
    });
    builder.addCase(fetchAllReservation_payments.fulfilled, (state, action) => {
      state.value.all = action.payload;
    });
  },
});
export const {} = reservation_payments.actions;

export default reservation_payments.reducer;
