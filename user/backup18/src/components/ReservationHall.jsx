import * as React from 'react';
import { useEffect, useRef, useState, useCallback } from 'react';
import { Calendar } from 'react-date-range';
import format from 'date-fns/format';
import { addDays, differenceInDays } from 'date-fns';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { InputLabel, Select, MenuItem, Grid, TextField, CircularProgress, Box, Typography, Radio, RadioGroup, FormControlLabel, FormControl, FormLabel, Snackbar } from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import Backdrop from '@mui/material/Backdrop';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from 'react-bootstrap';

// استيراد المكونات المخصصة وملفات SCSS
import Footer from './Footer';
import Dialoge from './Dialoge';
import MapLocation from './../components/MapLocation';
import Api from './../config/config';
import { fetchUserData } from './../redux/reducers/user';
import { fetchBankDetails } from '../redux/reducers/bank'; 
import "../scss/reservationChalet.scss"; // استخدم نفس ملف الـ SCSS الخاص بالشاليهات لتطبيق التنسيق

const Alert = React.forwardRef(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

// Component to render video
const VideoPlayer = ({ src }) => (
    <div className="video-container">
        <iframe
            src={src}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="Hall Video"
        ></iframe>
    </div>
);


function ReservationHall({ data: data2 }) {
    const { t, i18n } = useTranslation();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [openCalendar, setOpenCalendar] = useState(false);
    const calendarRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [snackOpenSuccess, setSnackOpenSuccess] = useState(false);
    const [snackOpenError, setSnackOpenError] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [dialogeMessage, setDialogeMessage] = useState(false);

    const isAuthenticated = useSelector((state) => state.user.isAuthenticated);
    const user = useSelector((state) => state.user.data);
    const banks = useSelector((state) => state.bank.value.data); 

    const [errors, setErrors] = useState({});
    const [isPeriodAvailable, setIsPeriodAvailable] = useState(true); 
    const [availabilityChecking, setAvailabilityChecking] = useState(false); 

    // ✅ حالة جديدة لتتبع توفر الفترات اليومية (morning, night, wholeDay) من الباك إند
    const [dayPeriodAvailability, setDayPeriodAvailability] = useState({
        morning: 'available', // 'available', 'confirmed', 'unConfirmed', 'partial-confirmed', 'partial-unConfirmed'
        night: 'available',
        wholeDay: 'available',
    });

    const [formData, setFormData] = useState({
        startDate: new Date(),
        endDate: addDays(new Date(), 1), // Default for multi-day
        periodType: 'dayPeriod', // Default to fixed period (dayPeriod)
        selectedPeriod: 'كامل اليوم', // Default to "كامل اليوم" to set initial checkIn/Out
        checkInSelection: 'صباحية', // Default check-in selection for any type
        checkOutSelection: 'مسائية', // Default check-out selection for any type
        cost: data2?.price?.wholeDay || 0, // Initial cost based on default selectedPeriod
        type: 'hall', 
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

    // جلب بيانات البنوك عند تحميل المكون
    useEffect(() => {
        dispatch(fetchBankDetails());
    }, [dispatch]);

    // Populate user data if authenticated
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
        } else {
            setFormData(prev => ({ ...prev, fullName: '', phoneNumber: '', idNumber: '', address: '', nationality: '' }));
        }
    }, [isAuthenticated, user]);

    // Auto-adjust end date for custom period and enforce same start/end for dayPeriod
    useEffect(() => {
        if (formData.periodType === 'customPeriod' && formData.startDate && formData.endDate) {
            if (differenceInDays(new Date(formData.endDate), new Date(formData.startDate)) < 0) {
                setFormData(prev => ({ ...prev, endDate: prev.startDate }));
            }
        } else if (formData.periodType === 'dayPeriod') {
            setFormData(prev => ({ ...prev, endDate: prev.startDate }));
        }
    }, [formData.startDate, formData.periodType, formData.endDate]); 

    // Define period buttons with their corresponding check-in/out selections and display info
    const periodButtons = [
        { label: 'صباحية', value: 'صباحية', enLabel: t("details.morning"), priceKey: 'morning', checkIn: 'صباحية', checkOut: 'صباحية', startHour: "dayStartHour", endHour: "dayEndHour" },
        { label: 'مسائية', value: 'مسائية', enLabel: t("details.Night"), priceKey: 'night', checkIn: 'مسائية', checkOut: 'مسائية', startHour: "nightStartHour", endHour: "nightEndHour" },
        { label: 'كامل اليوم', value: 'كامل اليوم', enLabel: t("details.day"), priceKey: 'wholeDay', checkIn: 'صباحية', checkOut: 'مسائية', startHour: "dayStartHour", endHour: "nightEndHour" },
    ];

    // Calculate cost based on selected period and dates, using checkInSelection/checkOutSelection
    useEffect(() => {
        if (!data2 || !data2.price) return;

        let totalCost = 0;
        const morningPrice = data2.price.morning || 0;
        const nightPrice = data2.price.night || 0;
        const wholeDayPrice = data2.price.wholeDay || (morningPrice + nightPrice); // Fallback

        const startDateObj = new Date(formData.startDate);
        const endDateObj = new Date(formData.endDate);
        startDateObj.setUTCHours(0, 0, 0, 0); 
        endDateObj.setUTCHours(0, 0, 0, 0); 

        const isSingleDayBooking = startDateObj.getTime() === endDateObj.getTime();

        if (isSingleDayBooking) {
            // For single-day booking, use the specific checkIn/Out selection
            if (formData.checkInSelection === 'صباحية' && formData.checkOutSelection === 'مسائية') {
                totalCost = wholeDayPrice;
            } else if (formData.checkInSelection === 'صباحية' && formData.checkOutSelection === 'صباحية') {
                totalCost = morningPrice;
            } else if (formData.checkInSelection === 'مسائية' && formData.checkOutSelection === 'مسائية') {
                totalCost = nightPrice;
            } else {
                // Handle illogical combinations (e.g., check-in night, check-out morning on same day)
                totalCost = wholeDayPrice; // Default to whole day for now
            }
        } else {
            // For multi-day booking
            let currentDate = new Date(startDateObj);
            while (currentDate.getTime() <= endDateObj.getTime()) {
                let dayCost = 0;
                if (currentDate.getTime() === startDateObj.getTime()) {
                    // Cost for the first day based on check-in selection
                    dayCost = (formData.checkInSelection === 'صباحية' ? wholeDayPrice : nightPrice);
                } else if (currentDate.getTime() === endDateObj.getTime()) {
                    // Cost for the last day based on check-out selection
                    dayCost = (formData.checkOutSelection === 'صباحية' ? morningPrice : wholeDayPrice);
                } else {
                    // Cost for full middle days
                    dayCost = wholeDayPrice;
                }
                totalCost += dayCost;
                currentDate.setDate(currentDate.getDate() + 1);
            }
        }

        setFormData(prev => ({
            ...prev,
            cost: totalCost,
        }));

    }, [formData.periodType, formData.startDate, formData.endDate, formData.checkInSelection, formData.checkOutSelection, data2]);

    // Check availability against backend
    const checkHallAvailability = useCallback(async () => {
        if (!data2?._id || !formData.startDate || !formData.endDate) {
            setIsPeriodAvailable(true); 
            return;
        }

        setAvailabilityChecking(true);
        try {
            const checkData = {
                entityId: data2._id,
                periodType: formData.periodType, 
                startDate: formatDate(formData.startDate),
                endDate: formatDate(formData.endDate),
                checkInSelection: formData.checkInSelection, 
                checkOutSelection: formData.checkOutSelection, 
            };

            const response = await Api.post('/admin/reservations/check-availability', checkData);
            setIsPeriodAvailable(response.data.available);
            
            // ✅ تحديث حالة توفر الفترات اليومية بناءً على استجابة الباك إند
            // هذا الجزء سيستخدم فقط عندما يكون periodType 'dayPeriod'
            if (formData.periodType === 'dayPeriod' && response.data.detailedAvailability) {
                // detailedAvailability ستعود الآن بتفاصيل اليوم المحدد فقط من الباك إند
                const dailyAvailability = response.data.detailedAvailability || { morning: 'available', night: 'available', wholeDay: 'available' };
                setDayPeriodAvailability(dailyAvailability);
                
                // تحديث isPeriodAvailable الرئيسية لتعكس حالة زر "كامل اليوم" إذا كان مختارًا
                // أو أي حالة تعارض أخرى بناءً على الفترة المختارة حاليًا
                const selectedButtonValue = formData.selectedPeriod;
                let currentOverallStatusForSelectedPeriod;

                if (selectedButtonValue === 'صباحية') {
                    currentOverallStatusForSelectedPeriod = dailyAvailability.morning;
                } else if (selectedButtonValue === 'مسائية') {
                    currentOverallStatusForSelectedPeriod = dailyAvailability.night;
                } else if (selectedButtonValue === 'كامل اليوم') {
                    currentOverallStatusForSelectedPeriod = dailyAvailability.wholeDay;
                }
                
                // إذا كانت الفترة المختارة (صباحية/مسائية/كامل اليوم) غير متاحة لأي سبب، قم بتعطيل الزر الرئيسي
                if (currentOverallStatusForSelectedPeriod === 'confirmed' || currentOverallStatusForSelectedPeriod === 'unConfirmed' || currentOverallStatusForSelectedPeriod === 'partial-confirmed' || currentOverallStatusForSelectedPeriod === 'partial-unConfirmed') {
                    setIsPeriodAvailable(false);
                } else {
                    setIsPeriodAvailable(true);
                }

            } else {
                // إعادة تعيين إذا لم يكن dayPeriod أو لم يكن هناك تفاصيل
                setDayPeriodAvailability({ morning: 'available', night: 'available', wholeDay: 'available' });
            }

            if (!response.data.available) {
                setErrorMessage(response.data.message); 
                setSnackOpenError(true);
            }
        } catch (error) {
            console.error("Error checking availability for hall:", error);
            setIsPeriodAvailable(false); 
            setErrorMessage(error.response?.data?.message || t("common.networkError"));
            setSnackOpenError(true);
        } finally {
            setAvailabilityChecking(false);
        }
    }, [data2?._id, formData.startDate, formData.endDate, formData.periodType, formData.checkInSelection, formData.checkOutSelection, formData.selectedPeriod, t]);

    // Trigger availability check on relevant form data changes
    useEffect(() => {
        const handler = setTimeout(() => { 
            checkHallAvailability();
        }, 500); 

        return () => {
            clearTimeout(handler);
        };
    }, [checkHallAvailability]);

    // Utility component for CircularProgress with label
    const CircularProgressWithLabel = (props) => (
        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
            <CircularProgress variant="determinate" {...props} />
            <Box sx={{ top: 0, left: 0, bottom: 0, right: 0, position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="caption" style={{ fontWeight: "700", fontSize: "1.2rem" }} color="text.secondary">{props.label}</Typography>
            </Box>
        </Box>
    );
    
    // Form validation logic
    const validateFields = () => {
        let newErrors = {};
        let formIsValid = true;

        if (!formData.fullName?.trim() || formData.fullName.trim().split(' ').length < 3) { newErrors.fullName = t("validation.fullNameRequired"); formIsValid = false; }
        if (!formData.phoneNumber?.trim()) { newErrors.phoneNumber = t("validation.phoneRequired"); formIsValid = false; }
        if (!formData.idNumber?.trim()) { newErrors.idNumber = t("validation.idNumberRequired"); formIsValid = false; }
        if (!formData.address?.trim()) { newErrors.address = t("validation.addressRequired"); formIsValid = false; }
        if (!formData.nationality?.trim()) { newErrors.nationality = t("validation.nationalityRequired"); formIsValid = false; }

        if (!formData.paymentMethod) {
            newErrors.paymentMethod = t("validation.paymentMethodRequired"); formIsValid = false;
        } else if (formData.paymentMethod === "bank") {
            if (!formData.bankName) {
                newErrors.bankName = t("validation.bankNameRequired"); formIsValid = false;
            }
            if (!formData.paymentProof) {
                newErrors.paymentProof = t("validation.paymentProofRequired"); formIsValid = false;
            }
        }

        // Updated validation for period selection
        if (formData.periodType === 'dayPeriod') {
            if (!formData.selectedPeriod) { 
                newErrors.selectedPeriod = t("validation.fixedPeriodRequired"); formIsValid = false;
            }
            if (differenceInDays(new Date(formData.endDate), new Date(formData.startDate)) !== 0) {
                newErrors.dateRange = t("validation.singleDayRequired"); formIsValid = false;
            }
            if (formData.checkInSelection === 'مسائية' && formData.checkOutSelection === 'صباحية' && differenceInDays(new Date(formData.endDate), new Date(formData.startDate)) === 0) {
                newErrors.periodSelection = t("validation.invalidSameDayPeriod"); formIsValid = false;
            }
            
            // ✅ منع الحجز إذا كانت الفترة المختارة غير متاحة بناءً على تفاصيل الباك إند
            const currentSelectedPeriodStatus = dayPeriodAvailability[
                formData.selectedPeriod === 'صباحية' ? 'morning' :
                formData.selectedPeriod === 'مسائية' ? 'night' :
                'wholeDay'
            ];
            
            if (currentSelectedPeriodStatus === 'confirmed' || currentSelectedPeriodStatus === 'unConfirmed' || currentSelectedPeriodStatus === 'partial-confirmed' || currentSelectedPeriodStatus === 'partial-unConfirmed') {
                newErrors.periodSelection = t("details.periodUnavailable");
                formIsValid = false;
            }
        } else if (formData.periodType === 'customPeriod') {
            if (!formData.startDate || !formData.endDate || differenceInDays(new Date(formData.endDate), new Date(formData.startDate)) < 0) {
                newErrors.dateRange = t("validation.dateRangeInvalid"); formIsValid = false;
            }
            // For multi-day, the overall isPeriodAvailable handles the conflict based on backend response.
            // No need for detailed period check here if the main button is disabled by isPeriodAvailable.
        }
        setErrors(newErrors);
        return formIsValid;
    };
    
    // Format date to YYYY-MM-DD
    const formatDate = (date) => date instanceof Date && !isNaN(date) ? format(date, "yyyy-MM-dd") : "";

    // Update user profile if changes detected
    const updateUserProfileIfChanged = async () => {
        if (isAuthenticated && user) {
            const payload = {};
            if (formData.fullName && formData.fullName !== user.name) payload.name = formData.fullName;
            if (formData.phoneNumber && formData.phoneNumber !== user.phone) payload.phone = formData.phoneNumber;
            if (formData.idNumber && formData.idNumber !== user.idNumber) payload.idNumber = formData.idNumber;
            if (formData.address && formData.address !== user.address) payload.address = formData.address;
            if (formData.nationality && formData.nationality !== user.nationality) payload.nationality = formData.nationality;

            if (Object.keys(payload).length > 0) {
                try {
                    await Api.patch('/users/updateDate', payload);
                    dispatch(fetchUserData());
                } catch (err) {
                    console.error("Failed to update user profile during reservation: ", err);
                }
            }
        }
    };

    // Handle form submission
    function handleSubmit(e) {
        e.preventDefault();
        if (!isAuthenticated) { setErrorMessage(t("validation.loginRequiredForReservation")); setSnackOpenError(true); setTimeout(() => navigate("/user/signin"), 2000); return; }
        if (!validateFields()) { setErrorMessage(t("validation.fillAllRequired")); setSnackOpenError(true); return; }

        // Final check based on isPeriodAvailable which is set by checkHallAvailability (for all types)
        // and also the dayPeriodAvailability for specific dayPeriod buttons.
        if (!isPeriodAvailable) { // This handles overall availability from backend
            setErrorMessage(t("details.periodUnavailable")); 
            setSnackOpenError(true);
            return;
        }
        // Additional check for dayPeriod specific button state (as handled by validateFields)
        if (formData.periodType === 'dayPeriod') {
            const currentSelectedPeriodStatus = dayPeriodAvailability[
                formData.selectedPeriod === 'صباحية' ? 'morning' :
                formData.selectedPeriod === 'مسائية' ? 'night' :
                'wholeDay'
            ];
            // If the specific selected dayPeriod is not available, return
            if (currentSelectedPeriodStatus === 'confirmed' || currentSelectedPeriodStatus === 'unConfirmed' || currentSelectedPeriodStatus === 'partial-confirmed' || currentSelectedPeriodStatus === 'partial-unConfirmed') {
                setErrorMessage(t("details.periodUnavailable")); // Already set by validateFields, but double-check
                setSnackOpenError(true);
                return;
            }
        }

        setLoading(true);

        const reservationPayload = {
            clientName: formData.fullName,
            phone: formData.phoneNumber,
            address: formData.address,
            nationality: formData.nationality,
            idNumber: formData.idNumber,
            entityId: data2._id,
            entityType: 'hall', 
            periodType: formData.periodType, 
            dayPeriod: formData.periodType === 'dayPeriod' ? formData.selectedPeriod : undefined, 
            
            checkInSelection: formData.checkInSelection, 
            checkOutSelection: formData.checkOutSelection, 
            
            startDate: formatDate(formData.startDate),
            endDate: formatDate(formData.endDate),
            discountCode: formData.discountCode || "",
            paymentMethod: formData.paymentMethod,
            bankName: formData.paymentMethod === "bank" ? formData.bankName : undefined, 
            paymentProof: formData.paymentMethod === "bank" ? formData.paymentProof : undefined, 
            cost: formData.cost 
        };
        
        Api.post('/user/reservation', reservationPayload)
            .then(async (res) => {
                setLoading(false);
                setSnackOpenSuccess(true);
                setDialogeMessage(true); 
                await updateUserProfileIfChanged(); 
                dispatch(fetchUserData());
            })
            .catch((error) => {
                setLoading(false);
                setSnackOpenError(true);
                const errorResponse = error.response?.data;
                if (errorResponse) {
                    if (errorResponse.error) {
                        setErrorMessage(errorResponse.error);
                    } else if (errorResponse.message) {
                        setErrorMessage(errorResponse.message);
                    } else if (typeof errorResponse === 'string') {
                        setErrorMessage(errorResponse);
                    } else {
                        setErrorMessage(t("validation.reservationError"));
                    }
                } else {
                    setErrorMessage(t("common.networkError"));
                }
            });
    }

    // Handle clicks outside calendar to close it
    useEffect(() => {
        const hideOnEscape = (e) => { if (e.key === "Escape") setOpenCalendar(false); };
        const hideOnClickOutside = (e) => { if (calendarRef.current && !calendarRef.current.contains(e.target) && !e.target.closest('.inputBox')) setOpenCalendar(false); };
        document.addEventListener("keydown", hideOnEscape, true);
        document.addEventListener("click", hideOnClickOutside, true);
        return () => { document.removeEventListener("keydown", hideOnEscape, true); document.removeEventListener("click", hideOnClickOutside, true); };
    }, []);

    const todayFormatted = format(new Date(), 'yyyy-MM-dd');
    // Adjust minCheckoutDateFormatted to allow same day for dayPeriod, next day for customPeriod
    const minCheckoutDateFormatted = formData.startDate 
        ? format(addDays(new Date(formData.startDate), formData.periodType === 'dayPeriod' ? 0 : 1), 'yyyy-MM-dd') 
        : '';

    // Dynamic button text and disabled state for main reservation button
    const mainButtonText = availabilityChecking
        ? t("details.checkingAvailability")
        : !isPeriodAvailable
            ? t("details.periodUnavailable")
            : data2?.maintenance
                ? t("details.maintenanceMessage")
                : t("details.choose");

    const isMainButtonDisabled = data2?.maintenance || loading || availabilityChecking || !isPeriodAvailable;

    return (
        <>
            {data2 ? (
                <div className="reservation-chalet-container"> {/* Re-using chalet styles */}
                    <div className='price-header-section'>
                        {i18n.language === 'ar' ? (<h3>{t("details.price_per_day")} <span>{data2.price?.wholeDay || 0} {t("details.currency")}</span></h3>)
                            : (<h3><span>{data2.price?.wholeDay || 0} {t("details.currency")}</span> {t("details.price_per_day")}</h3>)}
                        <div className='sub-prices'>
                            {data2.price?.morning && <span>{t("details.morning")}: {data2.price.morning} {t("details.currency")}</span>}
                            {data2.price?.night && <span>{t("details.Night")}: {data2.price.night} {t("details.currency")}</span>}
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="reservation-content-grid">
                        <div className="form-inputs-column">
                            <div className="calendar-container">
                                <InputLabel className="input-label-custom">{t("details.selectDate")}</InputLabel> 
                                <TextField fullWidth value={`${format(formData.startDate, 'MM/dd/yyyy')}`} InputProps={{ readOnly: true }} className="inputBox" onClick={() => setOpenCalendar(prev => !prev)} />
                                {openCalendar && (
                                    <div className="calendar" ref={calendarRef}>
                                        <Calendar className='calendarElement' onChange={(newDate) => { setFormData(prev => ({ ...prev, startDate: newDate, endDate: prev.periodType === 'dayPeriod' ? newDate : addDays(newDate, 1) })); }} minDate={new Date()} date={formData.startDate} />
                                    </div>
                                )}
                                {errors.dateRange && <Typography variant="caption" color="error" className="error-text-bottom">{errors.dateRange}</Typography>} 
                            </div>
                            <TextField fullWidth label={t("details.fullName")} value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} required error={!!errors.fullName} helperText={errors.fullName || ""} margin="normal" InputProps={{ readOnly: isAuthenticated && user?.name && user.name.trim().split(' ').length >= 3 }} />
                            <TextField fullWidth label={t("details.phoneNumber")} value={formData.phoneNumber} onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })} required error={!!errors.phoneNumber} helperText={errors.phoneNumber || ""} margin="normal" InputProps={{ readOnly: isAuthenticated && user?.phone }} />
                            <TextField fullWidth label={t("details.idNumber")} value={formData.idNumber} onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })} required error={!!errors.idNumber} helperText={errors.idNumber || ""} margin="normal" InputProps={{ readOnly: isAuthenticated && user?.idNumber }} />
                            <TextField fullWidth label={t("details.nationality")} value={formData.nationality} onChange={(e) => setFormData({ ...formData, nationality: e.target.value })} required error={!!errors.nationality} helperText={errors.nationality || ""} margin="normal" />
                            <TextField fullWidth label={t("details.address")} value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} required error={!!errors.address} helperText={errors.address || ""} margin="normal" />

                            <FormControl fullWidth margin="normal" error={!!errors.paymentMethod}> 
                                <InputLabel>{t("details.paymentMethod")}</InputLabel>
                                <Select value={formData.paymentMethod} onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })} required label={t("details.paymentMethod")}>
                                    <MenuItem value="">{t("common.select")}</MenuItem> 
                                    <MenuItem value="cash">{t("details.cash")}</MenuItem>
                                    <MenuItem value="network">{t("details.network")}</MenuItem>
                                    <MenuItem value="bank">{t("details.bank")}</MenuItem>
                                </Select>
                                {errors.paymentMethod && <Typography variant="caption" color="error">{errors.paymentMethod}</Typography>}
                                {formData.paymentMethod === "bank" && (
                                    <>
                                        <FormControl fullWidth margin="normal" error={!!errors.bankName}> 
                                            <InputLabel>{t("details.bankType")}</InputLabel>
                                            <Select value={formData.bankName} onChange={(e) => setFormData({ ...formData, bankName: e.target.value })} required label={t("details.bankType")}>
                                                <MenuItem value="">{t("common.selectBank")}</MenuItem> 
                                                {banks && banks.length > 0 ? ( 
                                                    banks.map(bank => (
                                                        <MenuItem key={bank.id} value={bank.name}>🏦 {bank.name}</MenuItem>
                                                    ))
                                                ) : (
                                                    <MenuItem disabled>{t("details.noBanksAvailable")}</MenuItem>
                                                )}
                                            </Select>
                                            {errors.bankName && <Typography variant="caption" color="error">{errors.bankName}</Typography>}
                                        </FormControl>
                                        <TextField fullWidth label={t("details.transferMessage")} value={formData.paymentProof} onChange={(e) => setFormData({ ...formData, paymentProof: e.target.value })} required error={!!errors.paymentProof} helperText={errors.paymentProof || ""} margin="normal" /> 
                                    </>
                                )}
                            </FormControl>
                            <TextField fullWidth label={t("details.discountCodeOptional")} value={formData.discountCode} onChange={(e) => setFormData({ ...formData, discountCode: e.target.value })} margin="normal" />
                            
                            <FormControl component="fieldset" fullWidth margin="normal" error={!!errors.selectedPeriod || !!errors.dateRange || !!errors.periodSelection}> 
                                <FormLabel component="legend">{t("details.chooseBookingType")}</FormLabel>
                                <RadioGroup row value={formData.periodType} onChange={(e) => setFormData(prev => ({
                                    ...prev, 
                                    periodType: e.target.value, 
                                    startDate: new Date(), 
                                    endDate: e.target.value === 'dayPeriod' ? new Date() : addDays(new Date(), 1), 
                                    checkInSelection: e.target.value === 'dayPeriod' ? 'صباحية' : prev.checkInSelection,
                                    checkOutSelection: e.target.value === 'dayPeriod' ? 'مسائية' : prev.checkOutSelection,
                                    selectedPeriod: e.target.value === 'dayPeriod' ? 'كامل اليوم' : prev.selectedPeriod, // Ensure a default selectedPeriod is set
                                    cost: 0 
                                }))}> 
                                    <FormControlLabel value="dayPeriod" control={<Radio />} label={t("details.fixedPeriod")} />
                                    <FormControlLabel value="customPeriod" control={<Radio />} label={t("details.multiplePeriods")} />
                                </RadioGroup>
                                {errors.selectedPeriod && <Typography variant="caption" color="error" className="error-text-bottom">{errors.selectedPeriod}</Typography>} 
                                {errors.dateRange && <Typography variant="caption" color="error" className="error-text-bottom">{errors.dateRange}</Typography>}
                                {errors.periodSelection && <Typography variant="caption" color="error" className="error-text-bottom">{errors.periodSelection}</Typography>}

                                {formData.periodType === "dayPeriod" ? (
                                    <div className="period-section">
                                        <h3>{t("details.period")}</h3>
                                        <div className="period-buttons">
                                            {periodButtons.map((button) => {
                                                const hasPrice = !!data2?.price?.[button.priceKey];
                                                // Determine the availability status from backend for the specific period
                                                let currentPeriodStatus;
                                                if (button.value === 'صباحية') {
                                                    currentPeriodStatus = dayPeriodAvailability.morning;
                                                } else if (button.value === 'مسائية') {
                                                    currentPeriodStatus = dayPeriodAvailability.night;
                                                } else if (button.value === 'كامل اليوم') {
                                                    currentPeriodStatus = dayPeriodAvailability.wholeDay;
                                                }

                                                // Determine if the button should be disabled
                                                const isDisabled = !hasPrice || currentPeriodStatus === 'confirmed' || 
                                                                 currentPeriodStatus === 'unConfirmed' ||
                                                                 currentPeriodStatus === 'partial-confirmed' || // Disable if partially booked (e.g., one period confirmed)
                                                                 currentPeriodStatus === 'partial-unConfirmed'; // Disable if partially pending
                                                
                                                // Determine the color based on availability
                                                const buttonColor = (currentPeriodStatus === 'available' && hasPrice) ? 'green' : 'red';
                                                const opacity = isDisabled ? 0.6 : 1;

                                                return (
                                                    <Button 
                                                        key={button.value} 
                                                        className={`period-btn btn ${formData.selectedPeriod === button.value ? "active" : ""}`} 
                                                        onClick={() => { 
                                                            if (!isDisabled) { 
                                                                setFormData(prev => ({ 
                                                                    ...prev, 
                                                                    selectedPeriod: button.value,
                                                                    checkInSelection: button.checkIn, 
                                                                    checkOutSelection: button.checkOut, 
                                                                })); 
                                                            } 
                                                        }} 
                                                        disabled={isDisabled}
                                                        style={{borderColor: buttonColor, color: buttonColor, opacity: opacity}}
                                                    >
                                                        <span className="period-label">{i18n.language === "ar" ? button.label : button.enLabel}</span>
                                                        {hasPrice && (
                                                            <> 
                                                                <span className="period-price">{data2.price[button.priceKey]} {t("details.currency")}</span>
                                                                {button.startHour && button.endHour && data2[button.startHour] && data2[button.endHour] && (
                                                                    <span className="period-time">({data2[button.startHour]} - {data2[button.endHour]})</span>
                                                                )}
                                                                {/* Display status text based on detailed availability */}
                                                                {currentPeriodStatus === 'confirmed' && <span className="status-text" style={{ color: 'red' }}> ({t("cards.fullyBookedMessage")})</span>}
                                                                {currentPeriodStatus === 'unConfirmed' && <span className="status-text" style={{ color: 'orange' }}> ({t("details.pendingReservation")})</span>}
                                                                {currentPeriodStatus === 'partial-confirmed' && <span className="status-text" style={{ color: 'red' }}> ({t("details.partiallyBookedConfirmed")})</span>}
                                                                {currentPeriodStatus === 'partial-unConfirmed' && <span className="status-text" style={{ color: 'orange' }}> ({t("details.partiallyBookedPending")})</span>}

                                                            </>
                                                        )}
                                                        {!hasPrice && <span className="period-unavailable" style={{ color: 'red' }}> ({t("details.notAvailable")})</span>}
                                                    </Button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    <Grid container spacing={2} sx={{ mt: 2 }}> 
                                        <Grid item xs={12} md={6}>
                                            <InputLabel className="input-label-custom">{t("details.checkInDate")}</InputLabel>
                                            <TextField fullWidth type="date" value={formatDate(formData.startDate)} onChange={(e) => { const [year, month, day] = e.target.value.split('-').map(part => parseInt(part, 10)); const safeNewStartDate = new Date(Date.UTC(year, month - 1, day)); if (!isNaN(safeNewStartDate)) { setFormData(prev => ({ ...prev, startDate: safeNewStartDate })); } }} InputLabelProps={{ shrink: true }} inputProps={{ min: todayFormatted }} />
                                            <div style={{ marginTop: '10px' }}>
                                                <FormLabel component="legend">{t("details.checkInPeriod")}</FormLabel>
                                                <RadioGroup row value={formData.checkInSelection} onChange={(e) => setFormData(prev => ({ ...prev, checkInSelection: e.target.value }))}>
                                                    <FormControlLabel value="صباحية" control={<Radio />} label={t("details.morning")} />
                                                    <FormControlLabel value="مسائية" control={<Radio />} label={t("details.Night")} />
                                                </RadioGroup>
                                            </div>
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <InputLabel className="input-label-custom">{t("details.checkOutDate")}</InputLabel>
                                            <TextField fullWidth type="date" value={formatDate(formData.endDate)} onChange={(e) => { const [year, month, day] = e.target.value.split('-').map(part => parseInt(part, 10)); const safeNewEndDate = new Date(Date.UTC(year, month - 1, day)); if (!isNaN(safeNewEndDate)) { setFormData({ ...formData, endDate: safeNewEndDate }); } }} InputLabelProps={{ shrink: true }} inputProps={{ min: minCheckoutDateFormatted }} />
                                            <div style={{ marginTop: '10px' }}>
                                                <FormLabel component="legend">{t("details.checkOutPeriod")}</FormLabel>
                                                <RadioGroup row value={formData.checkOutSelection} onChange={(e) => setFormData(prev => ({ ...prev, checkOutSelection: e.target.value }))}>
                                                    <FormControlLabel value="صباحية" control={<Radio />} label={t("details.morning")} />
                                                    <FormControlLabel value="مسائية" control={<Radio />} label={t("details.Night")} />
                                                </RadioGroup>
                                            </div>
                                        </Grid>
                                    </Grid>
                                )}
                            </FormControl>
                        </div>

                        <div className="summary-column">
                            <div className="summary-card">
                                <div className="date-box">
                                    <div className="date-field">
                                        <p>{t("details.arrive")}</p>
                                        <p>{`${format(formData.startDate, 'MM/dd/yyyy')}`}</p>
                                        <p style={{ fontSize: '0.8rem', color: '#666' }}>
                                            {/* Display checkInSelection for arrival */}
                                            {formData.checkInSelection === 'صباحية' ? t("details.morning") : t("details.Night")}
                                        </p>
                                    </div>
                                    {/* Show checkout for multi-day bookings OR if it's a same-day full-period booking */}
                                    {(formData.periodType === "customPeriod" || (differenceInDays(formData.endDate, formData.startDate) === 0 && formData.checkInSelection === 'صباحية' && formData.checkOutSelection === 'مسائية')) && (
                                        <div className="date-field">
                                            <p>{t("details.left")}</p>
                                            <p>{`${format(formData.endDate, 'MM/dd/yyyy')}`}</p>
                                            <p style={{ fontSize: '0.8rem', color: '#666' }}>
                                                {/* Display checkOutSelection for departure */}
                                                {formData.checkOutSelection === 'صباحية' ? t("details.morning") : t("details.Night")}
                                            </p>
                                        </div>
                                    )}
                                </div>
                                <div className="total-price-box"> 
                                    {i18n.language === 'ar' ? (<><p>{t("details.total")}</p><span>{formData.cost} {t("details.currency")}</span></>) 
                                    : (<><span>{formData.cost} {t("details.currency")}</span><p>{t("details.total")}</p></>)} 
                                </div>
                                <Button
                                    type='submit'
                                    className='reserve-btn btn'
                                    disabled={isMainButtonDisabled} 
                                >
                                    {mainButtonText} 
                                </Button>
                                <p className='installment-title'>{t("details.pill")}</p>
                                <Grid container spacing={2} className="installment-grid">
                                    <Grid item xs={4} className='installment-item'><CircularProgressWithLabel style={{ color: "var(--primary)" }} variant="determinate" value={100} label={3} /><p className='installment-amount'>{Math.floor(formData.cost / 3)} {t("details.currency")}</p></Grid>
                                    <Grid item xs={4} className='installment-item'><CircularProgressWithLabel style={{ color: "var(--primary)" }} variant="determinate" value={66} label={2} /><p className='installment-amount'>{Math.floor(formData.cost / 3)} {t("details.currency")}</p></Grid>
                                    <Grid item xs={4} className='installment-item'><CircularProgressWithLabel style={{ color: "var(--primary)" }} variant="determinate" value={33} label={1} /><p className='installment-amount'>{Math.floor(formData.cost / 3)} {t("details.currency")}</p></Grid>
                                </Grid>
                            </div>
                        </div>
                    </form>
                    <MapLocation />
                </div>
            ) : (
                <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={!data2}>
                    <CircularProgress color="inherit" />
                </Backdrop>
            )}
            <Dialoge open={dialogeMessage} handleClose={() => { setDialogeMessage(false); setLoading(false); navigate('/'); }} /> 
            <Snackbar open={snackOpenSuccess} autoHideDuration={6000} onClose={() => setSnackOpenSuccess(false)}><Alert onClose={() => setSnackOpenSuccess(false)} severity="success" sx={{ width: '100%' }}>{t("details.reservationSuccess")}</Alert></Snackbar>
            <Snackbar open={snackOpenError} autoHideDuration={6000} onClose={() => setSnackOpenError(false)}><Alert onClose={() => setSnackOpenError(false)} severity="error" sx={{ width: '100%' }}>{errorMessage}</Alert></Snackbar>
            <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={loading}><CircularProgress color="inherit" /></Backdrop>
            <Footer />
        </>
    );
}

export default ReservationHall;