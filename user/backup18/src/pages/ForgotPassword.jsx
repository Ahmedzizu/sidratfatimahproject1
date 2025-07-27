// F:\ractprojects\New folder (2)\ggg\user\src\pages\ForgotPassword.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Api from '../config/config';
import { notifySuccess, notifyError } from '../components/Notify';
import * as yup from 'yup';
import { Formik, Form } from 'formik';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
// import Navbar from '../components/Navbar'; // **** تم حذف هذا الاستيراد ****
import '../scss/signup.scss'; // استخدام نفس تنسيقات صفحات المصادقة (أو auth.scss)

const ForgotPassword = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const validationSchema = yup.object({
        email: yup.string().email(t('forgotPassword.emailInvalid')).required(t('forgotPassword.emailRequired')),
    });

    const handleSubmit = async (values) => {
        setLoading(true);
        try {
            const res = await Api.post('/users/forgot-password', { email: values.email });
            notifySuccess(res.data.message || t('forgotPassword.success'));
            navigate('/user/signin');
        } catch (err) {
            console.error('Forgot password error:', err);
            const errorMsg = err.response?.data?.message || t('forgotPassword.genericError');
            notifyError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            {/* <Navbar /> */} {/* **** تم حذف هذا السطر **** */}
            <div className="auth-container">
                <button onClick={() => navigate(-1)} className="back-button">
                    <ArrowBackIcon />
                </button>
                <div className="auth-card">
                    <h3 className="form-title">{t('forgotPassword.title')}</h3>
                    <p className="description">{t('forgotPassword.instruction')}</p>

                    <Formik
                        initialValues={{ email: '' }}
                        validationSchema={validationSchema}
                        onSubmit={handleSubmit}
                    >
                        {({ errors, touched, handleChange, handleBlur, values }) => (
                            <Form className="auth-form">
                                <TextField
                                    fullWidth
                                    id="email"
                                    name="email"
                                    placeholder={t('forgotPassword.emailPlaceholder')}
                                    value={values.email}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    error={touched.email && Boolean(errors.email)}
                                    helperText={touched.email && errors.email}
                                    variant="outlined"
                                    type="email"
                                    className="auth-input"
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            '& fieldset': { borderColor: 'var(--secondary)' }, // استخدام متغير CSS
                                            '&:hover fieldset': { borderColor: 'var(--secondary)' }, // استخدام متغير CSS
                                        },
                                    }}
                                />

                                <Button
                                    type="submit"
                                    variant="contained"
                                    className="auth-button primary"
                                    disabled={loading}
                                >
                                    {loading ? <CircularProgress size={24} color="inherit" /> : t('forgotPassword.sendEmailBtn')}
                                </Button>
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

export default ForgotPassword;