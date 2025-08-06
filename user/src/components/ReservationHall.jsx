// client/src/components/ReservationHall.jsx

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Calendar } from 'react-date-range';
import format from 'date-fns/format';
import { addDays, differenceInDays } from 'date-fns';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import {
    InputLabel, Select, MenuItem, Grid, TextField, CircularProgress, Box,
    Typography, Radio, RadioGroup, FormControlLabel, FormControl, FormLabel,
    Snackbar, Button as MuiButton
} from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import Backdrop from '@mui/material/Backdrop';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

// Components
import Footer from './Footer';
import Dialoge from './Dialoge';
import MapLocation from './MapLocation';
import Api from '../config/config';
import { fetchUserData } from '../redux/reducers/user';
import { fetchBankDetails } from '../redux/reducers/bank';
import "../scss/reservationChalet.scss"; // تأكد من الاسم الصحيح للملف SCSS الخاص بك (مثال: reservationHall.scss)

// Alert component for Snackbar
const Alert = React.forwardRef(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

// Helper function to format date to "yyyy-MM-dd"
const formatDate = (date) => date instanceof Date && !isNaN(date.getTime()) ? format(date, "yyyy-MM-dd") : "";

const ReservationHall = ({ data: hallData }) => {
    const { t, i18n } = useTranslation();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // Refs and state for UI control
    const calendarRef = useRef(null);
    const [openCalendar, setOpenCalendar] = useState(false);
    const [loading, setLoading] = useState(false);
    const [snackOpenSuccess, setSnackOpenSuccess] = useState(false);
    const [snackOpenError, setSnackOpenError] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [dialogeMessage, setDialogeMessage] = useState(false);

    // States for availability check (from backend API)
    const [availabilityChecking, setAvailabilityChecking] = useState(false);
    // حالة التوفر المفصلة لليوم الحالي أو للفترة المختارة (إذا كانت يوم واحد)
    const [dailyAvailabilityStatus, setDailyAvailabilityStatus] = useState({
        morning: 'available',
        night: 'available',
        wholeDay: 'available',
    });
    // حالة التوفر الكلية للفترة المختارة (أيام متعددة)
    const [isOverallPeriodAvailable, setIsOverallPeriodAvailable] = useState(true);

    // State for form validation errors (frontend)
    const [errors, setErrors] = useState({});

    // Form data state
    const [formData, setFormData] = useState({
        startDate: new Date(),
        endDate: addDays(new Date(), 0), // Default: same day for 'dayPeriod'
        periodType: 'dayPeriod', // Default booking type ('dayPeriod' for fixed periods, 'days' for multi-day)
        selectedPeriod: 'كامل اليوم', // 'صباحية', 'مسائية', 'كامل اليوم' (لـ periodType: 'dayPeriod')
        checkInSelection: 'صباحية', // 'صباحية' أو 'مسائية' (لـ periodType: 'days')
        checkOutSelection: 'مسائية', // 'صباحية' أو 'مسائية' (لـ periodType: 'days')
        cost: hallData?.price?.wholeDay || 0,
        type: 'hall', // Type of entity (hall, chalet, resort)
        fullName: '',
        phoneNumber: '',
        idNumber: '',
        address: '',
        nationality: '',
        discountCode: '',
        paymentMethod: '',
        bankName: '',
        paymentProof: '',
    });

    // Redux state
    const isAuthenticated = useSelector((state) => state.user.isAuthenticated);
    const user = useSelector((state) => state.user.data);
    const banks = useSelector((state) => state.bank.value.data);

    // Ref to store significant parameters for availability check debounce
    const prevSignificantParamsRef = useRef(null);
    // Ref to store current form parameters for the debounced check
    const availabilityParamsRef = useRef({});

    // Fetch initial data on component mount
    useEffect(() => {
        dispatch(fetchBankDetails());
        dispatch(fetchUserData());
    }, [dispatch]);

    // Populate form with user data if authenticated
    useEffect(() => {
        if (isAuthenticated && user) {
            setFormData(prev => ({
                ...prev,
                fullName: user.name || '',
                phoneNumber: user.phone || '',
                idNumber: user.idNumber || '',
                address: user.address || '',
                nationality: user.nationality || '',
            }));
        }
    }, [isAuthenticated, user]);

    // Sync endDate with startDate if periodType is 'dayPeriod'
    useEffect(() => {
        const newStartDate = new Date(formData.startDate);
        if (formData.periodType === 'dayPeriod') {
            setFormData(prev => ({ ...prev, endDate: newStartDate }));
        }
    }, [formData.startDate, formData.periodType]);

    // Define period buttons based on hallData prices and times
    const periodButtons = [
        {
            label: 'صباحية', value: 'صباحية', enLabel: t("details.morning"), priceKey: 'morning',
            checkIn: 'صباحية', checkOut: 'صباحية', checkInTime: hallData?.dayStartHour || "09:00",
            checkOutTime: hallData?.dayEndHour || "17:00"
        },
        {
            label: 'مسائية', value: 'مسائية', enLabel: t("details.Night"), priceKey: 'night',
            checkIn: 'مسائية', checkOut: 'مسائية', checkInTime: hallData?.nightStartHour || "18:00",
            checkOutTime: hallData?.nightEndHour || "23:00"
        },
        {
            label: 'كامل اليوم', value: 'كامل اليوم', enLabel: t("details.day"), priceKey: 'wholeDay',
            checkIn: 'صباحية', checkOut: 'مسائية', checkInTime: hallData?.dayStartHour || "09:00",
            checkOutTime: hallData?.nightEndHour || "23:00"
        },
    ];

    // Calculate reservation cost based on selected dates and periods
    useEffect(() => {
        if (!hallData?.price) return;

        let calculatedCost = 0;
        const startDateObj = new Date(formData.startDate);
        const endDateObj = new Date(formData.endDate);

        startDateObj.setUTCHours(0, 0, 0, 0);
        endDateObj.setUTCHours(0, 0, 0, 0);

        const isSingleDayBooking = startDateObj.getTime() === endDateObj.getTime();

        if (isSingleDayBooking) {
            const selectedPeriodKey =
                formData.selectedPeriod === 'صباحية' ? 'morning' :
                formData.selectedPeriod === 'مسائية' ? 'night' :
                'wholeDay';

            // نحسب السعر فقط إذا كانت الفترة متاحة
            if (dailyAvailabilityStatus[selectedPeriodKey] === 'available') {
                calculatedCost = hallData.price[selectedPeriodKey];
            } else {
                calculatedCost = 0; // إذا كانت الفترة غير متاحة، السعر 0
            }

        } else { // Multi-day booking
            let currentDate = new Date(startDateObj);
            while (currentDate.getTime() <= endDateObj.getTime()) {
                let dayCost = 0;
                // لا نحتاج لـ tempCurrentDateUTC هنا، فقط لضبط الساعة في دالة calculateBookingCost في الباك إند
                // لأننا هنا نحسب التكلفة الإجمالية للفترة المحددة في الفورم

                // تحديد تكلفة اليوم بناءً على قواعد الدخول والخروج
                if (currentDate.getTime() === startDateObj.getTime()) { // اليوم الأول
                    dayCost = formData.checkInSelection === 'صباحية' ? hallData.price.wholeDay : hallData.price.night;
                } else if (currentDate.getTime() === endDateObj.getTime()) { // اليوم الأخير
                    dayCost = formData.checkOutSelection === 'صباحية' ? hallData.price.morning : hallData.price.wholeDay;
                } else { // الأيام في المنتصف
                    dayCost = hallData.price.wholeDay;
                }
                calculatedCost += dayCost;
                currentDate.setDate(currentDate.getDate() + 1);
            }
        }

        setFormData(prev => ({ ...prev, cost: calculatedCost }));
    }, [formData.startDate, formData.endDate, formData.periodType, formData.selectedPeriod, formData.checkInSelection, formData.checkOutSelection, hallData?.price, dailyAvailabilityStatus]);

    // Update ref whenever relevant form data changes (for debounced availability check)
    useEffect(() => {
        availabilityParamsRef.current = {
            entityId: hallData?._id,
            startDate: formData.startDate,
            endDate: formData.endDate,
            periodType: formData.periodType,
            selectedPeriod: formData.selectedPeriod,
            checkInSelection: formData.checkInSelection,
            checkOutSelection: formData.checkOutSelection,
        };
    });

    // Check hall availability (Memoized callback for debounced API call)
    const checkHallAvailability = useCallback(async () => {
        const params = availabilityParamsRef.current;

        if (!params.entityId || !params.startDate || !params.endDate || isNaN(params.startDate.getTime()) || isNaN(params.endDate.getTime())) {
            // Default to available if dates are invalid/missing
            setDailyAvailabilityStatus({ morning: 'available', night: 'available', wholeDay: 'available' });
            setIsOverallPeriodAvailable(true);
            return;
        }

        // Handle end date before start date
        if (params.endDate.getTime() < params.startDate.getTime()) {
            setDailyAvailabilityStatus({ morning: 'unavailable', night: 'unavailable', wholeDay: 'unavailable' });
            setIsOverallPeriodAvailable(false);
            setErrorMessage(t("details.endDateBeforeStartDate"));
            setSnackOpenError(true);
            return;
        }

        setAvailabilityChecking(true);
        try {
            let overallAvailabilityCheck = true; // نتحقق من التوفر الكلي للفترة
            let tempDailyStatus = { morning: 'available', night: 'available', wholeDay: 'available' };
            let tempErrorMessage = "";

            // لو حجز ليوم واحد (dayPeriod) أو حجز متعدد الأيام
            let currentDate = new Date(params.startDate);
            while (currentDate.getTime() <= params.endDate.getTime()) {
                const response = await Api.post('/admin/reservations/get-daily-availability', {
                    entityId: params.entityId,
                    date: formatDate(currentDate) // نرسل تاريخ يوم واحد فقط
                });
                const dayStatus = response.data.availability; // المفروض ترجع {morning, night, wholeDay}

                let currentDayIsAvailable = true;

                if (params.periodType === 'dayPeriod') {
                    // لو فترة يوم واحد، بنركز على اليوم ده والفترة المختارة
                    const selectedPeriodKey = (params.selectedPeriod === 'صباحية') ? 'morning' :
                                              (params.selectedPeriod === 'مسائية') ? 'night' :
                                              'wholeDay';
                    if (dayStatus[selectedPeriodKey] === 'unavailable' || dayStatus[selectedPeriodKey] === 'unknown') {
                        currentDayIsAvailable = false;
                        tempErrorMessage = t("details.periodUnavailableSpecific", { period: params.selectedPeriod, date: formatDate(currentDate) });
                    }
                    tempDailyStatus = dayStatus; // لتحديث حالة الأزرار في الـ UI لليوم الواحد
                } else { // لو فترة متعددة الأيام 'days'
                    // بنتحقق من كل يوم في النطاق بناءً على أوقات الدخول والخروج
                    if (currentDate.getTime() === params.startDate.getTime()) { // اليوم الأول
                        if (params.checkInSelection === 'صباحية' && dayStatus.wholeDay === 'unavailable') {
                            currentDayIsAvailable = false;
                        } else if (params.checkInSelection === 'مسائية' && dayStatus.night === 'unavailable') {
                            currentDayIsAvailable = false;
                        }
                    } else if (currentDate.getTime() === params.endDate.getTime()) { // اليوم الأخير
                        if (params.checkOutSelection === 'صباحية' && dayStatus.morning === 'unavailable') {
                            currentDayIsAvailable = false;
                        } else if (params.checkOutSelection === 'مسائية' && dayStatus.wholeDay === 'unavailable') {
                            currentDayIsAvailable = false;
                        }
                    } else { // الأيام اللي في المنتصف
                        if (dayStatus.wholeDay === 'unavailable') {
                            currentDayIsAvailable = false;
                        }
                    }

                    if (!currentDayIsAvailable) {
                        tempErrorMessage = t("details.periodUnavailableOnDate", { date: formatDate(currentDate) });
                    }
                }

                if (!currentDayIsAvailable) {
                    overallAvailabilityCheck = false;
                    break; // لو لقينا يوم واحد غير متاح، نوقف التحقق
                }
                currentDate = addDays(currentDate, 1);
            }

            setDailyAvailabilityStatus(tempDailyStatus); // تحديث حالة الفترات لليوم الواحد
            setIsOverallPeriodAvailable(overallAvailabilityCheck); // تحديث حالة التوفر الكلية

            if (!overallAvailabilityCheck) {
                setErrorMessage(tempErrorMessage);
                setSnackOpenError(true);
            } else {
                setSnackOpenError(false); // لو مفيش تعارض، نقفل رسالة الخطأ
            }

        } catch (error) {
            console.error("Error checking availability:", error.response?.data || error);
            setErrorMessage(error.response?.data?.error || error.response?.data?.message || t("common.networkError"));
            setSnackOpenError(true);
            setDailyAvailabilityStatus({ morning: 'unavailable', night: 'unavailable', wholeDay: 'unavailable' });
            setIsOverallPeriodAvailable(false);
        } finally {
            setAvailabilityChecking(false);
        }
    }, [t, hallData]); // periodButtons removed from dependency array as it's not directly used here

    // Trigger availability check when *significant* parameters change
    useEffect(() => {
        const currentParams = availabilityParamsRef.current;

        const hasChanged =
            (prevSignificantParamsRef.current === null) ||
            (prevSignificantParamsRef.current.entityId !== currentParams.entityId) ||
            (prevSignificantParamsRef.current.startDate?.getTime() !== currentParams.startDate?.getTime()) ||
            (prevSignificantParamsRef.current.endDate?.getTime() !== currentParams.endDate?.getTime()) ||
            (prevSignificantParamsRef.current.periodType !== currentParams.periodType) ||
            (prevSignificantParamsRef.current.selectedPeriod !== currentParams.selectedPeriod) ||
            (prevSignificantParamsRef.current.checkInSelection !== currentParams.checkInSelection) ||
            (prevSignificantParamsRef.current.checkOutSelection !== currentParams.checkOutSelection);

        if (hasChanged) {
            // Update previous params for the next comparison only if changes occurred
            prevSignificantParamsRef.current = { ...currentParams }; // Deep copy
            const timer = setTimeout(() => checkHallAvailability(), 500); // Debounce the API call
            return () => clearTimeout(timer);
        }
    }, [
        checkHallAvailability,
        formData.periodType,
        formData.selectedPeriod,
        formData.checkInSelection,
        formData.checkOutSelection,
        hallData?._id,
        formData.startDate,
        formData.endDate
    ]);


    // CircularProgressWithLabel (component helper for UI)
    const CircularProgressWithLabel = ({ value, label, ...props }) => (
        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
            <CircularProgress variant="determinate" value={value} {...props} />
            <Box sx={{ top: 0, left: 0, bottom: 0, right: 0, position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="caption" style={{ fontWeight: "700", fontSize: "1.2rem" }} color="text.secondary">{label}</Typography>
            </Box>
        </Box>
    );

    // Form validation (client-side)
    const validateFields = () => {
        const newErrors = {};
        let isValid = true;

        // Validation for personal information fields
        if (isAuthenticated) { // Validate these fields ONLY if the user is authenticated
            if (!formData.fullName?.trim() || formData.fullName.trim().split(' ').length < 3) {
                newErrors.fullName = t("validation.fullNameRequired");
                isValid = false;
            }
            if (!formData.phoneNumber?.trim()) {
                newErrors.phoneNumber = t("validation.phoneRequired");
                isValid = false;
            }
            if (!formData.idNumber?.trim()) {
                newErrors.idNumber = t("validation.idNumberRequired");
                isValid = false;
            }
            if (!formData.address?.trim()) {
                newErrors.address = t("validation.addressRequired");
                isValid = false;
            }
            if (!formData.nationality?.trim()) {
                newErrors.nationality = t("validation.nationalityRequired");
                isValid = false;
            }

            // Validation for payment method fields
            if (!formData.paymentMethod) {
                newErrors.paymentMethod = t("validation.paymentMethodRequired");
                isValid = false;
            } else if (formData.paymentMethod === "bank") {
                if (!formData.bankName) {
                    newErrors.bankName = t("validation.bankNameRequired");
                    isValid = false;
                }
                if (!formData.paymentProof) {
                    newErrors.paymentProof = t("validation.paymentProofRequired");
                    isValid = false;
                }
            }
        }

        // ✅ Availability validation (based on current availability check status)
        // هذا التحقق الآن يعتمد بشكل مباشر على `isOverallPeriodAvailable`
        // التي يتم تحديثها بواسطة `checkHallAvailability`
        if (!isOverallPeriodAvailable) {
            newErrors.dateRange = errorMessage || t("details.periodUnavailable");
            isValid = false;
        }
        
        // إذا كان نوع الحجز يوم واحد ولم يتم اختيار فترة محددة
        if (formData.periodType === 'dayPeriod' && !formData.selectedPeriod) {
            newErrors.selectedPeriod = t("validation.periodSelectionRequired");
            isValid = false;
        }
        
        setErrors(newErrors);
        return isValid;
    };


    // Form submission handler
    const handleSubmit = async (e) => {
        e.preventDefault();

        setErrors({}); // Clear old errors before new submission

        // ✅ التحقق من حالة تسجيل الدخول أولاً
        // يتم هذا التحقق قبل أي validations أخرى أو API calls
        // إذا كان المستخدم غير مسجل دخول، لن تظهر الرسالة الخطأ "يجب تسجيل الدخول" إلا إذا كان
        // `isAuthenticated` `false`، بغض النظر عن `user` object.
        if (!isAuthenticated) { // إذا لم يكن هناك توكن أو مشكلة في المصادقة
            setErrorMessage(t("validation.loginRequiredForReservation"));
            setSnackOpenError(true);
            setTimeout(() => navigate("/user/signin"), 2000);
            return;
        }

        // ✅ خطوة أخيرة للتحقق من التوفر قبل الإرسال الفعلي
        // هذا يضمن أن المستخدم لم يقم بتغيير في اللحظة الأخيرة
        // أو أن حالة التوفر تغيرت منذ آخر فحص تلقائي.
        // بما أن `checkHallAvailability` تحدد `isOverallPeriodAvailable`، نستخدمها هنا
        if (!isOverallPeriodAvailable) {
            setErrorMessage(errorMessage || t("details.periodUnavailable")); // استخدم الرسالة الموجودة
            setSnackOpenError(true);
            return;
        }

        // التحقق من صحة البيانات (بعد التحقق من التوفر الأولي)
        if (!validateFields()) {
            setSnackOpenError(true);
            return;
        }

        setLoading(true); // Start loading for actual submission

        try {
            // ✅ بناء كائن الفترة للـ Backend بشكل صحيح
            const periodForBackend = {
                startDate: formatDate(formData.startDate),
                endDate: formatDate(formData.endDate),
                type: formData.periodType, // 'dayPeriod' أو 'days'
                dayPeriod: formData.periodType === 'dayPeriod' ? formData.selectedPeriod : undefined,
                checkIn: {
                    name: formData.checkInSelection,
                    // الوقت بناءً على اختيار المستخدم (صباحية/مسائية)
                    time: formData.checkInSelection === 'صباحية' ? hallData.dayStartHour : hallData.nightStartHour
                },
                checkOut: {
                    name: formData.checkOutSelection,
                    // الوقت بناءً على اختيار المستخدم (صباحية/مسائية)
                    time: formData.checkOutSelection === 'صباحية' ? hallData.dayEndHour : hallData.nightEndHour
                }
            };

            const reservationData = {
                clientId: user?._id, // تأكد أن user._id موجود لو authenticated
                clientName: formData.fullName,
                phone: formData.phoneNumber,
                email: user?.email, // استخدم إيميل المستخدم من Redux
                idNumber: formData.idNumber,
                nationality: formData.nationality,
                address: formData.address,
                entityId: hallData._id,
                notes: "",
                paymentMethod: formData.paymentMethod,
                bankName: formData.paymentMethod === "bank" ? formData.bankName : null,
                paymentProof: formData.paymentMethod === "bank" ? formData.paymentProof : null,
                paidAmount: 0,
                // discountAmount: parseFloat(formData.discountCode) || 0, // ❌ احذف هذا السطر أو علق عليه
                couponCode: formData.discountCode, // ✅ أضف هذا السطر لإرسال كود الكوبون كنص
                period: periodForBackend,
                entityName: hallData.name,
                type: formData.type
            };

            // تحديث بيانات المستخدم (إذا تغيرت)
            const updateUserProfileInSubmit = async () => {
                if (!isAuthenticated || !user) return;
                const updates = {};
                // تحديث البيانات فقط إذا تغيرت عن بيانات المستخدم المخزنة في Redux
                if (formData.fullName !== user.name) updates.name = formData.fullName;
                if (formData.phoneNumber !== user.phone) updates.phone = formData.phoneNumber;
                if (formData.idNumber !== user.idNumber) updates.idNumber = formData.idNumber;
                if (formData.address !== user.address) updates.address = formData.address;
                if (formData.nationality !== user.nationality) updates.nationality = formData.nationality;

                if (Object.keys(updates).length > 0) {
                    try {
                        await Api.patch('/users/updateDate', updates);
                        dispatch(fetchUserData()); // Refresh user data in Redux store
                    } catch (err) {
                        console.error("Failed to update user profile during reservation:", err);
                        // لا تمنع الحجز بسبب فشل تحديث البروفايل، فقط سجل الخطأ
                    }
                }
            };

            await updateUserProfileInSubmit();
            const response = await Api.post('/user/reservation', reservationData);

            if (response.status === 201) {
                setSnackOpenSuccess(true);
                // navigate to reservations after a short delay
                setTimeout(() => navigate('/reservations'), 300);
            }
        } catch (error) {
            console.error("Error during reservation submission:", error.response?.data || error);
            // استخدم رسالة الخطأ من الـ backend إن وجدت
            const errorMsg = error.response?.data?.error || error.response?.data?.message || t("common.networkError");
            setErrorMessage(errorMsg);
            setSnackOpenError(true);
        } finally {
            setLoading(false);
        }
    };

    // Close calendar on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (calendarRef.current && !calendarRef.current.contains(e.target) && !e.target.closest('.inputBox')) {
                setOpenCalendar(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // UI text and states for date inputs
    const todayFormatted = format(new Date(), 'yyyy-MM-dd');
    const minCheckoutDateFormatted = formData.startDate ?
        format(addDays(new Date(formData.startDate), formData.periodType === 'dayPeriod' ? 0 : 1), 'yyyy-MM-dd') :
        '';

    // Main button properties
    const mainButtonText = availabilityChecking ? t("details.checkingAvailability") :
        (hallData?.maintenance) ? t("details.maintenanceMessage") : // لو صيانة
        (!isOverallPeriodAvailable) ? t("details.periodUnavailable") : // لو الفترة الكلية غير متاحة
        t("details.bookNow"); // تم تغيير "choose" إلى "bookNow"

    // ✅ تحديث isMainButtonDisabled لتعطيل الزر بشكل دقيق
    const isMainButtonDisabled =
        hallData?.maintenance || // لو في صيانة
        loading || // لو في حالة تحميل (إرسال)
        availabilityChecking || // لو بنتحقق من التوفر
        !isOverallPeriodAvailable || // لو الفترات المختارة ككل غير متاحة
        (formData.periodType === 'dayPeriod' && dailyAvailabilityStatus[ // لو فترة ثابتة والصباحية/المسائية/كامل اليوم غير متاحة
            formData.selectedPeriod === 'صباحية' ? 'morning' :
            formData.selectedPeriod === 'مسائية' ? 'night' :
            'wholeDay'
        ] !== 'available') ||
        (formData.periodType === 'days' && ( // لو عدة أيام، والتحقق الشامل من checkHallAvailability فشل
            !isOverallPeriodAvailable || // هذا الشرط موجود بالفعل ويتم تحديثه في checkHallAvailability
            (new Date(formData.endDate).getTime() < new Date(formData.startDate).getTime()) // تاريخ النهاية قبل البداية
        ));


    return (
        <>
            {hallData ? (
                <div className="reservation-chalet-container" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
                    {/* Price Header Section */}
                    <div className='price-header-section'>
                        {i18n.language === 'ar' ? (
                            <h3>{t("details.price_per_day")} <span>{hallData.price?.wholeDay || 0} {t("details.currency")}</span></h3>
                        ) : (
                            <h3><span>{hallData.price?.wholeDay || 0} {t("details.currency")}</span> {t("details.price_per_day")}</h3>
                        )}
                        <div className='sub-prices'>
                            {hallData.price?.morning && <span>{t("details.morning")}: {hallData.price.morning} {t("details.currency")}</span>}
                            {hallData.price?.night && <span>{t("details.Night")}: {hallData.price.night} {t("details.currency")}</span>}
                        </div>
                    </div>

                    {/* Reservation Form */}
                    <form onSubmit={handleSubmit} className="reservation-content-grid">
                        {/* Left Column - Form Inputs */}
                        <div className="form-inputs-column">
                            {/* Date Picker */}
                            <div className="calendar-container">
                                <InputLabel className="input-label-custom">{t("details.selectDate")}</InputLabel>
                                <TextField
                                    fullWidth
                                    value={format(formData.startDate, 'MM/dd/yyyy')}
                                    InputProps={{ readOnly: true }}
                                    className="inputBox"
                                    onClick={() => setOpenCalendar(!openCalendar)}
                                />
                                {openCalendar && (
                                    <div className="calendar" ref={calendarRef}>
                                        <Calendar
                                            className='calendarElement'
                                            onChange={(date) => {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    startDate: date,
                                                    // إذا كانت periodType 'dayPeriod'، تبقى endDate هي نفس startDate.
                                                    // إذا كانت 'days'، تصبح endDate هي اليوم التالي لـ startDate.
                                                    endDate: prev.periodType === 'dayPeriod' ? date : addDays(date, 1)
                                                }));
                                            }}
                                            minDate={new Date()}
                                            date={formData.startDate}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Conditional rendering for personal info, payment, and discount fields */}
                            {isAuthenticated ? (
                                <>
                                    {/* Personal Information */}
                                    <TextField
                                        fullWidth
                                        label={t("details.fullName")}
                                        value={formData.fullName}
                                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                        required
                                        error={!!errors.fullName}
                                        helperText={errors.fullName || ""}
                                        margin="normal"
                                        InputProps={{
                                            readOnly: isAuthenticated && user?.name && user.name.trim().split(' ').length >= 3
                                        }}
                                    />

                                    <TextField
                                        fullWidth
                                        label={t("details.phoneNumber")}
                                        value={formData.phoneNumber}
                                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                        required
                                        error={!!errors.phoneNumber}
                                        helperText={errors.phoneNumber || ""}
                                        margin="normal"
                                        InputProps={{ readOnly: isAuthenticated && user?.phone }}
                                    />

                                    <TextField
                                        fullWidth
                                        label={t("details.idNumber")}
                                        value={formData.idNumber}
                                        onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                                        required
                                        error={!!errors.idNumber}
                                        helperText={errors.idNumber || ""}
                                        margin="normal"
                                        InputProps={{ readOnly: isAuthenticated && user?.idNumber }}
                                    />

                                    <TextField
                                        fullWidth
                                        label={t("details.nationality")}
                                        value={formData.nationality}
                                        onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                                        required
                                        error={!!errors.nationality}
                                        helperText={errors.nationality || ""}
                                        margin="normal"
                                    />

                                    <TextField
                                        fullWidth
                                        label={t("details.address")}
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        required
                                        error={!!errors.address}
                                        helperText={errors.address || ""}
                                        margin="normal"
                                    />

                                    {/* Payment Method */}
                                    <FormControl fullWidth margin="normal" error={!!errors.paymentMethod}>
                                        <InputLabel>{t("details.paymentMethod")}</InputLabel>
                                        <Select
                                            value={formData.paymentMethod}
                                            onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                                            required
                                            label={t("details.paymentMethod")}
                                        >
                                            <MenuItem value="">{t("common.select")}</MenuItem>
                                            <MenuItem value="cash">{t("details.cash")}</MenuItem>
                                            <MenuItem value="network">{t("details.network")}</MenuItem>
                                            <MenuItem value="bank">{t("details.bank")}</MenuItem>
                                        </Select>
                                        {errors.paymentMethod && (
                                            <Typography variant="caption" color="error">{errors.paymentMethod}</Typography>
                                        )}

                                        {formData.paymentMethod === "bank" && (
                                            <>
                                                <FormControl fullWidth margin="normal" error={!!errors.bankName}>
                                                    <InputLabel>{t("details.bankType")}</InputLabel>
                                                    <Select
                                                        value={formData.bankName}
                                                        onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                                                        required
                                                        label={t("details.bankType")}
                                                    >
                                                        <MenuItem value="">{t("common.selectBank")}</MenuItem>
                                                        {banks?.map(bank => (
                                                            <MenuItem key={bank.id} value={bank.name}>🏦 {bank.name}</MenuItem>
                                                        ))}
                                                    </Select>
                                                    {errors.bankName && (
                                                        <Typography variant="caption" color="error">{errors.bankName}</Typography>
                                                    )}
                                                </FormControl>

                                                <TextField
                                                    fullWidth
                                                    label={t("details.transferMessage")}
                                                    value={formData.paymentProof}
                                                    onChange={(e) => setFormData({ ...formData, paymentProof: e.target.value })}
                                                    required
                                                    error={!!errors.paymentProof}
                                                    helperText={errors.paymentProof || ""}
                                                    margin="normal"
                                                />
                                            </>
                                        )}
                                    </FormControl>

                                    {/* Discount Code */}
                                    <TextField
                                        fullWidth
                                        label={t("details.discountCodeOptional")}
                                        value={formData.discountCode}
                                        onChange={(e) => setFormData({ ...formData, discountCode: e.target.value })}
                                        margin="normal"
                                    />
                                </>
                            ) : (
                                <Typography variant="h6" color="text.secondary" sx={{ mt: 3, textAlign: 'center' }}>
                                    {t("validation.loginToBookMessage")}
                                </Typography>
                            )}

                            {/* Booking Type Selection (هذا الجزء سيبقى مرئيًا للجميع لاختيار نوع الحجز) */}
                            <FormControl component="fieldset" fullWidth margin="normal" error={!!errors.selectedPeriod || !!errors.dateRange || !!errors.periodSelection}>
                                <FormLabel component="legend">{t("details.chooseBookingType")}</FormLabel>
                                <RadioGroup
                                    row
                                    value={formData.periodType}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        periodType: e.target.value,
                                        startDate: new Date(),
                                        endDate: e.target.value === 'dayPeriod' ? new Date() : addDays(new Date(), 1),
                                        selectedPeriod: e.target.value === 'dayPeriod' ? 'كامل اليوم' : '',
                                        checkInSelection: 'صباحية',
                                        checkOutSelection: 'مسائية',
                                        cost: 0
                                    }))}
                                >
                                    <FormControlLabel
                                        value="dayPeriod"
                                        control={<Radio />}
                                        label={t("details.fixedPeriod")}
                                    />
                                    <FormControlLabel
                                        value="days"
                                        control={<Radio />}
                                        label={t("details.multiplePeriods")}
                                    />
                                </RadioGroup>
                                {errors.selectedPeriod && <Typography variant="caption" color="error" className="error-text-bottom">{errors.selectedPeriod}</Typography>}
                                {errors.dateRange && <Typography variant="caption" color="error" className="error-text-bottom">{errors.dateRange}</Typography>}
                                {errors.periodSelection && <Typography variant="caption" color="error" className="error-text-bottom">{errors.periodSelection}</Typography>}

                                {/* Period Selection (for 'dayPeriod' type) */}
                                {formData.periodType === "dayPeriod" ? (
                                    <div className="period-section">
                                        <h3>{t("details.period")}</h3>
                                        <div className="period-buttons">
                                            {periodButtons.map((button) => {
                                                const hasPrice = !!hallData?.price?.[button.priceKey];
                                                const currentPeriodStatus = dailyAvailabilityStatus[button.priceKey];
                                                const isDisabled = !hasPrice || currentPeriodStatus === 'unavailable' || availabilityChecking;
                                                const buttonColor = (currentPeriodStatus === 'available' && hasPrice) ? 'green' : 'red';
                                                const opacity = isDisabled ? 0.6 : 1;

                                                return (
                                                    <MuiButton
                                                        key={button.value}
                                                        className={`period-btn btn ${formData.selectedPeriod === button.value ? "active" : ""}`}
                                                        onClick={() => {
                                                            if (!isDisabled) {
                                                                setFormData(prev => ({
                                                                    ...prev,
                                                                    selectedPeriod: button.value,
                                                                    checkInSelection: button.checkIn,
                                                                    checkOutSelection: button.checkOut,
                                                                    endDate: prev.startDate
                                                                }));
                                                            }
                                                        }}
                                                        disabled={isDisabled}
                                                        style={{ borderColor: buttonColor, color: buttonColor, opacity: opacity }}
                                                    >
                                                        <span className="period-label">
                                                            {i18n.language === "ar" ? button.label : button.enLabel}
                                                        </span>
                                                        {hasPrice && (
                                                            <>
                                                                <span className="period-price">{hallData.price[button.priceKey]} {t("details.currency")}</span>
                                                                <span className="period-time">({hallData[button.checkInTime ? 'dayStartHour' : 'nightStartHour']} - {hallData[button.checkOutTime ? 'dayEndHour' : 'nightEndHour']})</span>
                                                                {currentPeriodStatus === 'unavailable' && <span className="status-text" style={{ color: 'red' }}> ({t("cards.fullyBooked")})</span>}
                                                            </>
                                                        )}
                                                        {!hasPrice && <span className="period-unavailable" style={{ color: 'red' }}> ({t("details.notAvailable")})</span>}
                                                    </MuiButton>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : ( // 'days' type (multiple days booking)
                                    <Grid container spacing={2} sx={{ mt: 2 }}>
                                        <Grid item xs={12} md={6}>
                                            <InputLabel className="input-label-custom">{t("details.checkInDate")}</InputLabel>
                                            <TextField
                                                fullWidth
                                                type="date"
                                                value={formatDate(formData.startDate)}
                                                onChange={(e) => {
                                                    const [year, month, day] = e.target.value.split('-').map(part => parseInt(part, 10));
                                                    const safeNewStartDate = new Date(Date.UTC(year, month - 1, day));
                                                    if (!isNaN(safeNewStartDate.getTime())) {
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            startDate: safeNewStartDate,
                                                            endDate: addDays(safeNewStartDate, 1)
                                                        }));
                                                    }
                                                }}
                                                InputLabelProps={{ shrink: true }}
                                                inputProps={{ min: todayFormatted }}
                                            />

                                            <div style={{ marginTop: '10px' }}>
                                                <FormLabel component="legend">{t("details.checkInPeriod")}</FormLabel>
                                                <RadioGroup
                                                    row
                                                    value={formData.checkInSelection}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, checkInSelection: e.target.value }))}
                                                >
                                                    <FormControlLabel
                                                        value="صباحية"
                                                        control={<Radio />}
                                                        label={t("details.morning")}
                                                    />
                                                    <FormControlLabel
                                                        value="مسائية"
                                                        control={<Radio />}
                                                        label={t("details.Night")}
                                                    />
                                                </RadioGroup>
                                            </div>
                                        </Grid>

                                        <Grid item xs={12} md={6}>
                                            <InputLabel className="input-label-custom">{t("details.checkOutDate")}</InputLabel>
                                            <TextField
                                                fullWidth
                                                type="date"
                                                value={formatDate(formData.endDate)}
                                                onChange={(e) => {
                                                    const [year, month, day] = e.target.value.split('-').map(part => parseInt(part, 10));
                                                    const safeNewEndDate = new Date(Date.UTC(year, month - 1, day));
                                                    if (!isNaN(safeNewEndDate.getTime())) {
                                                        setFormData(prev => ({ ...prev, endDate: safeNewEndDate }));
                                                    }
                                                }}
                                                InputLabelProps={{ shrink: true }}
                                                inputProps={{ min: minCheckoutDateFormatted }}
                                            />

                                            <div style={{ marginTop: '10px' }}>
                                                <FormLabel component="legend">{t("details.checkOutPeriod")}</FormLabel>
                                                <RadioGroup
                                                    row
                                                    value={formData.checkOutSelection}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, checkOutSelection: e.target.value }))}
                                                >
                                                    <FormControlLabel
                                                        value="صباحية"
                                                        control={<Radio />}
                                                        label={t("details.morning")}
                                                    />
                                                    <FormControlLabel
                                                        value="مسائية"
                                                        control={<Radio />}
                                                        label={t("details.Night")}
                                                    />
                                                </RadioGroup>
                                            </div>
                                        </Grid>
                                    </Grid>
                                )}
                            </FormControl>
                        </div>

                        {/* Right Column - Summary */}
                        <div className="summary-column">
                            <div className="summary-card">
                                <div className="date-box">
                                    <div className="date-field">
                                        <p>{t("details.arrive")}</p>
                                        <p>{format(formData.startDate, 'MM/dd/yyyy')}</p>
                                        <p style={{ fontSize: '0.8rem', color: '#666' }}>
                                            {formData.checkInSelection === 'صباحية' ? t("details.morning") : t("details.Night")}
                                        </p>
                                    </div>

                                    {(formData.periodType === "days" || differenceInDays(formData.endDate, formData.startDate) > 0 || (differenceInDays(formData.endDate, formData.startDate) === 0 && formData.selectedPeriod === 'كامل اليوم')) && (
                                        <div className="date-field">
                                            <p>{t("details.left")}</p>
                                            <p>{format(formData.endDate, 'MM/dd/yyyy')}</p>
                                            <p style={{ fontSize: '0.8rem', color: '#666' }}>
                                                {formData.checkOutSelection === 'صباحية' ? t("details.morning") : t("details.Night")}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="total-price-box">
                                    {i18n.language === 'ar' ? (
                                        <>
                                            <p>{t("details.total")}</p>
                                            <span>{formData.cost} {t("details.currency")}</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>{formData.cost} {t("details.currency")}</span>
                                            <p>{t("details.total")}</p>
                                        </>
                                    )}
                                </div>

                                {/* Conditional rendering for the submit button */}
                                {isAuthenticated ? (
                                    <MuiButton
                                        type='submit'
                                        className='reserve-btn btn'
                                        disabled={isMainButtonDisabled}
                                    >
                                        {mainButtonText}
                                    </MuiButton>
                                ) : (
                                    <MuiButton
                                        className='reserve-btn btn'
                                        onClick={() => navigate("/user/signin")}
                                        sx={{ mt: 2 }} // إضافة هامش علوي للتباعد
                                    >
                                        {t("common.loginToContinue")} {/* زر يدعو لتسجيل الدخول بدلاً من الحجز */}
                                    </MuiButton>
                                )}

                                <p className='installment-title'>{t("details.pill")}</p>

                                <Grid container spacing={2} className="installment-grid">
                                    <Grid item xs={4} className='installment-item'>
                                        <CircularProgressWithLabel
                                            value={100}
                                            label={3}
                                            style={{ color: "var(--primary)" }}
                                        />
                                        <p className='installment-amount'>
                                            {Math.floor(formData.cost / 3)} {t("details.currency")}
                                        </p>
                                    </Grid>
                                    <Grid item xs={4} className='installment-item'>
                                        <CircularProgressWithLabel
                                            value={66}
                                            label={2}
                                            style={{ color: "var(--primary)" }}
                                        />
                                        <p className='installment-amount'>
                                            {Math.floor(formData.cost / 3)} {t("details.currency")}
                                        </p>
                                    </Grid>
                                    <Grid item xs={4} className='installment-item'>
                                        <CircularProgressWithLabel
                                            value={33}
                                            label={1}
                                            style={{ color: "var(--primary)" }}
                                        />
                                        <p className='installment-amount'>
                                            {Math.floor(formData.cost / 3)} {t("details.currency")}
                                        </p>
                                    </Grid>
                                </Grid>
                            </div>
                        </div>
                    </form>

                    <MapLocation />
                </div>
            ) : (
                <Backdrop open={!hallData} sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
                    <CircularProgress color="inherit" />
                </Backdrop>
            )}

            {/* Dialogs and Snackbars */}
            <Dialoge
                open={dialogeMessage}
                handleClose={() => {
                    setDialogeMessage(false);
                    setLoading(false);
                    navigate('/');
                }}
            />

            <Snackbar
                open={snackOpenSuccess}
                autoHideDuration={6000}
                onClose={() => setSnackOpenSuccess(false)}
            >
                <Alert
                    onClose={() => setSnackOpenSuccess(false)}
                    severity="success"
                    sx={{ width: '100%' }}
                >
                    {t("details.reservationSuccess")}
                </Alert>
            </Snackbar>

            <Snackbar
                open={snackOpenError}
                autoHideDuration={6000}
                onClose={() => setSnackOpenError(false)}
            >
                <Alert
                    onClose={() => setSnackOpenError(false)}
                    severity="error"
                    sx={{ width: '100%' }}
                >
                    {errorMessage}
                </Alert>
            </Snackbar>

            <Backdrop
                open={loading}
                sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
            >
                <CircularProgress color="inherit" />
            </Backdrop>

            <Footer />
        </>
    );
};

export default ReservationHall;