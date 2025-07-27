import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Api from './../../config/config';

export const fetchRates= createAsyncThunk(
  'rates/fetchRates',
  async (_, thunkAPI) => {
    try {  
      const response = await Api.get('/user/reservation/rate')
      return response.data;
    } catch (error) {
  return thunkAPI.rejectWithValue(error.message);
    }
}
);
  const rates = createSlice({
    name: "rates",
    initialState: {
      value: { data: [] },
    },
    reducers: {
    },
    extraReducers: (builder) => {
      builder.addCase(fetchRates.fulfilled, (state, action) => {

        state.value.data=action.payload
      });
    },
  });
export const {} = rates.actions

export default rates.reducer