import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import "../scss/search.scss";
import { Grid, Button } from "@mui/material";
import { fetchReservations } from "../redux/reducers/reservation";
import { fetchChalets } from "../redux/reducers/chalet";
import { fetchHall } from "../redux/reducers/hall";
import { fetchResort } from "../redux/reducers/resort";
import { useNavigate } from "react-router-dom";
import { useRef } from "react";
import { useLocation } from "react-router-dom";

const Search = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const dateParam = queryParams.get("date");
  const [search, setSearch] = useState(dateParam || new Date().toISOString().split("T")[0]);
  useEffect(() => {
    if (dateParam) {
      setSearch(dateParam);
    }
  }, [dateParam]);  

  useEffect(() => {
    dispatch(fetchReservations());
    dispatch(fetchChalets());
    dispatch(fetchHall());
    dispatch(fetchResort());
  }, [dispatch]);

  const { t, i18n } = useTranslation();

    let chaletReservations = useSelector((state) => state.reservation.value.confirmed);
  let hallReservations = useSelector((state) => state.reservation.value.unConfirmed);
  let reservations = [...chaletReservations, ...hallReservations];
  let halls = useSelector((state) => state.hall.value.data);
  let resorts = useSelector((state) => state.resort.value.data);
  let chalets = useSelector((state) => state.chalet.value.data);
  let entities = [...halls, ...resorts, ...chalets];

  function validPeriod(id) {
    let isMorningValid = true;
    let isNightValid = true;
    let entityReservations = reservations.filter((ele) => ele?.entity?.id === id);
    let tempSearch = new Date(search).getTime();
    if (!tempSearch) return { isMorningValid, isNightValid };


    entityReservations.forEach((ele) => {
      let tempStart = new Date(ele?.period?.startDate).getTime();
      let tempEnd = new Date(ele?.period?.endDate).getTime();
      
      if (ele?.period?.type === "days") {
        if (tempStart <= tempSearch && tempEnd >= tempSearch) {
          isMorningValid = false;
          isNightValid = false;
        }
      } else if (ele?.period?.type === "dayPeriod") {
        if (tempStart === tempSearch && (ele?.period?.dayPeriod === "صباحية" || ele?.period?.dayPeriod === "كامل اليوم")) {
          isMorningValid = false;
        }
        if (tempStart === tempSearch && (ele?.period?.dayPeriod === "مسائية" || ele?.period?.dayPeriod === "كامل اليوم")) {
          isNightValid = false;
        }
      }
    });
    
    console.log(`📌 المتاح للكيان ${id}: صباحي=${isMorningValid} - مسائي=${isNightValid}`);
    return { isMorningValid, isNightValid };
  }

  function getReservationRoute(id) {
    let entityReservations = reservations.filter((ele) => ele?.entity?.id === id);
    let tempSearch = new Date(search).setHours(0, 0, 0, 0);
  
    let morningReservation = null;
    let eveningReservation = null;
  
    entityReservations.forEach((ele) => {
      let tempStart = new Date(ele?.period?.startDate).setHours(0, 0, 0, 0);
      let tempEnd = new Date(ele?.period?.endDate).setHours(0, 0, 0, 0);
  
      if (tempStart <= tempSearch && tempEnd >= tempSearch) {
        if (ele?.period?.dayPeriod === "صباحية") {
          morningReservation = ele.status === "confirmed"
            ? `/reservationDetails/${ele._id}`
            : `/unConfermidReservationDetails/${ele._id}`;
        } else if (ele?.period?.dayPeriod === "مسائية") {
          eveningReservation = ele.status === "confirmed"
            ? `/reservationDetails/${ele._id}`
            : `/unConfermidReservationDetails/${ele._id}`;
        }
      }
    });
  
    return { morningReservation, eveningReservation };
  }
  
  

  function getBackgroundColor(morning, night) {
    if (!morning && !night) return "#383f49"; // 🔵 أزرق للمحجوز بالكامل
    if (morning && night) return "#383f49"; // 🟢 أخضر للمتاح بالكامل
    if (morning && !night) return "#383f49"; // 🟡 ذهبي للمتاح صباحًا فقط
    if (!morning && night) return "#383f49"; // 🟠 برتقالي للمتاح مساءً فقط
    return "#ddcf27cc"; // لون افتراضي
  }
  

  function handleNavigation(id, type, entityName, price, isUnderMaintenance) {
    if (isUnderMaintenance) {
      alert("🚧 هذه القاعة تحت الصيانة حاليًا، لا يمكن الحجز.");
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
    } else {
      let detailsRoute = getReservationRoute(id);
      if (detailsRoute) navigate(detailsRoute);
    }
  }
  
  
  
  
  
  const dateInputRef = useRef(null);

  const openDatePicker = () => {
    if (dateInputRef.current) {
      dateInputRef.current.showPicker(); // يفتح التقويم عند الضغط على زر "اختيار"
    }
  };

  return (
    <div className="container" style={{ direction: i18n.language === "en" ? "ltr" : "rtl" }}>
      <h2>البحث السريع</h2>
      <div className="date-picker-container">
  <input 
    type="date" 
    ref={dateInputRef} 
    value={search} 
    onChange={(e) => setSearch(e.target.value)} 
    className="custom-date-picker"
  />
    <button className="select-button" onClick={openDatePicker}>اختيار</button>

</div>
      <Grid container spacing={3} margin="50px auto">
        {entities.map((ele, ind) => {
          let { isMorningValid, isNightValid } = validPeriod(ele._id);
          let isAvailable = isMorningValid || isNightValid;
          let detailsRoute = getReservationRoute(ele._id);
          const { morningReservation, eveningReservation } = getReservationRoute(ele._id);

          return (
            <Grid item xs={12} md={6} lg={3} key={ind}>
<div className="card-box" style={{ backgroundColor: getBackgroundColor(isMorningValid, isNightValid) ?? "#383f49" }}>
                
                <h2 className="card-title">{ele?.name}</h2>
                <hr />
                <p 
  className="card-text" 
  style={{ color: isMorningValid ? "green" : "red", fontWeight: "bold" }}
>
  <span className={`status-circle ${isMorningValid ? "available" : "unavailable"}`}></span>
  الفترة الصباحية: {isMorningValid ? "متاح" : "محجوز"}
</p>

<p 
  className="card-text" 
  style={{ color: isNightValid ? "green" : "red", fontWeight: "bold" }}
>
  <span className={`status-circle ${isNightValid ? "available" : "unavailable"}`}></span>
  الفترة المسائية: {isNightValid ? "متاح" : "محجوز"}
</p>


{ele?.period?.dayPeriod !== "كامل اليوم" && (
  <div className="buttons-container">
    {morningReservation && (
      <Button
        className="details-button"
        variant="contained"
        color="secondary"
        onClick={() => navigate(morningReservation)}
      >
        عرض تفاصيل الحجز الصباحي
      </Button>
    )}

    {eveningReservation && (
      <Button
        className="details-button"
        variant="contained"
        color="secondary"
        onClick={() => navigate(eveningReservation)}
      >
        عرض تفاصيل الحجز المسائي
      </Button>
    )}
  </div>
)}

                {/* ✅ الأزرار بجانب بعض (Row) */}
                <div className="buttons-container">
                  {isAvailable && (
          <Button
          className="book-button"
          variant="contained"
          color={ele.maintenance ? "gray" : "primary"} // 🔹 إذا كان تحت الصيانة، يصبح رماديًا
          onClick={() => handleNavigation(ele._id, "book", ele.name, ele.price, ele.maintenance)}
        >
          {ele.maintenance ? "🚧 تحت الصيانة" : "حجز"}
        </Button>
        
         
             
                 
                  )}

{detailsRoute && ele?.period?.dayPeriod === "كامل اليوم" && (
  <Button
    className="details-button"
    variant="contained"
    color="secondary"
    onClick={() => handleNavigation(ele._id, "details", ele?.price)}
  >
    عرض التفاصيل
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
