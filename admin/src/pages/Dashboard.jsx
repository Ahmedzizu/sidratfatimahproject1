import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchReservationCounts } from '../redux/reducers/ReservationCounts';
import { fetchReservations } from '../redux/reducers/reservation';
import { useTranslation } from 'react-i18next';
import AddReservation from '../modals/AddReservation';
import { Grid, Typography, TextField } from '@mui/material'; 
import "../scss/dashboard.scss";

const Dashboard = () => {
  const { t, i18n } = useTranslation();
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState({ open: false, date: {} });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [calendarView, setCalendarView] = useState('dayGridMonth');
  const [dayMaxEvents, setDayMaxEvents] = useState(3);

  const {
    hallsCount = 0,
    chaletsCount = 0,
    unconfirmedReservationsCount = 0,
    unpaidClientsCount = 0,
    hallsStartingToday = 0,
    hallsEndingToday = 0,
    chaletsStartingToday = 0,
    chaletsEndingToday = 0
  } = useSelector((state) => state.reservationCounts || {});

  const confirmedData = useSelector((state) => state.reservation?.value?.confirmed || []);

  useEffect(() => {
    dispatch(fetchReservationCounts());
    dispatch(fetchReservations());

    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setCalendarView('listWeek');
        setDayMaxEvents(1);
      } else if (width < 1200) {
        setCalendarView('dayGridMonth');
        setDayMaxEvents(2);
      } else {
        setCalendarView('dayGridMonth');
        setDayMaxEvents(3);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [dispatch]);

  const handleClose = () => setModal({ open: false });

  const eventsForCalendar = confirmedData
    .filter((ele) => ele.client?.name.toLowerCase().includes(search.toLowerCase()))
    .flatMap((ele) => {
      const eventClasses = ele.type?.toLowerCase() === 'hall' ? ['event-hall'] :
        ele.period?.dayPeriod === 'صباحية' ? ['event-morning'] :
        ele.period?.dayPeriod === 'مسائية' ? ['event-evening'] : ['event-full-day'];

      const startDate = new Date(ele.period?.startDate);
      const endDate = new Date(ele.period?.endDate);
      let currentDate = new Date(startDate);
      const events = [];

      while (currentDate <= endDate) {
        events.push({
          title: `${ele.client?.name}` || 'غير معروف',
          start: new Date(currentDate).toISOString().split('T')[0],
          id: ele._id,
          classNames: eventClasses,
          extendedProps: {
            status: ele.status,
            entity: ele.entity?.name,
            amount: ele.cost,
            dayPeriod: ele.period?.dayPeriod,
            entityType: ele.type,
          },
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }

      return events;
    });
function getNextDay(dateStr) {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + 1);
  return date.toISOString().split('T')[0]; // يرجع التاريخ بصيغة YYYY-MM-DD
}

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

      <Grid container spacing={2} style={{ marginTop: 20 }}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            variant="outlined"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('dashboard.searchBox')}
          />
        </Grid>
      </Grid>
<div className="calendar-wrapper">
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin, listPlugin]}
        initialView={calendarView}
        headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,listWeek' }}
        events={eventsForCalendar}
        eventClassNames="event-btn"
         eventDidMount={({ el, event }) => {
          const tooltipContent = `
            👤 ${event.title}
            🏠 ${event.extendedProps.entity || 'غير معروف'}
            💵 ${event.extendedProps.amount || 0}
            ${event.extendedProps.dayPeriod ? `الوقت: ${event.extendedProps.dayPeriod}` : ''}
          `.trim();
          el.setAttribute('title', tooltipContent);
        }}
        eventClick={(info) => {
          const { id, extendedProps } = info.event;
          const route = extendedProps.status === 'confirmed' ? `/reservationDetails/${id}` : `/unConfermidReservationDetails/${id}`;
          navigate(route);
        }}
        dayCellContent={(info) => {
          const today = new Date().setHours(0, 0, 0, 0);
          const selectedDate = new Date(info.date).setHours(0, 0, 0, 0);
          return (
            <div className="fc-day-content-wrapper">
              <div className="fc-daygrid-day-top">
                <span className="fc-daygrid-day-number">{info.dayNumberText}</span>
                {selectedDate >= today && (
                  <button onClick={() => navigate(`/search?date=${new Date(info.date).toLocaleDateString('en-CA')}`)}>
                    حجز
                  </button>
                )}
              </div>
            </div>
          );
        }}
        height="auto"
        dayMaxEvents={dayMaxEvents}
      />
</div>
      <AddReservation open={modal.open} handleClose={handleClose} />
    </div>
  );
};

export default Dashboard;
