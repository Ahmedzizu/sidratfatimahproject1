import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Api from '../../config/config';

// fetchUserData: fetches user details from the backend
export const fetchUserData = createAsyncThunk(
    'user/fetchUserData',
    async (_, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('userToken');
            if (!token) {
                return rejectWithValue('No token found'); // Use rejectWithValue to handle absence of token as an error state
            }
            const response = await Api.get('/users/data'); // Assuming this endpoint returns user data
            return response.data;
        } catch (error) {
            console.error("Error fetching user data:", error.response?.data || error.message);
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch user data');
        }
    }
);

// fetchUserReservations: fetches reservations for the logged-in user
export const fetchUserReservations = createAsyncThunk(
    'user/fetchUserReservations',
    async (_, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('userToken');
            if (!token) {
                return rejectWithValue('No token found for reservations');
            }
            const response = await Api.get('/users/reservation'); // Assuming this endpoint returns user reservations
            return response.data;
        } catch (error) {
            console.error("Error fetching user reservations:", error.response?.data || error.message);
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch user reservations');
        }
    }
);

const initialState = {
    data: null, // Stores the full user object
    isAuthenticated: !!localStorage.getItem('userToken'), // Checks if a token exists on init
    reservations: [], // Stores user's reservations
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed' for fetchUserData
    reservationsStatus: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed' for fetchUserReservations
    error: null, // General error state
};

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        // 'login' action to update state immediately after signin (before fetchUserData completes)
        login: (state, action) => {
            state.data = action.payload; // Payload should be the user object
            state.isAuthenticated = true;
            state.status = 'succeeded'; // Set status to succeeded if login is manual/immediate
            state.error = null;
        },
        // 'logout' action to clear user data and token
        logout: (state) => {
            state.data = null;
            state.isAuthenticated = false;
            state.reservations = [];
            state.status = 'idle'; // Reset status
            state.reservationsStatus = 'idle';
            state.error = null;
            localStorage.removeItem('userToken'); // Clear token from localStorage
        },
    },
    extraReducers: (builder) => {
        builder
            // Handlers for fetchUserData thunk
            .addCase(fetchUserData.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchUserData.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.data = action.payload; // User data
                state.isAuthenticated = !!action.payload; // Authenticated if data is present
                state.error = null; // Clear previous errors
            })
            .addCase(fetchUserData.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload; // Store the error
                state.data = null; // Clear user data on failure (e.g., token expired/invalid)
                state.isAuthenticated = false; // Set authenticated to false
                localStorage.removeItem('userToken'); // Also clear token from localStorage on auth error
            })
            // Handlers for fetchUserReservations thunk
            .addCase(fetchUserReservations.pending, (state) => {
                state.reservationsStatus = 'loading';
            })
            .addCase(fetchUserReservations.fulfilled, (state, action) => {
                state.reservationsStatus = 'succeeded';
                state.reservations = action.payload;
            })
            .addCase(fetchUserReservations.rejected, (state, action) => {
                state.reservationsStatus = 'failed';
                state.error = action.payload; // General error for reservations
            });
    },
});

export const { login, logout } = userSlice.actions;
export default userSlice.reducer;