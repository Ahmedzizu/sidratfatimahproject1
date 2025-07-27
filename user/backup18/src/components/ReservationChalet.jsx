import * as React from 'react';
import { useEffect, useRef, useState, useCallback } from 'react';
import { Calendar } from 'react-date-range';
import format from 'date-fns/format';
import { addDays, differenceInDays } from 'date-fns';
import 'react-date-range/dist/styles.css';
import { InputLabel, Select, MenuItem, FormControl } from '@mui/material';
import 'react-date-range/dist/theme/default.css';
import { Grid, TextField } from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormLabel from '@mui/material/FormLabel';
import Footer from './Footer';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import "../scss/reservationChalet.scss";
import Dialoge from './Dialoge';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import Backdrop from '@mui/material/Backdrop';
import Api from './../config/config';
import { useTranslation } from 'react-i18next';
import MapLocation from './../components/MapLocation';
import { useNavigate } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import { fetchUserData } from './../redux/reducers/user';
import { fetchBankDetails } from '../redux/reducers/bank';

const Alert = React.forwardRef(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});


function ReservationChalet({ data: data2 }) {
    const { t, i18n } = useTranslation();
    const dispatch = useDispatch();
    const [open, setOpen] = useState(false);
    const refOne = useRef(null);
    const [loading, setLoading] = useState(false);
    const [snackOpen, setSnackOpen] = useState(false);
    const [snackOpen2, setSnackOpen2] = useState(false);
    const [errMsg, setErrMsg] = useState("");
    const navigate = useNavigate();
    const [dialogeMsg, setDialogeMsg] = useState(false);

    const [currentImage, setCurrentImage] = useState(0);
    const images = data2?.images || [];

    const isAuthenticated = useSelector((state) => state.user.isAuthenticated);
    const user = useSelector((state) => state.user.data);
    const banks = useSelector((state) => state.bank.value.data);

    const [errors, setErrors] = useState({});
    const [isPeriodAvailable, setIsPeriodAvailable] = useState(true);
    const [availabilityChecking, setAvailabilityChecking] = useState(false);

    const [data, setData] = useState({
        startDate: new Date(),
        endDate: addDays(new Date(), 1), // Default for multi-day
        periodType: 'dayPeriod', // Default to fixed period
        selectedPeriod: 'صباحية', // This will now control checkInSelection/checkOutSelection for dayPeriod
        cost: data2?.price?.morning || data2?.price?.night || data2?.price?.wholeDay || 0,
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
        checkInSelection: 'صباحية', // Default check-in selection
        checkOutSelection: 'مسائية', // Default check-out selection
    });

    const handleClose = () => {
        setDialogeMsg(false);
        setLoading(false);
    };

    useEffect(() => {
        if (images.length > 1) {
            const timer = setInterval(() => {
                setCurrentImage(prevIndex => (prevIndex + 1) % images.length);
            }, 3000);
            return () => clearInterval(timer);
        }
    }, [images.length]);

    useEffect(() => {
        dispatch(fetchBankDetails());
    }, [dispatch]);

    useEffect(() => {
        if (isAuthenticated && user) {
            setData(prev => ({ ...prev, fullName: user.name || '', phoneNumber: user.phone || '', idNumber: user.idNumber || '', address: user.address || '', nationality: user.nationality || '' }));
        } else {
            setData(prev => ({ ...prev, fullName: '', phoneNumber: '', idNumber: '', address: '', nationality: '' }));
        }
    }, [isAuthenticated, user]);

    useEffect(() => {
        if (data.periodType === 'customPeriod' && data.startDate && data.endDate) {
            if (differenceInDays(new Date(data.endDate), new Date(data.startDate)) < 0) {
                // If end date is before start date, adjust it to be at least the start date
                setData(prev => ({ ...prev, endDate: prev.startDate }));
            }
        } else if (data.periodType === 'dayPeriod') {
            // For dayPeriod, startDate and endDate must be the same
            setData(prev => ({ ...prev, endDate: prev.startDate }));
        }
    }, [data.startDate, data.periodType, data.endDate]);

    const buttonGroup = [
        { label: 'صباحية', value: 'صباحية', enLabel: t("details.morning"), priceKey: 'morning', checkIn: 'صباحية', checkOut: 'صباحية' },
        { label: 'مسائية', value: 'مسائية', enLabel: t("details.Night"), priceKey: 'night', checkIn: 'مسائية', checkOut: 'مسائية' },
        { label: 'كامل اليوم', value: 'كامل اليوم', enLabel: t("details.day"), priceKey: 'wholeDay', checkIn: 'صباحية', checkOut: 'مسائية' },
    ];

    // ✨ هذا هو الـ useEffect الذي يحسب التكلفة بناءً على checkInSelection و checkOutSelection
    useEffect(() => {
        if (!data2 || !data2.price) return;

        let totalCost = 0;
        const morningPrice = data2.price.morning || 0;
        const nightPrice = data2.price.night || 0;
        const wholeDayPrice = data2.price.wholeDay || (morningPrice + nightPrice); // Fallback if wholeDay is not explicitly set

        const startDateObj = new Date(data.startDate);
        const endDateObj = new Date(data.endDate);
        startDateObj.setUTCHours(0, 0, 0, 0); // Normalize dates to avoid time zone issues
        endDateObj.setUTCHours(0, 0, 0, 0);

        const isSingleDayBooking = startDateObj.getTime() === endDateObj.getTime();

        if (isSingleDayBooking) {
            // Logic for single-day booking based on checkInSelection and checkOutSelection
            if (data.checkInSelection === 'صباحية' && data.checkOutSelection === 'مسائية') {
                totalCost = wholeDayPrice;
            } else if (data.checkInSelection === 'صباحية' && data.checkOutSelection === 'صباحية') {
                totalCost = morningPrice;
            } else if (data.checkInSelection === 'مسائية' && data.checkOutSelection === 'مسائية') {
                totalCost = nightPrice;
            } else {
                // Handle illogical combinations like "مسائية" check-in and "صباحية" check-out on the same day
                // For now, let's default to wholeDayPrice or show an error later in validation
                totalCost = wholeDayPrice; // Or set to 0 and show error
            }
        } else {
            // Logic for multi-day booking
            let currentDate = new Date(startDateObj);
            while (currentDate.getTime() <= endDateObj.getTime()) {
                let dayCost = 0;
                if (currentDate.getTime() === startDateObj.getTime()) {
                    // Cost for the first day based on check-in selection
                    dayCost = (data.checkInSelection === 'صباحية' ? wholeDayPrice : nightPrice);
                } else if (currentDate.getTime() === endDateObj.getTime()) {
                    // Cost for the last day based on check-out selection
                    dayCost = (data.checkOutSelection === 'صباحية' ? morningPrice : wholeDayPrice);
                } else {
                    // Cost for full middle days
                    dayCost = wholeDayPrice;
                }
                totalCost += dayCost;
                currentDate.setDate(currentDate.getDate() + 1);
            }
        }

        setData(prev => ({
            ...prev,
            cost: totalCost,
            // checkInPeriod and checkOutPeriod are times (e.g., '07:00'), not selections.
            // They should reflect the entity's actual check-in/out hours for the selected period.
            // The backend doesn't seem to use them for price calculation, so sending them as is fine.
            checkInPeriod: data.checkInSelection === 'صباحية' ? data2.dayStartHour : data2.nightStartHour,
            checkOutPeriod: data.checkOutSelection === 'صباحية' ? data2.dayEndHour : data2.nightEndHour,
        }));

    }, [data.periodType, data.startDate, data.endDate, data.checkInSelection, data.checkOutSelection, data2]);


    // ✅ دالة useCallback للتحقق من التوفر
    const checkChaletAvailability = useCallback(async () => {
        if (!data2?._id || !data.startDate || !data.endDate) {
            setIsPeriodAvailable(true); // إذا كانت البيانات غير مكتملة، اعتبرها متاحة مؤقتاً
            return;
        }

        setAvailabilityChecking(true);
        try {
            const checkData = {
                entityId: data2._id,
                periodType: data.periodType, // إرسال periodType كما هو ('dayPeriod' أو 'customPeriod')
                // dayPeriod: data.periodType === 'dayPeriod' ? data.selectedPeriod : undefined, // لم نعد نعتمد على هذا في الباك إند للحساب، ولكن يمكن إرساله كمعلومة إضافية
                startDate: formatDate(data.startDate),
                endDate: formatDate(data.endDate),
                // هذه هي البيانات الأساسية للتحقق
                checkInSelection: data.checkInSelection,
                checkOutSelection: data.checkOutSelection,
            };

            const response = await Api.post('/admin/reservations/check-availability', checkData);
            setIsPeriodAvailable(response.data.available);
        } catch (error) {
            console.error("Error checking availability:", error);
            setIsPeriodAvailable(false); // افترض عدم التوفر في حالة الخطأ
            // يمكنك تعيين رسالة خطأ هنا بناءً على error.response.data.message إذا كان متوفرًا
        } finally {
            setAvailabilityChecking(false);
        }
    }, [data2?._id, data.startDate, data.endDate, data.periodType, data.checkInSelection, data.checkOutSelection]); // Dependency array updated

    // ✅ Effect لاستدعاء دالة التحقق من التوفر عند تغيير البيانات ذات الصلة
    useEffect(() => {
        const handler = setTimeout(() => { // تأخير للحد من عدد الطلبات عند الكتابة السريعة
            checkChaletAvailability();
        }, 500); // تأخير نصف ثانية

        return () => {
            clearTimeout(handler);
        };
    }, [checkChaletAvailability]);


    function CircularProgressWithLabel(props) {
        return (
            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                <CircularProgress variant="determinate" {...props} />
                <Box sx={{ top: 0, left: 0, bottom: 0, right: 0, position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="caption" style={{ fontWeight: "700", fontSize: "1.2rem" }} color="text.secondary">{props.label}</Typography>
                </Box>
            </Box>
        );
    }

    const validateFields = () => {
        let newErrors = {};
        let formIsValid = true;

        if (!data.fullName?.trim() || data.fullName.trim().split(' ').length < 3) { newErrors.fullName = t("validation.fullNameRequired"); formIsValid = false; }
        if (!data.phoneNumber?.trim()) { newErrors.phoneNumber = t("validation.phoneRequired"); formIsValid = false; }
        if (!data.idNumber?.trim()) { newErrors.idNumber = t("validation.idNumberRequired"); formIsValid = false; }
        if (!data.address?.trim()) { newErrors.address = t("validation.addressRequired"); formIsValid = false; }
        if (!data.nationality?.trim()) { newErrors.nationality = t("validation.nationalityRequired"); formIsValid = false; }

        if (!data.paymentMethod) {
            newErrors.paymentMethod = t("validation.paymentMethodRequired"); formIsValid = false;
        } else if (data.paymentMethod === "bank") {
            if (!data.bankName) {
                newErrors.bankName = t("validation.bankNameRequired"); formIsValid = false;
            }
            if (!data.paymentProof) {
                newErrors.paymentProof = t("validation.paymentProofRequired"); formIsValid = false;
            }
        }

        // Updated validation for period selection
        if (data.periodType === 'dayPeriod') {
            // No specific dayPeriod selection is needed if relying purely on checkInSelection/checkOutSelection for cost
            // but if selectedPeriod still drives UI, keep it.
            // If selectedPeriod is used to set checkInSelection/checkOutSelection internally, then check it.
            if (!data.selectedPeriod) { // This might still be relevant if used for visual feedback
                newErrors.selectedPeriod = t("validation.fixedPeriodRequired"); formIsValid = false;
            }
            if (differenceInDays(new Date(data.endDate), new Date(data.startDate)) !== 0) {
                newErrors.dateRange = t("validation.singleDayRequired"); formIsValid = false;
            }
            if (data.checkInSelection === 'مسائية' && data.checkOutSelection === 'صباحية' && differenceInDays(new Date(data.endDate), new Date(data.startDate)) === 0) {
                newErrors.periodSelection = t("validation.invalidSameDayPeriod"); formIsValid = false;
            }
        } else if (data.periodType === 'customPeriod') {
            if (!data.startDate || !data.endDate || differenceInDays(new Date(data.endDate), new Date(data.startDate)) < 0) {
                newErrors.dateRange = t("validation.dateRangeInvalid"); formIsValid = false;
            }
            if (data.startDate && data.endDate && differenceInDays(new Date(data.endDate), new Date(data.startDate)) === 0) {
                // For custom period on same day, ensure check-in is before check-out logically
                if (data.checkInSelection === 'مسائية' && data.checkOutSelection === 'صباحية') {
                    newErrors.periodSelection = t("validation.invalidSameDayPeriod"); formIsValid = false;
                }
            }
        }
        setErrors(newErrors);
        return formIsValid;
    };

    const formatDate = (date) => date instanceof Date && !isNaN(date) ? format(date, "yyyy-MM-dd") : "";

    const updateUserProfileIfChanged = async () => {
        if (isAuthenticated && user) {
            const payload = {};
            if (data.fullName && data.fullName !== user.name) payload.name = data.fullName;
            if (data.phoneNumber && data.phoneNumber !== user.phone) payload.phone = data.phoneNumber;
            if (data.idNumber && data.idNumber !== user.idNumber) payload.idNumber = data.idNumber;
            if (data.address && data.address !== user.address) payload.address = data.address;
            if (data.nationality && data.nationality !== user.nationality) payload.nationality = data.nationality;

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


    function handleSubmit(e) {
        e.preventDefault();
        if (!isAuthenticated) { setSnackOpen2(true); setErrMsg(t("validation.loginRequiredForReservation")); setTimeout(() => navigate("/user/signin"), 2000); return; }
        if (!validateFields()) { setSnackOpen2(true); setErrMsg(t("validation.fillAllRequired")); return; }

        if (!isPeriodAvailable) {
            setSnackOpen2(true);
            setErrMsg(t("details.periodUnavailable"));
            return;
        }

        setLoading(true);

        const reservationData = {
            clientName: data.fullName,
            phone: data.phoneNumber,
            address: data.address,
            nationality: data.nationality,
            idNumber: data.idNumber,
            entityId: data2._id,
            entityType: data.type,
            periodType: data.periodType, // Send as is: 'dayPeriod' or 'customPeriod'
            // dayPeriod is derived from checkInSelection/checkOutSelection in backend for single day.
            // For multi-day, it's undefined.
            dayPeriod: data.periodType === 'dayPeriod' ? data.selectedPeriod : undefined, // Keep sending `selectedPeriod` if it helps the backend for single-day display

            // These are the key fields for pricing calculation on backend
            checkInSelection: data.checkInSelection,
            checkOutSelection: data.checkOutSelection,

            startDate: formatDate(data.startDate),
            endDate: formatDate(data.endDate),
            discountCode: data.discountCode || "",
            paymentMethod: data.paymentMethod,
            bankName: data.paymentMethod === "bank" ? data.bankName : undefined,
            paymentProof: data.paymentMethod === "bank" ? data.paymentProof : undefined,
            cost: data.cost // This cost is calculated on frontend, backend recalculates for validation
        };
        console.log("Sending reservation data:", reservationData);

        Api.post('/user/reservation', reservationData)
            .then(async (res) => {
                setLoading(false);
                setSnackOpen(true);
                setDialogeMsg(true);
                await updateUserProfileIfChanged();
                dispatch(fetchUserData());
            })
            .catch((error) => {
                setLoading(false);
                setSnackOpen2(true);
                const errorResponse = error.response?.data;
                if (errorResponse) {
                    if (errorResponse.error) {
                        setErrMsg(errorResponse.error);
                    } else if (errorResponse.message) {
                        setErrMsg(errorResponse.message);
                    } else if (typeof errorResponse === 'string') {
                        setErrMsg(errorResponse);
                    } else {
                        setErrMsg(t("validation.reservationError"));
                    }
                } else {
                    setErrMsg(t("common.networkError"));
                }
            });
    }

    useEffect(() => {
        const hideOnEscape = (e) => { if (e.key === "Escape") setOpen(false); };
        const hideOnClickOutside = (e) => { if (refOne.current && !refOne.current.contains(e.target) && !e.target.closest('.inputBox')) setOpen(false); };
        document.addEventListener("keydown", hideOnEscape, true);
        document.addEventListener("click", hideOnClickOutside, true);
        return () => { document.removeEventListener("keydown", hideOnEscape, true); document.removeEventListener("click", hideOnClickOutside, true); };
    }, []);

    const todayFormatted = format(new Date(), 'yyyy-MM-dd');
    const minCheckoutDateFormatted = data.startDate ? format(addDays(new Date(data.startDate), (data.periodType === 'customPeriod' ? 1 : 0)), 'yyyy-MM-dd') : '';
    // Adjust minCheckoutDateFormatted for single-day to be same day, multi-day to be next day

    const buttonText = availabilityChecking
        ? t("details.checkingAvailability")
        : !isPeriodAvailable
            ? t("details.periodUnavailable")
            : data2?.maintenance
                ? t("details.maintenanceMessage")
                : t("details.choose");

    const isButtonDisabled = data2?.maintenance || loading || availabilityChecking || !isPeriodAvailable;

    return (
        <>
            {data2 ? (
                <div className="reservation-chalet-container">
                    <div className='price-header-section'>
                        {i18n.language === 'ar' ? (<h3>{t("details.price_per_day")} <span>{data2.price?.wholeDay} {t("details.currency")}</span></h3>)
                            : (<h3><span>{data2.price?.wholeDay} {t("details.currency")}</span> {t("details.price_per_day")}</h3>)}
                        <div className='sub-prices'>
                            {data2.price?.morning && <span>{t("details.morning")}: {data2.price.morning} {t("details.currency")}</span>}
                            {data2.price?.night && <span>{t("details.Night")}: {data2.price.night} {t("details.currency")}</span>}
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="reservation-content-grid">
                        <div className="form-inputs-column">
                            <div className="calendar-container">
                                <InputLabel className="input-label-custom">{t("details.selectDate")}</InputLabel>
                                <TextField fullWidth value={`${format(data.startDate, 'MM/dd/yyyy')}`} InputProps={{ readOnly: true }} className="inputBox" onClick={() => setOpen(prev => !prev)} />
                                {open && (
                                    <div className="calendar" ref={refOne}>
                                        <Calendar className='calendarElement' onChange={(newDate) => setData(prev => ({ ...prev, startDate: newDate, endDate: (prev.periodType === 'dayPeriod' ? newDate : addDays(newDate, 1)) }))} minDate={new Date()} date={data.startDate} />
                                    </div>
                                )}
                                {errors.dateRange && <Typography variant="caption" color="error" className="error-text-bottom">{errors.dateRange}</Typography>}
                            </div>
                            <TextField fullWidth label={t("details.fullName")} value={data.fullName} onChange={(e) => setData({ ...data, fullName: e.target.value })} required error={!!errors.fullName} helperText={errors.fullName || ""} margin="normal" InputProps={{ readOnly: isAuthenticated && user?.name && user.name.trim().split(' ').length >= 3 }} />
                            <TextField fullWidth label={t("details.phoneNumber")} value={data.phoneNumber} onChange={(e) => setData({ ...data, phoneNumber: e.target.value })} required error={!!errors.phoneNumber} helperText={errors.phoneNumber || ""} margin="normal" InputProps={{ readOnly: isAuthenticated && user?.phone }} />
                            <TextField fullWidth label={t("details.idNumber")} value={data.idNumber} onChange={(e) => setData({ ...data, idNumber: e.target.value })} required error={!!errors.idNumber} helperText={errors.idNumber || ""} margin="normal" InputProps={{ readOnly: isAuthenticated && user?.idNumber }} />
                            <TextField fullWidth label={t("details.nationality")} value={data.nationality} onChange={(e) => setData({ ...data, nationality: e.target.value })} required error={!!errors.nationality} helperText={errors.nationality || ""} margin="normal" />
                            <TextField fullWidth label={t("details.address")} value={data.address} onChange={(e) => setData({ ...data, address: e.target.value })} required error={!!errors.address} helperText={errors.address || ""} margin="normal" />

                            <FormControl fullWidth margin="normal" error={!!errors.paymentMethod}>
                                <InputLabel>{t("details.paymentMethod")}</InputLabel>
                                <Select value={data.paymentMethod} onChange={(e) => setData({ ...data, paymentMethod: e.target.value })} required label={t("details.paymentMethod")}>
                                    <MenuItem value="">{t("common.select")}</MenuItem>
                                    <MenuItem value="cash">{t("details.cash")}</MenuItem>
                                    <MenuItem value="network">{t("details.network")}</MenuItem>
                                    <MenuItem value="bank">{t("details.bank")}</MenuItem>
                                </Select>
                                {errors.paymentMethod && <Typography variant="caption" color="error">{errors.paymentMethod}</Typography>}
                                {data.paymentMethod === "bank" && (
                                    <>
                                        <FormControl fullWidth margin="normal" error={!!errors.bankName}>
                                            <InputLabel>{t("details.bankType")}</InputLabel>
                                            <Select value={data.bankName} onChange={(e) => setData({ ...data, bankName: e.target.value })} required label={t("details.bankType")}>
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
                                        <TextField fullWidth label={t("details.transferMessage")} value={data.paymentProof} onChange={(e) => setData({ ...data, paymentProof: e.target.value })} required error={!!errors.paymentProof} helperText={errors.paymentProof || ""} margin="normal" />
                                    </>
                                )}
                            </FormControl>
                            <TextField fullWidth label={t("details.discountCodeOptional")} value={data.discountCode} onChange={(e) => setData({ ...data, discountCode: e.target.value })} margin="normal" />

                            <FormControl component="fieldset" fullWidth margin="normal" error={!!errors.selectedPeriod || !!errors.dateRange || !!errors.periodSelection}>
                                <FormLabel component="legend">{t("details.chooseBookingType")}</FormLabel>
                                <RadioGroup row value={data.periodType} onChange={(e) => setData(prev => ({ ...prev, periodType: e.target.value, startDate: new Date(), endDate: e.target.value === 'dayPeriod' ? new Date() : addDays(new Date(), 1) }))}>
                                    <FormControlLabel value="dayPeriod" control={<Radio />} label={t("details.fixedPeriod")} />
                                    <FormControlLabel value="customPeriod" control={<Radio />} label={t("details.multiplePeriods")} />
                                </RadioGroup>
                                {errors.selectedPeriod && <Typography variant="caption" color="error" className="error-text-bottom">{errors.selectedPeriod}</Typography>}
                                {errors.dateRange && <Typography variant="caption" color="error" className="error-text-bottom">{errors.dateRange}</Typography>}
                                {errors.periodSelection && <Typography variant="caption" color="error" className="error-text-bottom">{errors.periodSelection}</Typography>}

                                {data.periodType === "dayPeriod" ? (
                                    <div className="period-section">
                                        <h3>{t("details.period")}</h3>
                                        <div className="period-buttons">
                                            {buttonGroup.map((button, index) => {
                                                const isAvailable = !!data2?.price?.[button.priceKey];
                                                return (
                                                    <Button
                                                        key={index}
                                                        className={`period-btn btn ${data.selectedPeriod === button.value ? "active" : ""} ${!isAvailable ? "disabled" : ""}`}
                                                        onClick={() => {
                                                            if (isAvailable) {
                                                                setData(prev => ({
                                                                    ...prev,
                                                                    selectedPeriod: button.value,
                                                                    checkInSelection: button.checkIn, // Update checkInSelection
                                                                    checkOutSelection: button.checkOut, // Update checkOutSelection
                                                                }));
                                                            }
                                                        }}
                                                        disabled={!isAvailable}
                                                    >
                                                        <span className="period-label">{i18n.language === "ar" ? button.label : button.enLabel}</span>
                                                        {!isAvailable && <span className="period-unavailable">❌ {t("details.notAvailable")}</span>}
                                                        {isAvailable && (
                                                            <>
                                                                <span className="period-price">{data2.price[button.priceKey]} {t("details.currency")}</span>
                                                                {/* Display the fixed check-in/out times for each period type, assuming they exist on data2 */}
                                                                {button.value === 'صباحية' && data2.dayStartHour && data2.dayEndHour && (
                                                                    <span className="period-time">({data2.dayStartHour} - {data2.dayEndHour})</span>
                                                                )}
                                                                {button.value === 'مسائية' && data2.nightStartHour && data2.nightEndHour && (
                                                                    <span className="period-time">({data2.nightStartHour} - {data2.nightEndHour})</span>
                                                                )}
                                                                {button.value === 'كامل اليوم' && data2.dayStartHour && data2.nightEndHour && (
                                                                    <span className="period-time">({data2.dayStartHour} - {data2.nightEndHour})</span>
                                                                )}
                                                            </>
                                                        )}
                                                    </Button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    <Grid container spacing={2} sx={{ mt: 2 }}>
                                        <Grid item xs={12} md={6}>
                                            <InputLabel className="input-label-custom">{t("details.checkInDate")}</InputLabel>
                                            <TextField fullWidth type="date" value={formatDate(data.startDate)} onChange={(e) => { const [year, month, day] = e.target.value.split('-').map(part => parseInt(part, 10)); const safeNewStartDate = new Date(Date.UTC(year, month - 1, day)); if (!isNaN(safeNewStartDate)) { setData(prev => ({ ...prev, startDate: safeNewStartDate })); } }} InputLabelProps={{ shrink: true }} inputProps={{ min: todayFormatted }} />
                                            <div style={{ marginTop: '10px' }}>
                                                <FormLabel component="legend">{t("details.checkInPeriod")}</FormLabel>
                                                <RadioGroup row value={data.checkInSelection} onChange={(e) => setData(prev => ({ ...prev, checkInSelection: e.target.value }))}>
                                                    <FormControlLabel value="صباحية" control={<Radio />} label={t("details.morning")} />
                                                    <FormControlLabel value="مسائية" control={<Radio />} label={t("details.Night")} />
                                                </RadioGroup>
                                            </div>
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <InputLabel className="input-label-custom">{t("details.checkOutDate")}</InputLabel>
                                            <TextField fullWidth type="date" value={formatDate(data.endDate)} onChange={(e) => { const [year, month, day] = e.target.value.split('-').map(part => parseInt(part, 10)); const safeNewEndDate = new Date(Date.UTC(year, month - 1, day)); if (!isNaN(safeNewEndDate)) { setData({ ...data, endDate: safeNewEndDate }); } }} InputLabelProps={{ shrink: true }} inputProps={{ min: minCheckoutDateFormatted }} />
                                            <div style={{ marginTop: '10px' }}>
                                                <FormLabel component="legend">{t("details.checkOutPeriod")}</FormLabel>
                                                <RadioGroup row value={data.checkOutSelection} onChange={(e) => setData(prev => ({ ...prev, checkOutSelection: e.target.value }))}>
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
                                        <p>{`${format(data.startDate, 'MM/dd/yyyy')}`}</p>
                                        <p style={{ fontSize: '0.8rem', color: '#666' }}>
                                            {data.checkInSelection === 'صباحية' ? t("details.morning") : t("details.Night")}
                                        </p>
                                    </div>
                                    {(data.periodType === "customPeriod" || differenceInDays(data.endDate, data.startDate) > 0) && ( // Show checkout for multi-day bookings
                                        <div className="date-field">
                                            <p>{t("details.left")}</p>
                                            <p>{`${format(data.endDate, 'MM/dd/yyyy')}`}</p>
                                            <p style={{ fontSize: '0.8rem', color: '#666' }}>
                                                {data.checkOutSelection === 'صباحية' ? t("details.morning") : t("details.Night")}
                                            </p>
                                        </div>
                                    )}
                                </div>
                                <div className="total-price-box">
                                    {i18n.language === 'ar' ? (<><p>{t("details.total")}</p><span>{data.cost} {t("details.currency")}</span></>)
                                        : (<><span>{data.cost} {t("details.currency")}</span><p>{t("details.total")}</p></>)}
                                </div>
                                <Button
                                    type='submit'
                                    className='reserve-btn btn'
                                    disabled={isButtonDisabled}
                                >
                                    {buttonText}
                                </Button>
                                <p className='installment-title'>{t("details.pill")}</p>
                                <Grid container spacing={2} className="installment-grid">
                                    <Grid item xs={4} className='installment-item'><CircularProgressWithLabel style={{ color: "var(--primary)" }} variant="determinate" value={100} label={3} /><p className='installment-amount'>{Math.floor(data.cost / 3)} {t("details.currency")}</p></Grid>
                                    <Grid item xs={4} className='installment-item'><CircularProgressWithLabel style={{ color: "var(--primary)" }} variant="determinate" value={66} label={2} /><p className='installment-amount'>{Math.floor(data.cost / 3)} {t("details.currency")}</p></Grid>
                                    <Grid item xs={4} className='installment-item'><CircularProgressWithLabel style={{ color: "var(--primary)" }} variant="determinate" value={33} label={1} /><p className='installment-amount'>{Math.floor(data.cost / 3)} {t("details.currency")}</p></Grid>
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

            <Dialoge open={dialogeMsg} handleClose={handleClose} />
            <Snackbar open={snackOpen} autoHideDuration={6000} onClose={() => setSnackOpen(false)}><Alert onClose={() => setSnackOpen(false)} severity="success" sx={{ width: '100%' }}>{t("details.reservationSuccess")}</Alert></Snackbar>
            <Snackbar open={snackOpen2} autoHideDuration={6000} onClose={() => setSnackOpen2(false)}><Alert onClose={() => setSnackOpen2(false)} severity="warning" sx={{ width: '100%' }}>{errMsg}</Alert></Snackbar>
            <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={loading}><CircularProgress color="inherit" /></Backdrop>
            <Footer />
        </>
    );
}

export default ReservationChalet;