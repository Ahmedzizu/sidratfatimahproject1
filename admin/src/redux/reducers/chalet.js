import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Api from './../../config/config';

export const fetchChalets= createAsyncThunk(
  'chalet/fetchChalets',
  async (_, thunkAPI) => {
    try {  
      const response = await Api.get('/admin/chalet')
      return response.data;
    } catch (error) {
  return thunkAPI.rejectWithValue(error.message);
    }
}
);
  const chalet = createSlice({
    name: "chalet",
    initialState: {
      value: { data: [] },
    },
    reducers: {
    },
    extraReducers: (builder) => {
      builder.addCase(fetchChalets.fulfilled, (state, action) => {

        state.value.data=action.payload
      });
    },
  });
export const {} = chalet.actions

export default chalet.reducer