import React, { useEffect, useState } from 'react';
// import { Button, Grid, Tooltip } from '@mui/material';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux'; // Correct import for Redux hooks
import { fetchReservationCounts } from '../redux/reducers/ReservationCounts';
import { fetchReservations } from '../redux/reducers/reservation';
import { useTranslation } from 'react-i18next';
import AddReservation from '../modals/AddReservation';
import { Grid, Typography, CircularProgress } from '@mui/material'; 
const Dashboard = () => {
  const { t, i18n } = useTranslation();
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState({ open: false, date: {} });
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const hallsCount = useSelector((state) => state.reservationCounts?.hallsCount ?? 0);
  const chaletsCount = useSelector((state) => state.reservationCounts?.chaletsCount ?? 0);
  const unconfirmedReservationsCount = useSelector((state) => state.reservationCounts?.unconfirmedReservationsCount ?? 0);
  const unpaidClientsCount = useSelector((state) => state.reservationCounts?.unpaidClientsCount ?? 0);

  const confirmedData = useSelector((state) => state.reservation?.value?.confirmed || []);

  useEffect(() => {
    dispatch(fetchReservationCounts());
    dispatch(fetchReservations());
  }, [dispatch]);

  const handleClose = () => setModal({ open: false });

  const filteredData = confirmedData.filter((ele) =>
    ele.client?.name.toLowerCase().includes(search.toLowerCase())
  );
 const {
   
    hallsStartingToday = 0,
    hallsEndingToday = 0,
    chaletsStartingToday = 0,
    chaletsEndingToday = 0
  } = useSelector((state) => state.reservationCounts || {});

  const groupedEvents = filteredData.reduce((acc, ele) => {
    const date = ele.period?.startDate;
    if (!acc[date]) acc[date] = [];

    let eventColor = '#4CAF50'; // Default to green (Morning)
    if (ele.period?.dayPeriod === 'صباحية') eventColor = '#4CAF50'; // Green
    else if (ele.period?.dayPeriod === 'مسائية') eventColor = '#9C27B0'; // Purple
    else if (ele.period?.dayPeriod === 'كامل اليوم') eventColor = '#F44336'; // Red

    acc[date].push({
      title: `${ele.client?.name}` || 'غير معروف',
      date,
      id: ele._id,
      backgroundColor: eventColor,
      borderColor: eventColor,
      extendedProps: {
        status: ele.status,
        entity: ele.entity?.name,
        amount: ele.cost,
        dayPeriod: ele.period?.dayPeriod,
        entityType: ele.entityType
      },
    });

    return acc;
  }, {});

  const eventsForCalendar = Object.entries(groupedEvents).flatMap(([date, events]) => events);

  return (
    <div className="container" style={{ direction: i18n.language === 'en' ? 'ltr' : 'rtl' }}>
      <h2>{t('dashboard.title')}</h2>
      <Grid container spacing={2}>
        <Grid item sm={6} md={3} xs={12}>
          <div className="box box-halls" onClick={() => navigate('/HallsReservations')}>
            <div className="circle">{hallsCount}</div>
            <p>{t('dashboard.Halls')}</p>
          </div>
        </Grid>
        <Grid item sm={6} md={3} xs={12}>
          <div className="box box-chalets" onClick={() => navigate('/chaletReservarions')}>
            <div className="circle">{chaletsCount}</div>
            <p>{t('dashboard.Chalets')}</p>
          </div>
        </Grid>
        {unconfirmedReservationsCount > 0 && (
          <div className="global-alert">
            <div className="alert-circle">
              <span className="alert-icon">new</span>
            </div>
          </div>
        )}
        <Grid item sm={6} md={3} xs={12}>
          <div className="box box-resorts" onClick={() => navigate('/newReservations')}>
            <div className="circle">{unconfirmedReservationsCount}</div>
            <p>{t('dashboard.NewRez')}</p>
          </div>
        </Grid>
        <Grid item sm={6} md={3} xs={12}>
          <div className="box box-unpaid" onClick={() => navigate('/unPaidClients')}>
            <div className="circle">{unpaidClientsCount}</div>
            <p>{t('dashboard.Unpaid Clients')}</p>
          </div>
        </Grid>
      </Grid>

      <div className="calender-header">
        <h2>{t('dashboard.timatable')}</h2>
        <div className="group">
          <input
            type="text"
            className="search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('dashboard.searchBox')}
          />
          <button className="search-button" onClick={() => setSearch(search)}>
            {t('dashboard.search')}
          </button>
        </div>
      </div>
 <Grid container spacing={2} style={{ marginTop: '20px', marginBottom: '20px' }}>
        {/* --- مربع القاعات لليوم --- */}
        <Grid item md={6} xs={12}>
            <div className="today-box halls-today">
                <Typography variant="h6" className="today-box-title">حجوزات القاعات اليوم</Typography>
                <div className="today-box-content">
                    <div className="today-stat">
                        <span className="count green">{hallsStartingToday}</span>
                        <span className="label">حجز يبدأ اليوم</span>
                    </div>
                    <div className="divider"></div>
                    <div className="today-stat">
                        <span className="count red">{hallsEndingToday}</span>
                        <span className="label">حجز ينتهي اليوم</span>
                    </div>
                </div>
            </div>
        </Grid>
        {/* --- مربع الشاليهات لليوم --- */}
        <Grid item md={6} xs={12}>
            <div className="today-box chalets-today">
                <Typography variant="h6" className="today-box-title">حجوزات الشاليهات اليوم</Typography>
                <div className="today-box-content">
                    <div className="today-stat">
                        <span className="count green">{chaletsStartingToday}</span>
                        <span className="label">حجز يبدأ اليوم</span>
                    </div>
                    <div className="divider"></div>
                    <div className="today-stat">
                        <span className="count red">{chaletsEndingToday}</span>
                        <span className="label">حجز ينتهي اليوم</span>
                    </div>
                </div>
            </div>
        </Grid>
      </Grid>
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={eventsForCalendar}
        eventClassNames="event-btn"
        eventDidMount={({ el, event }) => {
          const tooltipContent = `
            👤 ${event.title}
            🏠 ${event.extendedProps.entity || 'غير معروف'}
            💵 ${event.extendedProps.amount || 0}
            ${event.extendedProps.dayPeriod ? `الوقت: ${event.extendedProps.dayPeriod}` : ''}
            ${event.extendedProps.entityType ? `النوع: ${event.extendedProps.entityType}` : ''}
          `.trim();
          el.setAttribute('title', tooltipContent);
        }}
        eventClick={(info) => {
          const { id, extendedProps } = info.event;
          const route =
            extendedProps.status === 'confirmed'
              ? `/reservationDetails/${id}`
              : `/unConfermidReservationDetails/${id}`;
          navigate(route);
        }}
        dayCellContent={(info) => {
          const today = new Date().setHours(0, 0, 0, 0);
          const selectedDate = new Date(info.date).setHours(0, 0, 0, 0);
          return (
            <div className="fc-day-content-wrapper"> {/* New wrapper div for day content */}
              <div className="fc-daygrid-day-top"> {/* Existing class for day number and button */}
                <span className="fc-daygrid-day-number">{info.dayNumberText}</span>
                {selectedDate >= today && (
                  <button onClick={() => navigate(`/search?date=${new Date(info.date).toLocaleDateString('en-CA')}`)}>
                    حجز
                  </button>
                )}
              </div>
              {/* Events will be rendered by FullCalendar here, below fc-daygrid-day-top */}
              {/* No explicit element for events needed here, FullCalendar manages it */}
            </div>
          );
        }}
        height="auto" // Allows CSS to fully control height
        dayMaxEvents={true}
        dayMaxEventRows={true}
      />

      <AddReservation open={modal.open} handleClose={handleClose} />
    </div>
  );
};

export default Dashboard;