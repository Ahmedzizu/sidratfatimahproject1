import React from 'react';
import Halls from './Halls'; // هذا المكون هو الذي يعرض القاعات الفردية
import { useTranslation } from 'react-i18next';
// استيراد ملف SCSS الجديد
import "../scss/hallPage.scss"; // تأكد من إنشاء هذا الملف في مجلد scss

const HallPage = () => {
  const { t, i18n } = useTranslation();
  return (
    <div className='hall-page-container'> {/* إضافة className هنا */}
      <h2 className='section-title'>{t("hallOffer")}</h2> {/* استخدام نفس className الخاص بالعناوين */}
      <Halls/>
    </div>
  );
};

export default HallPage;