import React, { useEffect, useState, useRef } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import "../scss/addChalets.scss"
import { Grid, InputLabel } from '@mui/material';
import { TextField } from '@mui/material';
import Api from './../config/config';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCustomer } from '../redux/reducers/customer';
import { useTranslation } from 'react-i18next';
import { fetchPackages, fetchServices } from '../redux/reducers/services';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { useParams } from 'react-router-dom';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
};

function ReservationServices({ handleClose, handleOpen, open, tempData: temp, update, fetchData }) {
  const { id } = useParams()
  const { t, i18n } = useTranslation();
  const [data, setData] = useState({ package: '', service: '', number: '', price: '', packagePrice: 0 })
  const packages = useSelector((state) => state.services.value.packages)
  const dispatch = useDispatch()
  const services = useSelector((state) => state.services.value.servies)
  useEffect(() => {
    if (temp) setData({ ...temp, confirmPassword: temp.password })
    dispatch(fetchPackages())
    dispatch(fetchServices())
  }, [temp])

  function handleSubmit(e) {
    e.preventDefault();
    let url = update ? '/admin/reservation/service/update' : '/admin/reservation/service';
    Api.post(url, { ...data, type: "service", reservationId: id, price: data.packagePrice * data.number })
      .then(() => {
        fetchData()
        setData({ package: '', service: '', number: '', price: '', packagePrice: 0 })
        handleClose()
      })
      .catch((err) => {
        console.log(err?.respone?.message);
      })
  }
  const handleSelect = (ele) => {
    setData({ ...data, package: ele.package, packagePrice: ele.price })

  }
  return (
    <div>
      <Modal style={{ direction: i18n.language == 'en' ? 'ltr' : 'rtl' }} open={open} onClose={handleClose} aria-labelledby="modal-modal-title" aria-describedby="modal-modal-description" >
        <Box sx={style} className='model'>
          <Typography id="modal-modal-title" variant="h6" component="h2" sx={{ marginBottom: 5 }}>
            اضافة خدمة اضافية
          </Typography>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <InputLabel htmlFor="chaletImg">الخدمة الأضافية</InputLabel>
                <Select labelId="demo-simple-select-label" required onChange={(e) => setData({ ...data, service: e.target.value })} fullWidth id="demo-simple-select" value={data.type} label="Age">
                  {
                    services.map((ele) => (
                      <MenuItem value={ele.service} onClick={() => handleSelect(ele)}>{ele.service}</MenuItem>
                    ))
                  }
                </Select>
              </Grid>
              <Grid item xs={12}>
                <InputLabel htmlFor="chaletImg">النوع</InputLabel>
                <Select labelId="demo-simple-select-label" required fullWidth id="demo-simple-select" value={data.type} label="Age">
                  {
                    packages.map((ele) => (
                      <MenuItem value={ele.package} onClick={() => handleSelect(ele)}>{ele.package}</MenuItem>
                    ))
                  }
                </Select>
              </Grid>
              {/* <Grid item xs={12}>
                    <InputLabel htmlFor="chaletImg">المبلغ الكلي</InputLabel>
                    <TextField variant="outlined" fullWidth required multiline type="text"  value={data.price} onChange={(e)=>setData({...data,price:e.target.value})}/>
                </Grid> */}
              <Grid item xs={12}>
                <InputLabel htmlFor="chaletImg">العدد</InputLabel>
                <TextField variant="outlined" fullWidth required multiline type="text" value={data.number} onChange={(e) => setData({ ...data, number: e.target.value })} />
              </Grid>
              <Grid item xs={12}>
                <Button variant='contained' type='submit' fullWidth style={{ backgroundColor: "#B38D46", height: "50px", fontSize: "1rem" }}>{t("client.add")}</Button>
              </Grid>
            </Grid>
          </form>
        </Box>
      </Modal>
    </div>
  );
}
export default ReservationServices;

