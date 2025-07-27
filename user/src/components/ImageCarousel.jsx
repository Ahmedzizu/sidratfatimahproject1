import React, { useState, useEffect, useRef } from "react";
import "../scss/carousel.scss";
import { useTranslation } from 'react-i18next'; // استيراد الترجمة
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'; // أيقونة السهم لليسار
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos'; // أيقونة السهم لليمين


const ImageCarousel = ({ images, imagesKey, interval = 4000 }) => { // interval بالمللي ثانية
    const { t, i18n } = useTranslation();
    const [currentIndex, setCurrentIndex] = useState(0); // ✅ تتبع الفهرس بدلاً من الصورة مباشرة
    const timeoutRef = useRef(null); // لمرجع المؤقت

    // دالة لإعادة تعيين المؤقت
    const resetTimeout = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
    };

    // تأثير لتغيير الصورة تلقائيًا
    useEffect(() => {
        resetTimeout(); // مسح المؤقت القديم عند كل إعادة تصيير
        timeoutRef.current = setTimeout(() => {
            setCurrentIndex((prevIndex) =>
                prevIndex === images.length - 1 ? 0 : prevIndex + 1
            );
        }, interval);

        // تنظيف المؤقت عند إلغاء تحميل المكون
        return () => {
            resetTimeout();
        };
    }, [currentIndex, images.length, interval]); // أعد تشغيل التأثير عند تغيير الصورة أو عدد الصور أو الفاصل الزمني

    // دالة للذهاب إلى الصورة السابقة
    const goToPrevSlide = () => {
        resetTimeout();
        setCurrentIndex((prevIndex) =>
            prevIndex === 0 ? images.length - 1 : prevIndex - 1
        );
    };

    // دالة للذهاب إلى الصورة التالية
    const goToNextSlide = () => {
        resetTimeout();
        setCurrentIndex((prevIndex) =>
            prevIndex === images.length - 1 ? 0 : prevIndex + 1
        );
    };

    // استخدام الصورة الحالية بناءً على الفهرس
    const currentImage = images[currentIndex];
    const thumbnailImages = images;

    return (
        <div 
            className="image-gallery-container"
            onMouseEnter={resetTimeout} // إيقاف التشغيل التلقائي عند التحويم
            onMouseLeave={() => { // استئناف التشغيل التلقائي
                timeoutRef.current = setTimeout(() => {
                    setCurrentIndex((prevIndex) =>
                        prevIndex === images.length - 1 ? 0 : prevIndex + 1
                    );
                }, interval);
            }}
        >
            {/* الصورة الرئيسية */}
            <div className="main-image-wrapper">
                <img 
                    src={imagesKey + currentImage} 
                    alt={`صورة ${currentIndex + 1}`} 
                    className="main-image"
                    loading="lazy" // تحسين الأداء
                />
                
                {/* أزرار التنقل (Previous/Next) */}
                {images.length > 1 && ( // إظهار الأزرار فقط إذا كان هناك أكثر من صورة
                    <>
                        <button 
                            className={`carousel-control prev ${i18n.language === 'en' ? 'ltr' : 'rtl'}`} 
                            onClick={goToPrevSlide} 
                            aria-label={t("common.previous")}
                        >
                            <ArrowBackIosNewIcon />
                        </button>
                        <button 
                            className={`carousel-control next ${i18n.language === 'en' ? 'ltr' : 'rtl'}`} 
                            onClick={goToNextSlide} 
                            aria-label={t("common.next")}
                        >
                            <ArrowForwardIosIcon />
                        </button>
                    </>
                )}
            </div>

            {/* الصور المصغرة */}
            <div className="thumbnail-images-wrapper">
                {thumbnailImages.map((image, index) => (
                    <img
                        key={index}
                        src={imagesKey + image}
                        alt={t("common.imageNumber", { number: index + 1 })} // ترجمة نص الـ alt
                        className={`thumbnail-image ${currentIndex === index ? "active" : ""}`}
                        onClick={() => {
                            resetTimeout(); // مسح المؤقت عند النقر اليدوي
                            setCurrentIndex(index);
                        }}
                        loading="lazy"
                    />
                ))}
            </div>
        </div>
    );
};

export default ImageCarousel;