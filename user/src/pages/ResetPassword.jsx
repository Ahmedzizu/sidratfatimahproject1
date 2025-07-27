// F:\ractprojects\New folder (2)\ggg\user\src\pages\ResetPassword.jsx
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Api from '../config/config';
import { notifySuccess, notifyError } from '../components/Notify';
import * as yup from 'yup';
import { Formik, Form } from 'formik';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
// import Navbar from '../components/Navbar'; // ✨ تم حذف هذا الاستيراد
import '../scss/signup.scss'; // استخدام نفس تنسيقات صفحات المصادقة

const ResetPassword = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { token } = useParams(); // استقبال التوكن من الـ URL
    const [loading, setLoading] = useState(false);

    const validationSchema = yup.object({
        newPassword: yup.string().min(8, t('resetPassword.passwordMinLength')).required(t('resetPassword.passwordRequired')),
        confirmNewPassword: yup.string()
            .oneOf([yup.ref('newPassword'), null], t('resetPassword.confirmPasswordMismatch'))
            .required(t('resetPassword.confirmNewPasswordRequired')),
    });

    const handleSubmit = async (values) => {
        setLoading(true);
        try {
            // نرسل التوكن اللي في الـ URL مع كلمة المرور الجديدة
            const res = await Api.patch(`/users/reset-password/${token}`, { newPassword: values.newPassword });
            notifySuccess(res.data.message || t('resetPassword.success'));
            navigate('/user/signin'); // بعد تغيير الباسورد بنجاح يروح لصفحة تسجيل الدخول
        } catch (err) {
            console.error('Reset password error:', err);
            const errorMsg = err.response?.data?.message || t('resetPassword.genericError');
            notifyError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            {/* ✨ تم حذف مكون Navbar من هنا */}
            <div className="auth-container">
                <button onClick={() => navigate(-1)} className="back-button">
                    <ArrowBackIcon />
                </button>
                <div className="auth-card">
                    <h3 className="form-title">{t('resetPassword.title')}</h3>
                    <p className="description">{t('resetPassword.instruction')}</p>

                    <Formik
                        initialValues={{ newPassword: '', confirmNewPassword: '' }}
                        validationSchema={validationSchema}
                        onSubmit={handleSubmit}
                    >
                        {({ errors, touched, handleChange, handleBlur, values }) => (
                            <Form className="auth-form">
                                <TextField
                                    fullWidth
                                    id="newPassword"
                                    name="newPassword"
                                    placeholder={t('resetPassword.newPasswordPlaceholder')}
                                    value={values.newPassword}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    error={touched.newPassword && Boolean(errors.newPassword)}
                                    helperText={touched.newPassword && errors.newPassword}
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
                                    id="confirmNewPassword"
                                    name="confirmNewPassword"
                                    placeholder={t('resetPassword.confirmNewPasswordPlaceholder')}
                                    value={values.confirmNewPassword}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    error={touched.confirmNewPassword && Boolean(errors.confirmNewPassword)}
                                    helperText={touched.confirmNewPassword && errors.confirmNewPassword}
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

                                <Button
                                    type="submit"
                                    variant="contained"
                                    className="auth-button primary"
                                    disabled={loading}
                                >
                                    {loading ? <CircularProgress size={24} color="inherit" /> : t('resetPassword.resetBtn')}
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

export default ResetPassword;