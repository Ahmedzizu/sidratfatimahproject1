import React, { useEffect, useState, useRef } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import "../scss/addChalets.scss"
import { Grid, InputLabel } from '@mui/material';
import { TextField } from '@mui/material';
import Api from '../config/config';
import { useDispatch, useSelector } from 'react-redux';
import { Select, MenuItem } from '@mui/material';
import { styled } from "@mui/material/styles";
import { fetchHall } from './../redux/reducers/hall';
import { fetchResort } from './../redux/reducers/resort';
import { fetchChalets } from './../redux/reducers/chalet';
import { useTranslation } from 'react-i18next';
import Divider from "@mui/material/Divider";
import MuiAlert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import { fetchCustomer } from '../redux/reducers/customer';
import Autocomplete from '@mui/material/Autocomplete';
import { differenceInDays } from 'date-fns'
import { fetchReservations } from './../redux/reducers/reservation';
import { useNavigate } from 'react-router-dom';

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});
const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 600,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
};

const AddReservation = ({ handleClose, handleOpen, open, data: temp }) => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch()
  const navigate = useNavigate()
  let users = useSelector((state) => state.customer.value.data)
  let halls = useSelector((state) => state.hall.value.data)
  halls = halls.map((ele) => { return { ...ele, type: 'hall' } })
  let resorts = useSelector((state) => state.resort.value.data)
  resorts = resorts.map((ele) => { return { ...ele, type: 'resort' } })
  let chalets = useSelector((state) => state.chalet.value.data)
  chalets = chalets.map((ele) => { return { ...ele, type: 'chalet' } })
  let entity = [...halls, ...resorts, ...chalets]

  const [prices, setPrices] = useState()
  const [snackOpen, setSnackOpen] = useState(false)
  const [error, setError] = useState({ endDate: "" })
  const today = new Date();
  const dateString = `${today.getFullYear()}-${('0' + (today.getMonth() + 1)).slice(-2)}-${('0' + today.getDate()).slice(-2)}`;
  const [type, setType] = useState('all')

  useEffect(() => {
    dispatch(fetchChalets())
    dispatch(fetchHall())
    dispatch(fetchResort())
    dispatch(fetchCustomer())
    calcCost()
  }, [])
  const [data, setData] = useState({ status: 'confirmed', cost: '', startDate: "", endDate: '', dayPeriod: 'كامل اليوم', clientName: "", clientPhone: "", cost: '', clientId: '', entityName: '', entityId: '', periodType: 'dayPeriod' })

  async function handleSubmit(e) {
    e.preventDefault();
    if (data.periodType == 'days' && (new Date(data.startDate).getTime() > new Date(data.endDate).getTime())) return setError({ endDate: 'تاريخ الانتهاء يجب ان يكون بعد تاريخ البدء' })
    await Api.post("/admin/addReservation",
      {
        client: {
          name: data.clientName,
          id: data.clientId,
          phone: data.clientPhone
        },
        entity: {
          name: data.entityName,
          id: data.entityId
        },
        cost: data.cost,
        period: {
          type: data.periodType,
          startDate: data.startDate,
          endDate: data.endDate,
          dayPeriod: data.dayPeriod           //morning - night -whole day
        },
        type: data.type,
        status: data.status
      }
    ).then(({ data }) => {
      setError({ endDate: "" })
      dispatch(fetchReservations())
      handleClose()
      setData({ status: 'confirmed', cost: '', startDate: "", endDate: '', dayPeriod: 'كامل اليوم', clientName: "", clientPhone: "", cost: '', clientId: '', entityName: '', entityId: '', periodType: 'dayPeriod' })
      navigate(`/reservationDetails/${data?._id}`)
    })
      .catch((err) => {
        if (err?.response?.status == 403) setSnackOpen(true)
      })
  }
  const handleUserSelect = (id) => {
    let user = users.find((ele) => ele._id == id)
    setData({ ...data, clientId: id, clientName: user.name, clientPhone: user.phone })
  }
  const handleEntitySelect = (id) => {
    let temp = entity.find((ele) => ele._id == id)
    setPrices(temp.price)
    setData({ ...data, entityId: temp._id, entityName: temp.name, type: temp.type, cost: temp?.price?.wholeDay, dayPeriod: "كامل اليوم" })
  }
  const calcCost = () => {
    switch (data.dayPeriod) {
      case "صباحية":
        setData({ ...data, cost: entity?.price?.morning })
        break;
      case "مسائية":
        setData({ ...data, cost: entity?.price?.night })
        break;
      case "كامل اليوم":
        setData({ ...data, cost: entity?.price?.wholeDay })
        break;
      default: setData({ ...data, cost: entity?.price?.wholeDay })
    }
  };
  const calcDaysCost = (type, date) => {
    switch (type) {
      case "start":
        if (data.startDate && data.endDate) {
          let days = differenceInDays(new Date(data.endDate).getTime(), new Date(date).getTime())
          let totalCost = (days * prices.wholeDay) + prices.wholeDay
          setData({ ...data, startDate: date, cost: totalCost })
        } else setData({ ...data, startDate: date })
        break;
      case "end":
        if (data.startDate && data.endDate) {
          let days = differenceInDays(new Date(date).getTime(), new Date(data.startDate).getTime())
          let totalCost = (days * prices.wholeDay) + prices.wholeDay
          setData({ ...data, endDate: date, cost: totalCost })
        } else setData({ ...data, endDate: date })
        break;
      default: console.log("invalid date");
    }
  }
  const DayPeriodPrice = (e) => {
    let period = e.target.value
    if (period == 'صباحية') setData({ ...data, dayPeriod: period, cost: prices.morning })
    if (period == 'مسائية') setData({ ...data, dayPeriod: period, cost: prices.night })
    if (period == 'كامل اليوم') setData({ ...data, dayPeriod: period, cost: prices.wholeDay })
  }

  return (
    <div>
      <Modal style={{ direction: i18n.language == 'en' ? 'ltr' : "rtl" }} open={open} onClose={handleClose} aria-labelledby="modal-modal-title" aria-describedby="modal-modal-description" >
        <Box sx={style} className='model'>
          <Typography id="modal-modal-title" variant="h6" component="h2" sx={{ marginBottom: 5 }}>
            {i18n.language == 'en' ? "Add Reservation" : "اضافة حجز"}
          </Typography>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <InputLabel>{t("reservation.client")}</InputLabel>
                <Select fullWidth value={data.clientId} required onChange={(e) => handleUserSelect(e.target.value)}>
                  {
                    users.map((ele) => (
                      <MenuItem value={ele._id}>{ele.name}</MenuItem>
                    ))
                  }
                </Select>
              </Grid>
              <Grid item xs={4}>
                <InputLabel>{t("reservation.entity")}</InputLabel>
                <Select fullWidth value={data.entityId} required onChange={(e) => handleEntitySelect(e.target.value)}>
                  {
                    entity.map((ele) => (
                      <MenuItem value={ele._id}>{ele.name}</MenuItem>
                    ))
                  }
                </Select>
              </Grid>
              <Grid item xs={4}>
                <InputLabel>{t("reservation.type")}</InputLabel>
                <Select fullWidth value={data.status} required onChange={(e) => setData({ ...data, status: e.target.value })}>
                  <MenuItem value="confirmed">مؤكد</MenuItem>
                  <MenuItem value="unConfirmed">غير مؤكد </MenuItem>
                </Select>
              </Grid>
              {data.entityId && <Grid item xs={4}>
                <InputLabel>{t("reservation.periodType")}</InputLabel>
                <Select fullWidth value={data.periodType} required onChange={(e) => setData({ ...data, periodType: e.target.value, cost: prices.wholeDay, dayPeriod: "كامل اليوم", endDate: '', startDate: '' })}>
                  <MenuItem value="dayPeriod">فترة من يوم</MenuItem>
                  <MenuItem value="days">عدة ايام</MenuItem>
                </Select>
              </Grid>}
              {data.periodType == 'dayPeriod' && data.entityId && <Grid item xs={4}>
                <InputLabel>{t("reservation.period")}</InputLabel>
                <Select value={data.dayPeriod} required onChange={DayPeriodPrice} fullWidth>
                  <MenuItem value={'صباحية'}>{t("reservation.morning")}</MenuItem>
                  <MenuItem value={'مسائية'}>{t("reservation.night")}</MenuItem>
                  <MenuItem value={'كامل اليوم'}>{t("reservation.day")}</MenuItem>
                </Select>
              </Grid>}
              {data.periodType == 'dayPeriod' && data.entityId && <Grid item xs={4}>
                <InputLabel>{t("reservation.dayDate")}</InputLabel>
                <TextField fullWidth variant="outlined" required type="date" value={data.startDate} onChange={(e) => setData({ ...data, startDate: e.target.value, endDate: e.target.value })} />
              </Grid>}
              {data.periodType == 'days' && data.entityId && <Grid item xs={4}>
                <InputLabel>{t("reservation.startDate")}</InputLabel>
                <TextField fullWidth variant="outlined" required type="date" value={data.startDate} onChange={(e) => { calcDaysCost("start", e.target.value) }} />
              </Grid>}
              {data.periodType == 'days' && data.entityId && <Grid item xs={4}>
                <InputLabel>{t("reservation.endDate")}</InputLabel>
                <TextField fullWidth variant="outlined" error={error.endDate} helperText={error.endDate} required type="date" value={data.endDate} onChange={(e) => { calcDaysCost("end", e.target.value) }} />
              </Grid>}
              {data.entityId && <Grid item xs={4}>
                <InputLabel>{t("reservation.cost")}</InputLabel>
                <TextField fullWidth variant="outlined" required type="number" value={data.cost} onChange={(e) => setData({ ...data, cost: e.target.value })} />
              </Grid>}
              <Grid item xs={12}>
                <Button variant='contained' type='submit' fullWidth style={{ backgroundColor: "#B38D46", height: "50px", fontSize: "1rem" }}>{t("reservation.add")}</Button>
              </Grid>
            </Grid>
          </form>
        </Box>
      </Modal>
      <Snackbar open={snackOpen} autoHideDuration={6000} onClose={() => setSnackOpen(false)}>
        <Alert onClose={() => setSnackOpen(false)} severity="warning" sx={{ width: '100%' }}>
          يوجد حجز بالفعل في هذه الفترة   !!
        </Alert>
      </Snackbar>
    </div>
  )
}

export default AddReservation
