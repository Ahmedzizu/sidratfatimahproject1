// F:\ractprojects\New folder (2)\ggg\user\src\pages\Signin.jsx
import React, { useState } from 'react';
import '../scss/signup.scss';
import logo from '../assets/Logo 1.png';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Api from '../config/config';
import { useNavigate, Link } from 'react-router-dom'; // ✨ إضافة Link
import { useDispatch } from 'react-redux';
import { login } from '../redux/reducers/user';
import { notifyError, notifySuccess } from '../components/Notify';
import * as yup from 'yup';
import { Formik, Form } from 'formik';
import CircularProgress from '@mui/material/CircularProgress';
import { useTranslation } from 'react-i18next';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Navbar from '../components/Navbar';

const Signin = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const { t } = useTranslation();

    const validationSchema = yup.object({
        email: yup.string().email(t('signin.emailInvalid')).required(t('signin.emailRequired')),
        password: yup.string().min(8, t('signin.passwordMinLength')).required(t('signin.passwordRequired')),
    });

    async function handleLogin(values) {
        setLoading(true);
        try {
            const res = await Api.post('/users/signin', values);
            const { token, user } = res.data;
            if (token) {
                localStorage.setItem('userToken', token);
            }
            dispatch(login(user));
            notifySuccess(t('signin.loginSuccess'));
            navigate('/');
        } catch (err) {
            console.error('Login error:', err);
            const errorResponse = err.response?.data;
            if (errorResponse) {
                if (typeof errorResponse === 'object' && !Array.isArray(errorResponse)) {
                    if (errorResponse.email) notifyError(errorResponse.email);
                    if (errorResponse.password) notifyError(errorResponse.password);
                    if (errorResponse.message) notifyError(errorResponse.message);
                } else {
                    notifyError(errorResponse.message || t('common.loginGenericError'));
                }
            } else {
                notifyError(t('common.networkError'));
            }
        } finally {
            setLoading(false);
        }
    }

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
                        initialValues={{ email: '', password: '' }}
                        validationSchema={validationSchema}
                        onSubmit={handleLogin}
                    >
                        {({ errors, touched, handleChange, handleBlur, values }) => (
                            <Form className="auth-form">
                                <h3 className="form-title">{t('signin.title')}</h3>

                                <TextField
                                    fullWidth
                                    id="email"
                                    name="email"
                                    placeholder={t('signin.emailPlaceholder')}
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
                                            '& fieldset': { borderColor: '#B38D46' },
                                            '&:hover fieldset': { borderColor: '#B38D46' },
                                        },
                                    }}
                                />

                                <TextField
                                    fullWidth
                                    id="password"
                                    name="password"
                                    placeholder={t('signin.passwordPlaceholder')}
                                    value={values.password}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    variant="outlined"
                                    type="password"
                                    error={touched.password && Boolean(errors.password)}
                                    helperText={touched.password && errors.password}
                                    className="auth-input"
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            '& fieldset': { borderColor: '#B38D46' },
                                            '&:hover fieldset': { borderColor: '#B38D46' },
                                        },
                                    }}
                                />

                                {/* ✨ رابط "هل نسيت كلمة المرور؟" */}
                                <Link to="/user/forgot-password" className="forgot-password-link">
                                    {t('signin.forgotPassword')}
                                </Link>

                                <div className="auth-actions">
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        className="auth-button primary"
                                        disabled={loading}
                                    >
                                        {loading ? <CircularProgress size={24} color="inherit" /> : t('signin.continueBtn')}
                                    </Button>

                                    <Button
                                        type="button"
                                        variant="outlined"
                                        className="auth-button secondary"
                                        onClick={() => navigate('/user/signup')}
                                        disabled={loading}
                                    >
                                        {t('signin.createAccountBtn')}
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
            {/* <ToastContainer position="top-center" autoClose={5000} /> */} {/* تم إزالته */}
        </div>
    );
};

export default Signin;