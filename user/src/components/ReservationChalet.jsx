// client/src/components/ReservationChalet.jsx

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
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
import { useNavigate, useLocation } from 'react-router-dom';

// Components (تأكد من مساراتها الصحيحة)
import Footer from './Footer';
import Dialoge from './Dialoge';
import MapLocation from './MapLocation';
import Api from '../config/config'; // تأكد أن هذا المسار لـ axios instance
import { fetchUserData } from '../redux/reducers/user';
import { fetchBankDetails } from '../redux/reducers/bank';
import "../scss/reservationChalet.scss"; // استخدم ملف SCSS الصحيح لهذا المكون

// Alert component for Snackbar
const Alert = React.forwardRef(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

// Helper function to format date to "yyyy-MM-dd"
const formatDate = (date) => date instanceof Date && !isNaN(date.getTime()) ? format(date, "yyyy-MM-dd") : "";

function ReservationChalet({ data: chaletData }) {
    const { t, i18n } = useTranslation();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();

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
    const [dailyAvailabilityStatus, setDailyAvailabilityStatus] = useState({
        morning: 'available',
        night: 'available',
        wholeDay: 'available',
    });
    const [isOverallPeriodAvailable, setIsOverallPeriodAvailable] = useState(true);

    // State for form validation errors (frontend)
    const [errors, setErrors] = useState({});

    // Initial form data from navigation state or defaults
    const initialSelectedDate = useMemo(() => {
        const dateFromState = location.state?.selectedDate ? new Date(location.state.selectedDate) : null;
        return dateFromState instanceof Date && !isNaN(dateFromState.getTime()) ? dateFromState : new Date();
    }, [location.state?.selectedDate]);

    const initialPeriodType = location.state?.initialPeriodType || 'dayPeriod';

    const [formData, setFormData] = useState(() => ({
        startDate: initialSelectedDate,
        endDate: initialPeriodType === 'dayPeriod' ? initialSelectedDate : addDays(initialSelectedDate, 1),
        periodType: initialPeriodType,
        selectedPeriod: 'كامل اليوم',
        checkInSelection: 'صباحية',
        checkOutSelection: 'مسائية',
        cost: chaletData?.price?.wholeDay || 0,
        type: 'chalet',
        fullName: '',
        phoneNumber: '',
        idNumber: '',
        address: '',
        nationality: '',
        discountCode: '',
        paymentMethod: '',
        bankName: '',
        paymentProof: '',
    }));

    // Redux state
    const isAuthenticated = useSelector((state) => state.user.isAuthenticated);
    const user = useSelector((state) => state.user.data);
    const banks = useSelector((state) => state.bank.value.data);

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

    // Handle date changes for dayPeriod type
    useEffect(() => {
        const newStartDate = new Date(formData.startDate);
        if (formData.periodType === 'dayPeriod') {
            setFormData(prev => ({ ...prev, endDate: newStartDate }));
        } else if (new Date(formData.endDate).getTime() < newStartDate.getTime()) {
            setFormData(prev => ({ ...prev, endDate: newStartDate }));
        }
    }, [formData.startDate, formData.periodType, formData.endDate]);

    // Period options for fixed day periods (Chalet specific times if different from Hall)
    const periodButtons = useMemo(() => [
        {
            label: 'صباحية', value: 'صباحية', enLabel: t("details.morning"),
            priceKey: 'morning', checkIn: 'صباحية', checkOut: 'صباحية',
            checkInTime: chaletData?.dayStartHour || "09:00", checkOutTime: chaletData?.dayEndHour || "17:00"
        },
        {
            label: 'مسائية', value: 'مسائية', enLabel: t("details.Night"),
            priceKey: 'night', checkIn: 'مسائية', checkOut: 'مسائية',
            checkInTime: chaletData?.nightStartHour || "18:00", checkOutTime: chaletData?.nightEndHour || "23:00"
        },
        {
            label: 'كامل اليوم', value: 'كامل اليوم', enLabel: t("details.day"),
            priceKey: 'wholeDay', checkIn: 'صباحية', checkOut: 'مسائية',
            checkInTime: chaletData?.dayStartHour || "09:00", checkOutTime: chaletData?.nightEndHour || "23:00"
        },
    ], [t, chaletData]);

    // Calculate cost (Optimized with useCallback for memoization)
    const calculateCost = useCallback(() => {
        if (!chaletData?.price) return 0;

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

            if (dailyAvailabilityStatus[selectedPeriodKey] === 'available') {
                calculatedCost = chaletData.price[selectedPeriodKey];
            } else {
                calculatedCost = 0;
            }

        } else { // Multi-day booking ('days' periodType)
            let currentDate = new Date(startDateObj);
            while (currentDate.getTime() <= endDateObj.getTime()) {
                let dayCost = 0;

                if (currentDate.getTime() === startDateObj.getTime()) {
                    dayCost = formData.checkInSelection === 'صباحية' ? chaletData.price.wholeDay : chaletData.price.night;
                } else if (currentDate.getTime() === endDateObj.getTime()) {
                    dayCost = formData.checkOutSelection === 'صباحية' ? chaletData.price.morning : chaletData.price.wholeDay;
                } else {
                    dayCost = chaletData.price.wholeDay;
                }
                calculatedCost += dayCost;
                currentDate.setDate(currentDate.getDate() + 1);
            }
        }
        return calculatedCost;
    }, [
        formData.startDate, formData.endDate, formData.periodType, formData.selectedPeriod,
        formData.checkInSelection, formData.checkOutSelection, chaletData?.price,
        dailyAvailabilityStatus // ✅ dayPeriodAvailability تم تغييرها إلى dailyAvailabilityStatus
    ]);

    // Update cost in formData whenever relevant dependencies change
    useEffect(() => {
        const newCost = calculateCost();
        if (formData.cost !== newCost) {
            setFormData(prev => ({ ...prev, cost: newCost }));
        }
    }, [calculateCost, formData.cost]);


    // Memoize `periodDetails` for `checkChaletAvailability` to avoid unnecessary re-creation
    const periodDetails = useMemo(() => {
        let finalCheckInTime;
        let finalCheckOutTime;

        if (formData.periodType === 'dayPeriod') {
            const selectedButton = periodButtons.find(p => p.value === formData.selectedPeriod);
            finalCheckInTime = selectedButton?.checkInTime;
            finalCheckOutTime = selectedButton?.checkOutTime;
        } else { // 'days' type
            finalCheckInTime = formData.checkInSelection === 'صباحية' ? chaletData?.dayStartHour : chaletData?.nightStartHour;
            finalCheckOutTime = formData.checkOutSelection === 'صباحية' ? chaletData?.dayEndHour : chaletData?.nightEndHour;
        }

        return {
            startDate: formatDate(formData.startDate),
            endDate: formatDate(formData.endDate),
            type: formData.periodType, // 'dayPeriod' or 'days'
            dayPeriod: formData.periodType === 'dayPeriod' ? formData.selectedPeriod : undefined,
            checkIn: {
                name: formData.checkInSelection,
                time: finalCheckInTime
            },
            checkOut: {
                name: formData.checkOutSelection,
                time: finalCheckOutTime
            }
        };
    }, [
        formData.startDate, formData.endDate, formData.periodType, formData.selectedPeriod,
        formData.checkInSelection, formData.checkOutSelection,
        chaletData?.dayStartHour, chaletData?.dayEndHour, chaletData?.nightStartHour, chaletData?.nightEndHour,
        periodButtons
    ]);


    // Check chalet availability - Debounced and optimized dependencies
    const checkChaletAvailability = useCallback(async () => {
        if (!chaletData?._id || !periodDetails.startDate || !periodDetails.endDate ||
            isNaN(new Date(periodDetails.startDate).getTime()) || isNaN(new Date(periodDetails.endDate).getTime())) {
            setIsOverallPeriodAvailable(true);
            setDailyAvailabilityStatus({ morning: 'available', night: 'available', wholeDay: 'available' });
            setErrorMessage(t("details.invalidDateRange"));
            setSnackOpenError(true);
            return;
        }

        if (new Date(periodDetails.endDate).getTime() < new Date(periodDetails.startDate).getTime()) {
            setDailyAvailabilityStatus({ morning: 'unavailable', night: 'unavailable', wholeDay: 'unavailable' });
            setIsOverallPeriodAvailable(false);
            setErrorMessage(t("details.endDateBeforeStartDate"));
            setSnackOpenError(true);
            return;
        }

        setAvailabilityChecking(true);
        try {
            let overallAvailabilityCheck = true;
            let tempDailyStatus = { morning: 'available', night: 'available', wholeDay: 'available' };
            let tempErrorMessage = "";

            let currentDate = new Date(new Date(periodDetails.startDate).setUTCHours(0, 0, 0, 0));

            while (currentDate.getTime() <= new Date(periodDetails.endDate).setUTCHours(0, 0, 0, 0)) {
                // ✅ هنا يتم استدعاء API جلب التوفر اليومي
                // هذا هو الـ API الذي يجب أن يكون موجودًا في الـ Backend
                // ويسد '/admin/reservations/get-daily-availability'
                const response = await Api.post('/admin/reservations/get-daily-availability', {
                    entityId: chaletData._id,
                    date: formatDate(currentDate)
                });
                const dayStatus = response.data.availability;

                let currentDayIsAvailable = true;

                if (periodDetails.type === 'dayPeriod') {
                    const selectedPeriodKey = (periodDetails.dayPeriod === 'صباحية') ? 'morning' :
                                              (periodDetails.dayPeriod === 'مسائية') ? 'night' :
                                              'wholeDay';
                    if (dayStatus[selectedPeriodKey] === 'unavailable' || dayStatus[selectedPeriodKey] === 'unknown') {
                        currentDayIsAvailable = false;
                        tempErrorMessage = t("details.periodUnavailableSpecific", { period: periodDetails.dayPeriod, date: formatDate(currentDate) });
                    }
                    tempDailyStatus = dayStatus;
                } else { // 'days' type
                    const reqStartDateUTC = new Date(periodDetails.startDate).setUTCHours(0,0,0,0);
                    const reqEndDateUTC = new Date(periodDetails.endDate).setUTCHours(0,0,0,0);

                    if (currentDate.getTime() === reqStartDateUTC) { // First day
                        if (periodDetails.checkIn.name === 'صباحية' && dayStatus.wholeDay === 'unavailable') currentDayIsAvailable = false;
                        else if (periodDetails.checkIn.name === 'مسائية' && dayStatus.night === 'unavailable') currentDayIsAvailable = false;
                    } else if (currentDate.getTime() === reqEndDateUTC) { // Last day
                        if (periodDetails.checkOut.name === 'صباحية' && dayStatus.morning === 'unavailable') currentDayIsAvailable = false;
                        else if (periodDetails.checkOut.name === 'مسائية' && dayStatus.wholeDay === 'unavailable') currentDayIsAvailable = false;
                    } else { // Middle days
                        if (dayStatus.wholeDay === 'unavailable') currentDayIsAvailable = false;
                    }

                    if (!currentDayIsAvailable) {
                        tempErrorMessage = t("details.periodUnavailableOnDate", { date: formatDate(currentDate) });
                    }
                }

                if (!currentDayIsAvailable) {
                    overallAvailabilityCheck = false;
                    break;
                }
                currentDate.setDate(currentDate.getDate() + 1);
            }

            setDailyAvailabilityStatus(tempDailyStatus);
            setIsOverallPeriodAvailable(overallAvailabilityCheck);

            if (!overallAvailabilityCheck) {
                setErrorMessage(tempErrorMessage);
                setSnackOpenError(true);
            } else {
                setSnackOpenError(false);
            }

        } catch (error) {
            // ✅ هذا هو الجزء الذي يجب معالجته: خطأ 404
            console.error("Error checking availability:", error.response?.data || error);
            // رسالة الخطأ الأصلية كانت: Cannot POST /reservations/check-availability 404 (Not Found)
            // هذا يعني أن الـ Backend لا يمتلك هذا المسار
            // يجب أن يكون المسار الصحيح هو `/admin/reservations/get-daily-availability`
            // كما تم الاتفاق عليه سابقًا في الـ Backend
            const backendErrorMsg = error.response?.data?.error || error.response?.data?.message;
            if (error.response?.status === 404 && error.config.url.includes('/reservations/check-availability')) {
                 setErrorMessage(t("common.apiEndpointNotFound") + ": /admin/reservations/get-daily-availability");
            } else {
                 setErrorMessage(backendErrorMsg || t("common.networkError"));
            }
            setSnackOpenError(true);
            setDailyAvailabilityStatus({ morning: 'unavailable', night: 'unavailable', wholeDay: 'unavailable' });
            setIsOverallPeriodAvailable(false);
        } finally {
            setAvailabilityChecking(false);
        }
    }, [chaletData, periodDetails, t, setDailyAvailabilityStatus, setIsOverallPeriodAvailable, setErrorMessage, setSnackOpenError]); // Add setter functions to dependencies


    // Trigger availability check with a debounce effect
    useEffect(() => {
        const timer = setTimeout(() => {
            checkChaletAvailability();
        }, 500); // 500ms debounce
        return () => clearTimeout(timer);
    }, [checkChaletAvailability, periodDetails]);


    // CircularProgressWithLabel (component helper)
    function CircularProgressWithLabel(props) {
        const { value, label } = props;
        return (
            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                <CircularProgress variant="determinate" {...props} />
                <Box sx={{ top: 0, left: 0, bottom: 0, right: 0, position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="caption" style={{ fontWeight: "700", fontSize: "1.2rem" }} color="text.secondary">{label}</Typography>
                </Box>
            </Box>
        );
    }

    // Form validation
    const validateFields = useCallback(() => {
        const newErrors = {};
        let isValid = true;

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

        if (!formData.periodType) {
            newErrors.periodSelection = t("validation.periodTypeRequired");
            isValid = false;
        }

        if (!isOverallPeriodAvailable) {
            newErrors.dateRange = errorMessage || t("details.periodUnavailable");
            isValid = false;
        }
        
        if (formData.periodType === 'dayPeriod' && !formData.selectedPeriod) {
            newErrors.selectedPeriod = t("validation.periodSelectionRequired");
            isValid = false;
        }
        
        setErrors(newErrors);
        return isValid;
    }, [formData, isOverallPeriodAvailable, errorMessage, t]);

    // Update user profile (memoized with useCallback)
    const updateUserProfile = useCallback(async () => {
        if (!isAuthenticated || !user) return;

        const updates = {};
        if (formData.fullName !== user.name) updates.name = formData.fullName;
        if (formData.phoneNumber !== user.phone) updates.phone = formData.phoneNumber;
        if (formData.idNumber !== user.idNumber) updates.idNumber = formData.idNumber;
        if (formData.address !== user.address) updates.address = formData.address;
        if (formData.nationality !== user.nationality) updates.nationality = formData.nationality;

        if (Object.keys(updates).length > 0) {
            try {
                await Api.patch('/users/update-profile', updates); // تأكد من وجود هذا المسار في الـ Backend
                dispatch(fetchUserData());
            } catch (err) {
                console.error("Failed to update user profile:", err);
            }
        }
    }, [isAuthenticated, user, formData, dispatch]);

    // Form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        setErrors({});

        if (!isAuthenticated) {
            setErrorMessage(t("validation.loginRequiredForReservation"));
            setSnackOpenError(true);
            setTimeout(() => navigate("/user/signin"), 2000);
            return;
        }

         if (!isOverallPeriodAvailable || chaletData?.maintenance) {
        setErrorMessage(errorMessage || t("details.periodUnavailable"));
        setSnackOpenError(true);
        return;
    }

    if (!validateFields()) {
        setSnackOpenError(true);
        if (Object.keys(errors).length > 0) {
            setErrorMessage(t("validation.pleaseCorrectErrors"));
        }
        return;
    }

    setLoading(true);

    try {
        const reservationData = {
            clientId: user?._id,
            clientName: formData.fullName,
            phone: formData.phoneNumber,
            email: user?.email,
            idNumber: formData.idNumber,
            nationality: formData.nationality,
            address: formData.address,
            entityId: chaletData._id,
            notes: "",
            paymentMethod: formData.paymentMethod,
            bankName: formData.paymentMethod === "bank" ? formData.bankName : null,
            paymentProof: formData.paymentMethod === "bank" ? formData.paymentProof : null,
            paidAmount: 0,
            // discountAmount: parseFloat(formData.discountCode) || 0, // ❌ احذف هذا السطر
            couponCode: formData.discountCode, // ✅ أضف هذا السطر لإرسال كود الكوبون كنص
            period: periodDetails,
            entityName: chaletData.name,
            type: formData.type
        };
        
        await updateUserProfile();

        const response = await Api.post('/user/reservation', reservationData); // تأكد من أن هذا هو المسار الصحيح في الـ Backend

        if (response.status === 201) {
            setSnackOpenSuccess(true);
            setDialogeMessage(true);
            setTimeout(() => navigate('/reservations'), 3000);
        }
    } catch (error) {
        console.error("Error during reservation submission:", error.response?.data || error);
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

    // UI text and states
    const todayFormatted = format(new Date(), 'yyyy-MM-dd');
    const minCheckoutDate = formData.startDate ?
        format(new Date(formData.startDate), 'yyyy-MM-dd') :
        '';

    // Main button properties
    const mainButtonText = availabilityChecking ? t("details.checkingAvailability") :
        (chaletData?.maintenance) ? t("details.maintenanceMessage") :
        (!isOverallPeriodAvailable) ? t("details.periodUnavailable") :
        t("details.bookNow");

    const isMainButtonDisabled =
        chaletData?.maintenance ||
        loading ||
        availabilityChecking ||
        !isOverallPeriodAvailable ||
        (formData.periodType === 'dayPeriod' && dailyAvailabilityStatus[
            formData.selectedPeriod === 'صباحية' ? 'morning' :
            formData.selectedPeriod === 'مسائية' ? 'night' :
            'wholeDay'
        ] !== 'available') ||
        (new Date(formData.endDate).getTime() < new Date(formData.startDate).getTime()) ||
        Object.keys(errors).some(key => errors[key]);


    return (
        <>
            {chaletData ? (
                <div className="reservation-chalet-container" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
                    {/* Price Header Section */}
                    <div className='price-header-section'>
                        {i18n.language === 'ar' ? (
                            <h3>{t("details.price_per_day")} <span>{chaletData.price?.wholeDay || 0} {t("details.currency")}</span></h3>
                        ) : (
                            <h3><span>{chaletData.price?.wholeDay || 0} {t("details.currency")}</span> {t("details.price_per_day")}</h3>
                        )}
                        <div className='sub-prices'>
                            {chaletData.price?.morning && <span>{t("details.morning")}: {chaletData.price.morning} {t("details.currency")}</span>}
                            {chaletData.price?.night && <span>{t("details.Night")}: {chaletData.price.night} {t("details.currency")}</span>}
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
                                                    endDate: prev.periodType === 'dayPeriod' ? date : (prev.endDate.getTime() < date.getTime() ? date : prev.endDate)
                                                }));
                                            }}
                                            minDate={new Date()}
                                            date={formData.startDate}
                                        />
                                    </div>
                                )}
                            </div>

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

                            {/* Booking Type Selection */}
                            <FormControl component="fieldset" fullWidth margin="normal" error={!!errors.selectedPeriod || !!errors.dateRange || !!errors.periodSelection}>
                                <FormLabel component="legend">{t("details.chooseBookingType")}</FormLabel>
                                <RadioGroup
                                    row
                                    value={formData.periodType}
                                    onChange={(e) => {
                                        const newType = e.target.value;
                                        setFormData(prev => ({
                                            ...prev,
                                            periodType: newType,
                                            startDate: new Date(),
                                            endDate: newType === 'dayPeriod' ? new Date() : addDays(new Date(), 1),
                                            selectedPeriod: newType === 'dayPeriod' ? 'كامل اليوم' : '',
                                            checkInSelection: 'صباحية',
                                            checkOutSelection: 'مسائية',
                                            cost: 0
                                        }));
                                    }}
                                >
                                    <FormControlLabel
                                        value="dayPeriod"
                                        control={<Radio />}
                                        label={t("details.fixedPeriod")}
                                    />
                                    <FormControlLabel
                                        value="days" // يتوافق مع 'period.type' في الـ Backend
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
                                                const hasPrice = !!chaletData?.price?.[button.priceKey];
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
                                                                    endDate: prev.startDate // Ensure endDate is same as startDate for single day booking
                                                                }));
                                                            }
                                                        }}
                                                        disabled={isDisabled}
                                                        style={{ borderColor: buttonColor, color: buttonColor, opacity: opacity }}
                                                    >
                                                        <span className="period-label">{i18n.language === "ar" ? button.label : button.enLabel}</span>
                                                        {hasPrice && (
                                                            <>
                                                                <span className="period-price">{chaletData.price[button.priceKey]} {t("details.currency")}</span>
                                                                <span className="period-time">({button.checkInTime} - {button.checkOutTime})</span>
                                                                {currentPeriodStatus === 'unavailable' && <span className="status-text" style={{ color: 'red' }}> ({t("cards.fullyBookedMessage")})</span>}
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
                                                            endDate: prev.endDate.getTime() < safeNewStartDate.getTime() ? safeNewStartDate : prev.endDate
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
                                                inputProps={{ min: formatDate(formData.startDate) }}
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

                                <MuiButton
                                    type='submit'
                                    className='reserve-btn btn'
                                    disabled={isMainButtonDisabled}
                                >
                                    {mainButtonText}
                                </MuiButton>

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
                <Backdrop open={!chaletData} sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
                    <CircularProgress color="inherit" />
                </Backdrop>
            )}

            {/* Dialogs and Snackbars */}
            <Dialoge
                open={dialogeMessage}
                handleClose={() => {
                    setDialogeMessage(false);
                    setLoading(false);
                    navigate('/reservations'); // Redirect to user reservations page
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
}

export default ReservationChalet;