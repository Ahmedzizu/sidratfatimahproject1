import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import Api from "./../../config/config";

// Thunks
// export const fetchReservations = createAsyncThunk(
//   "reservation/fetchReservations",
//   async (_, thunkAPI) => {
//     try {
//       const response = await Api.get("/admin/reservations/all");
//       return response.data;
//     } catch (error) {
//       return thunkAPI.rejectWithValue(error.message);
//     }
//   }
// );



export const fetchReservations = createAsyncThunk(
  "reservation/fetchReservations",
  async (_, thunkAPI) => {
    try {
      // استدعاء الـ API الجديد الذي يقوم بحساب المبلغ المتبقي في الخادم
      const response = await Api.get("/admin/reservations-with-remaining");
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);


export const fetchInsurance = createAsyncThunk(
  "reservation/fetchInsurance",
  async (_, thunkAPI) => {
    try {
      const response = await Api.get("/admin/insurance");
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);


export const fetchNotification = createAsyncThunk(
  "reservation/fetchNotification",
  async (_, thunkAPI) => {
    try {
      const response = await Api.get("/admin/notification");
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const fetchReservationsServices = createAsyncThunk(
  "reservation/fetchReservationsServices",
  async (_, thunkAPI) => {
    try {
      const response = await Api.get("/admin/reservation/service");
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

// Slice
const reservations = createSlice({
  name: "reservation",
  initialState: {
    value: {
      share: true,
      confirmed: [],
      unConfirmed: [],
      notification: [],
      reservationServices: [],
      insurance: [],
      deferred: [],
      canceled: [],
      cancelRequest: [],
      reservationRevenue: [],
      data: [],
      halls: [],      // فلاتر جديدة
      resorts: [],    // فلاتر جديدة
      chalets: [],    // فلاتر جديدة
    },
  },
  reducers: {
    shareOn: (state) => {
      state.value.share = false;
    },
    shareOff: (state) => {
      state.value.share = true;
    },
    // فلتر القاعات
    filterByHalls: (state) => {
      state.value.halls = state.value.data.filter(
        (ele) => ele.entity?.type === "hall"
      );
    },
    // فلتر المنتجعات
    filterByResorts: (state) => {
      state.value.resorts = state.value.data.filter(
        (ele) => ele.entity?.type === "resort"
      );
    },
    // فلتر الشاليهات
    filterByChalets: (state) => {
      state.value.chalets = state.value.data.filter(
        (ele) => ele.entity?.type === "chalet"
      );
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchReservations.fulfilled, (state, action) => {
      let all = action.payload;
      state.value.data = all;

      // فلتر الحالات
      state.value.unConfirmed = all.filter(
        (ele) => ele.status === "unConfirmed"
      );
      state.value.confirmed = all.filter(
        (ele) => ele.status === "confirmed"
      );
      state.value.canceled = all.filter(
        (ele) => ele.status === "canceled"
      );
      state.value.reservationRevenue = all.filter(
        (ele) => ele.status === "confirmed" || ele.completed
      );
      state.value.deferred = all.filter((ele) => ele.deferred === true);
      state.value.cancelRequest = all.filter(
        (ele) => ele.cancelRequest === true
      );

      // فلاتر جديدة
      state.value.halls = all.filter((ele) => ele.entity?.type === "hall");
      state.value.resorts = all.filter((ele) => ele.entity?.type === "resort");
      state.value.chalets = all.filter((ele) => ele.entity?.type === "chalet");
    });

    builder.addCase(fetchInsurance.fulfilled, (state, action) => {
      state.value.insurance = action.payload;
    });
    builder.addCase(fetchReservationsServices.fulfilled, (state, action) => {
      state.value.reservationServices = action.payload;
    });
    builder.addCase(fetchNotification.fulfilled, (state, action) => {
      state.value.notification = action.payload;
    });
  },
});

export const { shareOn, shareOff, filterByHalls, filterByResorts, filterByChalets } = reservations.actions;

export default reservations.reducer;
