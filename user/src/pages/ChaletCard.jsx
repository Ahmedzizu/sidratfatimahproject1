import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, Link } from "react-router-dom";
import { Button as MuiButton } from "@mui/material";
import { Container } from "react-bootstrap";
import { Box, Typography, Grid } from "@mui/material";
import { useTranslation } from "react-i18next";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import StarIcon from "@mui/icons-material/Star";
import DashboardIcon from "@mui/icons-material/Dashboard"; // أيقونة المساحة
import LocationOnIcon from "@mui/icons-material/LocationOn"; // أيقونة الموقع
import BuildCircleIcon from "@mui/icons-material/BuildCircle"; // أيقونة الصيانة
import BedIcon from '@mui/icons-material/KingBed'; // لغرف النوم
import BathtubIcon from '@mui/icons-material/Bathtub'; // للحمامات
import LivingRoomIcon from '@mui/icons-material/Chair'; // للصالات
import RestaurantIcon from '@mui/icons-material/Restaurant'; // للمطابخ

import "../scss/chaletCard.scss"; // ملف SCSS الخاص بالصفحة
import ImageCarousel from "../components/ImageCarousel.jsx";
import ReservationChalet from "../components/ReservationChalet.jsx";
import Loading from "../components/Loading";
import { fetchChalets } from "../redux/reducers/chalet.js";

const ChaletCard = () => {
    const dispatch = useDispatch();
    const { id } = useParams();
    const { t, i18n } = useTranslation();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const chalets = useSelector((state) => state.chalet.data);

    const imagesKey = process.env.REACT_APP_UPLOAD_URL || "http://localhost:5000/uploads/";

    // جلب الشاليهات عند تحميل المكون
    useEffect(() => {
        dispatch(fetchChalets());
    }, [dispatch]);

    // البحث عن الشاليه المحدد بعد تحميل الشاليهات
    useEffect(() => {
        if (chalets && chalets.length > 0) {
            const chaletData = chalets.find((ele) => String(ele._id) === String(id));
            if (chaletData) {
                setData(chaletData);
                setLoading(false);
                console.log("📌 الشاليه المحدد بعد تحميل البيانات:", chaletData);
            } else {
                console.warn("⚠️ الشاليه غير موجود!");
                setLoading(false);
            }
        } else if (chalets && chalets.length === 0) {
            setLoading(false);
            console.warn("⚠️ لا توجد شاليهات متاحة في Redux.");
        }
    }, [chalets, id]);

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
                    {t('cards.chaletNotFound')}
                </Typography>
                <MuiButton component={Link} to="/home/chalets" className="back-to-chalets-btn">
                    {t('common.backToChalets')}
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
                    <Link to="/home/chalets" className="back-link" aria-label={t('common.backToChalets')}>
                        {t('common.backToChalets')} <ArrowBackIcon className="back-icon" />
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

                                <Typography component="h3" className="details-title">{t("details.chaletSubtitle")}</Typography>
                                <ul className="details-features-list">
                                    {data?.sleeping && (<li><BedIcon className="feature-icon" /> {t("details.bed")}: {data.sleeping}</li>)}
                                    {data?.lounge && (<li><LivingRoomIcon className="feature-icon" /> {t("details.lounge")}: {data.lounge}</li>)}
                                    {data?.kitchen && (<li><RestaurantIcon className="feature-icon" /> {t("details.kitchen")}: {data.kitchen}</li>)}
                                    {data?.bath && (<li><BathtubIcon className="feature-icon" /> {t("details.bath")}: {data.bath}</li>)}
                                </ul>

                                {data?.details && data.details.length > 0 && (
                                    <>
                                        <Typography component="h3" className="details-title">{t("details.chaletDetails")}</Typography>
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
                        <Grid item xs={12} md={5}>
                            <Box className="details-key-info-box">
                                <div className="info-item">
                                    <LocationOnIcon className="info-icon" />
                                    <Typography variant="body1" className="info-label">{t("cards.address")}</Typography>
                                    <Typography variant="body1" className="info-value">{data?.address || t("cards.unknownLocation")}</Typography>
                                </div>
                                <div className="info-item">
                                    <DashboardIcon className="info-icon" />
                                    <Typography variant="body1" className="info-label">{t("cards.area")}</Typography>
                                    <Typography variant="body1" className="info-value">{data?.area || "N/A"} {t("cards.areaUnit")}</Typography>
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
                        </Grid>
                    </Grid>
                </Box>
            </Container>

            {/* Reservation Form Section */}
            <ReservationChalet data={data} />
        </Box>
    );
};

export default ChaletCard;