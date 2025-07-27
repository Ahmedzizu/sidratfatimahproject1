// F:\ractprojects\New folder (2)\ggg\user\src\i18n.js

import i18n from 'i18next'; // ✨ تأكد أنك تستورد i18n نفسه من 'i18next'
import { initReactI18next } from 'react-i18next'; // ✨ وده Hook للـ React

// استيراد ملفات الترجمة JSON
import translationAR from './translation/ar.json';
import translationEN from './translation/en.json';

// إعداد موارد الترجمة
const resources = {
  en: {
    translation: translationEN,
  },
  ar: {
    translation: translationAR,
  },
};

i18n
  .use(initReactI18next) // بيربط i18next بالـ React Components
  .init({
    resources, // الموارد (ملفات الـ JSON)
    lng: 'ar', // ✨ اللغة الافتراضية عند بداية التطبيق
    fallbackLng: 'en', // اللغة الاحتياطية لو اللغة الحالية مش متاحة

    // خيارات الكاش
    // interpolation: {
    //   escapeValue: false, // React بالفعل بيعمل escape للـ XSS
    // },

    // خيارات لتصحيح الأخطاء (Debug) - ممكن تشيلها في الإنتاج
    debug: true, // ✨ عشان تشوف الـ logs الخاصة بالترجمة في الـ console

    // خيارات تحميل الـ namespace (لو كنت بتستخدمها)
    ns: ['translation'], // الـ namespace الافتراضي
    defaultNS: 'translation',

    // خيارات لـ React (مهمة لـ Suspense)
    react: {
      useSuspense: false, // ✨ غالبا بتفضل False في تطبيقات React العادية عشان متحتجش <Suspense>
    },
  });

export default i18n; // ✨ لازم تعمل export للـ i18n instance نفسها