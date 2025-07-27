import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Api from '../../config/config';

export const fetchResort = createAsyncThunk(
    'resort/fetchResort',
    async (_, thunkAPI) => {
        try { 
            const response = await Api.get('/admin/resort');
            console.log("✅ البيانات المسترجعة من API (resorts):", response.data);
            return response.data;
        } catch (error) {
            console.error("❌ خطأ في جلب المنتجعات:", error.response?.data || error.message);
            return thunkAPI.rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const getResortCard = createAsyncThunk(
    'resort/getResortCard',
    async (resortId, { rejectWithValue }) => {
        try {
            const response = await Api.get(`/resorts/${resortId}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching single resort (${resortId}):`, error.response?.data || error.message);
            return rejectWithValue(error.response?.data || `Failed to fetch resort ${resortId}`);
        }
    }
);

const initialState = {
    data: [],
    selectedResort: null,
    status: 'idle',
    error: null,
};

const resortSlice = createSlice({
    name: "resort",
    initialState,
    reducers: {
        // If getResortCard was a regular reducer, it would be here. But it's a thunk now.
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchResort.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchResort.fulfilled, (state, action) => {
                state.status = 'succeeded';
                let resorts = action.payload;
                resorts = resorts.map((resort) => {
                    if (resort.details && typeof resort.details === 'string' && resort.details.includes('-')) {
                        resort.details = resort.details.split('-');
                    }
                    return resort;
                });
                state.data = resorts;
                state.error = null;
            })
            .addCase(fetchResort.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
                state.data = [];
                console.error("❌ فشل في جلب المنتجعات:", action.payload);
            })
            .addCase(getResortCard.fulfilled, (state, action) => {
                state.selectedResort = action.payload;
            });
    },
});

// ✅ FIXED: No longer exporting getResortCard from slice.actions
export const { /* any other regular actions if you have them */ } = resortSlice.actions; 
export default resortSlice.reducer;