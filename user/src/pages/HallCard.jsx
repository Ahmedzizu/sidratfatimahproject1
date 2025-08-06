import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, Link } from "react-router-dom";
import { Button as MuiButton } from "@mui/material";
import { Container } from "react-bootstrap";
import { Box, Typography, Grid } from "@mui/material";
import { useTranslation } from "react-i18next";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import StarIcon from "@mui/icons-material/Star";
import DashboardIcon from "@mui/icons-material/Dashboard"; // أيقونة المساحة (أو السعة للقاعات)
import LocationOnIcon from "@mui/icons-material/LocationOn"; // أيقونة الموقع
import BuildCircleIcon from "@mui/icons-material/BuildCircle"; // أيقونة الصيانة
import EventSeatIcon from '@mui/icons-material/EventSeat'; // لأيقونة السعة (مقاعد)
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom'; // لأيقونة الغرف
import HomeWorkIcon from '@mui/icons-material/HomeWork'; // لأيقونة عدد القاعات

import "../scss/chaletCard.scss"; // ملف SCSS الخاص بالصفحة (يجب أن يكون ملفاً مشتركاً أو خاصاً)
import ImageCarousel from "../components/ImageCarousel.jsx";
import ReservationHall from "../components/ReservationHall.jsx";
import Loading from "../components/Loading";
import { fetchHalls } from "../redux/reducers/hall.js";

const HallCard = () => {
    const dispatch = useDispatch();
    const { id } = useParams();
    const { t, i18n } = useTranslation();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const halls = useSelector((state) => state.hall.data);

    const imagesKey = process.env.REACT_APP_UPLOAD_URL || "http://localhost:5000/uploads/";

    // جلب القاعات عند تحميل المكون
    useEffect(() => {
        dispatch(fetchHalls());
    }, [dispatch]);

    // البحث عن القاعة المحددة بعد تحميل القاعات
    useEffect(() => {
        if (halls && halls.length > 0) {
            const hallData = halls.find((ele) => String(ele._id) === String(id));
            if (hallData) {
                setData(hallData);
                setLoading(false);
                console.log("📌 القاعة المحددة بعد تحميل البيانات:", hallData);
            } else {
                console.warn("⚠️ القاعة غير موجودة!");
                setLoading(false);
            }
        } else if (halls && halls.length === 0) {
            setLoading(false);
            console.warn("⚠️ لا توجد قاعات متاحة في Redux.");
        }
    }, [halls, id]);

    // حساب متوسط التقييم
    function calcRate() {
        if (!Array.isArray(data?.rate) || data.rate.length === 0) return "N/A";
        const total = data.rate.reduce((prev, curr) => prev + curr, 0);
        return (total / data.rate.length).toFixed(1);
    }

    if (loading) {
        return <Loading open={true} />;
    }

    if (!data) {
        return (
            <Box className="chalet-card-page-container no-data" dir={i18n.language === 'en' ? 'ltr' : 'rtl'}>
                <Typography variant="h5" className="no-chalet-message">
                    {t('cards.hallNotFound')}
                </Typography>
                <MuiButton component={Link} to="/home/halls" className="back-to-chalets-btn">
                    {t('common.backToHalls')}
                </MuiButton>
            </Box>
        );
    }

    return (
        <Box className="chalet-card-page-container" dir={i18n.language === 'en' ? 'ltr' : 'rtl'}>
            <Container className="chalet-details-wrapper">
                {/* Header Section: Name and Back Button */}
                <Box className="chalet-header-section">
                    <Typography component="h1" className="chalet-name-title">
                        {data?.name || t('cards.unknownName')}
                    </Typography>
                    <Link to="/home/halls" className="back-link" aria-label={t('common.backToHalls')}>
                        {t('common.backToHalls')} <ArrowBackIcon className="back-icon" />
                    </Link>
                </Box>

                {/* Carousel / Image Gallery */}
                <ImageCarousel images={data?.images} imagesKey={imagesKey} />

                {/* Video Section */}
                {data?.videos && data.videos.length > 0 && (
                    <Box className="chalet-video-section">
                        {data.videos[0] ? (
                            <video controls className="chalet-video">
                                <source src={`${imagesKey}${data.videos[0]}`} type="video/mp4" />
                                {t("details.videoNotSupported")}
                            </video>
                        ) : (
                            <Typography className="no-video-message">
                                {t("details.noVideoSelected")}
                            </Typography>
                        )}
                    </Box>
                )}

                {/* Main Details Section */}
                <Box className="chalet-main-details-section">
                    <Grid container spacing={4}>
                        {/* Left Column: Description and Features */}
                        <Grid item xs={12} md={7}>
                            <Box className="details-description-box">
                                <Typography component="h3" className="details-title">{t("details.description")}</Typography>
                                <Typography component="p" className="details-text">{data?.description || t("common.noDescription")}</Typography>

                                <Typography component="h3" className="details-title">{t("details.hallSubtitle")}</Typography>
                                <ul className="details-features-list">
                                    {data?.capacity && (<li><EventSeatIcon className="feature-icon" /> {t("details.hallCapacity")}: {data.capacity} {t("cards.person")}</li>)}
                                    {data?.rooms && (<li><MeetingRoomIcon className="feature-icon" /> {t("details.rooms")}: {data.rooms}</li>)}
                                    {data?.halls && (<li><HomeWorkIcon className="feature-icon" /> {t("details.halls")}: {data.halls}</li>)}
                                </ul>

                                {data?.details && data.details.length > 0 && (
                                    <>
                                        <Typography component="h3" className="details-title">{t("details.hallDetails")}</Typography>
                                        <ul className="details-features-list">
                                            {Array.isArray(data.details) ? data.details.map((detail, index) => (
                                                <li key={index} className="feature-item-extra">{detail}</li>
                                            )) : <li className="feature-item-extra">{data.details}</li>}
                                        </ul>
                                    </>
                                )}
                            </Box>
                        </Grid>

                        {/* Right Column: Key Info (Rate, Location, Area) */}
                        {/* <Grid item xs={12} md={5}>
                            <Box className="details-key-info-box">
                                <div className="info-item">
                                    <LocationOnIcon className="info-icon" />
                                </div>
                                <div className="info-item">
                                    <DashboardIcon className="info-icon" />
                                </div>
                                <div className="info-item">
                                    <StarIcon className="info-icon" />
                                    <Typography variant="body1" className="info-label">{t("cards.rate")}</Typography>
                                    <Typography variant="body1" className="info-value">
                                        {calcRate()} / 5 ({data?.rate?.length || 0} {t("cards.reviews")})
                                    </Typography>
                                </div>
                                {data?.maintenance && (
                                    <div className="info-item maintenance-info">
                                        <BuildCircleIcon className="info-icon" />
                                        <Typography variant="body1" className="info-label">{t("cards.maintenance")}</Typography>
                                        <Typography variant="body1" className="info-value maintenance-status">
                                            {t("cards.underMaintenance")}
                                        </Typography>
                                    </div>
                                )}
                            </Box>
                        </Grid> */}
                    </Grid>
                </Box>
            </Container>

            {/* Reservation Form Section */}
            <ReservationHall data={data} />
        </Box>
    );
};

export default HallCard;