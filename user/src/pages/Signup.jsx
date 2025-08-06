import React, { useState } from 'react';
import '../scss/signup.scss'; // The new SCSS file
import logo from '../assets/Logo 1.png';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Api from '../config/config';
import { useNavigate } from 'react-router-dom';
import { notifyError, notifySuccess } from '../components/Notify';
import * as yup from 'yup';
import { Formik, Form, Field, ErrorMessage } from 'formik'; // Use Formik's Field and ErrorMessage components
import CircularProgress from '@mui/material/CircularProgress';
import { useTranslation } from 'react-i18next';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Navbar from '../components/Navbar';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

// Error message component for a cleaner UI
const CustomErrorMessage = ({ name }) => (
    <div className="error-message">
        <ErrorMessage name={name} />
    </div>
);

const Signup = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [isPhoneFocused, setIsPhoneFocused] = useState(false);
    const { t } = useTranslation();

    const validationSchema = yup.object({
        name: yup.string()
            .required(t('signup.nameRequired'))
            .min(3, t('signup.nameMinLength')),
        email: yup.string()
            .email(t('signup.emailInvalid'))
            .required(t('signup.emailRequired')),
        phone: yup.string()
            .required(t('signup.phoneRequired'))
            .matches(/^\+[1-9]\d{1,14}$/, t('signup.phoneInvalid')),
        password: yup.string()
            .min(8, t('signup.passwordMinLength'))
            .required(t('signup.passwordRequired')),
        confirmPassword: yup.string()
            .oneOf([yup.ref('password'), null], t('signup.confirmPasswordMismatch'))
            .required(t('signup.confirmPasswordRequired')),
    });

    const handleSubmit = async (values, { setFieldError }) => {
        setLoading(true);
        try {
            const res = await Api.post('/users/signup', values);
            notifySuccess(res.data.message || t('signup.signupSuccess'));
            navigate(`/user/verify-email?email=${encodeURIComponent(values.email)}&userId=${res.data.userId}`);
        } catch (err) {
            console.error('Signup error:', err);
            const errorResponse = err.response?.data;

            if (errorResponse) {
                if (errorResponse.errors) {
                    errorResponse.errors.forEach(error => {
                        setFieldError(error.path, error.msg);
                    });
                }
                else if (errorResponse.message) {
                    notifyError(errorResponse.message);
                } else {
                    notifyError(t('common.signupGenericError'));
                }
            } else {
                notifyError(t('common.networkError'));
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <Navbar />

            <div className="auth-container">
                <button onClick={() => navigate(-1)} className="back-button">
                    <ArrowBackIcon />
                </button>

                <div className="auth-card">
                    <div className="logo-container">
                        <img src={logo} alt="logo" className="logo" />
                        <h2 className="title">{t("main.title")}</h2>
                    </div>

                    <Formik
                        initialValues={{ name: '', email: '', phone: '', password: '', confirmPassword: '' }}
                        validationSchema={validationSchema}
                        onSubmit={handleSubmit}
                        validateOnChange={true}
                        validateOnBlur={true}
                    >
                        {({ errors, touched, handleChange, handleBlur, values, setFieldValue, setFieldTouched }) => (
                            <Form className="auth-form">
                                <h3 className="form-title">{t('signup.title')}</h3>

                                {/* حقل الاسم الكامل */}
                                <Field
                                    as={TextField}
                                    fullWidth
                                    id="name"
                                    name="name"
                                    label={t('signup.namePlaceholder')}
                                    value={values.name}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    error={touched.name && Boolean(errors.name)}
                                    helperText={touched.name && errors.name}
                                    variant="outlined"
                                    className="auth-input"
                                />

                                {/* حقل البريد الإلكتروني */}
                                <Field
                                    as={TextField}
                                    fullWidth
                                    id="email"
                                    name="email"
                                    label={t('signup.emailPlaceholder')}
                                    value={values.email}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    error={touched.email && Boolean(errors.email)}
                                    helperText={touched.email && errors.email}
                                    variant="outlined"
                                    type="email"
                                    className="auth-input"
                                />

                                {/* حقل رقم الهاتف */}
                                <div className={`phone-input-wrapper ${touched.phone && errors.phone ? 'has-error' : ''}`}>
                                    <PhoneInput
                                        country={'sa'}
                                        value={values.phone}
                                        onChange={(phone) => setFieldValue('phone', '+' + phone)}
                                        onFocus={() => setIsPhoneFocused(true)}
                                        onBlur={(e) => {
                                            handleBlur('phone')(e);
                                            setIsPhoneFocused(false);
                                            setFieldTouched('phone', true, false);
                                        }}
                                        inputProps={{
                                            name: 'phone',
                                            id: 'phone',
                                            required: true,
                                        }}
                                        inputClass="phone-input-field"
                                        buttonClass="phone-input-button"
                                        dropdownClass="phone-input-dropdown"
                                        containerClass={`phone-input-container ${isPhoneFocused ? 'focused' : ''}`}
                                        placeholder={t('signup.phonePlaceholder')}
                                        enableSearch
                                        countryCodeEditable={false}
                                    />
                                    {touched.phone && errors.phone && (
                                        <CustomErrorMessage name="phone" />
                                    )}
                                </div>
                                
                                {/* حقل كلمة المرور */}
                                <Field
                                    as={TextField}
                                    fullWidth
                                    id="password"
                                    name="password"
                                    label={t('signup.passwordPlaceholder')}
                                    value={values.password}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    error={touched.password && Boolean(errors.password)}
                                    helperText={touched.password && errors.password}
                                    variant="outlined"
                                    type="password"
                                    className="auth-input"
                                />

                                {/* حقل تأكيد كلمة المرور */}
                                <Field
                                    as={TextField}
                                    fullWidth
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    label={t('signup.confirmPasswordPlaceholder')}
                                    value={values.confirmPassword}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    error={touched.confirmPassword && Boolean(errors.confirmPassword)}
                                    helperText={touched.confirmPassword && errors.confirmPassword}
                                    variant="outlined"
                                    type="password"
                                    className="auth-input"
                                />

                                {/* أزرار الإجراءات */}
                                <div className="auth-actions">
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        className="auth-button primary"
                                        disabled={loading}
                                    >
                                        {loading ? <CircularProgress size={24} color="inherit" /> : t('signup.continueBtn')}
                                    </Button>

                                    <Button
                                        type="button"
                                        variant="outlined"
                                        className="auth-button secondary"
                                        onClick={() => navigate('/user/signin')}
                                        disabled={loading}
                                    >
                                        {t('signup.loginBtn')}
                                    </Button>
                                </div>
                            </Form>
                        )}
                    </Formik>
                </div>
            </div>

            {/* عناصر الزخرفة في الخلفية */}
            <div className="auth-decoration">
                <div className="bubble bubble-1"></div>
                <div className="bubble bubble-2"></div>
                <div className="golden-pattern"></div>
            </div>
        </div>
    );
};

export default Signup;