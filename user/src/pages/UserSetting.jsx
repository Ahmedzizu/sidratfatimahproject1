import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button, InputLabel, TextField } from '@mui/material';
import "../scss/userSetting.scss";
import Footer from './../components/Footer';
import Api from './../config/config';
import { fetchUserData } from './../redux/reducers/user';
import CircularProgress from '@mui/material/CircularProgress';
import * as yup from 'yup';
import { Formik, Form, ErrorMessage } from 'formik';
import { notifyError, notifySuccess } from '../components/Notify';
import { useTranslation } from 'react-i18next';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

const UserSetting = () => {
    const { t, i18n } = useTranslation();
    const dispatch = useDispatch();

    const [loadingProfile, setLoadingProfile] = useState(false);
    const [loadingPassword, setLoadingPassword] = useState(false);
    const [isPhoneFocused, setIsPhoneFocused] = useState(false); // حالة جديدة لـ PhoneInput

    const userData = useSelector((state) => state.user.data);

    const [initialData, setInitialData] = useState({
        name: '',
        phone: '',
        email: '',
        idNumber: '',
        nationality: '',
        address: '',
    });

    useEffect(() => {
        if (!userData || !userData.name) {
            dispatch(fetchUserData());
        } else {
            setInitialData({
                name: userData.name || '',
                phone: userData.phone || '',
                email: userData.email || '',
                idNumber: userData.idNumber || '',
                nationality: userData.nationality || '',
                address: userData.address || '',
            });
        }
    }, [userData, dispatch]);

    const profileSchema = yup.object({
        name: yup.string().required(t('setting.nameRequired')),
        phone: yup.string()
            .required(t('setting.phoneRequired'))
            .matches(/^\+[1-9]\d{1,14}$/, t('setting.phoneInvalid')),
        idNumber: yup.string().nullable().max(20, t('setting.idNumberMaxLength')),
        nationality: yup.string().nullable().max(50, t('setting.nationalityMaxLength')),
        address: yup.string().nullable().max(100, t('setting.addressMaxLength')),
    });

    const passwordSchema = yup.object({
        oldPass: yup.string().required(t('setting.oldPassRequired')),
        newPass: yup.string().min(8, t('setting.newPassMinLength')).required(t('setting.newPassRequired')),
        confirmNewPass: yup.string()
            .oneOf([yup.ref('newPass'), null], t('setting.confirmNewPassMismatch'))
            .required(t('setting.confirmNewPassRequired')),
    });

    async function handleProfileSubmit(values) {
        setLoadingProfile(true);
        try {
            const payload = { ...values };
            delete payload.email;

            await Api.patch('/users/updateDate', payload);

            dispatch(fetchUserData());

            notifySuccess(t("setting.profileUpdateSuccess"));
        } catch (err) {
            console.error('Profile update error:', err);
            const errorMsg = err.response?.data?.message || t("setting.profileUpdateError");
            notifyError(errorMsg);
        } finally {
            setLoadingProfile(false);
        }
    }

    async function handlePasswordUpdate(values, { resetForm }) {
        setLoadingPassword(true);
        try {
            await Api.patch('/users/updatePassword', {
                oldPass: values.oldPass,
                newPass: values.newPass
            });
            notifySuccess(t("setting.passwordUpdateSuccess"));
            resetForm();
        } catch (err) {
            console.error('Password update error:', err);
            const errorMsg = err.response?.data?.message || t("setting.passwordUpdateError");
            notifyError(errorMsg);
        } finally {
            setLoadingPassword(false);
        }
    }

    return (
        <>
            <div className='user-setting-page' dir={i18n.language === 'en' ? 'ltr' : "rtl"}>
                <h2 className="setting-main-title">{t("setting.title")}</h2>

                <div className="forms-container"> {/* حاوية جديدة للنماذج */}
                    <Formik
                        initialValues={initialData}
                        enableReinitialize={true}
                        validationSchema={profileSchema}
                        onSubmit={handleProfileSubmit}
                    >
                        {({ errors, touched, handleChange, handleBlur, values, setFieldValue }) => (
                            <Form className='profile-data-form'>
                                <h3 className="form-section-title">{t("setting.profileInfo")}</h3> {/* عنوان جديد */}
                                <div className="form-fields-grid">
                                    <div className="form-field-item">
                                        <InputLabel htmlFor='name-field' className="input-label">{t("setting.name")}</InputLabel>
                                        <TextField
                                            type='text'
                                            variant='outlined'
                                            id='name-field'
                                            name='name'
                                            value={values.name}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            error={touched.name && Boolean(errors.name)}
                                            helperText={touched.name && errors.name}
                                            required
                                            className="form-input"
                                            placeholder={t("setting.namePlaceholder")}
                                        />
                                    </div>

                                    <div className="form-field-item">
                                        <InputLabel htmlFor='email-field' className="input-label">{t("setting.email")}</InputLabel>
                                        <TextField
                                            type='email'
                                            variant='outlined'
                                            id='email-field'
                                            name='email'
                                            value={values.email}
                                            InputProps={{ readOnly: true }}
                                            className="form-input disabled-input" // إضافة كلاس لتمييز الحقل المعطل
                                            disabled
                                            placeholder={t("setting.emailPlaceholder")}
                                        />
                                        <ErrorMessage name="email" component="div" className="error-message" />
                                    </div>

                                    <div className={`form-field-item phone-field-item ${isPhoneFocused ? 'focused' : ''}`}> {/* إضافة كلاس لـ PhoneInput */}
                                        <InputLabel htmlFor='phone-field' className="input-label">{t("setting.phone")}</InputLabel>
                                        <PhoneInput
                                            country={'eg'} // تغيير الدولة الافتراضية إلى مصر
                                            value={values.phone}
                                            onChange={(phone) => setFieldValue('phone', '+' + phone)}
                                            onBlur={(e) => {
                                                handleBlur('phone')(e); // استدعاء onBlur الخاص بـ Formik
                                                setIsPhoneFocused(false); // تحديث الحالة
                                            }}
                                            onFocus={() => setIsPhoneFocused(true)} // تحديث الحالة
                                            inputProps={{
                                                name: 'phone',
                                                id: 'phone-field',
                                                required: true,
                                            }}
                                            containerClass="phone-input-container"
                                            inputClass="phone-input-field"
                                            buttonClass="phone-input-button"
                                            dropdownClass="phone-input-dropdown"
                                            placeholder={t('signup.phonePlaceholder')} // استخدام placeholder من الترجمة
                                            enableSearch
                                            countryCodeEditable={false}
                                        />
                                        {touched.phone && errors.phone && (
                                            <p className="error-message">{errors.phone}</p>
                                        )}
                                    </div>

                                    <div className="form-field-item">
                                        <InputLabel htmlFor='idNumber-field' className="input-label">{t("setting.idNumber")}</InputLabel>
                                        <TextField
                                            type='text'
                                            variant='outlined'
                                            id='idNumber-field'
                                            name='idNumber'
                                            value={values.idNumber}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            error={touched.idNumber && Boolean(errors.idNumber)}
                                            helperText={touched.idNumber && errors.idNumber}
                                            className="form-input"
                                            placeholder={t("setting.idNumberPlaceholder")}
                                        />
                                    </div>

                                    <div className="form-field-item">
                                        <InputLabel htmlFor='nationality-field' className="input-label">{t("setting.nationality")}</InputLabel>
                                        <TextField
                                            type='text'
                                            variant='outlined'
                                            id='nationality-field'
                                            name='nationality'
                                            value={values.nationality}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            error={touched.nationality && Boolean(errors.nationality)}
                                            helperText={touched.nationality && errors.nationality}
                                            className="form-input"
                                            placeholder={t("setting.nationalityPlaceholder")}
                                        />
                                    </div>

                                    <div className="form-field-item full-width-item"> {/* كلاس جديد للعرض الكامل */}
                                        <InputLabel htmlFor='address-field' className="input-label">{t("setting.address")}</InputLabel>
                                        <TextField
                                            type='text'
                                            variant='outlined'
                                            id='address-field'
                                            name='address'
                                            value={values.address}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            error={touched.address && Boolean(errors.address)}
                                            helperText={touched.address && errors.address}
                                            className="form-input"
                                            placeholder={t("setting.addressPlaceholder")}
                                            multiline
                                            rows={2}
                                        />
                                    </div>
                                </div>

                                <Button variant='contained' className='submit-btn primary-btn' type='submit' disabled={loadingProfile}>
                                    {loadingProfile ? <CircularProgress size={24} color="inherit" /> : t("setting.save")}
                                </Button>
                            </Form>
                        )}
                    </Formik>

                    {/* Password Change Section */}
                    <Formik
                        initialValues={{ oldPass: '', newPass: '', confirmNewPass: '' }}
                        validationSchema={passwordSchema}
                        onSubmit={handlePasswordUpdate}
                    >
                        {({ errors, touched, handleChange, handleBlur, values }) => (
                            <Form className='password-update-form'>
                                <h3 className="form-section-title">{t("setting.changePassword")}</h3> {/* عنوان جديد */}
                                <div className="form-fields-grid">
                                    <div className="form-field-item">
                                        <InputLabel htmlFor='oldPass-field' className="input-label">{t("setting.oldPass")}</InputLabel>
                                        <TextField
                                            type='password'
                                            variant='outlined'
                                            id='oldPass-field'
                                            name='oldPass'
                                            value={values.oldPass}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            error={touched.oldPass && Boolean(errors.oldPass)}
                                            helperText={touched.oldPass && errors.oldPass}
                                            required
                                            className="form-input"
                                            placeholder={t("setting.oldPassPlaceholder")}
                                        />
                                    </div>
                                    <div className="form-field-item">
                                        <InputLabel htmlFor='newPass-field' className="input-label">{t("setting.newPass")}</InputLabel>
                                        <TextField
                                            type='password'
                                            variant='outlined'
                                            id='newPass-field'
                                            name='newPass'
                                            value={values.newPass}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            error={touched.newPass && Boolean(errors.newPass)}
                                            helperText={touched.newPass && errors.newPass}
                                            required
                                            className="form-input"
                                            placeholder={t("setting.newPassPlaceholder")}
                                        />
                                    </div>
                                    <div className="form-field-item">
                                        <InputLabel htmlFor='confirmNewPass-field' className="input-label">{t("setting.confirmNewPass")}</InputLabel>
                                        <TextField
                                            type='password'
                                            variant='outlined'
                                            id='confirmNewPass-field'
                                            name='confirmNewPass'
                                            value={values.confirmNewPass}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            error={touched.confirmNewPass && Boolean(errors.confirmNewPass)}
                                            helperText={touched.confirmNewPass && errors.confirmNewPass}
                                            required
                                            className="form-input"
                                            placeholder={t("setting.confirmNewPassPlaceholder")}
                                        />
                                    </div>
                                </div>
                                <Button variant='contained' className='submit-btn secondary-btn' type='submit' disabled={loadingPassword}>
                                    {loadingPassword ? <CircularProgress size={24} color="inherit" /> : t("setting.updatePassword")}
                                </Button>
                            </Form>
                        )}
                    </Formik>
                </div>
            </div>
            <Footer />
        </>
    );
};

export default UserSetting;