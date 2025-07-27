import React from 'react';
import "../scss/termsAndCondition.scss";
import Footer from '../components/Footer';
import { useTranslation } from 'react-i18next';
import { Box, Typography, List, ListItem } from '@mui/material';

const TermsAndConditions = () => {
    const { t, i18n } = useTranslation();

    return (
        <>
            <Box
                className='termsAndConditions-page-container'
                sx={{ direction: i18n.language === 'en' ? "ltr" : 'rtl' }}
            >
                <Box className='termsAndConditions'>
                    <Box className="terms-header">
                        <Typography variant="h2" component="h2" className="terms-title">{t("terms.title")}</Typography>
                        <Typography variant="body1" className="intro-text">{t("terms.intro")}</Typography>
                    </Box>

                    <List className="terms-list">
                        {/* استخدام index + 1 لضمان الترقيم الصحيح (1, 2, 3, ...) */}
                        {[...Array(6)].map((_, index) => ( // إنشاء مصفوفة بحجم 6 عناصر لتمرير index
                            <ListItem key={index} className="terms-list-item">
                                <span className="term-number">{index + 1}</span> {/* استخدام index + 1 للرقم */}
                                {t(`terms.t${index + 1}`)} {/* استخدام index + 1 لمفتاح الترجمة */}
                            </ListItem>
                        ))}
                    </List>
                </Box>
            </Box>
            <Footer />
        </>
    );
}

export default TermsAndConditions;