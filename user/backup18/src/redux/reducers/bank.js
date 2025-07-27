import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { useNavigate } from "react-router-dom";
import Api from "../../config/config";

export const fetchBankDetails = createAsyncThunk(
  "bank/fetchBankDetails",
  async (_, thunkAPI) => {
    try {
      const response = await Api.get("/bank-details/all");
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

const bank = createSlice({
  name: "bank",
  initialState: {
    value: { data: [] },
  },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchBankDetails.fulfilled, (state, action) => {
      state.value.data = action.payload;
    });
  },
});
export const {} = bank.actions;

export default bank.reducer;
