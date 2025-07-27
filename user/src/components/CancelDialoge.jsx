import * as React from 'react';
import { useState } from 'react'; // استيراد useState لاستخدام حالة التحميل
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Paper from '@mui/material/Paper'; // لإعادة استخدام PaperComponent
import CircularProgress from '@mui/material/CircularProgress'; // لمؤشر التحميل
import { useDispatch } from 'react-redux';
import Api from '../config/config';
import { fetchUserReservations } from '../redux/reducers/user';
import { useTranslation } from 'react-i18next'; // استيراد useTranslation
import { toast } from 'react-toastify'; // استيراد toast لإشعارات المستخدم
import 'react-toastify/dist/ReactToastify.css'; // تنسيقات toastify
import '../scss/cancelDialoge.scss'; // ملف SCSS الجديد

// مكون PaperComponent (يمكن دمجه في SCSS بدلاً من هنا)
function CustomPaperComponent(props) {
    return (
        <Paper {...props} className="cancel-dialoge-paper" />
    );
}

export default function CancelDialoge({ open, handleClose, url, id }) {
    const dispatch = useDispatch();
    const { t, i18n } = useTranslation();
    const [loading, setLoading] = useState(false); // حالة التحميل لزر الإلغاء

    async function handleDelete() {
        if (!id) {
            toast.error(t('common.cancelErrorNoId'), { theme: "dark", position: i18n.language === 'en' ? 'top-right' : 'top-left' });
            return;
        }

        setLoading(true); // بدء التحميل
        try {
            // ✨ التعديل هنا: استخدام Api.post وإرسال ID في body
            // لأن السيرفر يتوقع POST مع { reservationId: id }
            const response = await Api.post(url, { reservationId: id }); // تأكد أن السيرفر يتوقع reservationId
            
            // إذا كان السيرفر لا يُرجع رسالة نجاح واضحة
            toast.success(response.data.message || t('user.cancelSuccess'), { // ✨ رسالة نجاح
                position: i18n.language === 'en' ? 'top-right' : 'top-left',
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                theme: "dark",
                rtl: i18n.language === 'ar',
            });
            dispatch(fetchUserReservations()); // إعادة جلب الحجوزات لتحديث القائمة
            handleClose(); // إغلاق الديالوج
        } catch (err) {
            console.error('Cancellation error:', err.response?.data || err.message);
            const errorMessage = err.response?.data?.message || t('user.cancelError'); // ✨ رسالة خطأ
            toast.error(errorMessage, {
                position: i18n.language === 'en' ? 'top-right' : 'top-left',
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                theme: "dark",
                rtl: i18n.language === 'ar',
            });
        } finally {
            setLoading(false); // إنهاء التحميل
        }
    }

    return (
        <div>
            <Dialog
                open={open}
                onClose={handleClose}
                PaperComponent={CustomPaperComponent} // استخدام CustomPaperComponent
                aria-labelledby="cancel-dialog-title" // تحديث ID
                className="cancel-dialoge-root" // كلاس لجذر الديالوج
            >
                <DialogTitle id="cancel-dialog-title" className="dialog-title">
                    {t('user.confirmCancelTitle')} {/* ✨ استخدام مفتاح ترجمة */}
                </DialogTitle>
                <DialogContent className="dialog-content">
                    <DialogContentText className="dialog-text">
                        {t('user.confirmCancelMessage')} {/* ✨ استخدام مفتاح ترجمة */}
                    </DialogContentText>
                </DialogContent>
                <DialogActions className="dialog-actions">
                    <Button 
                        onClick={handleDelete} 
                        variant='contained' 
                        className="delete-btn" // كلاس للزر الأحمر
                        disabled={loading} // تعطيل الزر أثناء التحميل
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : t('user.cancelReservation')} {/* ✨ نص وزر تحميل */}
                    </Button>
                    <Button 
                        autoFocus 
                        onClick={handleClose} 
                        variant='outlined' 
                        className="back-btn" // كلاس للزر الثانوي
                        disabled={loading} // تعطيل الزر أثناء التحميل
                    >
                        {t('common.back')} {/* ✨ استخدام مفتاح ترجمة */}
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}