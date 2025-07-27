import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { useNavigate } from 'react-router-dom';
import Api from './../../config/config';

export const fetchHall= createAsyncThunk(
  'hall/fetchHall',
  async (_, thunkAPI) => {
    try {  
      const response = await Api.get('/admin/hall')
      return response.data;
    } catch (error) {
  return thunkAPI.rejectWithValue(error.message);
    }
}
);
  const hall = createSlice({
    name: "hall",
    initialState: {
      value: { data: [] },
    },
    reducers: {
    },
    extraReducers: (builder) => {
      builder.addCase(fetchHall.fulfilled, (state, action) => {
        state.value.data=action.payload
      });
    },
  });
export const {} = hall.actions

export default hall.reducer