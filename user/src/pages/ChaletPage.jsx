import React from 'react';
import Chalets from './Chalets'; // هذا المكون هو الذي يعرض الشاليهات الفردية، لذا يجب أن يكون ملف SCSS الخاص به متناسقًا أيضًا
import { useTranslation } from 'react-i18next';
// استيراد ملف SCSS الجديد
import "../scss/chaletPage.scss"; // تأكد من إنشاء هذا الملف في مجلد scss

const ChaletPage = () => {
  const { t, i18n } = useTranslation();
  return (
    <div className='chalet-page-container'> {/* إضافة className هنا */}
      <h2 className='section-title'>{t("chaletOffer")}</h2> {/* استخدام نفس className الخاص بالعناوين */}
      <Chalets/>
    </div>
  );
};

export default ChaletPage;