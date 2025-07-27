import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { useNavigate } from 'react-router-dom';
import Api from './../../config/config';

export const fetchResort= createAsyncThunk(
  'resort/fetchResort',
  async (_, thunkAPI) => {
    try {  
      const response = await Api.get('/admin/resort')
      return response.data;
    } catch (error) {
  return thunkAPI.rejectWithValue(error.message);
    }
}
);
  const resort = createSlice({
    name: "resort",
    initialState: {
      value: { data: [] },
    },
    reducers: {
    },
    extraReducers: (builder) => {
      builder.addCase(fetchResort.fulfilled, (state, action) => {
        state.value.data=action.payload
      });
    },
  });
export const {} = resort.actions

export default resort.reducer