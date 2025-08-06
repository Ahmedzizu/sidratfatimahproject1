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
} from "@mui/material";
import MuiAlert from '@mui/material/Alert'; // استخدام MuiAlert مباشرة
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchHalls } from "../redux/reducers/hall";
import { useTranslation } from "react-i18next";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import StarIcon from "@mui/icons-material/Star";
import DashboardIcon from "@mui/icons-material/Dashboard";
import BuildCircleIcon from "@mui/icons-material/BuildCircle";
import DatePicker from "react-datepicker";
import format from 'date-fns/format';
import "react-datepicker/dist/react-datepicker.css";
import "../scss/halls.scss"; // ملف الأنماط الخاص بالقاعات

// تعريف مكون Alert لـ Snackbar
const Alert = React.forwardRef(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const Halls = () => {
    const { t, i18n } = useTranslation();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const allHalls = useSelector((state) => state.hall.data);
    const searchTerm = useSelector((state) => state.chalet.searchTerm);

    const [halls, setHalls] = useState([]);
    const [filteredHalls, setFilteredHalls] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "info",
    });

    const hallsPerPage = 9;
    const totalHalls = filteredHalls.length;
    const totalPages = Math.ceil(totalHalls / hallsPerPage);
    const startIndex = (page - 1) * hallsPerPage;
    const displayedHalls = filteredHalls.slice(startIndex, startIndex + hallsPerPage);

    const imagesKey = process.env.REACT_APP_UPLOAD_URL || "http://localhost:5000/uploads/";

    useEffect(() => {
        dispatch(fetchHalls());
    }, [dispatch]);

    useEffect(() => {
        if (allHalls && Array.isArray(allHalls)) {
            filterHallsByDate(selectedDate, allHalls);
        } else if (allHalls && allHalls.length === 0) {
            setLoading(false);
        }
    }, [allHalls, selectedDate]);

    useEffect(() => {
        if (halls.length >= 0) {
            applySearchFilter(halls);
        }
    }, [searchTerm, halls]);

    const filterHallsByDate = async (date, allAvailableHalls) => {
        try {
            setLoading(true);
            const formattedDate = format(date, "yyyy-MM-dd");
            
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/admin/hall/by-date`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ date: formattedDate }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server responded with status ${response.status}: ${errorText}`);
            }
            
            const result = await response.json();
            
            if (result && Array.isArray(result)) {
                const updatedHalls = allAvailableHalls.map(hall => {
                    const foundInAvailability = result.find(item => String(item._id) === String(hall._id));
                    return {
                        ...hall,
                        availability: foundInAvailability ? foundInAvailability.availability : "متاح للفترتين"
                    };
                });
                setHalls(updatedHalls);
            } else {
                setHalls(allAvailableHalls.map(hall => ({ ...hall, availability: "غير متاح" })));
                setSnackbar({
                    open: true,
                    message: t("cards.errorFetchingAvailability"),
                    severity: "error",
                });
            }
        } catch (error) {
            console.error("❌ Error fetching halls by date:", error);
            setHalls(allAvailableHalls.map(hall => ({ ...hall, availability: "غير متاح" })));
            setSnackbar({
                open: true,
                message: t("cards.networkErrorAvailability"),
                severity: "error",
            });
        } finally {
            setLoading(false);
        }
    };

    const applySearchFilter = (hallsToFilter) => {
        if (!searchTerm || Object.keys(searchTerm).length === 0) {
            setFilteredHalls(hallsToFilter);
            return;
        }

        const filtered = hallsToFilter.filter(hall => {
            if (searchTerm.query &&
                !hall.name.toLowerCase().includes(searchTerm.query.toLowerCase()) &&
                !hall.address?.toLowerCase().includes(searchTerm.query.toLowerCase())) {
                return false;
            }
            if (searchTerm.minPrice && (hall.price?.wholeDay || 0) < searchTerm.minPrice) return false;
            if (searchTerm.maxPrice && (hall.price?.wholeDay || 0) > searchTerm.maxPrice) return false;
            if (searchTerm.capacity && (hall.capacity || 0) < searchTerm.capacity) return false;
            return true;
        });

        setFilteredHalls(filtered);
        setPage(1);
    };

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

    const handleCardClick = (hall) => {
        if (hall.availability === "غير متاح") {
            setSnackbar({
                open: true,
                message: t("cards.fullyBookedMessage"),
                severity: "warning",
            });
        } else if (hall.maintenance) {
            setSnackbar({
                open: true,
                message: t("cards.maintenanceMessage"),
                severity: "info",
            });
        }
        else {
            navigate(`/hallCard/${hall._id}`);
        }
    };

    const handleCloseSnackbar = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackbar({ ...snackbar, open: false });
    };

    return (
        <div className="halls-page-container" dir={i18n.language === 'en' ? 'ltr' : 'rtl'}>
            {/* الخلفية المتحركة والفقاعات */}
            <div className="animated-background-container">
                <div className="animated-bubble bubble-1"></div>
                <div className="animated-bubble bubble-2"></div>
                <div className="animated-bubble bubble-3"></div>
                <div className="animated-bubble bubble-4"></div>
                <div className="animated-bubble bubble-5"></div>
            </div>

            <div className="page-content-wrapper">
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
                    <Grid container spacing={4} className="halls-grid">
                        {displayedHalls.length > 0 ? (
                            displayedHalls.map((ele, ind) => {
                                const isFullyBooked = ele.availability === "غير متاح";
                                const isUnderMaintenance = ele.maintenance;
                                const cardDisabled = isFullyBooked || isUnderMaintenance;

                                return (
                                    <Grid key={ind} item xs={12} sm={6} md={4} lg={4}>
                                        <Card
                                            className={`hall-card ${cardDisabled ? 'disabled-card' : ''}`}
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
                                                    height="250"
                                                    image={`${imagesKey}${ele.images?.[0] || "/placeholder.jpg"}`}
                                                    alt={ele.name || t("cards.hall")}
                                                    className="card-image"
                                                />
                                                <CardContent className="card-content">
                                                    <Typography gutterBottom variant="h5" component="div" className="card-title">
                                                        <span className="hall-name-display">{ele.name || t("cards.unknownName")}</span>
                                                        <div className="card-rating">
                                                            {[...Array(5)].map((_, i) => (
                                                                <StarIcon key={i} className={`star-icon ${ele.rate && ele.rate.length > i ? "filled" : ""}`} />
                                                            ))}
                                                            <span className="rating-count">
                                                                ({ele.rate?.length || 0}) {t("cards.reviews")}
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
                                                        <div className="capacity-info">
                                                            {ele.capacity ? (
                                                                <>
                                                                    <span className="capacity-value">{ele.capacity}</span>
                                                                    <span className="capacity-unit"> {t("cards.person")}</span>
                                                                </>
                                                            ) : (
                                                                <span className="capacity-value">N/A</span>
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
                                {searchTerm && Object.keys(searchTerm).length > 0 ? t("search.noResults") : t("cards.noHallsAvailable")}
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

                <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
                    <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </div>
        </div>
    );
};

export default Halls;