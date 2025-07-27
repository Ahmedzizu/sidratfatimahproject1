import React, { useState, useEffect } from 'react';
import {
    Grid,
    Card,
    CardContent,
    Typography,
    Button as MuiButton,
    TextField,
    Snackbar,
    Box,
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
import { fetchChalets } from './../redux/reducers/chalet';
import { fetchHalls } from './../redux/reducers/hall';
import { useTranslation } from 'react-i18next';
import '../scss/reservations.scss';

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
    const allChalets = useSelector((state) => state.chalet.data);
    const allHalls = useSelector((state) => state.hall.data);
    const userStatus = useSelector((state) => state.user.status);

    const [rating, setRating] = useState(0);
    const [note, setNote] = useState('');
    const [tempReservation, setTempReservation] = useState(null);
    const [hover, setHover] = useState(0);
    const [snackOpen, setSnackOpen] = useState(false);
    const [snackOpen2, setSnackOpen2] = useState(false);
    const [errMsg, setErrMsg] = useState('');
    const [bankOpen, setBankOpen] = useState(false);

    useEffect(() => {
        if (isAuthenticated) {
            dispatch(fetchUserReservations());
        }
        dispatch(fetchChalets());
        dispatch(fetchHalls());
    }, [dispatch, isAuthenticated]);

    const handleDeleteClose = () => setDeleteOpen(false);
    const handleBankClose = () => setBankOpen(false);

    function typeOfEntity(entityId) {
        if (allHalls && allHalls.some((ele) => ele._id === entityId)) return 'hall';
        if (allChalets && allChalets.some((ele) => ele._id === entityId)) return 'chalet';
        return null;
    }

    // ✨ دالة جديدة للتحقق من إمكانية الإلغاء بناءً على الوقت
    const canCancelReservation = (reservation) => {
        if (reservation.status === 'canceled' || reservation.status === 'completed' || reservation.cancelRequest) {
            return false; // لا يمكن الإلغاء إذا كانت ملغاة، مكتملة، أو هناك طلب إلغاء بالفعل
        }

        const { period } = reservation;
        if (!period || !period.startDate) {
            return true; // إذا لم يكن هناك تاريخ بدء، نفترض أنه يمكن الإلغاء (أو يمكن تعديل هذا المنطق)
        }

        const now = new Date();
        let reservationStartTime;

        if (period.periodType === 'dayPeriod') {
            // للحجوزات اليومية (صباحية/مسائية/يوم كامل)
            const [year, month, day] = period.startDate.split('-').map(Number);
            let hours = 0; // افتراضي لبداية اليوم
            if (period.dayPeriod === 'صباحية' || period.dayPeriod === 'morning') {
                hours = 9; // مثال: تبدأ الصباحية الساعة 9 صباحاً
            } else if (period.dayPeriod === 'مسائية' || period.dayPeriod === 'Night') {
                hours = 17; // مثال: تبدأ المسائية الساعة 5 مساءً
            } else { // يوم كامل
                hours = 9; // مثال: يبدأ اليوم الكامل الساعة 9 صباحاً
            }
            reservationStartTime = new Date(year, month - 1, day, hours, 0, 0);
        } else {
            // للحجوزات التي لها تاريخ بدء وانتهاء (عادةً بالليالي)
            const [year, month, day] = period.startDate.split('-').map(Number);
            reservationStartTime = new Date(year, month - 1, day, 15, 0, 0); // مثال: وقت تسجيل الدخول 3 مساءً
        }

        // حساب الفرق بالساعات
        const diffInMilliseconds = reservationStartTime.getTime() - now.getTime();
        const diffInHours = diffInMilliseconds / (1000 * 60 * 60);

        // يمكن الإلغاء إذا كان الوقت المتبقي أكبر من نافذة الإلغاء المحددة
        return diffInHours > CANCELLATION_CUTOFF_HOURS;
    };


    async function handleSubmitRating(e) {
        e.preventDefault();
        if (!rating || rating === 0) {
            setErrMsg(t('user.mustRate'));
            setSnackOpen(true);
            return;
        }
        if (!tempReservation) return;

        // ✨ إضافة console.log للتحقق من البيانات قبل الإرسال
        console.log("Sending rating data:", {
            reservationId: tempReservation._id,
            entity: { id: tempReservation.entity.id, type: typeOfEntity(tempReservation.entity.id) },
            rate: rating,
            note: note,
        });

        try {
            const response = await Api.post('/user/reservation/rate', {
                reservationId: tempReservation._id,
                entity: { id: tempReservation.entity.id, type: typeOfEntity(tempReservation.entity.id) },
                rate: rating,
                note: note,
            });

            // ✨ إضافة console.log لاستجابة السيرفر
            console.log("Rating response:", response.data);

            setErrMsg(response.data.message || t('user.thanksForRating'));
            setSnackOpen2(true);
            setRating(0);
            setNote('');
            setTempReservation(null);
            dispatch(fetchUserReservations());
        } catch (error) {
            console.error('Error submitting rating:', error.response?.data || error.message);
            setErrMsg(error.response?.data?.message || t('common.ratingGenericError'));
            setSnackOpen(true);
        }
    }

    const openDeleteDialog = (reservationId) => {
        setDeleteID(reservationId);
        setDeleteOpen(true);
    };

    if (!isAuthenticated && userStatus !== 'loading') {
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

    if (isAuthenticated && userStatus === 'loading') {
        return (
            <Box className="reservations-page-container loading-reservations" dir={i18n.language === 'en' ? 'ltr' : 'rtl'}>
                <Typography variant="h6" className="loading-message">
                    {t('common.loading')}
                </Typography>
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

                                            <Typography variant="body2" className="reservation-period">
                                                {ele.period?.startDate ? (
                                                    ele.period.periodType === 'dayPeriod' ? (
                                                        <p>{`${ele.period.startDate} / ${t(`details.${ele.period.dayPeriod === 'صباحية' ? 'morning' : ele.period.dayPeriod === 'مسائية' ? 'Night' : 'day'}`)}`}</p>
                                                    ) : (
                                                        <p>{`${ele.period.startDate} - ${ele.period.endDate}`}</p>
                                                    )
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
                                                                            setTempReservation(ele); // ✨ تعيين الحجز المؤقت عند اختيار النجمة
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

            <CancelDialoge open={deleteOpen} handleClose={handleDeleteClose} url={`/admin/reservation/cancel`} id={deleteID} />
            <BankDetailsModal open={bankOpen} handleClose={handleBankClose} />
            <Snackbar open={snackOpen} autoHideDuration={6000} onClose={() => setSnackOpen(false)}>
                <Alert onClose={() => setSnackOpen(false)} severity="warning" className="snackbar-alert">
                    {errMsg || t('common.errorOccurred')}
                </Alert>
            </Snackbar>
            <Snackbar open={snackOpen2} autoHideDuration={6000} onClose={() => setSnackOpen2(false)}>
                <Alert onClose={() => setSnackOpen2(false)} severity="success" className="snackbar-alert">
                    {errMsg || t('common.successOperation')}
                </Alert>
            </Snackbar>
            <Footer />
        </>
    );
};

export default Reservations;