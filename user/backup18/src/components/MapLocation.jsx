import React from 'react';
import "../scss/mapLocation.scss";
import { useTranslation } from 'react-i18next';
import { Box, Typography } from '@mui/material'; // استخدام مكونات MUI للخطوط

const MapLocation = () => {
    const { t, i18n } = useTranslation();

    return (
      <Box 
        className='map-location-container' 
        sx={{direction: i18n.language === 'en' ? 'ltr' : "rtl"}}
      >
        <Typography variant="h3" component="h2" className="map-title">{t("details.map")}</Typography>
        <Box className="map-frame-wrapper"> {/* حاوية لـ iframe لتنسيق الحدود والظلال */}
            <iframe 
                src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d7209.37182561346!2d49.638536!3d25.381841!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e3795929cc05f0b%3A0x63deaa725c5fc7!2z2LTYp9mE2YrZh9in2Kog2LPYr9ix2Kkg2YHYp9i32YXYqQ!5e0!3m2!1sar!2ssa!4v1683792346189!5m2!1sar!2ssa" // تم الإبقاء على هذا الرابط كما هو
                className="map-iframe" 
                title={t("details.map")} // عنوان iframe لتحسين الوصول
                allowFullScreen={true} // استخدام allowFullScreen بدلاً من allowfullscreen (صياغة React)
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
        </Box>
      </Box>
    );
}

export default MapLocation;