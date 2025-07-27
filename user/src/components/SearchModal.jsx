// src/components/SearchModal.jsx
import React, { useEffect, useState } from 'react';
import { Box, Button, Typography, Modal, Grid, Fade, TextField } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { setSearch, clearSearch } from '../redux/reducers/chalet';
import "../scss/home.scss"; // تأكد من أن هذا المسار صحيح

// الأنماط الأولية للمودال (سيتم تجاوزها بواسطة SCSS)
const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: { xs: '90%', sm: 450, md: 600 }, // تعديل العرض ليكون متجاوباً وأوسع قليلاً
    bgcolor: 'transparent', // ستتحكم SCSS بالخلفية
    boxShadow: 'none', // ستتحكم SCSS بالظلال
    p: 0, // ستتحكم SCSS بالبادينج للحاوية الداخلية
    outline: 'none', // إزالة outline الافتراضي
    borderRadius: "0px", // ستتحكم SCSS بالـ border-radius
};

const SearchModal = ({ handleClose, open }) => {
    const dispatch = useDispatch();
    const { t, i18n } = useTranslation();

    const currentSearchTerm = useSelector((state) => state.chalet.searchTerm);
    const [data, setData] = useState(currentSearchTerm || {});

    useEffect(() => {
        if (open) {
            setData(currentSearchTerm || {});
        }
    }, [open, currentSearchTerm]);

    const handleChange = (e) => {
        setData({ ...data, [e.target.name]: e.target.value });
    };

    function handleSubmit(e) {
        e.preventDefault();
        const searchPayload = {};
        for (const key in data) {
            if (data[key] !== null && data[key] !== '') {
                if (['minPrice', 'maxPrice', 'area', 'rooms', 'capacity', 'pools', 'kitchen', 'bedrooms', 'bathrooms', 'lounges'].includes(key)) {
                    searchPayload[key] = parseFloat(data[key]);
                } else {
                    searchPayload[key] = data[key];
                }
            }
        }
        dispatch(setSearch(searchPayload));
        handleClose();
    }

    function handleClearSearch() {
        setData({});
        dispatch(clearSearch());
        handleClose();
    }

    return (
        <Modal
            open={open}
            onClose={handleClose}
            closeAfterTransition
            TransitionComponent={Fade}
            TransitionProps={{ timeout: 500 }}
            BackdropProps={{ timeout: 500, style: { backgroundColor: 'rgba(0, 0, 0, 0.7)' } }} // خلفية داكنة للـ Backdrop
            className="search-modal-root" // كلاس لتنسيق جذر المودال
        >
            <Box sx={{ ...style, direction: i18n.language === 'en' ? 'ltr' : "rtl" }} className="search-modal-box">
                <div className="search-modal-content"> {/* حاوية للمحتوى لتطبيق البادينج والحدود */}
                    <Typography id="modal-modal-title" variant="h6" component="h2" className="search-modal-title">
                        {t("main.detailedSearch")} {/* استخدام detailedSearch ليكون أكثر دقة */}
                    </Typography>
                    <form onSubmit={handleSubmit} className="search-form">
                        <Grid container spacing={3}> {/* زيادة المسافة بين الحقول */}
                            <Grid item xs={12}>
                                <TextField 
                                    name="query" 
                                    label={t("search.searchByName")} 
                                    variant="outlined" 
                                    value={data.query || ''} 
                                    fullWidth 
                                    onChange={handleChange} 
                                    className="form-input" // كلاس ليتناسق مع تصميماتنا
                                />
                            </Grid>
                            
                            <Grid item xs={12} sm={6}> {/* جعلها عمودين على الشاشات الصغيرة */}
                                <TextField 
                                    name="minPrice" 
                                    label={t("search.minPrice")} 
                                    type="number" 
                                    variant="outlined" 
                                    inputProps={{ min: 0 }} 
                                    value={data.minPrice || ''} 
                                    fullWidth 
                                    onChange={handleChange} 
                                    className="form-input"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField 
                                    name="maxPrice" 
                                    label={t("search.maxPrice")} 
                                    type="number" 
                                    variant="outlined" 
                                    inputProps={{ min: data.minPrice || 0 }} 
                                    value={data.maxPrice || ''} 
                                    fullWidth 
                                    onChange={handleChange} 
                                    className="form-input"
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}><TextField name="area" label={t("search.area")} type="number" variant="outlined" inputProps={{ min: 0 }} value={data.area || ''} fullWidth onChange={handleChange} className="form-input" /></Grid>
                            <Grid item xs={12} sm={6}><TextField name="rooms" label={t("search.rooms")} type="number" variant="outlined" inputProps={{ min: 0 }} value={data.rooms || ''} fullWidth onChange={handleChange} className="form-input" /></Grid>
                            <Grid item xs={12} sm={6}><TextField name="capacity" label={t("search.capacity")} type="number" variant="outlined" inputProps={{ min: 0 }} value={data.capacity || ''} fullWidth onChange={handleChange} className="form-input" /></Grid>
                            <Grid item xs={12} sm={6}><TextField name="pools" label={t("search.pools")} type="number" variant="outlined" inputProps={{ min: 0 }} value={data.pools || ''} fullWidth onChange={handleChange} className="form-input" /></Grid>
                            <Grid item xs={12} sm={6}><TextField name="kitchen" label={t("search.kitchen")} type="number" variant="outlined" inputProps={{ min: 0 }} value={data.kitchen || ''} fullWidth onChange={handleChange} className="form-input" /></Grid>
                            <Grid item xs={12} sm={6}><TextField name="bedrooms" label={t("search.bedrooms")} type="number" variant="outlined" inputProps={{ min: 0 }} value={data.bedrooms || ''} fullWidth onChange={handleChange} className="form-input" /></Grid>
                            <Grid item xs={12} sm={6}><TextField name="bathrooms" label={t("search.bathrooms")} type="number" variant="outlined" inputProps={{ min: 0 }} value={data.bathrooms || ''} fullWidth onChange={handleChange} className="form-input" /></Grid>
                            <Grid item xs={12} sm={6}><TextField name="lounges" label={t("search.lounges")} type="number" variant="outlined" inputProps={{ min: 0 }} value={data.lounges || ''} fullWidth onChange={handleChange} className="form-input" /></Grid>

                            {/* === أزرار التحكم === */}
                            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '30px' }}> {/* توسيط الأزرار */}
                                <Button variant='contained' type='submit' className="submit-btn primary-btn">{t("search.search")}</Button>
                                <Button variant='outlined' onClick={handleClearSearch} className="submit-btn secondary-btn">{t("search.clear")}</Button>
                            </Grid>
                        </Grid>
                    </form>
                </div> {/* نهاية search-modal-content */}
            </Box>
        </Modal>
    );
};

export default SearchModal;