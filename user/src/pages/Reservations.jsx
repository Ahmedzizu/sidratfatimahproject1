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
    CircularProgress
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
import format from 'date-fns/format';
import { parseISO, isBefore, isAfter, addHours, addMinutes } from 'date-fns';

// 👈 استيراد المكون الجديد الذي قمت بإنشائه
import ReservationDetailsModal from '../components/ReservationDetailsModal.jsx';

// Alert component for Snackbar
const Alert = React.forwardRef(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

// عدد الساعات قبل بدء الحجز التي لا يُسمح بعدها بالإلغاء
const CANCELLATION_CUTOFF_HOURS = 24;

const Reservations = () => {
    const dispatch = useDispatch();
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteID, setDeleteID] = useState(null);

    const userReservations = useSelector((state) => state.user.reservations);
    const isAuthenticated = useSelector((state) => state.user.isAuthenticated);
    const userStatus = useSelector((state) => state.user.status);

    const [rating, setRating] = useState(0);
    const [note, setNote] = useState('');
    const [tempReservation, setTempReservation] = useState(null);
    const [hover, setHover] = useState(0);
    const [snackOpenSuccess, setSnackOpenSuccess] = useState(false);
    const [snackOpenError, setSnackOpenError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [bankOpen, setBankOpen] = useState(false);

    // 👈 متغير حالة جديد للتحكم في نافذة عرض التفاصيل
    const [viewDetails, setViewDetails] = useState({
        open: false,
        reservationData: null
    });

    useEffect(() => {
        if (isAuthenticated) {
            dispatch(fetchUserReservations());
        }
    }, [dispatch, isAuthenticated]);

    const handleDeleteClose = () => setDeleteOpen(false);
    const handleBankClose = () => setBankOpen(false);

    // 👈 دالة لفتح نافذة التفاصيل
    const handleViewDetailsOpen = (reservation) => {
        setViewDetails({
            open: true,
            reservationData: reservation
        });
    };

    // 👈 دالة لإغلاق نافذة التفاصيل
    const handleViewDetailsClose = () => {
        setViewDetails({
            open: false,
            reservationData: null
        });
    };

    const canCancelReservation = (reservation) => {
        if (reservation.status === 'canceled' || reservation.status === 'completed' || reservation.cancelRequest) {
            return false;
        }
        const { period } = reservation;
        if (!period || !period.startDate || !period.checkIn || !period.checkIn.time) {
            return true;
        }
        const now = new Date();
        const startDate = parseISO(period.startDate);
        let reservationStartDateTime = new Date(startDate);
        const [hours, minutes] = period.checkIn.time.split(':').map(Number);
        reservationStartDateTime = addHours(reservationStartDateTime, hours);
        reservationStartDateTime = addMinutes(reservationStartDateTime, minutes);
        const diffInMilliseconds = reservationStartDateTime.getTime() - now.getTime();
        const diffInHours = diffInMilliseconds / (1000 * 60 * 60);
        return diffInHours > CANCELLATION_CUTOFF_HOURS;
    };

    async function handleSubmitRating(e) {
        e.preventDefault();
        if (!rating || rating === 0) {
            setErrorMessage(t('user.mustRate'));
            setSnackOpenError(true);
            return;
        }
        if (!tempReservation) return;

        try {
            const response = await Api.post('/user/reservation/rate', {
                reservationId: tempReservation._id,
                entity: { id: tempReservation.entity.id, type: tempReservation.type },
                rate: rating,
                note: note,
            });

            setErrorMessage(response.data.message || t('user.thanksForRating'));
            setSnackOpenSuccess(true);
            setRating(0);
            setNote('');
            setTempReservation(null);
            dispatch(fetchUserReservations());
        } catch (error) {
            setErrorMessage(error.response?.data?.message || t('common.ratingGenericError'));
            setSnackOpenError(true);
        }
    }

    const openDeleteDialog = (reservationId) => {
        setDeleteID(reservationId);
        setDeleteOpen(true);
    };

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
    
    if (!isAuthenticated) {
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
                                                {/* 👈 زر عرض التفاصيل الجديد */}
                                                <MuiButton
                                                    variant="contained"
                                                    onClick={() => handleViewDetailsOpen(ele)}
                                                    className="view-details-btn submit-btn primary-btn"
                                                >
                                                    {t('common.viewDetails')}
                                                </MuiButton>

                                                {!ele.completed && ele.status !== 'canceled' && !ele.cancelRequest && (
                                                    <MuiButton
                                                        variant="contained"
                                                        onClick={() => setBankOpen(true)}
                                                        className="bank-info-btn submit-btn secondary-btn"
                                                    >
                                                        {t('user.bankInfo')}
                                                    </MuiButton>
                                                )}
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
            
            {/* 👈 المكون الجديد الذي يستقبل بيانات الحجز للطباعة */}
            <ReservationDetailsModal
                open={viewDetails.open}
                handleClose={handleViewDetailsClose}
                reservation={viewDetails.reservationData}
            />

            <Snackbar open={snackOpenSuccess} autoHideDuration={6000} onClose={() => setSnackOpenSuccess(false)}>
                <Alert onClose={() => setSnackOpenSuccess(false)} severity="success" className="snackbar-alert">
                    {errorMessage || t('common.successOperation')}
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