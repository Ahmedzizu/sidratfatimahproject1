// redux/reducers/hall.js
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import Api from "../../config/config";

export const fetchHalls = createAsyncThunk(
    "hall/fetchHalls",
    async (_, thunkAPI) => {
        try {
            const response = await Api.get("/admin/hall"); // افتراض أنك تريد جلب جميع القاعات هنا
            // إذا كنت تفضل الفلترة حسب التاريخ من البداية:
            // const date = new Date().toISOString().split("T")[0];
            // const response = await Api.post("/admin/hall/by-date", { date: date });

            console.log("✅ البيانات المسترجعة من API (halls):", response.data);
            return response.data;
        } catch (error) {
            console.error("❌ خطأ في جلب القاعات:", error.response?.data || error.message);
            return thunkAPI.rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const getHallCard = createAsyncThunk(
    'hall/getHallCard',
    async (hallId, { rejectWithValue }) => {
        try {
            const response = await Api.get(`/halls/${hallId}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching single hall (${hallId}):`, error.response?.data || error.message);
            return rejectWithValue(error.response?.data || `Failed to fetch hall ${hallId}`);
        }
    }
);

const initialState = {
    data: [],
    filteredData: [], // ✅ جديد: لحفظ البيانات بعد الفلترة
    selectedHall: null,
    searchTerm: {
        query: "", // ✅ جديد: حقل للبحث العادي بالاسم
        minPrice: "", maxPrice: '', area: '', rooms: '', capacity: '',
        pools: '', kitchen: '', bedrooms: '', bathrooms: '', lounges: ''
    }, // ✅ تم تعديل searchTerm ليكون object
    status: 'idle',
    error: null,
};

const hallSlice = createSlice({
    name: "hall",
    initialState,
    reducers: {
        setSearch: (state, action) => {
            // ✅ التحقق من نوع الـ payload وتحديث searchTerm بناءً عليه
            if (typeof action.payload === 'string') {
                state.searchTerm = { ...state.searchTerm, query: action.payload };
            } else if (typeof action.payload === 'object' && action.payload !== null) {
                state.searchTerm = { ...state.searchTerm, ...action.payload };
            } else {
                state.searchTerm = { query: "" };
            }
            // ✅ استدعاء دالة الفلترة بعد تحديث searchTerm
            applyFilters(state);
        },
        clearSearch: (state) => {
            // ✅ جديد: لمسح جميع الفلاتر
            state.searchTerm = {
                query: "",
                minPrice: "", maxPrice: '', area: '', rooms: '', capacity: '',
                pools: '', kitchen: '', bedrooms: '', bathrooms: '', lounges: ''
            };
            applyFilters(state); // تطبيق الفلاتر (يعني عرض كل البيانات الأصلية)
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchHalls.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchHalls.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.data = action.payload || [];
                state.error = null;
                applyFilters(state); // ✅ فلترة البيانات بعد جلبها لأول مرة
                console.log("📌 بيانات القاعات المخزنة في Redux:", state.data);
            })
            .addCase(fetchHalls.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
                state.data = [];
                state.filteredData = []; // ✅ مسح البيانات المفلترة في حالة الفشل
                console.error("❌ فشل في جلب القاعات:", action.payload);
            })
            .addCase(getHallCard.fulfilled, (state, action) => {
                state.selectedHall = action.payload;
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
        filtered = filtered.filter(hall =>
            hall.name?.toLowerCase().includes(lowerCaseQuery) ||
            hall.address?.toLowerCase().includes(lowerCaseQuery) // تأكد من وجود حقل address في موديل القاعات
        );
    }

    // فلترة بناءً على البحث المفصل (تأكد من مقارنة الأرقام كأرقام)
    if (minPrice !== "" && !isNaN(parseFloat(minPrice))) {
        filtered = filtered.filter(hall => hall.price >= parseFloat(minPrice));
    }
    if (maxPrice !== "" && !isNaN(parseFloat(maxPrice))) {
        filtered = filtered.filter(hall => hall.price <= parseFloat(maxPrice));
    }
    if (area !== "" && !isNaN(parseFloat(area))) {
        filtered = filtered.filter(hall => hall.area >= parseFloat(area));
    }
    if (rooms !== "" && !isNaN(parseFloat(rooms))) {
        filtered = filtered.filter(hall => hall.rooms >= parseFloat(rooms)); // تأكد من اسم الحقل الصحيح للقاعات
    }
    if (capacity !== "" && !isNaN(parseFloat(capacity))) {
        filtered = filtered.filter(hall => hall.capacity >= parseFloat(capacity));
    }
    // ملاحظة: لـ pools, kitchen, bedrooms, bathrooms, lounges
    // تأكد من أسماء الحقول في الـ DB ونوع البيانات في موديل القاعات
    // بما أن القاعات قد لا تحتوي على نفس حقول الشاليهات بالضبط، قد تحتاج لتعديل هذه الفلاتر
    if (pools !== "" && !isNaN(parseFloat(pools))) {
        // إذا كان للقاعات حقل pools
        filtered = filtered.filter(hall => hall.pools >= parseFloat(pools));
    }
    if (kitchen !== "" && !isNaN(parseFloat(kitchen))) {
        // إذا كان للقاعات حقل kitchen
        filtered = filtered.filter(hall => hall.kitchen >= parseFloat(kitchen));
    }
    if (bedrooms !== "" && !isNaN(parseFloat(bedrooms))) {
        // إذا كان للقاعات حقل bedrooms
        filtered = filtered.filter(hall => hall.rooms >= parseFloat(bedrooms)); // غالبًا الغرف هي البديل لغرف النوم في القاعات
    }
    if (bathrooms !== "" && !isNaN(parseFloat(bathrooms))) {
        // إذا كان للقاعات حقل bathrooms
        filtered = filtered.filter(hall => hall.bathrooms >= parseFloat(bathrooms));
    }
    if (lounges !== "" && !isNaN(parseFloat(lounges))) {
        // إذا كان للقاعات حقل lounges
        filtered = filtered.filter(hall => hall.halls >= parseFloat(lounges)); // غالبًا عدد القاعات (Halls) هو البديل لـ lounges
    }


    state.filteredData = filtered;
};

export const { setSearch, clearSearch } = hallSlice.actions; // ✅ تصدير setSearch و clearSearch
export default hallSlice.reducer;