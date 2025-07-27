// F:\ractprojects\New folder (2)\ggg\user\src\pages\EmailVerification.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Api from '../config/config';
import { notifySuccess, notifyError } from '../components/Notify';
import '../scss/signup.scss'; // استخدام نفس تنسيقات صفحات المصادقة

const EmailVerification = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();

    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [countdown, setCountdown] = useState(60); // عد تنازلي لإعادة الإرسال
    const [verificationAttempted, setVerificationAttempted] = useState(false); // جديد: لتتبع محاولة التحقق الأولية من الـ URL

    const queryParams = new URLSearchParams(location.search);
    const emailFromQuery = queryParams.get('email');      // إذا جاء من صفحة التسجيل
    const userIdFromQuery = queryParams.get('userId');    // إذا جاء من صفحة التسجيل
    const codeFromUrl = queryParams.get('code');          // إذا جاء من رابط الإيميل
    const idFromUrl = queryParams.get('id');              // إذا جاء من رابط الإيميل

    // استخدم الـ ID والكود من الـ URL أولاً، ثم من الـ query params الأخرى
    const currentUserId = idFromUrl || userIdFromQuery;
    const currentEmail = emailFromQuery; // الإيميل مهم لإعادة الإرسال

    useEffect(() => {
        if (!currentUserId || !currentEmail) {
            notifyError(t('verifyEmail.missingInfo'));
            navigate('/user/signup');
            return;
        }

        // إذا كان الكود موجوداً في الـ URL ولم تتم محاولة التحقق بعد، حاول التحقق تلقائياً
        if (codeFromUrl && currentUserId && !verificationAttempted) {
            setVerificationAttempted(true); // لمنع التشغيل المتكرر
            console.log("Attempting automatic verification from URL...");
            handleVerifyAuto(currentUserId, codeFromUrl);
        }

        // بدء العد التنازلي
        let timer;
        if (countdown > 0 && !resendLoading) { 
            timer = setInterval(() => {
                setCountdown(prev => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [currentEmail, currentUserId, codeFromUrl, navigate, countdown, resendLoading, t, verificationAttempted]); 
    // تم إضافة codeFromUrl و verificationAttempted إلى التبعيات

    const handleVerifyAuto = async (id, code) => {
        setLoading(true);
        try {
            const res = await Api.post('/users/verify-email', { id, code });
            notifySuccess(res.data.message || t('verifyEmail.success'));
            navigate('/user/signin');
        } catch (err) {
            console.error('Email verification error (auto):', err);
            const errorMsg = err.response?.data?.message || t('verifyEmail.genericError');
            notifyError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await Api.post('/users/verify-email', { id: currentUserId, code: otp });
            notifySuccess(res.data.message || t('verifyEmail.success'));
            navigate('/user/signin'); 
        } catch (err) {
            console.error('Email verification error (manual):', err);
            const errorMsg = err.response?.data?.message || t('verifyEmail.genericError');
            notifyError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        setResendLoading(true);
        setCountdown(60); // إعادة تعيين العد التنازلي
        try {
            await Api.post('/users/resend-email-verification', { email: currentEmail }); 
            notifySuccess(t('verifyEmail.resendSuccess'));
        } catch (err) {
            console.error('Resend OTP error:', err);
            const errorMsg = err.response?.data?.message || t('verifyEmail.resendError');
            notifyError(errorMsg);
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-card">
                    <h3 className="form-title">{t('verifyEmail.title')}</h3>
                    <p className="description" dangerouslySetInnerHTML={{ __html: t('verifyEmail.instruction', { email: currentEmail }) }}></p>

                    <form onSubmit={handleVerify} className="auth-form">
                        <TextField
                            fullWidth
                            id="otp"
                            name="otp"
                            placeholder={t('verifyEmail.otpPlaceholder')}
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            variant="outlined"
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
                            {loading ? <CircularProgress size={24} color="inherit" /> : t('verifyEmail.verifyBtn')}
                        </Button>

                        <Button
                            type="button"
                            variant="outlined"
                            className="auth-button secondary"
                            onClick={handleResendOtp}
                            disabled={resendLoading || countdown > 0}
                        >
                            {resendLoading ? <CircularProgress size={24} color="inherit" /> : (
                                countdown > 0 ? t('verifyEmail.resendCountdown', { count: countdown }) : t('verifyEmail.resendBtn')
                            )}
                        </Button>
                    </form>
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

export default EmailVerification;