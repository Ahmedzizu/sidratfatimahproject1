import React, { useState } from 'react';
import '../scss/signup.scss';
import logo from '../assets/Logo 1.png';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Api from '../config/config';
import { useNavigate } from 'react-router-dom';
import { notifyError, notifySuccess } from '../components/Notify';
import * as yup from 'yup';
import { Formik, Form } from 'formik';
import CircularProgress from '@mui/material/CircularProgress';
import { useTranslation } from 'react-i18next';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Navbar from '../components/Navbar';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

const Signup = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [isPhoneFocused, setIsPhoneFocused] = useState(false); // حالة جديدة لتتبع التركيز على حقل الهاتف
    const { t } = useTranslation();

    const validationSchema = yup.object({
        name: yup.string().required(t('signup.nameRequired')),
        email: yup.string().email(t('signup.emailInvalid')).required(t('signup.emailRequired')),
        phone: yup.string()
            .required(t('signup.phoneRequired'))
            .matches(/^\+[1-9]\d{1,14}$/, t('signup.phoneInvalid')),
        password: yup.string().min(8, t('signup.passwordMinLength')).required(t('signup.passwordRequired')),
        confirmPassword: yup.string()
            .oneOf([yup.ref('password'), null], t('signup.confirmPasswordMismatch'))
            .required(t('signup.confirmPasswordRequired')),
    });

    const handleSubmit = async (values) => {
        setLoading(true);
        try {
            const res = await Api.post('/users/signup', values);
            notifySuccess(res.data.message || t('signup.signupSuccess'));
            navigate(`/user/verify-email?email=${encodeURIComponent(values.email)}&userId=${res.data.userId}`);
        } catch (err) {
            console.error('Signup error:', err);
            const errorResponse = err.response?.data;
            if (errorResponse) {
                if (typeof errorResponse === 'object' && !Array.isArray(errorResponse)) {
                    if (errorResponse.name) notifyError(errorResponse.name);
                    if (errorResponse.email) notifyError(errorResponse.email);
                    if (errorResponse.phone) notifyError(errorResponse.phone);
                    if (errorResponse.password) notifyError(errorResponse.password);
                    if (errorResponse.message) notifyError(errorResponse.message);
                } else {
                    notifyError(errorResponse.message || t('common.signupGenericError'));
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
                    >
                        {({ errors, touched, handleChange, handleBlur, values, setFieldValue }) => (
                            <Form className="auth-form">
                                <h3 className="form-title">{t('signup.title')}</h3>

                                <TextField
                                    fullWidth
                                    id="name"
                                    name="name"
                                    placeholder={t('signup.namePlaceholder')}
                                    value={values.name}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    error={touched.name && Boolean(errors.name)}
                                    helperText={touched.name && errors.name}
                                    variant="outlined"
                                    className="auth-input"
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            '& fieldset': { borderColor: '#B38D46' },
                                            '&:hover fieldset': { borderColor: '#B38D46' },
                                        },
                                    }}
                                />

                                <TextField
                                    fullWidth
                                    id="email"
                                    name="email"
                                    placeholder={t('signup.emailPlaceholder')}
                                    value={values.email}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    error={touched.email && Boolean(errors.email)}
                                    helperText={touched.email && errors.email}
                                    variant="outlined"
                                    className="auth-input"
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            '& fieldset': { borderColor: '#B38D46' },
                                            '&:hover fieldset': { borderColor: '#B38D46' },
                                        },
                                    }}
                                />

                                <div className={`phone-input-wrapper ${isPhoneFocused ? 'focused' : ''}`}> {/* إضافة كلاس 'focused' */}
                                    <PhoneInput
                                        country={'eg'}
                                        value={values.phone}
                                        onChange={(phone) => setFieldValue('phone', '+' + phone)}
                                        onFocus={() => setIsPhoneFocused(true)} // تحديث الحالة عند التركيز
                                        onBlur={(e) => {
                                            handleBlur('phone')(e); // تأكد من استدعاء onBlur الخاص بـ Formik
                                            setIsPhoneFocused(false); // تحديث الحالة عند فقدان التركيز
                                        }}
                                        inputProps={{
                                            name: 'phone',
                                            id: 'phone',
                                            required: true,
                                        }}
                                        placeholder={t('signup.phonePlaceholder')}
                                        enableSearch
                                        countryCodeEditable={false}
                                        inputStyle={{
                                            backgroundColor: '#1E1E1E',
                                            border: '1px solid rgba(179, 141, 70, 0.4)',
                                            borderRadius: '8px',
                                            color: '#F5F5F5',
                                            fontSize: '1rem',
                                            height: '56px',
                                            width: '100%',
                                            paddingLeft: '60px',
                                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
                                            transition: 'all 0.3s ease',
                                        }}
                                        buttonStyle={{
                                            backgroundColor: '#1E1E1E',
                                            border: '1px solid rgba(179, 141, 70, 0.4)',
                                            borderRight: 'none',
                                            borderTopLeftRadius: '8px',
                                            borderBottomLeftRadius: '8px',
                                        }}
                                        dropdownStyle={{
                                            backgroundColor: '#1E1E1E',
                                            border: '1px solid rgba(179, 141, 70, 0.4)',
                                            borderRadius: '8px',
                                            color: '#F5F5F5',
                                        }}
                                        searchStyle={{
                                            backgroundColor: '#121212',
                                            border: '1px solid rgba(179, 141, 70, 0.4)',
                                            color: '#F5F5F5',
                                            margin: '10px',
                                            padding: '8px 10px',
                                        }}
                                    />
                                    {touched.phone && errors.phone && (
                                        <p className="error-message-phone">{errors.phone}</p>
                                    )}
                                </div>

                                <TextField
                                    fullWidth
                                    id="password"
                                    name="password"
                                    placeholder={t('signup.passwordPlaceholder')}
                                    value={values.password}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    error={touched.password && Boolean(errors.password)}
                                    helperText={touched.password && errors.password}
                                    variant="outlined"
                                    type="password"
                                    className="auth-input"
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            '& fieldset': { borderColor: '#B38D46' },
                                            '&:hover fieldset': { borderColor: '#B38D46' },
                                        },
                                    }}
                                />

                                <TextField
                                    fullWidth
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    placeholder={t('signup.confirmPasswordPlaceholder')}
                                    value={values.confirmPassword}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    error={touched.confirmPassword && Boolean(errors.confirmPassword)}
                                    helperText={touched.confirmPassword && errors.confirmPassword}
                                    variant="outlined"
                                    type="password"
                                    className="auth-input"
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            '& fieldset': { borderColor: '#B38D46' },
                                            '&:hover fieldset': { borderColor: '#B38D46' },
                                        },
                                    }}
                                />

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

            <div className="auth-decoration">
                <div className="bubble bubble-1"></div>
                <div className="bubble bubble-2"></div>
                <div className="golden-pattern"></div>
            </div>
        </div>
    );
};

export default Signup;