import React, { useEffect, useState, useRef } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import "../scss/addChalets.scss"
import { FormControlLabel, FormGroup, Grid, InputLabel } from '@mui/material';
import { TextField } from '@mui/material';
import Api from './../config/config';
import { useDispatch, useSelector } from 'react-redux';
import { fetchEmploees } from './../redux/reducers/employee';
import { useTranslation } from 'react-i18next';
import Checkbox from '@mui/material/Checkbox';
const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 500,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
};

function Permissions({ handleClose, handleOpen, open, data }) {
  
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch()
  useEffect(() => { if (data) {
    setCheckboxes(data.permissions)
  } }, [data])
  const [checkboxes, setCheckboxes] = useState({
    expenses: false,
    insurance: false,
    bankTransfer: false,
    withdraw: false,
    onlinePayment: false,
    client: false,
    addEntity: false,
    removeEntity: false,
    addReservation: false,
    editReservation: false,
    removeReservation: false,
    acceptReservation: false,
    addClient: false,
    paypal: false,
    deferreReservation: false,
    cancelReaquest: false,
    employee: false
  });
  const handleChange = (event) => {
    const name = event.target.name;
    const isChecked = event.target.checked;
    setCheckboxes({ ...checkboxes, [name]: isChecked });
  };
  function handleSubmit(e) {
    console.log(data);
    console.log(checkboxes);
    e.preventDefault();
    Api.post('/employee/permissions/update', { ...checkboxes, _id: data._id })
      .then(() => handleClose())
      .catch((err) => console.log(err.response.data))
    dispatch(fetchEmploees());
  }

  return (
    <div>
      <Modal open={open} onClose={handleClose} aria-labelledby="modal-modal-title" aria-describedby="modal-modal-description" >
        <Box sx={style} className='model'>
          <Typography id="modal-modal-title" variant="h6" component="h2" sx={{ marginBottom: 5, fontWeight: "700", fontSize: "1.5rem" }} >
            {t("employee.permissions")}
          </Typography>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={4}><FormControlLabel control={<Checkbox name="expenses" onChange={handleChange} checked={checkboxes.expenses} />} label={t("employee.expenses")} /></Grid>
              <Grid item xs={4}><FormControlLabel control={<Checkbox name="insurance" onChange={handleChange} checked={checkboxes.insurance} />} label={t("employee.insurance")} /></Grid>
              <Grid item xs={4}><FormControlLabel control={<Checkbox name="bankTransfer" onChange={handleChange} checked={checkboxes.bankTransfer} />} label={t("employee.bank")} /></Grid>
              <Grid item xs={4}><FormControlLabel control={<Checkbox name="withdraw" onChange={handleChange} checked={checkboxes.withdraw} />} label={t("employee.draws")} /></Grid>
              <Grid item xs={4}><FormControlLabel control={<Checkbox name="onlinePayment" onChange={handleChange} checked={checkboxes.onlinePayment} />} label={t("employee.online")} /></Grid>
              <Grid item xs={4}><FormControlLabel control={<Checkbox name="paypal" onChange={handleChange} checked={checkboxes.paypal} />} label={t("employee.paypal")} /></Grid>
              <Grid item xs={4}><FormControlLabel control={<Checkbox name="client" onChange={handleChange} checked={checkboxes.client} />} label={t("employee.clients")} /></Grid>
              <Grid item xs={4}><FormControlLabel control={<Checkbox name="addEntity" onChange={handleChange} checked={checkboxes.addEntity} />} label={t("employee.addEntity")} /></Grid>
              <Grid item xs={4}><FormControlLabel control={<Checkbox name="removeEntity" onChange={handleChange} checked={checkboxes.removeEntity} />} label={t("employee.deleteEntity")} /></Grid>
              <Grid item xs={4}><FormControlLabel control={<Checkbox name="addReservation" onChange={handleChange} checked={checkboxes.addReservation} />} label={t("employee.addReserv")} /></Grid>
              <Grid item xs={4}><FormControlLabel control={<Checkbox name="editReservation" onChange={handleChange} checked={checkboxes.editReservation} />} label={t("employee.editReserv")} /></Grid>
              <Grid item xs={4}><FormControlLabel control={<Checkbox name="removeReservation" onChange={handleChange} checked={checkboxes.removeReservation} />} label={t("employee.deleteReserv")} /></Grid>
              <Grid item xs={4}><FormControlLabel control={<Checkbox name="acceptReservation" onChange={handleChange} checked={checkboxes.acceptReservation} />} label={t("employee.acceptReserv")} /></Grid>
              <Grid item xs={4}><FormControlLabel control={<Checkbox name="deferreReservation" onChange={handleChange} checked={checkboxes.deferreReservation} />} label={t("employee.deferreReserv")} /></Grid>
              {/* <Grid item xs={4}><FormControlLabel control={<Checkbox name="addClient" onChange={handleChange} checked={checkboxes.addClient} />} label={t("employee.addClients")} /></Grid> */}
              <Grid item xs={4}><FormControlLabel control={<Checkbox name="cancelReaquest" onChange={handleChange} checked={checkboxes.cancelReaquest} />} label={t("employee.cancelRequest")} /></Grid>
              <Grid item xs={4}><FormControlLabel control={<Checkbox name="employee" onChange={handleChange} checked={checkboxes.employee} />} label={t("employee.employee")} /></Grid>
              <Grid item xs={12}>
                <Button variant='contained' type='submit' fullWidth style={{ backgroundColor: "#B38D46", height: "50px", fontSize: "1rem" }}>{t("employee.add")}</Button>
              </Grid>
            </Grid>
          </form>
        </Box>
      </Modal>
    </div>
  );
}
export default Permissions;