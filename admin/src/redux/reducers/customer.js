import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { useNavigate } from 'react-router-dom';
import Api from '../../config/config';

export const fetchCustomer= createAsyncThunk(
  'customer/fetchCustomer',
  async (_, thunkAPI) => {
    try {  
      const response = await Api.get('/admin/customer')
      return response.data;
    } catch (error) {
      const navigate=useNavigate()
      return thunkAPI.rejectWithValue(error.message);
    }
}
);
  const customer = createSlice({
    name: "customer",
    initialState: {
      value: { data: [] },
    },
    reducers: {
    },
    extraReducers: (builder) => {
      builder.addCase(fetchCustomer.fulfilled, (state, action) => {
        state.value.data=action.payload
      });
    },
  });
export const {} = customer.actions

export default customer.reducer