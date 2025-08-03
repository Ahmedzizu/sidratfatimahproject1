import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import "../scss/addChalets.scss"
import { Grid, InputLabel, TextField, MenuItem, Select } from '@mui/material';
import Api from './../config/config';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { fetchPackages, fetchServices } from '../redux/reducers/services';
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

function ReservationServices({ handleClose, open, tempData: temp, update, fetchData }) {
  const { id } = useParams();
  const { t } = useTranslation();
  const [data, setData] = useState({ service: '', number: '', packagePrice: 0, discount: 0, package: '' });
  const packages = useSelector((state) => state.services.value.packages);
  const dispatch = useDispatch();
  const services = useSelector((state) => state.services.value.servies);

  // Effect 1: Fetches data only when the modal opens
  useEffect(() => {
    if (open) {
      dispatch(fetchPackages());
      dispatch(fetchServices());
    }
  }, [open, dispatch]);

  // Effect 2: Populates the form, runs ONLY when data is ready
  useEffect(() => {
    if (open) {
      if (temp && update && (services.length > 0 || packages.length > 0)) {
        console.log("--- DEBUG: EDIT MODE ---");
        console.log("Item to edit (temp):", temp);
        console.log("Available services list:", services);
        console.log("Available packages list:", packages);
        
        const selectedObject = services.find(s => s.service === temp.service) || packages.find(p => p.package === temp.package);
        
        console.log("Found object for price:", selectedObject); // <-- This will tell us if it found the price
        
        
        // <-- This will show the price it's setting
         // ✨ Find the price in the PACKAGES list using the item's package name
        const selectedPackage = packages.find(p => p.package === temp.package);
        const packagePrice = selectedPackage ? selectedPackage.price : 0;
         console.log("Setting packagePrice to:", packagePrice);
        setData({ ...temp, packagePrice, discount: temp.discount || 0 });
      } else if (!update) {
        setData({ service: '', number: '', packagePrice: 0, discount: 0, package: '' });
      }
    }
  }, [temp, open, update, services, packages]);


  function handleSubmit(e) {
    e.preventDefault();
    let url = update ? `/admin/reservation/service/update/${data._id}` : '/admin/reservation/service';

    const totalPrice = (data.packagePrice || 0) * (data.number || 0);
    const discountAmount = parseFloat(data.discount) || 0;

    if (discountAmount > totalPrice) {
      alert(`خطأ: لا يمكن أن يكون الخصم (${discountAmount}) أكبر من السعر الإجمالي (${totalPrice})`);
      return;
    }
    
    const finalPrice = totalPrice - discountAmount;

    Api.post(url, { ...data, type: "service", reservationId: id, price: finalPrice })
      .then(() => {
        fetchData();
        handleClose();
      })
      .catch((err) => {
        console.log(err?.response?.message);
      });
  }

  const handleSelectionChange = (event, type) => {
    const selectedName = event.target.value;
    let selectedObject;
    
    if (type === 'service') {
        selectedObject = services.find(s => s.service === selectedName);
    } else if (type === 'package') {
        selectedObject = packages.find(p => p.package === selectedName);
    }

    if (selectedObject) {
      setData(prevData => ({
        ...prevData,
        service: type === 'service' ? selectedObject.service : prevData.service,
        package: type === 'package' ? selectedObject.package : prevData.package,
        packagePrice: selectedObject.price
      }));
    }
  };

  return (
    <div>
      <Modal open={open} onClose={handleClose} aria-labelledby="modal-modal-title" aria-describedby="modal-modal-description">
        <Box sx={style} className='model'>
          <Typography id="modal-modal-title" variant="h6" component="h2" sx={{ marginBottom: 5 }}>
            {update ? 'تعديل خدمة إضافية' : 'اضافة خدمة اضافية'}
          </Typography>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <InputLabel>الخدمة الأضافية</InputLabel>
                <Select required onChange={(e) => handleSelectionChange(e, 'service')} fullWidth value={data.service || ''}>
                  {services.map((ele) => (
                    <MenuItem key={ele._id} value={ele.service}>{ele.service}</MenuItem>
                  ))}
                </Select>
              </Grid>
              <Grid item xs={12}>
                <InputLabel>النوع</InputLabel>
                <Select required onChange={(e) => handleSelectionChange(e, 'package')} fullWidth value={data.package || ''}>
                  {packages.map((ele) => (
                    <MenuItem key={ele._id} value={ele.package}>{ele.package}</MenuItem>
                  ))}
                </Select>
              </Grid>
              <Grid item xs={12}>
                <InputLabel>العدد</InputLabel>
                <TextField variant="outlined" fullWidth required type="number" value={data.number || ''} onChange={(e) => setData({ ...data, number: e.target.value })} />
              </Grid>
              <Grid item xs={12}>
                <InputLabel>الخصم (مبلغ ثابت)</InputLabel>
                <TextField variant="outlined" fullWidth type="number" value={data.discount || 0} onChange={(e) => setData({ ...data, discount: e.target.value })} />
              </Grid>
              <Grid item xs={12}>
                <Button variant='contained' type='submit' fullWidth style={{ backgroundColor: "#B38D46", height: "50px", fontSize: "1rem" }}>{update ? t("common.edit") : t("client.add")}</Button>
              </Grid>
            </Grid>
          </form>
        </Box>
      </Modal>
    </div>
  );
}
export default ReservationServices;