// redux/reducers/chalet.js
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import Api from "../../config/config";

// ✅ Fetch chalets from API
export const fetchChalets = createAsyncThunk(
    "chalet/fetchChalets",
    async (_, thunkAPI) => {
        try {
            const response = await Api.get("/admin/chalet"); 

            console.log("✅ البيانات المسترجعة من API (chalets):", response.data);
            return response.data;
        } catch (error) {
            console.error("❌ خطأ في جلب الشاليهات:", error.response?.data || error.message);
            return thunkAPI.rejectWithValue(error.response?.data || error.message);
        }
    }
);

// ✅ Get single chalet card
export const getChaletCard = createAsyncThunk(
    'chalet/getChaletCard',
    async (chaletId, { rejectWithValue }) => {
        try {
            const response = await Api.get(`/chalets/${chaletId}`); 
            return response.data;
        } catch (error) {
            console.error(`Error fetching single chalet (${chaletId}):`, error.response?.data || error.message);
            return rejectWithValue(error.response?.data || `Failed to fetch chalet ${chaletId}`);
        }
    }
);

const initialState = {
    data: [], 
    filteredData: [], 
    selectedChalet: null,
    searchTerm: {
        query: "", 
        minPrice: "",
        maxPrice: '',
        area: '',
        rooms: '',
        capacity: '',
        pools: '',
        kitchen: '',
        bedrooms: '',
        bathrooms: '',
        lounges: ''
    }, 
    status: 'idle',
    error: null,
};

const chaletSlice = createSlice({
    name: "chalet",
    initialState,
    reducers: {
        setSearch: (state, action) => {
            if (typeof action.payload === 'string') {
                state.searchTerm = { ...state.searchTerm, query: action.payload };
            } else if (typeof action.payload === 'object' && action.payload !== null) {
                state.searchTerm = { ...state.searchTerm, ...action.payload };
            } else {
                state.searchTerm = { query: "" };
            }
            applyFilters(state);
        },
        clearSearch: (state) => {
            state.searchTerm = {
                query: "",
                minPrice: "", maxPrice: '', area: '', rooms: '', capacity: '',
                pools: '', kitchen: '', bedrooms: '', bathrooms: '', lounges: ''
            };
            applyFilters(state);
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchChalets.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchChalets.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.data = action.payload || [];
                state.error = null;
                applyFilters(state);
                console.log("📌 بيانات الشاليهات المخزنة في Redux:", state.data);
            })
            .addCase(fetchChalets.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
                state.data = [];
                state.filteredData = [];
                console.error("❌ فشل في جلب الشاليهات:", action.payload);
            })
            .addCase(getChaletCard.fulfilled, (state, action) => {
                state.selectedChalet = action.payload;
            });
    },
});

// ✅ دالة جديدة لتطبيق الفلاتر على البيانات
const applyFilters = (state) => {
    const { query, minPrice, maxPrice, area, rooms, capacity, pools, kitchen, bedrooms, bathrooms, lounges } = state.searchTerm;
    let filtered = state.data;

    // فلترة بناءً على البحث العادي (بالاسم أو العنوان)
    if (query) {
        const lowerCaseQuery = query.toLowerCase();
        filtered = filtered.filter(chalet =>
            chalet.name?.toLowerCase().includes(lowerCaseQuery) ||
            chalet.address?.toLowerCase().includes(lowerCaseQuery)
        );
    }

    // فلترة بناءً على البحث المفصل (تأكد من مقارنة الأرقام كأرقام)
    if (minPrice !== "" && !isNaN(parseFloat(minPrice))) {
        filtered = filtered.filter(chalet => chalet.price >= parseFloat(minPrice));
    }
    if (maxPrice !== "" && !isNaN(parseFloat(maxPrice))) {
        filtered = filtered.filter(chalet => chalet.price <= parseFloat(maxPrice));
    }
    if (area !== "" && !isNaN(parseFloat(area))) {
        filtered = filtered.filter(chalet => chalet.area >= parseFloat(area));
    }
    if (rooms !== "" && !isNaN(parseFloat(rooms))) {
        filtered = filtered.filter(chalet => chalet.rooms >= parseFloat(rooms));
    }
    if (capacity !== "" && !isNaN(parseFloat(capacity))) {
        filtered = filtered.filter(chalet => chalet.capacity >= parseFloat(capacity));
    }
    if (pools !== "" && !isNaN(parseFloat(pools))) {
        filtered = filtered.filter(chalet => chalet.pools >= parseFloat(pools));
    }
    if (kitchen !== "" && !isNaN(parseFloat(kitchen))) {
        filtered = filtered.filter(chalet => chalet.kitchen >= parseFloat(kitchen));
    }
    if (bedrooms !== "" && !isNaN(parseFloat(bedrooms))) {
        filtered = filtered.filter(chalet => chalet.sleeping >= parseFloat(bedrooms)); 
    }
    if (bathrooms !== "" && !isNaN(parseFloat(bathrooms))) {
        filtered = filtered.filter(chalet => chalet.bath >= parseFloat(bathrooms)); 
    }
    if (lounges !== "" && !isNaN(parseFloat(lounges))) {
        filtered = filtered.filter(chalet => chalet.lounge >= parseFloat(lounges)); 
    }


    state.filteredData = filtered; // هذا السطر هو السطر 164 تقريبًا في كودك بعد التعديلات
};

export const { setSearch, clearSearch } = chaletSlice.actions; 
export default chaletSlice.reducer;