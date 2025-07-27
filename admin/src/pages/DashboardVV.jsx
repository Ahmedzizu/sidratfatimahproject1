import React, { useEffect, useState } from 'react'
import { Button, Grid, Link } from '@mui/material';
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import "../scss/dashboard.scss"
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchReservations } from '../redux/reducers/reservation';
import { useTranslation } from 'react-i18next';
import AddReservation from '../modals/AddReservation';
import axios from 'axios';
import { format } from 'date-fns';
// import the calendarcomponent

const DashboardVV = () => {
  const { t, i18n } = useTranslation();
  const unConfirmedData = useSelector((state) => state.reservation.value.unConfirmed)
  const confirmedData = useSelector((state) => state.reservation.value.confirmed)
  const deferredData = useSelector((state) => state.reservation.value.deferred)
  const canceled = useSelector((state) => state.reservation.value.canceled)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState({ open: false, date: {} })
  const dispatch = useDispatch()
  const navigate = useNavigate()


  const events = confirmedData.flatMap((ele) => {
    const startDate = new Date(ele.period.startDate);
    const endDate = new Date(ele.period.endDate);

    const formatDate = (date) => date.toISOString().split('T')[0];

    const repeatedEvents = [];
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      repeatedEvents.push({
        title: `${ele.period.type == "days" ? 'كامل اليوم' : ele.period?.dayPeriod || "كامل اليوم"} - ${ele?.client?.name}`,
        date: formatDate(currentDate),
        _id: ele._id,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return repeatedEvents;
  });



  const handleClose = () => { setModal({ open: false }) }


  let filteredDate = events
  if (search) filteredDate = filteredDate.filter((ele) => ele.title.includes(search))

  useEffect(() => { dispatch(fetchReservations()) }, [])

  const handleEventClick = (info) => {
    const id = info.event.extendedProps._id;
    navigate("/reservationDetails/" + id)
  };
  const user = useSelector((state) => state.employee.value.user)

  return (
    <>

      <div className="container" style={{ direction: i18n.language == 'en' ? "ltr" : "rtl" }}>
        <h2 >{t("dashboard.title")}</h2>
        <Grid container spacing={2}>
          <Grid item sm={6} md={3} xs={12} >
            <div className="box" style={{ backgroundColor: "#DDBE1D" }} onClick={() => navigate('/HallsReservations')}>
              <p>{unConfirmedData.length}</p>
              <p>{t("dashboard.HallsReservations")}</p>
            </div>
          </Grid>
          <Grid item sm={6} md={3} xs={12}>
            <div className="box" style={{ backgroundColor: "#006C35" }} onClick={() => navigate('/chaletReservarions')}>
              <p>{confirmedData.length}</p>
              <p>{t("dashboard.confirmed")}</p>
            </div>
          </Grid>
          <Grid item sm={6} md={3} xs={12}>
            <div className="box" style={{ backgroundColor: "#2BAEB7" }} onClick={() => navigate('/newReservations')}>
              <p>{deferredData.length}</p>
              <p>{t("dashboard.deferred")}</p>
            </div>
          </Grid>
          <Grid item sm={6} md={3} xs={12}>
            <div className="box" style={{ backgroundColor: "#C92626" }} onClick={() => navigate('/canceledReservations')}>
              <p>{canceled.length}</p>
              <p>{t("dashboard.canceled")}</p>
            </div>
          </Grid>
        </Grid>
        
      </div>
      <AddReservation open={modal.open} handleClose={handleClose} />
    </>
  )
}

export default DashboardVV