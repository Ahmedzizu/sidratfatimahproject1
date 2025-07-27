import React, { useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import IconButton from '@mui/material/IconButton';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { fetchBankDetails } from '../redux/reducers/bank';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "../scss/bankDetails.scss";

const useCopyToClipboard = () => {
    const copyToClipboard = (text) => {
        if (!navigator.clipboard) {
            console.warn('Clipboard API not available');
            const textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "fixed";
            textArea.style.opacity = 0;
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                document.execCommand('copy');
                return true;
            } catch (err) {
                console.error('Failed to copy fallback:', err);
                return false;
            } finally {
                document.body.removeChild(textArea);
            }
        }
        return navigator.clipboard.writeText(text)
            .then(() => true)
            .catch(err => {
                console.error('Failed to copy:', err);
                return false;
            });
    };
    return copyToClipboard;
};

const style = {
    position: 'fixed',
    right: '20px',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '45%',
    maxWidth: '600px',
    bgcolor: '#282828',
    boxShadow: 24,
    p: 4,
    borderRadius: 12,
    border: '1px solid rgba(212, 175, 55, 0.2)',
    outline: 'none',
    maxHeight: '85vh',
    overflowY: 'auto',
};

function BankDetailsModal({ handleClose, open }) {
    const { t, i18n } = useTranslation();
    const dispatch = useDispatch();
    const data = useSelector((state) => state.bank.value.data);
    const copyToClipboard = useCopyToClipboard();

    useEffect(() => {
        if (open) {
            dispatch(fetchBankDetails());
        }
    }, [open, dispatch]);

    const handleCopy = async (accountNumber, bankName) => {
        const copied = await copyToClipboard(accountNumber);
        if (copied) {
            toast.success(`${t('تم نسخ رقم الحساب بنجاح')}: ${bankName}`, {
                position: i18n.language === 'en' ? 'top-right' : 'top-left',
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "dark",
                rtl: i18n.language === 'ar',
            });
        } else {
            toast.error(t('فشل نسخ رقم الحساب!'), {
                position: i18n.language === 'en' ? 'top-right' : 'top-left',
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "dark",
                rtl: i18n.language === 'ar',
            });
        }
    };

    return (
        <div>
            <Modal
                style={{ direction: i18n.language === 'en' ? 'ltr' : 'rtl' }}
                open={open}
                onClose={handleClose}
                aria-labelledby="bank-details-modal-title"
                aria-describedby="bank-details-modal-description"
                closeAfterTransition
                BackdropProps={{ style: { backgroundColor: 'rgba(0, 0, 0, 0.7)' } }}
            >
                <Box 
                    sx={style} 
                    className='bank-details-modal-box'
                    style={i18n.language === 'ar' ? { 
                        right: 'auto', 
                        left: '20px',
                        animation: 'slideInFromLeft 0.4s ease-out forwards'
                    } : {}}
                >
                    <Typography
                        id="bank-details-modal-title"
                        variant="h5"
                        component="h2"
                    >
                        {t('المعلومات البنكية للتحويل')}
                    </Typography>
                    <div className="bank-info-container">
                        {data.length > 0 ? (
                            data.map((ele, index) => (
                                <div key={index} className="bank-item">
                                    <p className="bank-name">{t('اسم البنك')}: <span>{ele.name}</span> ({ele.id})</p>
                                    <div className="account-details">
                                        <p className="account-number">{t('رقم الحساب')}: <span>{ele.account}</span></p>
                                        <IconButton
                                            aria-label={t('نسخ رقم الحساب')}
                                            onClick={() => handleCopy(ele.account, ele.name)}
                                            className="copy-button"
                                        >
                                            <ContentCopyIcon sx={{ color: '#D4AF37' }} />
                                        </IconButton>
                                    </div>
                                    {index < data.length - 1 && <hr className="bank-divider" />}
                                </div>
                            ))
                        ) : (
                            <Typography sx={{ color: '#E0E0E0', textAlign: 'center', mt: 3, fontSize: '1rem' }}>
                                {t('لا توجد معلومات بنكية متاحة حاليًا.')}
                            </Typography>
                        )}
                    </div>
                </Box>
            </Modal>
        </div>
    );
}

export default BankDetailsModal;