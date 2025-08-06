import React, { useEffect, useState } from "react";
import {
    Grid,
    Pagination,
    Card,
    CardContent,
    CardMedia,
    Typography,
    CardActionArea,
    Snackbar,
    Alert as MuiAlert,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getChaletCard, fetchChalets } from "../redux/reducers/chalet";
import { fetchHalls } from "../redux/reducers/hall";
import { useTranslation } from "react-i18next";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import StarIcon from "@mui/icons-material/Star";
import DashboardIcon from "@mui/icons-material/Dashboard";
import BuildCircleIcon from "@mui/icons-material/BuildCircle";
import DatePicker from "react-datepicker";
import format from 'date-fns/format';
import "react-datepicker/dist/react-datepicker.css";
import "../scss/chalets.scss"; // استخدم هذا المسار إذا كنت تستخدم نفس ملف SCSS للشاليهات والقاعات

// تعريف مكون Alert لـ Snackbar
const Alert = React.forwardRef(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const Chalets = () => {
    const { t, i18n } = useTranslation();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const allChalets = useSelector((state) => state.chalet.data);
    const searchTerm = useSelector((state) => state.chalet.searchTerm);

    const [chalets, setChalets] = useState([]);
    const [filteredChalets, setFilteredChalets] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);

    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "info",
    });

    const chaletsPerPage = 9;
    const totalChalets = filteredChalets.length;
    const totalPages = Math.ceil(totalChalets / chaletsPerPage);
    const startIndex = (page - 1) * chaletsPerPage;
    const displayedChalets = filteredChalets.slice(startIndex, startIndex + chaletsPerPage);
    const imagesKey = process.env.REACT_APP_UPLOAD_URL || "http://localhost:5000/uploads/";

    // جلب جميع الشاليهات عند تحميل المكون
    useEffect(() => {
        dispatch(fetchChalets());
    }, [dispatch]);

    // فلترة الشاليهات حسب التاريخ كلما تغيرت allChalets أو selectedDate
    useEffect(() => {
        if (allChalets && Array.isArray(allChalets)) {
            filterChaletsByDate(selectedDate, allChalets);
        } else if (allChalets && allChalets.length === 0) {
            setLoading(false);
        }
    }, [allChalets, selectedDate]);

    // تطبيق فلتر البحث كلما تغيرت searchTerm أو chalets (الشاليهات المفلترة بالتاريخ)
    useEffect(() => {
        if (chalets.length >= 0) {
            applySearchFilter(chalets);
        }
    }, [searchTerm, chalets]);

    const filterChaletsByDate = async (date, allAvailableChalets) => {
        try {
            setLoading(true);
            const formattedDate = format(date, "yyyy-MM-dd");

            // جلب حالة توفر الشاليهات في هذا التاريخ من السيرفر
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/admin/chalet/by-date`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ date: formattedDate }),
            });

            if (!response.ok) { // التعامل مع استجابات HTTP غير الناجحة
                const errorText = await response.text();
                throw new Error(`Server responded with status ${response.status}: ${errorText}`);
            }

            const result = await response.json();

            if (result && Array.isArray(result)) {
                // دمج بيانات التوفر مع البيانات الأصلية
                const updatedChalets = allAvailableChalets.map(chalet => {
                    const foundInAvailability = result.find(item => item._id === chalet._id);
                    return {
                        ...chalet,
                        availability: foundInAvailability ? foundInAvailability.availability : "متاح للفترتين" // افتراضي
                    };
                });
                setChalets(updatedChalets);
            } else {
                setChalets(allAvailableChalets.map(chalet => ({ ...chalet, availability: "غير متاح" })));
                setSnackbar({
                    open: true,
                    message: t("cards.errorFetchingAvailability"),
                    severity: "error",
                });
            }
            setSelectedDate(date);
        } catch (error) {
            console.error("❌ Error fetching chalets by date:", error);
            setChalets(allAvailableChalets.map(chalet => ({ ...chalet, availability: "غير متاح" })));
            setSnackbar({
                open: true,
                message: t("cards.networkErrorAvailability"),
                severity: "error",
            });
        } finally {
            setLoading(false);
        }
    };

    const applySearchFilter = (chaletsToFilter) => {
        if (!searchTerm || Object.keys(searchTerm).length === 0) {
            setFilteredChalets(chaletsToFilter);
            return;
        }

        const filtered = chaletsToFilter.filter(chalet => {
            // البحث النصي العام
            if (searchTerm.query &&
                !chalet.name.toLowerCase().includes(searchTerm.query.toLowerCase()) &&
                !chalet.address?.toLowerCase().includes(searchTerm.query.toLowerCase())) {
                return false;
            }
            // فلاتر الأسعار والميزات
            if (searchTerm.minPrice && (chalet.price?.wholeDay || 0) < searchTerm.minPrice) return false;
            if (searchTerm.maxPrice && (chalet.price?.wholeDay || 0) > searchTerm.maxPrice) return false;
            if (searchTerm.area && (chalet.area || 0) < searchTerm.area) return false;
            if (searchTerm.rooms && (chalet.rooms || 0) < searchTerm.rooms) return false;
            if (searchTerm.capacity && (chalet.capacity || 0) < searchTerm.capacity) return false;
            if (searchTerm.pools && (chalet.pools || 0) < searchTerm.pools) return false;
            if (searchTerm.kitchen && (chalet.kitchen || 0) < searchTerm.kitchen) return false;
            if (searchTerm.bedrooms && (chalet.bedrooms || 0) < searchTerm.bedrooms) return false;
            if (searchTerm.bathrooms && (chalet.bathrooms || 0) < searchTerm.bathrooms) return false;
            if (searchTerm.lounges && (chalet.lounges || 0) < searchTerm.lounges) return false;
            return true;
        });

        setFilteredChalets(filtered);
        setPage(1); // العودة للصفحة الأولى عند تطبيق فلتر جديد
    };
    
    // دالة مُحسّنة لعرض حالة التوفر
    const getAvailabilityStatus = (status) => {
        switch (status) {
            case "متاح صباحية":
            case "متاح صباحًا":
                return <span className="availability-status available-morning">🟢 {t("details.morning")}</span>;
            case "متاح مسائية":
            case "متاح مساءً":
                return <span className="availability-status available-night">🟠 {t("details.Night")}</span>;
            case "متاح للفترتين":
                return (
                    <span className="availability-status available-both">
                        <span>🟢 {t("details.morning")}</span>
                        <span>🟡 {t("details.Night")}</span>
                    </span>
                );
            case "غير متاح":
                return <span className="availability-status not-available">🔴 {t("cards.notAvailable")}</span>;
            default:
                return <span className="availability-status unknown">❓ {t("cards.unknown")}</span>;
        }
    };

    const handleCardClick = (chalet) => {
        if (chalet.availability === "غير متاح") {
            setSnackbar({
                open: true,
                message: t("cards.fullyBookedMessage"),
                severity: "warning",
            });
        } else if (chalet.maintenance) { // منع الحجز إذا كان في الصيانة
            setSnackbar({
                open: true,
                message: t("cards.maintenanceMessage"),
                severity: "info",
            });
        }
        else {
            navigate(`/chaletCard/${chalet._id}`);
        }
    };

    const handleCloseSnackbar = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackbar({ ...snackbar, open: false });
    };

    return (
        <>
            <div className="chalet-page-container" dir={i18n.language === 'en' ? 'ltr' : 'rtl'}>
                {/* قسم منتقي التاريخ */}
                <div className="calendar-filter-section">
                    <DatePicker
                        selected={selectedDate}
                        onChange={(date) => setSelectedDate(date)}
                        dateFormat="yyyy-MM-dd"
                        className="date-picker-input"
                        placeholderText={t("cards.selectDate")}
                        minDate={new Date()}
                        calendarClassName={i18n.language === 'ar' ? "datepicker-rtl" : "datepicker-ltr"}
                    />
                </div>

                {loading ? (
                    <Typography variant="h6" className="loading-message">
                        ⏳ {t("common.loading")}...
                    </Typography>
                ) : (
                    <Grid container spacing={4} className="chalets-grid">
                        {displayedChalets.length > 0 ? (
                            displayedChalets.map((ele, ind) => {
                                const isFullyBooked = ele.availability === "غير متاح";
                                const isUnderMaintenance = ele.maintenance;
                                const cardDisabled = isFullyBooked || isUnderMaintenance;

                                return (
                                    <Grid key={ind} item xs={12} sm={6} md={4} lg={4}>
                                        <Card
                                            className={`chalet-card ${cardDisabled ? 'disabled-card' : ''}`}
                                            onClick={() => handleCardClick(ele)}
                                        >
                                            <CardActionArea component="div" className="card-action-area">
                                                {isUnderMaintenance && (
                                                    <div className="maintenance-badge">
                                                        <BuildCircleIcon className="badge-icon" />
                                                        <span>{t("cards.maintenance")}</span>
                                                    </div>
                                                )}
                                                {isFullyBooked && !isUnderMaintenance && (
                                                   <div className="fully-booked-overlay">
                                                        <span>{t("cards.fullyBooked")}</span>
                                                    </div>
                                                )}
                                                <CardMedia
                                                    component="img"
                                                    height="250" // تم زيادة الارتفاع
                                                    image={`${imagesKey}${ele.images?.[0] || "/placeholder.jpg"}`}
                                                    alt={ele.name || t("cards.chalet")}
                                                    className="card-image"
                                                />
                                                <CardContent className="card-content">
                                                    <Typography gutterBottom variant="h5" component="div" className="card-title">
                                                        {/* ✨ تحسين عرض الاسم والتقييمات */}
                                                        <span className="chalet-name-display">{ele.name || t("cards.unknownName")}</span>
                                                        <div className="card-rating">
                                                            {[...Array(5)].map((_, i) => (
                                                                <StarIcon key={i} className={`star-icon ${ele.rate && ele.rate.length > i ? "filled" : ""}`} />
                                                            ))}
                                                            <span className="rating-count">
                                                                ({ele.rate?.length || 0}) {t("cards.reviews")} {/* تم تغيير النص إلى "مراجعات" */}
                                                            </span>
                                                        </div>
                                                    </Typography>

                                                    <div className="availability-info">
                                                        {getAvailabilityStatus(ele.availability)}
                                                    </div>

                                                    <div className="card-details-row">
                                                        <div className="price-info">
                                                            <strong className="price-value">{t("cards.sar")} {ele?.price?.wholeDay || "N/A"}</strong>
                                                            <span className="price-unit"> / {t("cards.day")}</span>
                                                        </div>
                                                        <div className="location-info">
                                                            <LocationOnIcon className="detail-icon" />
                                                            <span>{ele.address || t("cards.unknownLocation")}</span>
                                                        </div>
                                                    </div>
                                                    <div className="card-details-row">
                                                        <div className="area-info">
                                                            <DashboardIcon className="detail-icon" />
                                                            <span>{ele.area || "N/A"} {t("cards.areaUnit")}</span> {/* استخدمت "areaUnit" بدلاً من "area" لتكون أكثر عمومية */}
                                                        </div>
                                                        <div className="capacity-info">
                                                            {/* ✨ حل مشكلة N/A فرد */}
                                                            {ele.capacity ? (
                                                                <>
                                                                    <span className="capacity-value">{ele.capacity}</span>
                                                                    <span className="capacity-unit"> {t("cards.person")}</span>
                                                                </>
                                                            ) : (
                                                                <span className="capacity-value"></span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </CardActionArea>
                                        </Card>
                                    </Grid>
                                );
                            })
                        ) : (
                            <Typography variant="h6" className="no-results-message">
                                {t("cards.noChaletsAvailable")}
                            </Typography>
                        )}
                    </Grid>
                )}

                {totalPages > 1 && (
                    <Pagination
                        count={totalPages}
                        page={page}
                        onChange={(event, value) => setPage(value)}
                        className="pagination-controls"
                        dir="ltr"
                    />
                )}
            </div>

            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
};

export default Chalets;