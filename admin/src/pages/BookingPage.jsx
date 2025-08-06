
import React, { useState, useEffect, useMemo } from "react";
import { TextField, Button, MenuItem, Select, FormControl, InputLabel, Grid, Box, InputAdornment, Typography,Autocomplete ,createFilterOptions  } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import PhoneAndroidIcon from "@mui/icons-material/PhoneAndroid";
import PublicIcon from "@mui/icons-material/Public";
import BadgeIcon from "@mui/icons-material/Badge";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";

// ✅ إضافة استيراد أيقونات Material-UI الجديدة
import EmailIcon from "@mui/icons-material/Email";
import LocationOnIcon from "@mui/icons-material/LocationOn";

import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../scss/booking.scss";
import { useDispatch, useSelector } from "react-redux";
import { fetchCustomer } from "../redux/reducers/customer";
import { fetchBankDetails } from '../redux/reducers/bank';
import { fetchReservations } from "../redux/reducers/reservation";
import Api from '../config/config';
import AddCustomerModal from '../modals/AddCustomer';

// --- دالة validPeriod لتحديد التوفر ---
/**
 * دالة مساعدة لتحديد مدى توافر الكيان (صباحي ومسائي) في تاريخ محدد.
 * @param {string} id - معرف الكيان (القاعة/الشاليه/المنتجع).
 * @param {Array} reservations - قائمة بجميع الحجوزات.
 * @param {string} searchDate - التاريخ الذي يتم البحث فيه (بصيغة YYYY-MM-DD).
 * @returns {{isMorningValid: boolean, isNightValid: boolean}} - حالة التوافر لكل فترة.
 */
function validPeriod(id, reservations, searchDate) {
    let isMorningValid = true;
    let isNightValid = true;
    let entityReservations = reservations.filter((ele) => ele?.entity?.id === id);
    let searchDateMillis = new Date(searchDate).setUTCHours(0, 0, 0, 0);

    if (isNaN(searchDateMillis)) return { isMorningValid, isNightValid };

    entityReservations.forEach((ele) => {
        let resStartDateMillis = new Date(ele?.period?.startDate).setUTCHours(0, 0, 0, 0);
        let resEndDateMillis = new Date(ele?.period?.endDate).setUTCHours(0, 0, 0, 0);

        if (resStartDateMillis <= searchDateMillis && resEndDateMillis >= searchDateMillis) {
            const isSingleDayBooking = resStartDateMillis === resEndDateMillis;
            const isStartDay = searchDateMillis === resStartDateMillis;
            const isEndDay = searchDateMillis === resEndDateMillis;

            if (isSingleDayBooking) {
                if (ele?.period?.dayPeriod === "صباحية" || ele?.period?.dayPeriod === "كامل اليوم") {
                    isMorningValid = false;
                }
                if (ele?.period?.dayPeriod === "مسائية" || ele?.period?.dayPeriod === "كامل اليوم") {
                    isNightValid = false;
                }
            } else {
                if (isStartDay) {
                    if (ele?.period?.checkIn?.name === "صباحية") {
                        isMorningValid = false;
                        isNightValid = false;
                    } else if (ele?.period?.checkIn?.name === "مسائية") {
                        isNightValid = false;
                    }
                } else if (isEndDay) {
                    if (ele?.period?.checkOut?.name === "مسائية") {
                        isMorningValid = false;
                        isNightValid = false;
                    } else if (ele?.period?.checkOut?.name === "صباحية") {
                        isMorningValid = false;
                    }
                } else { // In between multi-day booking
                    isMorningValid = false;
                    isNightValid = false;
                }
            }
        }
    });
    return { isMorningValid, isNightValid, wholeDay: isMorningValid && isNightValid };
}

const DEFAULT_ENTITY_TIMES = {
    dayStartHour: "09:00",
    dayEndHour: "17:00",
    nightStartHour: "18:00",
    nightEndHour: "23:00",
};


const BookingPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();

    const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
    const entityId = queryParams.get("entityId");
    const entityName = queryParams.get("name") || "مكان غير معروف";
    const initialDate = useMemo(() => queryParams.get("date") || new Date().toISOString().split('T')[0], [queryParams]);
const [sources, setSources] = useState([]);
    const price = useMemo(() => {
        const parsedPrice = JSON.parse(queryParams.get("price")) || {};
        return {
            morning: parsedPrice.morning || 0,
            night: parsedPrice.night || 0,
            wholeDay: parsedPrice.wholeDay || 0,
            dayStartHour: parsedPrice.dayStartHour || DEFAULT_ENTITY_TIMES.dayStartHour,
            dayEndHour: parsedPrice.dayEndHour || DEFAULT_ENTITY_TIMES.dayEndHour,
            nightStartHour: parsedPrice.nightStartHour || DEFAULT_ENTITY_TIMES.nightStartHour,
            nightEndHour: parsedPrice.nightEndHour || DEFAULT_ENTITY_TIMES.nightEndHour,
        };
    }, [queryParams]);

    const [formData, setFormData] = useState({
        clientId: null,
        clientName: "",
        phone: "",
        email: "",
        address: "",
        nationality: "",
        idNumber: "",
        selectedPeriod: "wholeDay",
        startDate: initialDate,
        endDate: initialDate,
    source: "", // ✅ تأكد من وجود هذا الحقل هنا

        checkInSelection: "صباحية",
        checkOutSelection: "مسائية",
        checkInPeriod: price.dayStartHour,
        checkOutPeriod: price.nightEndHour,
          paymentMethod: "نقدي",
        paidAmount: "",
        // ✅ تم تغيير bankName إلى bankId وتعيين القيمة الأولية كـ null
        bankId: null,
        discountAmount: "",
        notes: "",
    });

    const [finalCosts, setFinalCosts] = useState({ total: 0, remaining: 0 });
    const customers = useSelector((state) => state.customer.value.data) || [];
     const banks = useSelector((state) => state.bank.value.data) || [];
   
   
    let confirmedReservations = useSelector((state) => state.reservation.value.confirmed);
    let unConfirmedReservations = useSelector((state) => state.reservation.value.unConfirmed);
    let allReservations = useMemo(() => [...(confirmedReservations || []), ...(unConfirmedReservations || [])], [confirmedReservations, unConfirmedReservations]);

    const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCustomerOption, setSelectedCustomerOption] = useState("");

    const currentAvailablePeriods = useMemo(() => {
        if (!entityId || !initialDate || allReservations.length === 0) {
            return { morning: true, night: true, wholeDay: true };
        }
        const { isMorningValid, isNightValid, wholeDay } = validPeriod(entityId, allReservations, initialDate);
        return {
            morning: isMorningValid,
            night: isNightValid,
            wholeDay: wholeDay,
        };
    }, [entityId, allReservations, initialDate]);
 // ✅ دمج جميع استدعاءات الـ API في useEffect واحد
    useEffect(() => {
        dispatch(fetchCustomer());
        dispatch(fetchBankDetails());
        dispatch(fetchReservations());
        Api.get('/reservation-payments/sources/all')
            .then((res) => {
                setSources(res.data);
            })
            .catch(err => console.error("Failed to fetch sources:", err));
    }, [dispatch]);


      // ✅ إضافة دالة handleChange المفقودة
   

    const filteredCustomers = useMemo(() => {
        if (!searchQuery) return customers;
        return customers.filter(customer =>
            customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            customer.phone.includes(searchQuery)
        );
    }, [customers, searchQuery]);

    useEffect(() => {
        let calculatedTotalCost = 0;
        const start = new Date(formData.startDate);
        const end = new Date(formData.endDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
            setFinalCosts({ total: 0, remaining: 0 });
            return;
        }
// This useEffect hook is now correctly placed at the top level.
// Depend on 'open' to trigger the effect.
        const isSingleDayBooking = start.toDateString() === end.toDateString();

        if (isSingleDayBooking) {
            if (formData.selectedPeriod === 'morning') {
                calculatedTotalCost = price.morning;
            } else if (formData.selectedPeriod === 'night') {
                calculatedTotalCost = price.night;
            } else if (formData.selectedPeriod === 'wholeDay') {
                calculatedTotalCost = price.wholeDay;
            }
        } else {
            let currentDate = new Date(start);
            while (currentDate <= end) {
                let dayCost = 0;
                if (currentDate.toDateString() === start.toDateString()) {
                    dayCost = (formData.checkInSelection === 'صباحية') ? price.wholeDay : price.night;
                } else if (currentDate.toDateString() === end.toDateString()) {
                    dayCost = (formData.checkOutSelection === 'صباحية') ? price.morning : price.wholeDay;
                } else {
                    dayCost = price.wholeDay;
                }
                calculatedTotalCost += dayCost;
                currentDate.setDate(currentDate.getDate() + 1);
            }
        }

        const discount = parseFloat(formData.discountAmount) || 0;
        const paid = parseFloat(formData.paidAmount) || 0;

        const finalCostAfterDiscount = calculatedTotalCost ;
        const remaining = finalCostAfterDiscount - paid- discount;

        setFinalCosts({
            total: Math.max(0, finalCostAfterDiscount),
            remaining: Math.max(0, remaining)
        });
    }, [
        formData.selectedPeriod,
        formData.startDate,
        formData.endDate,
        formData.checkInSelection,
        formData.checkOutSelection,
        formData.discountAmount,
        formData.paidAmount,
        price
    ]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCustomerChange = (selectedCustomer) => {
    // الدالة الآن تستقبل كائن العميل المختار مباشرة (وليس 'e')

    // إذا قام المستخدم بمسح الحقل (لم يتم اختيار أي شيء)
    if (!selectedCustomer) {
        setFormData(prev => ({
            ...prev,
            clientId: null,
            clientName: "",
            phone: "",
            email: "",
            address: "",
            nationality: "",
            idNumber: ""
        }));
        return;
    }

    // إذا اختار المستخدم خيار "عميل جديد"
    if (selectedCustomer._id === "new") {
        setIsAddCustomerModalOpen(true);
    } else {
        // إذا اختار المستخدم عميلاً موجودًا بالفعل
        setFormData(prev => ({
            ...prev,
            clientId: selectedCustomer._id,
            clientName: selectedCustomer.name,
            phone: selectedCustomer.phone,
            email: selectedCustomer.email || "",
            address: selectedCustomer.address || "",
            nationality: selectedCustomer.nationality || "",
            idNumber: selectedCustomer.idNumber || ""
        }));
    }
};

    const handleCustomerAdded = (newCustomer) => {
        dispatch(fetchCustomer());
        setIsAddCustomerModalOpen(false);
        setSelectedCustomerOption(newCustomer._id);
        setFormData(prev => ({
            ...prev,
            clientId: newCustomer._id,
            clientName: newCustomer.name,
            phone: newCustomer.phone,
            email: newCustomer.email || "",
            address: newCustomer.address || "",
            nationality: newCustomer.nationality || "",
            idNumber: newCustomer.idNumber || ""
        }));
        toast.success("✅ تم إضافة العميل الجديد بنجاح!");
    };

    const handlePeriodSelect = (periodKey) => {
        if (
            (periodKey === 'morning' && !currentAvailablePeriods.morning) ||
            (periodKey === 'night' && !currentAvailablePeriods.night) ||
            (periodKey === 'wholeDay' && !currentAvailablePeriods.wholeDay)
        ) {
            toast.warn(`⚠️ الفترة "${periodKey === 'morning' ? 'صباحية' : periodKey === 'night' ? 'مسائية' : 'كامل اليوم'}" غير متاحة في هذا اليوم!`);
            return;
        }

        let newCheckInTime = price.dayStartHour;
        let newCheckOutTime = price.nightEndHour;

        if (periodKey === 'morning') {
            newCheckInTime = price.dayStartHour;
            newCheckOutTime = price.dayEndHour;
        } else if (periodKey === 'night') {
            newCheckInTime = price.nightStartHour;
            newCheckOutTime = price.nightEndHour;
        }

        setFormData(prev => ({
            ...prev,
            selectedPeriod: periodKey,
            startDate: initialDate,
            endDate: initialDate,
            checkInSelection: periodKey === "morning" ? "صباحية" : (periodKey === "night" ? "مسائية" : "صباحية"),
            checkOutSelection: periodKey === "night" ? "مسائية" : (periodKey === "morning" ? "صباحية" : "مسائية"),
            checkInPeriod: newCheckInTime,
            checkOutPeriod: newCheckOutTime,
        }));
    };

    const handleSubmit = async () => {
        if (!formData.clientId) {
            toast.error("⚠️ الرجاء اختيار عميل أولاً!", { position: "top-center" });
            return;
        }
        if (!formData.selectedPeriod) {
            toast.error("⚠️ الرجاء اختيار فترة الحجز!", { position: "top-center" });
            return;
        }

        if (
            (formData.selectedPeriod === 'morning' && !currentAvailablePeriods.morning) ||
            (formData.selectedPeriod === 'night' && !currentAvailablePeriods.night) ||
            (formData.selectedPeriod === 'wholeDay' && !currentAvailablePeriods.wholeDay)
        ) {
            toast.error("❌ الفترة المختارة أصبحت غير متاحة. يرجى تحديث الصفحة والمحاولة مرة أخرى.");
            return;
        }

        const bookingStartDate = new Date(formData.startDate).toISOString().split('T')[0];
        const bookingEndDate = new Date(formData.endDate).toISOString().split('T')[0];

        let periodTypeForBackend;
        let dayPeriodForBackend = null;

        if (bookingStartDate === bookingEndDate) {
            periodTypeForBackend = "dayPeriod";
            if (formData.selectedPeriod === "morning") {
                dayPeriodForBackend = "صباحية";
            } else if (formData.selectedPeriod === "night") {
                dayPeriodForBackend = "مسائية";
            } else {
                dayPeriodForBackend = "كامل اليوم";
            }
        } else {
            periodTypeForBackend = "days";
            dayPeriodForBackend = "كامل اليوم";
        }


        const payload = {
            clientId: formData.clientId,
            clientName: formData.clientName,
            phone: formData.phone,
            email: formData.email,
            address: formData.address,
            nationality: formData.nationality,
            idNumber: formData.idNumber,
            entityId: entityId,
            notes: formData.notes,
            paymentMethod: formData.paymentMethod,
        source: formData.source, // ✅ يتم إرساله هنا

            // إرسال معرّف البنك بدلاً من اسمه
            bank: formData.paymentMethod === "تحويل بنكي" ? formData.bankId : null,
            paidAmount: parseFloat(formData.paidAmount) || 0,
            discountAmount: parseFloat(formData.discountAmount) || 0,
            period: {
                type: periodTypeForBackend,
                startDate: bookingStartDate,
                endDate: bookingEndDate,
                dayPeriod: dayPeriodForBackend,
                checkIn: {
                    name: formData.checkInSelection,
                    time: formData.checkInPeriod
                },
                checkOut: {
                    name: formData.checkOutSelection,
                    time: formData.checkOutPeriod
                }
            },
        };

        try {
            const response = await Api.post('/admin/reservations/admin-reservation', payload);
            if (response.data) {
                toast.success("✅ تم إنشاء الحجز بنجاح!");
                setTimeout(() => navigate("/"), 2000);
            }
        } catch (error) {
            console.error("Error creating reservation:", error);
            const errorMessage = error.response?.data?.error || "حدث خطأ غير معروف";
            toast.error(`❌ فشل الحجز: ${errorMessage}`, { position: "top-center" });
        }
    };
// دالة الفلترة التي ستبحث في حقول متعددة
const filterOptions = createFilterOptions({
  stringify: (option) =>
    // إنشاء نص واحد للبحث فيه يحتوي على الاسم، الهاتف، الإيميل، ورقم الهوية
    `${option.name} ${option.phone || ''} ${option.email || ''} ${option.idNumber || ''}`,
});

    return (
         <div className="main-layout">
        <motion.div className="booking-container" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <ToastContainer position="top-center" autoClose={3000} />
            <Button startIcon={<ArrowBackIcon />} variant="outlined" className="back-button" onClick={() => navigate(-1)}>
                رجوع
            </Button>

            <div className="booking-header">
                <h2 className="booking-title">حجز {entityName}</h2>
                <p className="booking-date">
    حجوزات {entityName} ليوم {new Date(initialDate).toLocaleDateString("ar-EG", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
</p>
            </div>

            <Grid container spacing={3} className="booking-content">
                <Grid item xs={12} md={7}>
                <Box className="booking-section">
    <h3 className="section-title">1. معلومات العميل</h3>

   <Autocomplete
    fullWidth
    options={[{ _id: 'new', name: '🆕 أضف عميل جديد' }, ...customers]}
    getOptionLabel={(option) => option.name}
    value={customers.find(c => c._id === formData.clientId) || null}
    onChange={(event, newValue) => handleCustomerChange(newValue)}
    isOptionEqualToValue={(option, value) => option._id === value._id}

    // ✅✅✅ الخاصية الجديدة للبحث المتقدم ✅✅✅
    filterOptions={filterOptions}

    renderOption={(props, option) => (
        <Box component="li" {...props} key={option._id}>
            {option.name} {option.phone && `(${option.phone})`}
        </Box>
    )}
    renderInput={(params) => (
        <TextField
            {...params}
            label="🔍 ابحث بالاسم، الجوال، الهوية، أو الإيميل" // يمكنك تحديث النص هنا
            variant="outlined"
        />
    )}
    sx={{ mb: 2 }}
/>

                        {/* عرض معلومات العميل المحدد (للقراءة فقط) */}
                        {formData.clientId && (
                            <Box className="fields-container" sx={{ mt: 2, '& .MuiTextField-root': { mb: 1.5 } }}>
                                <TextField
                                    fullWidth
                                    label="اسم العميل"
                                    value={formData.clientName}
                                    InputProps={{ readOnly: true, startAdornment: <InputAdornment position="start"><AccountCircleIcon className="input-icon" /></InputAdornment> }}
                                    variant="filled"
                                />
                                <TextField
                                    fullWidth
                                    label="رقم الجوال"
                                    value={formData.phone}
                                    InputProps={{ readOnly: true, startAdornment: <InputAdornment position="start"><PhoneAndroidIcon className="input-icon" /></InputAdornment> }}
                                    variant="filled"
                                />
                                <TextField
                                    fullWidth
                                    label="الجنسية"
                                    value={formData.nationality}
                                    InputProps={{ readOnly: true, startAdornment: <InputAdornment position="start"><PublicIcon className="input-icon" /></InputAdornment> }}
                                    variant="filled"
                                />
                                <TextField
                                    fullWidth
                                    label="رقم الهوية"
                                    value={formData.idNumber}
                                    InputProps={{ readOnly: true, startAdornment: <InputAdornment position="start"><BadgeIcon className="input-icon" /></InputAdornment> }}
                                    variant="filled"
                                />
                                <TextField
                                    fullWidth
                                    label="البريد الإلكتروني"
                                    value={formData.email}
                                    InputProps={{ readOnly: true, startAdornment: <InputAdornment position="start"><EmailIcon className="input-icon" /></InputAdornment> }}
                                    variant="filled"
                                />
                                <TextField
                                    fullWidth
                                    label="العنوان"
                                    value={formData.address}
                                    InputProps={{ readOnly: true, startAdornment: <InputAdornment position="start"><LocationOnIcon className="input-icon" /></InputAdornment> }}
                                    variant="filled"
                                />
                            </Box>
                        )}
                    </Box>

                    <Box className="booking-section"marginTop={3}>
                        <h3 className="section-title">2. فترة الحجز</h3>
                        <Box className="period-container">
                            {[
                                { key: "morning", label: "صباحية", time: `${price.dayStartHour} - ${price.dayEndHour}`, price: price.morning, icon: "🌅", disabled: !currentAvailablePeriods.morning },
                                { key: "night", label: "مسائية", time: `${price.nightStartHour} - ${price.nightEndHour}`, price: price.night, icon: "🌙", disabled: !currentAvailablePeriods.night },
                                { key: "wholeDay", label: "كامل اليوم", time: `${price.dayStartHour} - ${price.nightEndHour}`, price: price.wholeDay, icon: "☀️", disabled: !currentAvailablePeriods.wholeDay },
                            ].map(({ key, label, time, price: periodPrice, icon, disabled }) => (
                                <motion.div
                                    key={key}
                                    className={`period-option ${formData.selectedPeriod === key ? "selected" : ""} ${disabled ? "disabled" : ""}`}
                                    whileTap={{ scale: disabled ? 1 : 0.95 }}
                                    onClick={() => handlePeriodSelect(key)}
                                >
                                    <span className="period-label">{icon} {label}</span>
                                    <span className="period-time">{time}</span>
                                    <span className="period-price">💰 السعر: {periodPrice} ريال</span>
                                    {disabled && <Typography variant="caption" color="error" sx={{ mt: 0.5, fontSize: '0.75rem' }}>غير متاح</Typography>}
                                </motion.div>
                            ))}
                        </Box>
                        {!currentAvailablePeriods.wholeDay && (formData.selectedPeriod === 'wholeDay') && (
                            <Typography color="error" sx={{ mt: 1 }}>
                                ملاحظة: فترة كامل اليوم غير متاحة. الرجاء اختيار فترة أخرى.
                            </Typography>
                        )}
                        {(!formData.selectedPeriod && (currentAvailablePeriods.morning || currentAvailablePeriods.night || currentAvailablePeriods.wholeDay)) && (
                            <Typography color="warning" sx={{ mt: 1 }}>
                                الرجاء اختيار فترة حجز لتأكيد التوفر.
                            </Typography>
                        )}
                    </Box>

                    {/* ✅ إزالة الشرط هنا ليكون هذا القسم مرئيًا دائماً،
                         ممكن تحتاج تخفيه لو selectedPeriod مش wholeDay */}
                    {/* {formData.selectedPeriod === "wholeDay" && ( */}
                        <Box className="booking-section" marginTop={3}>
                            <h3 className="section-title">3. وقت الدخول والخروج (للحجز متعدد الأيام أو كامل اليوم)</h3>
                            <Box className="fields-container">
                                <Box className="input-group">
                                    <TextField
                                        fullWidth
                                        label="تاريخ الدخول"
                                        name="startDate"
                                        type="date"
                                        value={formData.startDate}
                                        onChange={handleChange}
                                        InputLabelProps={{ shrink: true }}
                                        required
                                        inputProps={{ min: initialDate }}
                                    />
                                    <FormControl fullWidth>
                                        <InputLabel>وقت الدخول (صباحية/مسائية)</InputLabel>
                                        <Select
                                            name="checkInSelection"
                                            value={formData.checkInSelection}
                                            onChange={handleChange}
                                            required
                                        >
                                            <MenuItem value="صباحية">🌅 صباحية</MenuItem>
                                            <MenuItem value="مسائية">🌙 مسائية</MenuItem>
                                        </Select>
                                    </FormControl>
                                    <TextField
                                        fullWidth
                                        label="وقت الدخول (ساعة:دقيقة)"
                                        name="checkInPeriod"
                                        type="time"
                                        value={formData.checkInPeriod}
                                        onChange={handleChange}
                                        InputLabelProps={{ shrink: true }}
                                        required
                                    />
                                </Box>

                                <Box className="input-group">
                                    <TextField
                                        fullWidth
                                        label="تاريخ الخروج"
                                        name="endDate"
                                        type="date"
                                        value={formData.endDate}
                                        onChange={handleChange}
                                        InputLabelProps={{ shrink: true }}
                                        required
                                        inputProps={{ min: formData.startDate }}
                                    />
                                    <FormControl fullWidth>
                                        <InputLabel>وقت الخروج (صباحية/مسائية)</InputLabel>
                                        <Select
                                            name="checkOutSelection"
                                            value={formData.checkOutSelection}
                                            onChange={handleChange}
                                            required
                                        >
                                            <MenuItem value="صباحية">🌅 صباحية</MenuItem>
                                            <MenuItem value="مسائية">🌙 مسائية</MenuItem>
                                        </Select>
                                    </FormControl>
                                    <TextField
                                        fullWidth
                                        label="وقت الخروج (ساعة:دقيقة)"
                                        name="checkOutPeriod"
                                        type="time"
                                        value={formData.checkOutPeriod}
                                        onChange={handleChange}
                                        InputLabelProps={{ shrink: true }}
                                        required
                                    />
                                </Box>
                            </Box>
                    </Box>
                    <Box className="booking-section" marginTop={3}>
    <h3 className="section-title">4. تفاصيل الدفع</h3>
    <Box className="fields-container">
        <FormControl fullWidth sx={{ mb: 1.5 }}>
            <InputLabel>طريقة الدفع</InputLabel>
            {/* ✅ تم تعديل قيم الـ Select لتطابق AddPayment */}
            <Select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange} required>
                <MenuItem value="نقدي">💵 نقدي</MenuItem>
                <MenuItem value="تحويل بنكي">🏦 تحويل بنكي</MenuItem>
                <MenuItem value="شبكة">💳 شبكة</MenuItem>
            </Select>
        </FormControl>

                {/* ✅ حقل المصدر الجديد */}
                <FormControl fullWidth sx={{ mb: 1.5 }}>
                  <InputLabel>المصدر</InputLabel>
                  <Autocomplete
                    freeSolo
                    options={sources}
                    value={formData.source || ""}
                    onChange={(event, newValue) => {
                      setFormData(prev => ({ ...prev, source: newValue }));
                    }}
                    renderInput={(params) => (
                      <TextField {...params} variant="outlined" />
                    )}
                  />
                </FormControl>

        <TextField
            fullWidth
            label="المبلغ المدفوع"
            name="paidAmount"
            type="number"
            value={formData.paidAmount}
            onChange={handleChange}
            required
            sx={{ mb: 1.5 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><MonetizationOnIcon className="input-icon" /></InputAdornment> }}
        />

        <TextField
            fullWidth
            label="مبلغ الخصم (اختياري)"
            name="discountAmount"
            type="number"
            value={formData.discountAmount}
            onChange={handleChange}
            sx={{ mb: 1.5 }}
        />

        {/* ✅ الخطوة 2: إصلاح منطق اختيار البنك */}
                            {formData.paymentMethod === "تحويل بنكي" && (
                                <FormControl fullWidth sx={{ mb: 1.5 }}>
                                    <InputLabel>اختر البنك</InputLabel>
                                    {/* تغيير الحقل إلى bankId وحفظ قيمة bank._id */}
                                    <Select name="bankId" value={formData.bankId || ''} onChange={handleChange} required>
                                        {banks.map((bank) => (
                                            <MenuItem key={bank._id} value={bank._id}>
                                                🏦 {bank.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
            </FormControl>
        )}
        <TextField fullWidth label="ملاحظات" name="notes" value={formData.notes} onChange={handleChange} multiline rows={2} />
    </Box>
                    </Box>
                    <Box mt={2} textAlign="center" className="summary-section">
    <h3 className="section-title">الملخص المالي</h3>
    <div className="summary-item total">
        <span>التكلفة الكلية:</span>
        <strong>{finalCosts.total.toFixed(2)} ريال</strong>
    </div>
    <div className="summary-item">
        <span>المبلغ المدفوع:</span>
        <strong>{(parseFloat(formData.paidAmount) || 0).toFixed(2)} ريال</strong>
    </div>
    <div className="summary-item remaining">
        <span>المبلغ المتبقي:</span>
        <strong>{finalCosts.remaining.toFixed(2)} ريال</strong>
    </div>
                        </Box>
                        <Box textAlign="center" marginTop={3}>
    <Button
        variant="contained"
        className="submit-button"
        onClick={handleSubmit}
        disabled={!formData.clientId || !formData.selectedPeriod || finalCosts.total < 0 || !currentAvailablePeriods[formData.selectedPeriod]}
        fullWidth
    >
        {!formData.clientId ? "الرجاء اختيار العميل" :
            !formData.selectedPeriod ? "الرجاء اختيار الفترة" :
                !currentAvailablePeriods[formData.selectedPeriod] ? `الفترة المختارة (${formData.selectedPeriod === 'morning' ? 'صباحية' : formData.selectedPeriod === 'night' ? 'مسائية' : 'كامل اليوم'}) غير متاحة` :
                    (finalCosts.total < 0 ? "خطأ في حساب التكلفة" : "تأكيد الحجز")}
    </Button>
</Box>

                    {/* )} */}


                <Grid item xs={24} >
             {/* ======================= بداية قسم الدفع والملخص المالي ======================= */}




                        </Grid>


{/* ======================= نهاية قسم الدفع والملخص المالي ======================= */}
                </Grid>
            </Grid>


            <AddCustomerModal
    open={isAddCustomerModalOpen}
    handleClose={() => setIsAddCustomerModalOpen(false)}
    onCustomerAdded={handleCustomerAdded}
                />

            </motion.div>
            </div>
    );
};

export default BookingPage;