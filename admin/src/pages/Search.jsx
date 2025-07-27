// F:\ractprojects\New folder (2)\ggg\admin\1818admi\New folder18\src\pages\BookingPage.jsx

import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Grid, Button, ToggleButton, ToggleButtonGroup, TextField } from "@mui/material";
import { fetchReservations } from "../redux/reducers/reservation";
import { fetchChalets } from "../redux/reducers/chalet";
import { fetchHall } from "../redux/reducers/hall";
import { useNavigate, useLocation } from "react-router-dom";

import "../scss/search.scss"; // تأكد من وجود ملف الـ SCSS هذا

const Search = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const dateParam = queryParams.get("date");

  // حالة البحث بالتاريخ (القيمة الافتراضية هي تاريخ اليوم أو التاريخ من الـ URL)
  const [search, setSearch] = useState(dateParam || new Date().toISOString().split("T")[0]);

  // حالة لمدخل البحث النصي (اسم الكيان)
  const [nameSearch, setNameSearch] = useState('');
  // حالة الفلتر حسب النوع (all, chalet, hall, )
  const [filterType, setFilterType] = useState('all');

  // جلب البيانات عند تحميل المكون أو تغيير الـ dispatch
  useEffect(() => {
    dispatch(fetchReservations());
    dispatch(fetchChalets());
    dispatch(fetchHall());
  }, [dispatch]);

  // تحديث حقل التاريخ إذا تم تغييره عبر الـ URL
  useEffect(() => {
    if (dateParam) {
      setSearch(dateParam);
    }
  }, [dateParam]);

  const { t, i18n } = useTranslation(); // للترجمة

  // جلب بيانات الحجوزات والكيانات من Redux Store
  let confirmedReservations = useSelector((state) => state.reservation.value.confirmed);
  let unConfirmedReservations = useSelector((state) => state.reservation.value.unConfirmed);
  let reservations = [...confirmedReservations, ...unConfirmedReservations]; // جميع الحجوزات (مؤكدة وغير مؤكدة)

  let halls = useSelector((state) => state.hall.value.data);
  let chalets = useSelector((state) => state.chalet.value.data);

  // منطق عرض الكيانات المفلترة (حسب النوع والاسم)
  let allEntities = [...chalets, ...halls];

  // الخطوة الأولى: الفلترة حسب النوع
  let typeFilteredEntities = [];
  if (filterType === 'chalet') {
    typeFilteredEntities = chalets;
  } else if (filterType === 'hall') {
    typeFilteredEntities = halls;
  } else { // 'all' أو أي قيمة أخرى غير محددة
    typeFilteredEntities = allEntities;
  }

  // الخطوة الثانية: الفلترة حسب الاسم (على الكيانات المفلترة حسب النوع)
  const displayedEntities = typeFilteredEntities.filter(entity =>
    entity?.name.toLowerCase().includes(nameSearch.toLowerCase())
  );

  /**
   * دالة مساعدة لتحديد مدى توافر الكيان (صباحي ومسائي) في تاريخ البحث المحدد.
   * @param {string} id - معرف الكيان (القاعة/الشاليه/المنتجع).
   * @returns {{isMorningValid: boolean, isNightValid: boolean}} - حالة التوافر لكل فترة.
   */
  function validPeriod(id) {
    let isMorningValid = true;
    let isNightValid = true;
    let entityReservations = reservations.filter((ele) => ele?.entity?.id === id);
    let searchDateMillis = new Date(search).setUTCHours(0, 0, 0, 0);

    if (isNaN(searchDateMillis)) return { isMorningValid, isNightValid };

    entityReservations.forEach((ele) => {
      let resStartDateMillis = new Date(ele?.period?.startDate).setUTCHours(0, 0, 0, 0);
      let resEndDateMillis = new Date(ele?.period?.endDate).setUTCHours(0, 0, 0, 0);

      if (resStartDateMillis <= searchDateMillis && resEndDateMillis >= searchDateMillis) {
        const isSingleDayBooking = resStartDateMillis === resEndDateMillis;
        const isStartDay = searchDateMillis === resStartDateMillis;
        const isEndDay = searchDateMillis === resEndDateMillis;

        if (isSingleDayBooking) {
          if (ele?.period?.dayPeriod === "صباحية" || ele?.period?.dayPeriod === "كامل اليوم") {
            isMorningValid = false;
          }
          if (ele?.period?.dayPeriod === "مسائية" || ele?.period?.dayPeriod === "كامل اليوم") {
            isNightValid = false;
          }
        } else {
          if (isStartDay) {
            if (ele?.period?.checkIn?.name === "صباحية") {
              isMorningValid = false;
              isNightValid = false;
            } else if (ele?.period?.checkIn?.name === "مسائية") {
              isNightValid = false;
            }
          } else if (isEndDay) {
            if (ele?.period?.checkOut?.name === "مسائية") {
              isMorningValid = false;
              isNightValid = false;
            } else if (ele?.period?.checkOut?.name === "صباحية") {
              isMorningValid = false;
            }
          } else {
            isMorningValid = false;
            isNightValid = false;
          }
        }
      }
    });
    return { isMorningValid, isNightValid };
  }

  /**
   * دالة لجلب مسار صفحة تفاصيل الحجز ليوم البحث (صباحي، مسائي، أو كامل اليوم).
   * @param {string} id - معرف الكيان.
   * @returns {{morningDetailPath: string|null, eveningDetailPath: string|null, fullDayDetailPath: string|null}}
   * مفاتيح تمثل مسار كل فترة بشكل مستقل.
   */
  function getReservationRoute(id) {
    let entityReservations = reservations.filter((ele) => ele?.entity?.id === id);
    let searchDateMillis = new Date(search).setUTCHours(0, 0, 0, 0);

    let morningDetailPath = null;
    let eveningDetailPath = null;
    let fullDayDetailPath = null;

    entityReservations.forEach((ele) => {
      let resStartDateMillis = new Date(ele?.period?.startDate).setUTCHours(0, 0, 0, 0);
      let resEndDateMillis = new Date(ele?.period?.endDate).setUTCHours(0, 0, 0, 0);

      const isSingleDayBooking = resStartDateMillis === resEndDateMillis;
      const isBookingSpansSearchDay = resStartDateMillis <= searchDateMillis && resEndDateMillis >= searchDateMillis;
      const isStartDay = searchDateMillis === resStartDateMillis;
      const isEndDay = searchDateMillis === resEndDateMillis;

      if (isBookingSpansSearchDay) {
        const currentDetailPath = ele.status === "confirmed"
          ? `/reservationDetails/${ele._id}`
          : `/unConfermidReservationDetails/${ele._id}`;

        let isCurrentBookingCoversFullDay = false;

        if (isSingleDayBooking && ele?.period?.dayPeriod === "كامل اليوم") {
          isCurrentBookingCoversFullDay = true;
        } else if (!isSingleDayBooking && !isStartDay && !isEndDay) { // في منتصف حجز متعدد الأيام
          isCurrentBookingCoversFullDay = true;
        } else if (isStartDay && ele?.period?.checkIn?.name === "صباحية" && !isSingleDayBooking) { // بدء متعدد الأيام صباحي
          isCurrentBookingCoversFullDay = true;
        } else if (isEndDay && ele?.period?.checkOut?.name === "مسائية" && !isSingleDayBooking) { // انتهاء متعدد الأيام مسائي
          isCurrentBookingCoversFullDay = true;
        }

        if (isCurrentBookingCoversFullDay) {
          fullDayDetailPath = currentDetailPath;
          morningDetailPath = currentDetailPath; 
          eveningDetailPath = currentDetailPath; 
        } 
        
        if (fullDayDetailPath !== currentDetailPath) { 
          if (isSingleDayBooking) { 
              if (ele?.period?.dayPeriod === "صباحية" && !morningDetailPath) {
                  morningDetailPath = currentDetailPath;
              } else if (ele?.period?.dayPeriod === "مسائية" && !eveningDetailPath) {
                  eveningDetailPath = currentDetailPath;
              }
          } else { 
              if (isStartDay && ele?.period?.checkIn?.name === "مسائية" && !eveningDetailPath) {
                  eveningDetailPath = currentDetailPath;
              } else if (isEndDay && ele?.period?.checkOut?.name === "صباحية" && !morningDetailPath) {
                  morningDetailPath = currentDetailPath;
              }
          }
        }
      }
    });

    return { morningDetailPath, eveningDetailPath, fullDayDetailPath };
  }

  // هذه الدالة لتحديد لون خلفية البطاقة بناءً على حالة التوافر
  function getBackgroundColor(isMorningValid, isNightValid) {
    return "#343A40"; // لون افتراضي (رمادي غامق) إذا لم تنطبق أي من الحالات
  }

  /**
   * دالة للتحكم في التنقل لصفحة الحجز أو صفحة التفاصيل.
   * @param {string} id - معرف الكيان.
   * @param {string} type - نوع التنقل ('book' للحجز، 'details' للتفاصيل).
   * @param {string} entityName - اسم الكيان.
   * @param {object} price - كائن الأسعار (morning, night, wholeDay).
   * @param {boolean} isUnderMaintenance - هل الكيان تحت الصيانة.
   */
  function handleNavigation(id, type, entityName, price, isUnderMaintenance) {
    if (isUnderMaintenance) {
      alert(t("under_maintenance_alert"));
      return;
    }

    let { isMorningValid, isNightValid } = validPeriod(id);

    if (type === "book") {
      const availablePeriods = {
        morning: isMorningValid,
        evening: isNightValid,
        fullDay: isMorningValid && isNightValid,
      };

      navigate(
        `/booking?entityId=${id}&name=${encodeURIComponent(entityName)}&date=${encodeURIComponent(search)}&availablePeriods=${JSON.stringify(availablePeriods)}&price=${JSON.stringify(price)}`
      );
    } else { // type === "details"
      let { morningDetailPath, eveningDetailPath, fullDayDetailPath } = getReservationRoute(id);
      
      if (fullDayDetailPath) {
          navigate(fullDayDetailPath);
      } else if (morningDetailPath && eveningDetailPath && morningDetailPath !== eveningDetailPath) {
          alert(t("multiple_bookings_today")); 
      } else if (morningDetailPath) {
          navigate(morningDetailPath);
      } else if (eveningDetailPath) {
          navigate(eveningDetailPath);
      } else {
          alert(t("no_specific_booking_found_for_details"));
      }
    }
  }

  const dateInputRef = useRef(null);

  const openDatePicker = () => {
    if (dateInputRef.current) {
      dateInputRef.current.showPicker();
    }
  };

  return (
    <div className="container" style={{ direction: i18n.language === "en" ? "ltr" : "rtl" }}>
      <h2>{t("quick_search")}</h2>
      <div className="date-picker-container">
        <input
          type="date"
          ref={dateInputRef}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="custom-date-picker"
        />
        <button className="select-button" onClick={openDatePicker}>{t("choose")}</button>
      </div>

      {/* --- قسم الفلاتر الجديد --- */}
      <div className="filter-container">
        {/* حقل البحث بالاسم */}
        <TextField
          label={t("search_by_name")}
          variant="outlined"
          value={nameSearch}
          onChange={(e) => setNameSearch(e.target.value)}
          className="name-search-input"
          sx={{ minWidth: 200 }}
        />

        <ToggleButtonGroup
          value={filterType}
          exclusive
          onChange={(event, newFilterType) => {
            if (newFilterType !== null) {
              setFilterType(newFilterType);
            }
          }}
          aria-label="filter type"
          className="filter-toggle-buttons"
        >
          <ToggleButton value="all" aria-label="all">
            {t("all_types")}
          </ToggleButton>
          <ToggleButton value="chalet" aria-label="chalets">
            {t("chalets")}
          </ToggleButton>
          <ToggleButton value="hall" aria-label="halls">
            {t("halls")}
          </ToggleButton>
        </ToggleButtonGroup>
      </div>
      {/* ---------------------------------- */}

      <Grid container spacing={3} margin="50px auto">
        {displayedEntities.map((ele, ind) => {
          let { isMorningValid, isNightValid } = validPeriod(ele._id);
          let isAvailableForBooking = isMorningValid || isNightValid;

          const { morningDetailPath, eveningDetailPath, fullDayDetailPath } = getReservationRoute(ele._id);
          
          // ✅✅✅ تم تعريف isFullyBooked هنا:
          const isFullyBooked = !isMorningValid && !isNightValid; 

          return (
            <Grid item xs={12} md={6} lg={3} key={ind}>
              <div className="card-box" style={{ backgroundColor: getBackgroundColor(isMorningValid, isNightValid) }}>
                <h2 className="card-title">{ele?.name}</h2>
                <hr />
                <p
                  className="card-text"
                  style={{ color: isMorningValid ? "green" : "red", fontWeight: "bold" }}
                >
                  <span className={`status-circle ${isMorningValid ? "available" : "unavailable"}`}></span>
                  {t("morning_period")}: {isMorningValid ? t("available") : t("booked")}
                </p>

                <p
                  className="card-text"
                  style={{ color: isNightValid ? "green" : "red", fontWeight: "bold" }}
                >
                  <span className={`status-circle ${isNightValid ? "available" : "unavailable"}`}></span>
                  {t("evening_period")}: {isNightValid ? t("available") : t("booked")}
                </p>

                {/* ------------------------------------------------------------- */}
                {/* قسم أزرار عرض التفاصيل الخاصة بالحجوزات (معالجة الأزرار المكررة) */}
                <div className="buttons-container">
                    {/* زر تفاصيل اليوم الكامل: يظهر إذا كان هناك حجز يغطي اليوم بأكمله */}
                    {fullDayDetailPath && (
                        <Button
                            className="details-button"
                            variant="contained"
                            color="secondary"
                            onClick={() => navigate(fullDayDetailPath)}
                        >
                            {t("view_full_day_booking_details")}
                        </Button>
                    )}

                    {/* أزرار تفاصيل الفترات الجزئية: تظهر فقط إذا لم يكن هناك حجز كامل لليوم الحالي (تفادياً للتكرار) */}
                    {!fullDayDetailPath && (
                        <>
                            {morningDetailPath && (
                                <Button
                                    className="details-button"
                                    variant="contained"
                                    color="secondary"
                                    onClick={() => navigate(morningDetailPath)}
                                >
                                    {t("view_morning_booking_details")}
                                </Button>
                            )}
                            {eveningDetailPath && (
                                <Button
                                    className="details-button"
                                    variant="contained"
                                    color="secondary"
                                    onClick={() => navigate(eveningDetailPath)}
                                >
                                    {t("view_evening_booking_details")}
                                </Button>
                            )}
                        </>
                    )}
                </div>
                {/* ------------------------------------------------------------- */}


                {/* أزرار الحجز وحالة الصيانة */}
                <div className="buttons-container">
                  {/* زر الحجز: يظهر فقط إذا لم يكن الكيان تحت الصيانة ومتاح جزئياً أو كلياً للحجز الجديد */}
                  {!ele.maintenance && isAvailableForBooking && (
                    <Button
                      className="book-button"
                      variant="contained"
                      color="primary"
                      onClick={() => handleNavigation(ele._id, "book", ele.name, ele.price, ele.maintenance)}
                    >
                      {t("book")}
                    </Button>
                  )}

                  {/* زر "تحت الصيانة" */}
                  {ele.maintenance && (
                    <Button
                      className="book-button"
                      variant="contained"
                      color="gray"
                      disabled
                    >
                      {t("under_maintenance")}
                    </Button>
                  )}

                  {/* زر "عرض التفاصيل" العام: يظهر كزر احتياطي فقط لو كان الكيان محجوزاً بالكامل 
                      ولم يتم عرض زر تفاصيل يوم كامل (fullDayDetailPath)
                      هذا يمنع التكرار ويضمن أن زر "عرض التفاصيل" العام يظهر فقط عندما لا يكون هناك زر تفاصيل محدد.
                  */}
                  {isFullyBooked && !fullDayDetailPath && (
                    <Button
                      className="details-button"
                      variant="contained"
                      color="secondary"
                      onClick={() => handleNavigation(ele._id, "details", ele?.name, ele?.price)}
                    >
                      {t("view_details")}
                    </Button>
                  )}
                </div>
              </div>
            </Grid>
          );
        })}
      </Grid>
    </div>
  );
};

export default Search;