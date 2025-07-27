import React, { useState, useEffect } from 'react';
import {
    Grid,
    Card,
    CardContent,
    Typography,
    Button as MuiButton,
    TextField, // TextField لم يستخدم في هذا الكود مباشرة، لكنه مستورد
    Snackbar,
    Box,
    CircularProgress // تأكد من استيرادها
} from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { FaStar } from 'react-icons/fa';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import Api from '../config/config';
import CancelDialoge from '../components/CancelDialoge';
import Footer from './../components/Footer';
import BankDetailsModal from '../components/BankDetailsModal';
import { fetchUserReservations } from '../redux/reducers/user';
import { fetchChalets } from './../redux/reducers/chalet'; // قد لا نحتاج لجلب جميع الشاليهات
import { fetchHalls } from './../redux/reducers/hall'; // قد لا نحتاج لجلب جميع القاعات
import { useTranslation } from 'react-i18next';
import '../scss/reservations.scss';
import format from 'date-fns/format'; // لضمان تنسيق التواريخ
import { parseISO, isBefore, isAfter, addHours, addMinutes } from 'date-fns'; // دوال Date-fns إضافية

// Alert component for Snackbar
const Alert = React.forwardRef(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

// عدد الساعات قبل بدء الحجز التي لا يُسمح بعدها بالإلغاء
const CANCELLATION_CUTOFF_HOURS = 24; // مثال: لا يمكن الإلغاء قبل 24 ساعة

const Reservations = () => {
    const dispatch = useDispatch();
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteID, setDeleteID] = useState(null);

    const userReservations = useSelector((state) => state.user.reservations);
    const isAuthenticated = useSelector((state) => state.user.isAuthenticated);
    // جلب جميع الكيانات (قاعات وشاليهات) قد يكون مكلفًا إذا لم تستخدمها مباشرة.
    // يمكن تعديل `typeOfEntity` ليستخدم فقط `ele.type` من الحجز إذا كانت متاحة.
    const allChalets = useSelector((state) => state.chalet.data); 
    const allHalls = useSelector((state) => state.hall.data); 
    const userStatus = useSelector((state) => state.user.status); // حالة تحميل المستخدم

    const [rating, setRating] = useState(0);
    const [note, setNote] = useState('');
    const [tempReservation, setTempReservation] = useState(null);
    const [hover, setHover] = useState(0);
    const [snackOpenSuccess, setSnackOpenSuccess] = useState(false); // تم تغيير الاسم
    const [snackOpenError, setSnackOpenError] = useState(false); // تم تغيير الاسم
    const [errorMessage, setErrorMessage] = useState(''); // تم تغيير الاسم
    const [bankOpen, setBankOpen] = useState(false);

    useEffect(() => {
        if (isAuthenticated) {
            dispatch(fetchUserReservations());
        }
        // جلب جميع الكيانات ليس ضرورياً هنا إذا كانت `typeOfEntity` لا تحتاجها
        // dispatch(fetchChalets()); 
        // dispatch(fetchHalls()); 
    }, [dispatch, isAuthenticated]);

    const handleDeleteClose = () => setDeleteOpen(false);
    const handleBankClose = () => setBankOpen(false);

    // ✨ تم تبسيط هذه الدالة. لا تحتاج لجلب كل الكيانات.
    // نوع الكيان (hall/chalet) موجود بالفعل في `reservation.type`
    // function typeOfEntity(entityId) {
    //     if (allHalls && allHalls.some((ele) => ele._id === entityId)) return 'hall';
    //     if (allChalets && allChalets.some((ele) => ele._id === entityId)) return 'chalet';
    //     return null;
    // }

    // ✨ دالة مُحسنة للتحقق من إمكانية الإلغاء بناءً على الوقت
    const canCancelReservation = (reservation) => {
        // لا يمكن الإلغاء إذا كانت ملغاة، مكتملة، أو هناك طلب إلغاء بالفعل
        if (reservation.status === 'canceled' || reservation.status === 'completed' || reservation.cancelRequest) {
            return false;
        }

        const { period } = reservation;
        if (!period || !period.startDate || !period.checkIn || !period.checkIn.time) {
            // إذا كانت بيانات الفترة غير كاملة، يمكن اعتبارها قابلة للإلغاء بشكل افتراضي أو حسب سياساتك
            return true; 
        }

        const now = new Date();
        const startDate = parseISO(period.startDate); // تحويل التاريخ من ISO string
        let reservationStartDateTime = new Date(startDate); // نسخة من تاريخ البدء

        // تحليل وقت الدخول (مثل "09:00" أو "18:00")
        const [hours, minutes] = period.checkIn.time.split(':').map(Number);
        
        // ضبط ساعات ودقائق الدخول على تاريخ البدء
        reservationStartDateTime = addHours(reservationStartDateTime, hours);
        reservationStartDateTime = addMinutes(reservationStartDateTime, minutes);

        // حساب الفرق بالساعات
        const diffInMilliseconds = reservationStartDateTime.getTime() - now.getTime();
        const diffInHours = diffInMilliseconds / (1000 * 60 * 60);

        // يمكن الإلغاء إذا كان الوقت المتبقي أكبر من نافذة الإلغاء المحددة
        return diffInHours > CANCELLATION_CUTOFF_HOURS;
    };


    async function handleSubmitRating(e) {
        e.preventDefault();
        if (!rating || rating === 0) {
            setErrorMessage(t('user.mustRate')); // استخدام errorMessage
            setSnackOpenError(true); // استخدام snackOpenError
            return;
        }
        if (!tempReservation) return;

        console.log("Sending rating data:", {
            reservationId: tempReservation._id,
            // ✨ typeOfEntity تم إزالتها، استخدام `ele.type` من الحجز مباشرة
            entity: { id: tempReservation.entity.id, type: tempReservation.type }, 
            rate: rating,
            note: note,
        });

        try {
            const response = await Api.post('/user/reservation/rate', {
                reservationId: tempReservation._id,
                entity: { id: tempReservation.entity.id, type: tempReservation.type },
                rate: rating,
                note: note,
            });

            console.log("Rating response:", response.data);

            setErrorMessage(response.data.message || t('user.thanksForRating'));
            setSnackOpenSuccess(true); // استخدام snackOpenSuccess
            setRating(0);
            setNote('');
            setTempReservation(null);
            dispatch(fetchUserReservations());
        } catch (error) {
            console.error('Error submitting rating:', error.response?.data || error.message);
            setErrorMessage(error.response?.data?.message || t('common.ratingGenericError'));
            setSnackOpenError(true); // استخدام snackOpenError
        }
    }

    const openDeleteDialog = (reservationId) => {
        setDeleteID(reservationId);
        setDeleteOpen(true);
    };

    // حالة التحميل الأولية للصفحة
    if (userStatus === 'loading' && isAuthenticated) {
        return (
            <Box className="reservations-page-container loading-reservations" dir={i18n.language === 'en' ? 'ltr' : 'rtl'}>
                <CircularProgress color="inherit" />
                <Typography variant="h6" className="loading-message" sx={{ mt: 2 }}>
                    {t('common.loading')}
                </Typography>
            </Box>
        );
    }
    
    // إذا لم يكن المستخدم مسجل دخول
    if (!isAuthenticated) { // لا نعتمد على userStatus هنا لسرعة العرض
        return (
            <Box className="reservations-page-container login-required-container" dir={i18n.language === 'en' ? 'ltr' : 'rtl'}>
                <Link to="/user/signin" style={{ textDecoration: 'none' }}>
                    <MuiButton variant="contained" className="login-prompt-btn">
                        {t('user.loginRequired')}
                    </MuiButton>
                </Link>
            </Box>
        );
    }


    return (
        <>
            <Box className="reservations-page-container" dir={i18n.language === 'en' ? 'ltr' : 'rtl'}>
                <div className="container reserve">
                    <h2 className="section-title">{t('user.reservations')}</h2>
                    <Grid container spacing={4} className="reservations-grid">
                        {userReservations && userReservations.length > 0 ? (
                            userReservations.map((ele, ind) => (
                                <Grid key={ind} item xs={12} sm={6} md={6} lg={4}>
                                    <Card className={`reservation-card ${ele.status}`}>
                                        <CardContent className="card-content">
                                            <Typography gutterBottom variant="h5" component="div" className="card-name">
                                                {ele.entity?.name || t('common.unknownEntity')}
                                            </Typography>

                                            <div className="price-box">
                                                <p className="price-text">
                                                    {t('details.price')} <span className="price-value">{ele.cost || 0} {t('details.currency')}</span>
                                                </p>
                                            </div>

                                            {/* ✨ عرض الفترة والتاريخ بشكل مُحسّن ✨ */}
                                            <Typography variant="body2" className="reservation-period">
                                                {ele.period?.startDate ? (
                                                    <>
                                                        <p>
                                                            {t('common.date')}: {format(parseISO(ele.period.startDate), 'yyyy-MM-dd')}
                                                            {ele.period.periodType === 'dayPeriod' && (
                                                                <>
                                                                    {' / '}
                                                                    {t(`details.${ele.period.dayPeriod === 'صباحية' ? 'morning' : ele.period.dayPeriod === 'مسائية' ? 'Night' : 'day'}`)}
                                                                </>
                                                            )}
                                                        </p>
                                                        {ele.period.periodType === 'days' && ele.period.endDate && (
                                                            <p>
                                                                {t('common.to')}: {format(parseISO(ele.period.endDate), 'yyyy-MM-dd')}
                                                            </p>
                                                        )}
                                                        {ele.period.checkIn?.time && (
                                                            <p>
                                                                {t('details.checkInTime')}: {ele.period.checkIn.time}
                                                                {ele.period.checkOut?.time && ` - ${ele.period.checkOut.time}`}
                                                            </p>
                                                        )}
                                                    </>
                                                ) : (
                                                    <p>{t('common.noDateSpecified')}</p>
                                                )}
                                            </Typography>

                                            <div className="status-container">
                                                {ele.status === 'unConfirmed' && (
                                                    <p className="status-text unconfirmed">
                                                        <ErrorOutlineIcon className="status-icon" />
                                                        {t('user.unconfirm')}
                                                    </p>
                                                )}
                                                {ele.status === 'confirmed' && (
                                                    <p className="status-text confirmed">
                                                        {t('user.confirmed')}
                                                    </p>
                                                )}
                                                {ele.status === 'completed' && (
                                                    <p className="status-text completed">
                                                        {t('user.completed')}
                                                    </p>
                                                )}
                                                {ele.status === 'canceled' && (
                                                    <p className="status-text canceled">
                                                        {t('user.canceled')}
                                                    </p>
                                                )}
                                                {ele.cancelRequest && ele.status !== 'canceled' && (
                                                    <Alert severity="info" className="cancel-request-alert">
                                                        {t('user.cancelRequest')}
                                                    </Alert>
                                                )}
                                            </div>

                                            {ele.status === 'completed' && !ele.rated && (
                                                <form onSubmit={handleSubmitRating} className="rating-form">
                                                    <div className="stars-container">
                                                        <Typography variant="body2" className="rating-label">{t('user.rating')}</Typography>
                                                        {[...Array(5)].map((star, i) => {
                                                            const ratingValue = i + 1;
                                                            return (
                                                                <label key={i}>
                                                                    <input
                                                                        type="radio"
                                                                        name="rating"
                                                                        value={ratingValue}
                                                                        onClick={() => {
                                                                            setRating(ratingValue);
                                                                            setTempReservation(ele); 
                                                                        }}
                                                                        style={{ display: 'none' }}
                                                                    />
                                                                    <FaStar
                                                                        className="star"
                                                                        color={ratingValue <= (hover || rating) ? 'var(--primary-color)' : '#e4e5e9'}
                                                                        size={25}
                                                                        onMouseEnter={() => setHover(ratingValue)}
                                                                        onMouseLeave={() => setHover(0)}
                                                                    />
                                                                </label>
                                                            );
                                                        })}
                                                    </div>
                                                    <TextField
                                                        value={note}
                                                        onChange={(e) => setNote(e.target.value)}
                                                        label={t('user.notes')}
                                                        variant="outlined"
                                                        multiline
                                                        rows={2}
                                                        fullWidth
                                                        className="note-field form-input"
                                                    />
                                                    <MuiButton variant="contained" type="submit" className="submit-rating-btn submit-btn primary-btn">
                                                        {t('common.send')}
                                                    </MuiButton>
                                                </form>
                                            )}

                                            <div className="reservation-actions-btns">
                                                {!ele.completed && ele.status !== 'canceled' && !ele.cancelRequest && (
                                                    <MuiButton
                                                        variant="contained"
                                                        onClick={() => setBankOpen(true)}
                                                        className="bank-info-btn submit-btn secondary-btn"
                                                    >
                                                        {t('user.bankInfo')}
                                                    </MuiButton>
                                                )}
                                                {/* ✨ استخدام canCancelReservation هنا */}
                                                {canCancelReservation(ele) && (
                                                    <MuiButton
                                                        variant="outlined"
                                                        onClick={() => openDeleteDialog(ele._id)}
                                                        className="cancel-reservation-btn submit-btn cancel-btn"
                                                    >
                                                        {t('user.cancel')}
                                                    </MuiButton>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))
                        ) : (
                            <Grid item xs={12}>
                                <Typography variant="h6" className="no-reservations-message">
                                    {t('user.noReservations')}
                                </Typography>
                            </Grid>
                        )}
                    </Grid>
                </div>
            </Box>

            <CancelDialoge open={deleteOpen} handleClose={handleDeleteClose} url={`/users/reservation/cancel`} id={deleteID} />
            <BankDetailsModal open={bankOpen} handleClose={handleBankClose} />
            <Snackbar open={snackOpenSuccess} autoHideDuration={6000} onClose={() => setSnackOpenSuccess(false)}>
                <Alert onClose={() => setSnackOpenSuccess(false)} severity="success" className="snackbar-alert">
                    {errorMessage || t('common.successOperation')} {/* رسالة النجاح ستكون في errorMessage بعد التصحيح */}
                </Alert>
            </Snackbar>
            <Snackbar open={snackOpenError} autoHideDuration={6000} onClose={() => setSnackOpenError(false)}>
                <Alert onClose={() => setSnackOpenError(false)} severity="error" className="snackbar-alert">
                    {errorMessage || t('common.errorOccurred')}
                </Alert>
            </Snackbar>
            <Footer />
        </>
    );
};

export default Reservations;